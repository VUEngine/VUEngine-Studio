import { CommandService, isOSX, MAIN_MENU_BAR, MenuPath } from '@theia/core';
import { ApplicationShell, CommonCommands, ContextMenuRenderer, HoverService, KeybindingRegistry, MAXIMIZED_CLASS } from '@theia/core/lib/browser';
import { ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { ElectronCommands } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import styled from 'styled-components';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { buildMenuPath } from '../../build/browser/ves-build-contribution';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import { EmulatorCommands } from '../../emulator/browser/ves-emulator-commands';
import { VesEmulatorService } from '../../emulator/browser/ves-emulator-service';
import { VesExportCommands } from '../../export/browser/ves-export-commands';
import { VesFlashCartCommands } from '../../flash-cart/browser/ves-flash-cart-commands';
import { VesFlashCartService } from '../../flash-cart/browser/ves-flash-cart-service';
import { VIEW_MODE_MENU } from '../../viewMode/browser/view-mode-contribution';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import ActionButtons from './components/ActionButtons';
import ApplicationIcon from './components/ApplicationIcon';
import ApplicationTitle from './components/ApplicationTitle';
import MainMenu from './components/MainMenu';
import MaximizeToggle from './components/MaximizeToggle';
import ViewModeSelect from './components/ViewModeSelect';
import WindowControls from './components/WindowControls';
import { TitlebarCommands } from './ves-titlebar-commands';

const StyledTitleBar = styled.div`
    -webkit-app-region: drag;
    display: flex;
    flex-direction: row;
    gap: 3px;

    > div {
        align-items: center;
        display: flex;
        gap: 3px;

        &:first-child {
            justify-content: start;
            min-width: 305px;
        }

        &:nth-child(2) {
            justify-content: center;
            flex-grow: 1;
            overflow: hidden;
        }

        &:last-child {
            justify-content: end;
            min-width: 305px;
        }
    }
`;

@injectable()
export class TitlebarWidget extends ReactWidget {

    static readonly ID = 'titlebar';
    static readonly LABEL = 'Titlebar';

    @inject(ApplicationShell)
    protected applicationShell: ApplicationShell;
    @inject(CommandService)
    protected readonly commandService!: CommandService;
    @inject(ContextMenuRenderer)
    protected readonly contextMenuRenderer: ContextMenuRenderer;
    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;
    @inject(HoverService)
    protected readonly hoverService: HoverService;
    @inject(KeybindingRegistry)
    protected readonly keybindingRegistry!: KeybindingRegistry;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;
    @inject(WindowTitleService)
    private readonly windowTitleService: WindowTitleService;
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService;
    @inject(VesEmulatorService)
    protected readonly vesEmulatorService: VesEmulatorService;
    @inject(VesFlashCartService)
    protected readonly vesFlashCartService: VesFlashCartService;
    @inject(VesWorkspaceService)
    private readonly workspaceService: VesWorkspaceService;

    protected applicationTitle = '';
    protected isMaximizedEditor: boolean = false;
    protected romExists: boolean = false;

    @postConstruct()
    protected init(): void {
        this.doInit();
        this.id = TitlebarWidget.ID;
        this.title.label = TitlebarWidget.LABEL;
        this.title.caption = TitlebarWidget.LABEL;
        this.title.closable = false;
        this.applicationShell.onDidToggleMaximized(max => {
            this.isMaximizedEditor = max.hasClass(MAXIMIZED_CLASS);
            this.update();
        });
        this.windowTitleService.onDidChangeTitle(() => {
            this.setTitle();
        });
        window.electronTheiaCore.onWindowEvent('maximize', () => this.update());
        window.electronTheiaCore.onWindowEvent('unmaximize', () => this.update());
        this.vesBuildService.onDidChangeIsCleaning(() => this.update());
        this.vesBuildService.onDidChangeIsQueued(() => this.update());
        this.vesBuildService.onDidChangeBuildStatus(() => this.update());
        this.vesBuildService.onDidSucceedBuild(() => this.checkRomExists());
        this.vesFlashCartService.onDidChangeIsQueued(() => this.update());
        this.vesFlashCartService.onDidChangeIsFlashing(() => this.update());
        this.vesFlashCartService.onDidChangeConnectedFlashCarts(() => this.update());
        this.vesEmulatorService.onDidChangeIsQueued(() => this.update());
        this.keybindingRegistry.onKeybindingsChanged(() => this.update());
        this.viewModeService.onDidChangeViewMode(() => this.update());

        this.update();
    }

    protected async doInit(): Promise<void> {
        await this.workspaceService.ready;
        this.setTitle();
        this.checkRomExists();
    }

    protected async checkRomExists(): Promise<void> {
        this.romExists = await this.vesBuildService.outputRomExists();
        this.update();
    }

    protected setTitle(): void {
        this.applicationTitle = this.windowTitleService.title;
        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <StyledTitleBar onDoubleClick={this.maximizeWindow}>
                <div>
                    <ApplicationIcon />
                    <ViewModeSelect
                        hidden={!this.workspaceService.opened}
                        viewMode={this.viewModeService.getViewMode()}
                        openViewModeMenu={this.openViewModeMenu.bind(this)}
                        vesCommonService={this.vesCommonService}
                        hoverService={this.hoverService}
                    />
                    <MainMenu
                        hidden={false}
                        openMainMenu={this.openMainMenu.bind(this)}
                        hoverService={this.hoverService}
                    />
                </div>
                <div>
                    <ApplicationTitle
                        applicationTitle={this.applicationTitle}
                        isWorkspaceOpened={this.workspaceService.opened}
                        isCollaboration={this.workspaceService.isCollaboration()}
                        openRecentWorkspace={this.openRecentWorkspace.bind(this)}
                        closeWorkspace={this.closeWorkspace.bind(this)}
                        vesCommonService={this.vesCommonService}
                        hoverService={this.hoverService}
                    />
                </div>
                <div>
                    <MaximizeToggle
                        isMaximizedEditor={this.isMaximizedEditor}
                        collapse={this.collapse.bind(this)}
                        vesCommonService={this.vesCommonService}
                        hoverService={this.hoverService}
                    />
                    <ActionButtons
                        isWorkspaceOpened={this.workspaceService.opened}
                        hasWarnings={this.vesBuildService.getNumberOfWarnings() > 0}
                        buildStatus={this.vesBuildService.buildStatus}
                        buildIsQueued={this.vesBuildService.isQueued}
                        runIsQueued={this.vesEmulatorService.isQueued}
                        flashIsQueued={this.vesFlashCartService.isQueued}
                        isFlashing={this.vesFlashCartService.isFlashing}
                        flashingProgress={this.vesFlashCartService.flashingProgress}
                        hasConnectedFlashCarts={this.vesFlashCartService.connectedFlashCarts.length > 0}
                        isCleaning={this.vesBuildService.isCleaning}
                        romExists={this.romExists}
                        build={this.build.bind(this)}
                        run={this.run.bind(this)}
                        flash={this.flash.bind(this)}
                        exportRom={this.exportRom.bind(this)}
                        clean={this.clean.bind(this)}
                        openBuildMenu={this.openBuildMenu.bind(this)}
                        vesCommonService={this.vesCommonService}
                        hoverService={this.hoverService}
                    />
                    <WindowControls
                        hidden={isOSX}
                        isMaximized={this.isMaximized()}
                        maximizeWindow={this.maximizeWindow.bind(this)}
                        unmaximizeWindow={this.unmaximizeWindow.bind(this)}
                        minimizeWindow={this.minimizeWindow.bind(this)}
                        closeWindow={this.closeWindow.bind(this)}
                    />
                </div>
            </StyledTitleBar>
        );
    }

    protected build = () => this.commandService.executeCommand(VesBuildCommands.BUILD.id);
    protected run = () => this.commandService.executeCommand(EmulatorCommands.RUN.id);
    protected flash = () => this.commandService.executeCommand(VesFlashCartCommands.FLASH.id);
    protected exportRom = () => this.commandService.executeCommand(VesExportCommands.EXPORT.id);
    protected clean = () => this.commandService.executeCommand(VesBuildCommands.CLEAN.id);

    protected isMaximized(): boolean {
        return window.electronTheiaCore.isMaximized();
    }

    protected maximizeWindow = () => this.commandService.executeCommand(TitlebarCommands.MAXIMIZE.id);
    protected minimizeWindow = () => this.commandService.executeCommand(TitlebarCommands.MINIMIZE.id);
    protected unmaximizeWindow = () => this.commandService.executeCommand(TitlebarCommands.UNMAXIMIZE.id);
    protected closeWindow = () => this.commandService.executeCommand(ElectronCommands.CLOSE_WINDOW.id);

    protected collapse = () =>
        this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id, this.isMaximized);

    protected openRecentWorkspace = () => this.commandService.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
    protected closeWorkspace = () => this.commandService.executeCommand(WorkspaceCommands.CLOSE.id);

    protected openMenu(e: React.MouseEvent<HTMLElement, MouseEvent>, menuPath: MenuPath): void {
        e.stopPropagation();
        const button = e.currentTarget.getBoundingClientRect();
        this.contextMenuRenderer.render({
            menuPath: menuPath,
            includeAnchorArg: false,
            anchor: {
                x: button.left,
                y: button.top,
            },
            context: e.currentTarget,
            contextKeyService: this.contextKeyService,
        });
    }

    protected openViewModeMenu(e: React.MouseEvent<HTMLElement, MouseEvent>): void {
        this.openMenu(e, VIEW_MODE_MENU);
    }

    protected openMainMenu(e: React.MouseEvent<HTMLElement, MouseEvent>): void {
        this.openMenu(e, MAIN_MENU_BAR);
    }

    protected openBuildMenu(e: React.MouseEvent<HTMLElement, MouseEvent>): void {
        this.openMenu(e, buildMenuPath);
    }
}
