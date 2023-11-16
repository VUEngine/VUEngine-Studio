import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, UntitledResourceResolver } from '@theia/core';
import { AbstractViewContribution, CommonCommands, CommonMenus, OpenerService, Widget, open } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { UserWorkingDirectoryProvider } from '@theia/core/lib/browser/user-working-directory-provider';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesEditorsCommands } from './ves-editors-commands';
import { VesEditorsContextKeyService } from './ves-editors-context-key-service';
import { VesEditorsWidget } from './ves-editors-widget';

@injectable()
export class VesEditorsViewContribution extends AbstractViewContribution<VesEditorsWidget> implements CommandContribution, MenuContribution, TabBarToolbarContribution {
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    @inject(OpenerService)
    protected openerService: OpenerService;
    @inject(VesEditorsContextKeyService)
    protected readonly contextKeyService: VesEditorsContextKeyService;
    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;
    @inject(UserWorkingDirectoryProvider)
    protected readonly workingDirProvider: UserWorkingDirectoryProvider;

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
        this.contextKeyService.graphicalEditorFocus.set(
            this.shell.activeWidget instanceof VesEditorsWidget
        );
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        commandRegistry.registerCommand(VesEditorsCommands.OPEN_SOURCE, {
            isEnabled: () => true,
            isVisible: widget => widget instanceof VesEditorsWidget,
            execute: widget => this.openSource(widget),
        });

        commandRegistry.registerHandler(CommonCommands.UNDO.id, {
            isEnabled: () => this.shell.activeWidget instanceof VesEditorsWidget,
            execute: () => (this.shell.activeWidget as VesEditorsWidget).undo()
        });
        commandRegistry.registerHandler(CommonCommands.REDO.id, {
            isEnabled: () => this.shell.activeWidget instanceof VesEditorsWidget,
            execute: () => (this.shell.activeWidget as VesEditorsWidget).redo()
        });

        await this.vesProjectService.ready;
        const types = this.vesProjectService.getProjectDataTypes();
        for (const typeId of Object.keys(types || {})) {
            const type = types![typeId];
            if (!type.file.startsWith('.')) {
                continue;
            }
            const id = `ves:editors:new-untitled:${typeId}`;
            const typeLabel = type.schema.title || typeId;
            commandRegistry.registerCommand(Command.toLocalizedCommand(
                {
                    id,
                    label: `New ${typeLabel} File`,
                    category: 'Editor',
                    iconClass: type.icon,
                },
                `vuengine/editors/newUntitled/${typeId}`,
                'vuengine/editors/commands/category'
            ), {
                isEnabled: () => true,
                execute: async () => {
                    const untitledUri = this.untitledResourceResolver.createUntitledURI(type.file, await this.workingDirProvider.getUserWorkingDir());
                    await this.untitledResourceResolver.resolve(untitledUri);
                    return open(this.openerService, untitledUri);
                },
            });
        }
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesEditorsCommands.OPEN_SOURCE.id,
            command: VesEditorsCommands.OPEN_SOURCE.id,
            tooltip: VesEditorsCommands.OPEN_SOURCE.label,
            priority: 0,
        });
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        await this.vesProjectService.ready;
        const types = this.vesProjectService.getProjectDataTypes();
        for (const typeId of Object.keys(types || {})) {
            const type = types![typeId];
            if (!type.file.startsWith('.')) {
                continue;
            }
            const id = `ves:editors:new-untitled:${typeId}`;
            menus.registerMenuNode(CommonMenus.FILE_NEW_CONTRIBUTIONS, {
                id,
                sortString: typeId,
                command: id,
            });
        }
    }

    protected openSource(widget: Widget): void {
        const ref = widget instanceof VesEditorsWidget && widget || undefined;
        if (!ref || !ref.uri) {
            return;
        }
        this.editorManager.open(ref.uri, {
            widgetOptions: { ref, mode: 'tab-after' }
        });
    }
}
