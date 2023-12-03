import { Command, CommandContribution, CommandRegistry, CommandService, MenuContribution, MenuModelRegistry, UntitledResourceResolver } from '@theia/core';
import { AbstractViewContribution, CommonCommands, CommonMenus, OpenerService, Widget, open } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { UserWorkingDirectoryProvider } from '@theia/core/lib/browser/user-working-directory-provider';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesEditorsCommands } from './ves-editors-commands';
import { VesEditorsContextKeyService } from './ves-editors-context-key-service';
import { VesEditorsWidget } from './ves-editors-widget';
import { NavigatorContextMenu } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { FILE_NAVIGATOR_ID, FileNavigatorWidget } from '@theia/navigator/lib/browser/navigator-widget';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class VesEditorsViewContribution extends AbstractViewContribution<VesEditorsWidget> implements CommandContribution, MenuContribution, TabBarToolbarContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(OpenerService)
    protected openerService: OpenerService;
    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;
    @inject(VesEditorsContextKeyService)
    protected readonly contextKeyService: VesEditorsContextKeyService;
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
        this.bindEvents();
    }

    protected bindEvents(): void {
        this.shell.onDidChangeActiveWidget(() => this.updateFocusedView());
        this.frontendApplicationStateService.onStateChanged(
            async (state: FrontendApplicationState) => {
                if (state === 'ready') {
                    const widget = this.shell.getWidgetById(FILE_NAVIGATOR_ID) as FileNavigatorWidget | undefined;
                    widget?.model.onSelectionChanged(() => {
                        // @ts-ignore
                        this.contextKeyService.explorerResourceExt.set(widget.model.selectedNodes[0].fileStat.resource.path.ext);
                    });
                }
            }
        );
    }

    protected updateFocusedView(): void {
        this.contextKeyService.graphicalEditorFocus.set(
            this.shell.activeWidget instanceof VesEditorsWidget
        );
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        commandRegistry.registerCommand(VesEditorsCommands.GENERATE, {
            isEnabled: () => true,
            isVisible: widget => widget instanceof VesEditorsWidget,
            execute: widget => this.generateFiles(widget),
        });
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

        await this.vesProjectService.projectDataReady;
        const types = this.vesProjectService.getProjectDataTypes();
        for (const typeId of Object.keys(types || {})) {
            const type = types![typeId];
            if (type.file?.startsWith('.')) {
                commandRegistry.registerCommand(Command.toLocalizedCommand(
                    {
                        id: `ves:editors:new-untitled:${typeId}`,
                        label: `New Untitled ${type.schema.title || typeId} File`,
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

            if (type.forFiles?.length) {
                commandRegistry.registerCommand(Command.toLocalizedCommand(
                    {
                        id: `ves:editors:new-file:${typeId}`,
                        label: `New ${type.schema.title || typeId} File...`,
                        category: 'Editor',
                    },
                    `vuengine/editors/newFile/${typeId}`,
                    'vuengine/editors/commands/category'
                ), {
                    isEnabled: () => true,
                    execute: async () => this.commandService.executeCommand(WorkspaceCommands.NEW_FILE.id),
                });
            }
        }
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesEditorsCommands.GENERATE.id,
            command: VesEditorsCommands.GENERATE.id,
            tooltip: VesEditorsCommands.GENERATE.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: VesEditorsCommands.OPEN_SOURCE.id,
            command: VesEditorsCommands.OPEN_SOURCE.id,
            tooltip: VesEditorsCommands.OPEN_SOURCE.label,
            priority: 1,
        });
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        await this.vesProjectService.projectDataReady;
        const types = this.vesProjectService.getProjectDataTypes();
        for (const typeId of Object.keys(types || {})) {
            const type = types![typeId];
            if (type.file?.startsWith('.')) {
                const id = `ves:editors:new-untitled:${typeId}`;
                menus.registerMenuNode(CommonMenus.FILE_NEW_CONTRIBUTIONS, {
                    id,
                    sortString: typeId,
                    command: id,
                });
            }

            if (type.forFiles?.length) {
                menus.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
                    commandId: `ves:editors:new-file:${typeId}`,
                    order: '-500',
                    when: type.forFiles.map(f => `explorerResourceExt == ${f}`).join(' || '),
                });
            }
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

    protected generateFiles(widget: Widget): void {
        const ref = widget instanceof VesEditorsWidget && widget || undefined;
        if (!ref || !ref.uri) {
            return;
        }
        (ref as VesEditorsWidget).generateFiles();
    }
}
