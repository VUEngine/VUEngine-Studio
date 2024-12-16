import { isOSX, URI } from '@theia/core';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry, OpenerService, PreferenceService } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { ElectronCommands } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS } from '@theia/navigator/lib/browser/navigator-widget-factory';
import { SCM_VIEW_CONTAINER_TITLE_OPTIONS } from '@theia/scm/lib/browser/scm-contribution';
import { SEARCH_VIEW_CONTAINER_TITLE_OPTIONS } from '@theia/search-in-workspace/lib/browser/search-in-workspace-factory';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { VesCoreCommands } from './ves-core-commands';
import { VesCoreMenus } from './ves-core-menus';

@injectable()
export class VesCoreContribution implements CommandContribution, MenuContribution, KeybindingContribution {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(FileService)
    protected fileService: FileService;
    @inject(OpenerService)
    protected openerService: OpenerService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(WindowService)
    protected readonly windowService: WindowService;

    static REPORT_ISSUE_URL = 'https://github.com/VUEngine/VUEngine-Studio/issues/new';
    static SUPPORT_URL = 'https://www.patreon.com/VUEngine';
    static DOCUMENTATION_URL = 'https://www.vuengine.dev/documentation/';

    @postConstruct()
    protected init(): void {
        // make default views unclosable
        EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS.closeable = false;
        SCM_VIEW_CONTAINER_TITLE_OPTIONS.closeable = false;
        SEARCH_VIEW_CONTAINER_TITLE_OPTIONS.closeable = false;
    };

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesCoreCommands.REPORT_ISSUE, {
            execute: () => this.windowService.openNewWindow(VesCoreContribution.REPORT_ISSUE_URL, { external: true })
        });
        commandRegistry.registerCommand(VesCoreCommands.SUPPORT, {
            execute: () => this.windowService.openNewWindow(VesCoreContribution.SUPPORT_URL, { external: true })
        });
        commandRegistry.registerCommand(VesCoreCommands.OPEN_DOCUMENTATION, {
            execute: path => this.windowService.openNewWindow(`${VesCoreContribution.DOCUMENTATION_URL}${path ? path : ''}`, { external: true })
        });
        commandRegistry.registerCommand(VesCoreCommands.SWITCH_HEADER_SOURCE, {
            isEnabled: () => this.shell.currentWidget instanceof EditorWidget && (
                ((this.shell.currentWidget as EditorWidget).getResourceUri()?.path.base.endsWith('.c') ?? false) ||
                ((this.shell.currentWidget as EditorWidget).getResourceUri()?.path.base.endsWith('.h') ?? false)
            ),
            execute: async () => {
                const uri = (this.shell.currentWidget as EditorWidget).getResourceUri();
                if (uri) {
                    const fsPath = uri.path.fsPath();
                    const updatedPath = fsPath.endsWith('.h')
                        ? fsPath.slice(0, -2) + '.c'
                        : fsPath.endsWith('.c')
                            ? fsPath.slice(0, -2) + '.h'
                            : fsPath;
                    const switchedUri = new URI(updatedPath);
                    if (await this.fileService.exists(switchedUri)) {
                        const opener = await this.openerService.getOpener(switchedUri);
                        await opener.open(switchedUri);
                    }
                }
            }
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(VesCoreMenus.VES_HELP, {
            commandId: VesCoreCommands.REPORT_ISSUE.id,
            label: VesCoreCommands.REPORT_ISSUE.label,
            order: '1',
        });
        menus.registerMenuAction(VesCoreMenus.VES_HELP, {
            commandId: VesCoreCommands.SUPPORT.id,
            label: VesCoreCommands.SUPPORT.label,
            order: '3',
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybindings({
            command: VesCoreCommands.SWITCH_HEADER_SOURCE.id,
            keybinding: 'alt+o'
        });

        // rebind reload window command
        registry.unregisterKeybinding({
            command: ElectronCommands.RELOAD.id,
            keybinding: 'ctrlcmd+r'
        });
        registry.registerKeybindings({
            command: ElectronCommands.RELOAD.id,
            keybinding: 'ctrlcmd+shift+r'
        });

        if (isOSX) {
            registry.registerKeybindings({
                command: WorkspaceCommands.FILE_RENAME.id,
                keybinding: 'enter',
                when: 'filesExplorerFocus',
            });
        }
    }
}
