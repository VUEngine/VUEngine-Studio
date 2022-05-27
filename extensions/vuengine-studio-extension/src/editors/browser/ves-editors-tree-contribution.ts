import { BaseTreeEditorContribution, TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { CommandRegistry, MenuModelRegistry, nls } from '@theia/core';
import { ApplicationShell, NavigatableWidgetOptions, open, OpenerService, QuickPickItem, QuickPickOptions, QuickPickService, WidgetOpenerOptions } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesEditorsTreeEditorWidget } from './tree/ves-editors-tree-editor-widget';
import { VesEditorsTreeLabelProvider } from './tree/ves-editors-tree-label-provider';
import { VesEditorsTreeModelService } from './tree/ves-editors-tree-model-service';
import { VesEditorUri } from './ves-editor-uri';
import { VesEditorsCommands } from './ves-editors-commands';

@injectable()
export class VesEditorsTreeContribution extends BaseTreeEditorContribution {
    @inject(ApplicationShell)
    protected shell: ApplicationShell;
    @inject(OpenerService)
    protected openerService: OpenerService;
    @inject(QuickPickService)
    protected quickPickService: QuickPickService;
    @inject(VesProjectService)
    protected vesProjectService: VesProjectService;

    constructor(
        @inject(VesEditorsTreeModelService)
        modelService: TreeEditor.ModelService,
        @inject(VesEditorsTreeLabelProvider)
        labelProvider: VesEditorsTreeLabelProvider
    ) {
        super(VesEditorsTreeEditorWidget.WIDGET_ID, modelService, labelProvider);
    }

    readonly id = VesEditorsTreeEditorWidget.WIDGET_ID;
    readonly label = nls.localize('vuengine/editors/visualEditor', 'Visual Editor');

    canHandle(uri: URI): number {
        return 0;
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        await this.vesProjectService.ready;
        const registeredTypes = this.vesProjectService.getRegisteredTypes();
        Object.keys(registeredTypes).forEach(typeId => {
            const registeredType = registeredTypes[typeId];
            if (!registeredType.parent) {
                commandRegistry.registerCommand({
                    id: `${VesEditorsCommands.OPEN_EDITOR.id}:${typeId}`,
                    label: `${VesEditorsCommands.OPEN_EDITOR.label}: ${registeredType.schema.title}`,
                    iconClass: registeredType.icon
                }, {
                    execute: async () => {
                        if (registeredType.leaf) {
                            const projectDataType = this.vesProjectService.getProjectDataType(typeId);
                            if (projectDataType) {
                                const ids = Object.keys(projectDataType);
                                if (ids.length) {
                                    const uri = VesEditorUri.toUri(`${typeId}/${ids[0]}`);
                                    await open(this.openerService, uri, { mode: 'reveal' });
                                }
                            }
                        } else {
                            // find which types can be children of current project node
                            const childTypes = Object.values(registeredTypes).filter(registeredTypeInner =>
                                registeredTypeInner.parent?.typeId === typeId
                            );

                            this.itemSelectQuickPick(childTypes.map(type => type.schema?.properties?.typeId.const));
                        }
                    }
                });
            }
        });
    }

    async itemSelectQuickPick(types: string[]): Promise<void> {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/chooseAnItemTitle', 'Choose an item'),
            placeholder: nls.localize('vuengine/editors/chooseAnItemPlaceholder', 'Select which item you want to edit'),
        };
        const items: QuickPickItem[] = [];

        types.forEach(type => {
            const projectDataType = this.vesProjectService.getProjectDataType(type);
            if (projectDataType) {
                Object.keys(projectDataType).forEach(key => {
                    const item = projectDataType[key];
                    const registeredTypes = this.vesProjectService.getRegisteredTypes();
                    const registeredType = registeredTypes[type];
                    items.push({
                        label: item.name,
                        description: `${type}/${key}`,
                        iconClasses: registeredType.icon ? [registeredType.icon] : [],
                    });
                });
            }
        });

        if (!items.length) {
            // TODO: error message
            return;
        }

        this.quickPickService.show<QuickPickItem>(items, quickPickOptions).then(async selection => {
            if (!selection) {
                return;
            }

            const uri = VesEditorUri.toUri(selection.description!);
            await open(this.openerService, uri, { mode: 'reveal' });
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);

        // ...
    }

    protected createWidgetOptions(uri: URI, options?: WidgetOpenerOptions): NavigatableWidgetOptions {
        return {
            kind: 'navigatable',
            uri: this.serializeUri(uri)
        };
    }

    protected serializeUri(uri: URI): string {
        return uri.withoutFragment().toString();
    }

}
