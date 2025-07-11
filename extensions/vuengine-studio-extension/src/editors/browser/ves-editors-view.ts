import { CommandRegistry, CommandService, MenuModelRegistry, nls, UntitledResourceResolver, URI } from '@theia/core';
import {
    AbstractViewContribution,
    CommonCommands,
    KeybindingRegistry,
    OpenerService,
    Widget
} from '@theia/core/lib/browser';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { UserWorkingDirectoryProvider } from '@theia/core/lib/browser/user-working-directory-provider';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { NavigatorContextMenu } from '@theia/navigator/lib/browser/navigator-contribution';
import { FILE_NAVIGATOR_ID, FileNavigatorWidget } from '@theia/navigator/lib/browser/navigator-widget';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { VesCodeGenService } from '../../codegen/browser/ves-codegen-service';
import { GenerationMode } from '../../codegen/browser/ves-codegen-types';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { nanoid, stringify } from './components/Common/Utils';
import { EditorsCommands, VesEditorsCommands } from './ves-editors-commands';
import { VesEditorsContextKeyService } from './ves-editors-context-key-service';
import { TYPE_LABELS } from './ves-editors-types';
import { VesEditorsWidget } from './ves-editors-widget';

@injectable()
export class VesEditorsViewContribution extends AbstractViewContribution<VesEditorsWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(OpenerService)
    protected readonly openerService: OpenerService;
    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;
    @inject(VesCodeGenService)
    protected readonly vesCodeGenService: VesCodeGenService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
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
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesEditorsCommands.GENERATE, {
            isEnabled: () => true,
            isVisible: widget => widget instanceof VesEditorsWidget || this.shell.currentWidget instanceof VesEditorsWidget,
            execute: widget => this.generateFiles(widget instanceof VesEditorsWidget
                ? widget
                : this.shell.currentWidget as VesEditorsWidget
            ),
        });
        commandRegistry.registerCommand(VesEditorsCommands.OPEN_SOURCE, {
            isEnabled: () => true,
            isVisible: widget => widget instanceof VesEditorsWidget || this.shell.currentWidget instanceof VesEditorsWidget,
            execute: widget => this.openSource(widget instanceof VesEditorsWidget
                ? widget
                : this.shell.currentWidget as VesEditorsWidget
            ),
        });
        commandRegistry.registerCommand(VesEditorsCommands.OPEN_GENERATED_FILES, {
            isEnabled: () => true,
            isVisible: widget => widget instanceof VesEditorsWidget || this.shell.currentWidget instanceof VesEditorsWidget,
            execute: widget => this.openGeneratedFiles(widget instanceof VesEditorsWidget
                ? widget
                : this.shell.currentWidget as VesEditorsWidget
            ),
        });
        commandRegistry.registerCommand(VesEditorsCommands.GENERATE_ID, {
            isEnabled: () => true,
            isVisible: () => false,
            execute: fileUri => this.generateId(fileUri),
        });

        commandRegistry.registerHandler(CommonCommands.UNDO.id, {
            isEnabled: widget => widget instanceof VesEditorsWidget || this.shell.currentWidget instanceof VesEditorsWidget,
            execute: widget => {
                const w = widget instanceof VesEditorsWidget
                    ? widget
                    : this.shell.currentWidget as VesEditorsWidget;
                w?.undo();
                w?.dispatchCommandEvent(CommonCommands.UNDO.id);
            }
        });
        commandRegistry.registerHandler(CommonCommands.REDO.id, {
            isEnabled: widget => widget instanceof VesEditorsWidget || this.shell.currentWidget instanceof VesEditorsWidget,
            execute: widget => {
                const w = widget instanceof VesEditorsWidget
                    ? widget
                    : this.shell.currentWidget as VesEditorsWidget;
                w?.redo();
                w?.dispatchCommandEvent(CommonCommands.REDO.id);
            }
        });

        EditorsCommands.map(editor => {
            Object.values(editor).map(command => {
                commandRegistry.registerCommand({
                    id: command.id,
                    label: command.label,
                    category: command.category,
                }, {
                    // enable and make visible only for the editors for which command is registered
                    isEnabled: widget => {
                        const w = widget instanceof VesEditorsWidget
                            ? widget
                            : this.shell.currentWidget as VesEditorsWidget;
                        return w?.commands !== undefined && w?.commands[command.id] === true;
                    },
                    isVisible: widget => {
                        const w = widget instanceof VesEditorsWidget
                            ? widget
                            : this.shell.currentWidget as VesEditorsWidget;
                        return w?.commands !== undefined && w?.commands[command.id] === true;
                    },
                    execute: widget => {
                        const w = widget instanceof VesEditorsWidget
                            ? widget
                            : this.shell.currentWidget as VesEditorsWidget;
                        w?.dispatchCommandEvent(command.id);
                    }
                });
            });
        });

        await this.vesProjectService.projectDataReady;
        const types = this.vesProjectService.getProjectDataTypes();

        for (const typeId of Object.keys(types || {})) {
            const type = types![typeId];

            // TODO: Need a strategy to handle relative file paths, e.g. for sprites in actor editor
            // See also: line 256
            /*
            if (type.file?.startsWith('.')) {
                commandRegistry.registerCommand({
                    id: `editors.new-untitled.${typeId}`,
                    label: nls.localize('vuengine/editors/general/newTypeFile', 'New {0} File...', TYPE_LABELS[typeId] ?? type.schema.title),
                    category: CommonCommands.FILE_CATEGORY,
                    iconClass: type.icon,
                }, {
                    isEnabled: () => true,
                    isVisible: () => false,
                    execute: async () => {
                        const untitledUri = this.untitledResourceResolver.createUntitledURI(type.file, await this.workingDirProvider.getUserWorkingDir());
                        await this.untitledResourceResolver.resolve(untitledUri);
                        return open(this.openerService, untitledUri);
                    },
                });
            }
            */

            if (type.forFiles?.length) {
                commandRegistry.registerCommand({
                    id: `editors.new-file.${typeId}`,
                    label: nls.localize('vuengine/editors/general/newTypeFile', 'New {0} File...', TYPE_LABELS[typeId] ?? type.schema.title),
                    category: CommonCommands.FILE_CATEGORY,
                }, {
                    // Show "new xyz conversion file" commands only in explorer, but hide from command palette
                    isVisible: widget => this.shell.currentWidget?.id === 'files',
                    execute: async () => this.commandService.executeCommand(WorkspaceCommands.NEW_FILE.id),
                });
            }
        }

        commandRegistry.registerCommand(VesEditorsCommands.OPEN_IN_EDITOR, {
            isEnabled: () => true,
            isVisible: () => {
                const p = this.editorManager.all.find(w => w.id === this.shell.currentWidget?.id)?.editor.uri.path;
                if (p) {
                    for (const t of Object.values(types || {})) {
                        if ([p.ext, p.base].includes(t.file)) {
                            return true;
                        }
                    }
                }
                return false;
            },
            execute: async () => {
                const u = this.editorManager.all.find(w => w.id === this.shell.currentWidget?.id)?.editor.uri;
                if (u) {
                    const opener = await this.openerService.getOpener(u);
                    await opener.open(u);
                }
            },
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        super.registerKeybindings(registry);

        EditorsCommands.map(editor => {
            Object.values(editor).map(command => {
                if (command.keybinding) {
                    if (!Array.isArray(command.keybinding)) {
                        command.keybinding = [command.keybinding];
                    }
                    command.keybinding.map(keybinding =>
                        registry.registerKeybindings({
                            command: command.id,
                            when: 'graphicalEditorFocus',
                            keybinding,
                        })
                    );
                }
            });
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesEditorsCommands.GENERATE.id,
            command: VesEditorsCommands.GENERATE.id,
            tooltip: VesEditorsCommands.GENERATE.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: VesEditorsCommands.OPEN_GENERATED_FILES.id,
            command: VesEditorsCommands.OPEN_GENERATED_FILES.id,
            tooltip: VesEditorsCommands.OPEN_GENERATED_FILES.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: VesEditorsCommands.OPEN_SOURCE.id,
            command: VesEditorsCommands.OPEN_SOURCE.id,
            tooltip: VesEditorsCommands.OPEN_SOURCE.label,
            priority: 2,
        });
        toolbar.registerItem({
            id: VesEditorsCommands.OPEN_IN_EDITOR.id,
            command: VesEditorsCommands.OPEN_IN_EDITOR.id,
            tooltip: VesEditorsCommands.OPEN_IN_EDITOR.label,
            priority: 2,
        });
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        await this.vesProjectService.projectDataReady;
        const types = this.vesProjectService.getProjectDataTypes();
        for (const typeId of Object.keys(types || {})) {
            const type = types![typeId];

            // TODO: Need a strategy to handle relative file paths, e.g. for sprites in actor editor
            // See also: line 144
            /*
            if (type.file?.startsWith('.')) {
                const id = `editors.new-untitled.${ typeId }`;
                menus.registerMenuNode(CommonMenus.FILE_NEW_CONTRIBUTIONS, {
                    id,
                    sortString: typeId,
                    command: id,
                });
            }
            */

            if (type.forFiles?.length) {
                menus.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
                    commandId: `editors.new-file.${typeId}`,
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
        this.editorManager.open(ref.uri);
    }

    protected async openGeneratedFiles(widget: Widget): Promise<void> {
        const ref = widget instanceof VesEditorsWidget && widget || undefined;
        if (!ref || !ref.uri || !ref.typeId) {
            return;
        }

        const uris = await this.vesCodeGenService.getGeneratedFileUris(ref.uri, ref.typeId);
        uris.forEach(async u => {
            if (await this.fileService.exists(u)) {
                this.editorManager.open(u);
            }
        });
    }

    protected generateFiles(widget: Widget): void {
        const ref = widget instanceof VesEditorsWidget && widget || undefined;
        if (!ref || !ref.uri) {
            return;
        }
        this.vesCodeGenService.generate([ref.typeId], GenerationMode.All, ref.uri);
    }

    protected async generateId(fileUri: URI): Promise<void> {
        try {
            const fileContents = await this.fileService.readFile(fileUri);
            const fileContentsJson = JSON.parse(fileContents.value.toString());
            fileContentsJson._id = nanoid();
            await this.fileService.writeFile(fileUri, BinaryBuffer.fromString(stringify(fileContentsJson)));
        } catch (error) {
            console.error('Could not generate ID for file.', fileUri.path.fsPath());
        }
    }
}
