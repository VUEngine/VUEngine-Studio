import { CommandRegistry, nls, QuickPickItem, QuickPickOptions, QuickPickService } from '@theia/core';
import { AbstractViewContribution, CommonCommands, open, OpenerService } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ProjectFileType } from 'src/project/browser/ves-project-types';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesEditorUri } from './ves-editor-uri';
import { VesEditorsCommands } from './ves-editors-commands';
import { VesEditorsContextKeyService } from './ves-editors-context-key-service';
import { VesEditorsWidget } from './ves-editors-widget';

@injectable()
export class VesEditorsViewContribution extends AbstractViewContribution<VesEditorsWidget> implements TabBarToolbarContribution {
    @inject(OpenerService)
    protected openerService: OpenerService;
    @inject(QuickPickService)
    private readonly quickPickService: QuickPickService;
    @inject(VesEditorsContextKeyService)
    protected readonly contextKeyService: VesEditorsContextKeyService;
    @inject(VesProjectService)
    private readonly vesProjectService: VesProjectService;

    constructor() {
        super({
            widgetId: VesEditorsWidget.ID,
            widgetName: VesEditorsWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }

    @postConstruct()
    protected init(): void {
        this.updateFocusedView();
        this.shell.onDidChangeActiveWidget(() => this.updateFocusedView());
    }

    protected updateFocusedView(): void {
        this.contextKeyService.graphicalEditorsFocus.set(
            this.shell.activeWidget instanceof VesEditorsWidget
        );
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        commandRegistry.registerHandler(CommonCommands.UNDO.id, {
            isEnabled: () => this.shell.activeWidget instanceof VesEditorsWidget,
            execute: () => (this.shell.activeWidget as VesEditorsWidget).undo()
        });
        commandRegistry.registerHandler(CommonCommands.REDO.id, {
            isEnabled: () => this.shell.activeWidget instanceof VesEditorsWidget,
            execute: () => (this.shell.activeWidget as VesEditorsWidget).redo()
        });

        await this.vesProjectService.ready;
        const registeredTypes = this.vesProjectService.getProjectDataTypes();
        if (registeredTypes) {
            Object.keys(registeredTypes).forEach(typeId => {
                const registeredType = registeredTypes[typeId];
                commandRegistry.registerCommand({
                    id: `${VesEditorsCommands.WIDGET_OPEN.id}:${typeId}`,
                    label: `${VesEditorsCommands.WIDGET_OPEN.label}: ${registeredType.schema.title}`,
                    iconClass: registeredType.icon
                }, {
                    execute: () => this.selectItem(registeredType, typeId)
                });
            });
        }
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesEditorsCommands.WIDGET_HELP.id,
            command: VesEditorsCommands.WIDGET_HELP.id,
            tooltip: VesEditorsCommands.WIDGET_HELP.label,
            priority: 0,
        });
    }

    protected async selectItem(registeredType: ProjectFileType, typeId: string): Promise<void> {
        if (!registeredType.multiple) {
            const projectDataType = this.vesProjectService.getProjectDataItemsForType(typeId);
            if (projectDataType) {
                const ids = Object.keys(projectDataType);
                if (ids.length) {
                    const uri = VesEditorUri.toUri(`${typeId}/${ids[0]}`);
                    await open(this.openerService, uri, { mode: 'reveal' });
                }
            }
        } else {
            this.itemSelectQuickPick(typeId);
        }
    }

    protected async itemSelectQuickPick(typeId: string): Promise<void> {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/chooseAnItemTitle', 'Choose an item'),
            placeholder: nls.localize('vuengine/editors/chooseAnItemPlaceholder', 'Select which item you want to edit'),
        };
        const items: QuickPickItem[] = [];

        const projectDataType = this.vesProjectService.getProjectDataItemsForType(typeId);
        if (projectDataType) {
            Object.keys(projectDataType).forEach(key => {
                const item = projectDataType[key];
                const registeredType = this.vesProjectService.getProjectDataType(typeId);
                if (registeredType) {
                    items.push({
                        label: item.name as string,
                        description: `${typeId}/${key}`,
                        iconClasses: registeredType.icon ? [registeredType.icon] : [],
                    });
                }
            });
        }

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
}
