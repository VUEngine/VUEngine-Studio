import { BaseTreeEditorContribution, TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { CommandRegistry, MenuModelRegistry } from '@theia/core';
import { ApplicationShell, NavigatableWidgetOptions, OpenerService, WidgetOpenerOptions } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesEditorsTreeEditorWidget } from './tree/ves-editors-tree-editor-widget';
import { VesEditorsTreeLabelProvider } from './tree/ves-editors-tree-label-provider';
import { VesEditorsTreeModelService } from './tree/ves-editors-tree-model-service';

@injectable()
export class VesEditorsTreeContribution extends BaseTreeEditorContribution {
    @inject(ApplicationShell)
    protected shell: ApplicationShell;
    @inject(OpenerService)
    protected opener: OpenerService;

    constructor(
        @inject(VesEditorsTreeModelService)
        modelService: TreeEditor.ModelService,
        @inject(VesEditorsTreeLabelProvider)
        labelProvider: VesEditorsTreeLabelProvider
    ) {
        super(VesEditorsTreeEditorWidget.WIDGET_ID, modelService, labelProvider);
    }

    readonly id = VesEditorsTreeEditorWidget.WIDGET_ID;
    readonly label = 'Visual Editor';

    canHandle(uri: URI): number {
        return 0;
    }

    registerCommands(commands: CommandRegistry): void {
        // register commands here

        super.registerCommands(commands);
    }

    registerMenus(menus: MenuModelRegistry): void {
        // register menu actions here

        super.registerMenus(menus);
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
