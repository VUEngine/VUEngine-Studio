import { CommandService, MessageService, nls, PreferenceService, QuickPickService } from '@theia/core';
import {
    FrontendApplication,
    HoverService,
    LocalStorageService,
    Message,
    OpenerService,
    StatusBar,
    StatusBarEntry
} from '@theia/core/lib/browser';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCodeGenService } from '../../codegen/browser/ves-codegen-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { EditorsContext } from '../../editors/browser/ves-editors-types';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import ProjectDashboard from './components/StagesDashboard/ProjectDashboard';
import { VesProjectService } from './ves-project-service';

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.25;
export const ZOOM_DEFAULT = 0.5;

interface VesProjectDashboardWidgetState {
    scale: number
}

@injectable()
export class VesProjectDashboardWidget extends ReactWidget {
    @inject(FrontendApplication)
    protected readonly app: FrontendApplication;
    @inject(ClipboardService)
    private readonly clipboardService: ClipboardService;
    @inject(ColorRegistry)
    private readonly colorRegistry: ColorRegistry;
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(EnvVariablesServer)
    protected readonly envVariablesServer: EnvVariablesServer;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;
    @inject(HoverService)
    protected readonly hoverService: HoverService;
    @inject(MessageService)
    protected readonly messageService: MessageService;
    @inject(LocalStorageService)
    protected readonly localStorageService: LocalStorageService;
    @inject(OpenerService)
    protected readonly openerService: OpenerService;
    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(ThemeService)
    protected readonly themeService: ThemeService;
    @inject(VesBuildPathsService)
    protected readonly vesBuildPathsService: VesBuildPathsService;
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService;
    @inject(VesCodeGenService)
    protected readonly vesCodeGenService: VesCodeGenService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesImagesService)
    protected readonly vesImagesService: VesImagesService;
    @inject(VesPluginsService)
    protected readonly vesPluginsService: VesPluginsService;
    @inject(VesProcessService)
    protected readonly vesProcessService: VesProcessService;
    @inject(VesProcessWatcher)
    protected readonly vesProcessWatcher: VesProcessWatcher;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;
    @inject(VesRumblePackService)
    private readonly vesRumblePackService: VesRumblePackService;
    @inject(WindowService)
    private readonly windowService: WindowService;
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    static readonly ID = 'vesProjectDashboardWidget';
    static readonly LABEL = nls.localize('vuengine/project/stagesDashboard', 'Stages');

    protected state: VesProjectDashboardWidgetState = {
        scale: ZOOM_DEFAULT,
    };

    protected resource = '';

    protected statusBarItems: { [id: string]: StatusBarEntry } = {};

    @postConstruct()
    protected init(): void {
        this.doInit();

        this.id = VesProjectDashboardWidget.ID;
        this.title.label = VesProjectDashboardWidget.LABEL;
        this.title.caption = nls.localize('vuengine/project/stagesDashboard', 'Stages');
        this.title.iconClass = 'codicon codicon-compass';
        this.title.closable = true;
        this.node.style.outline = 'none';

        this.update();
    }

    protected async doInit(): Promise<void> {
    }

    protected setStatusBarItem(id: string, entry: StatusBarEntry): void {
        this.statusBarItems[id] = entry;
        this.statusBar.setElement(id, entry);
    }

    protected removeStatusBarItem(id: string): void {
        delete (this.statusBarItems[id]);
        this.statusBar.removeElement(id);
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.tabIndex = 0;
        this.node.focus();
    }

    protected onAfterAttach(msg: Message): void {
        this.setStatusBar();
    }

    protected onAfterDetach(msg: Message): void {
        this.resetStatusBar();
    }

    protected onAfterShow(msg: Message): void {
        this.setStatusBar();
    }

    protected onAfterHide(msg: Message): void {
        this.resetStatusBar();
    }

    protected setStatusBar(): void {
        this.app.shell.addClass('hide-text-editor-status-bar-items');
        Object.keys(this.statusBarItems).forEach(id => this.statusBar.setElement(id, this.statusBarItems[id]));
    }

    protected resetStatusBar(): void {
        this.app.shell.removeClass('hide-text-editor-status-bar-items');
        Object.keys(this.statusBarItems).forEach(id => this.statusBar.removeElement(id));
    }

    handleZoomIn(): void {
        if (this.state.scale + ZOOM_STEP <= ZOOM_MAX) {
            this.setScale(this.state.scale + ZOOM_STEP);
        }
    }

    handleZoomOut(): void {
        if (this.state.scale - ZOOM_STEP >= ZOOM_MIN) {
            this.setScale(this.state.scale - ZOOM_STEP);
        }
    }

    handleZoomReset(): void {
        this.setScale(ZOOM_DEFAULT);
    }

    protected setScale(scale: number): void {
        this.state.scale = scale;
        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <div className="jsonforms-container">
                <EditorsContext.Provider
                    // @ts-ignore
                    value={{
                        disableCommands: () => { },
                        enableCommands: () => { },
                        activateEditor: () => { },
                        setStatusBarItem: this.setStatusBarItem.bind(this),
                        removeStatusBarItem: this.removeStatusBarItem.bind(this),
                        services: {
                            clipboardService: this.clipboardService,
                            colorRegistry: this.colorRegistry,
                            commandService: this.commandService,
                            envVariablesServer: this.envVariablesServer,
                            fileService: this.fileService,
                            fileDialogService: this.fileDialogService,
                            hoverService: this.hoverService,
                            messageService: this.messageService,
                            localStorageService: this.localStorageService,
                            openerService: this.openerService,
                            quickPickService: this.quickPickService,
                            preferenceService: this.preferenceService,
                            themeService: this.themeService,
                            vesBuildPathsService: this.vesBuildPathsService,
                            vesBuildService: this.vesBuildService,
                            vesCodeGenService: this.vesCodeGenService,
                            vesCommonService: this.vesCommonService,
                            vesImagesService: this.vesImagesService,
                            vesPluginsService: this.vesPluginsService,
                            vesProcessService: this.vesProcessService,
                            vesProcessWatcher: this.vesProcessWatcher,
                            vesProjectService: this.vesProjectService,
                            vesRumblePackService: this.vesRumblePackService,
                            windowService: this.windowService,
                            workspaceService: this.workspaceService,
                        }
                    }}
                >
                    <ProjectDashboard
                        scale={this.state.scale}
                        setScale={this.setScale.bind(this)}
                    />
                </EditorsContext.Provider>
            </div>
        );
    }
}
