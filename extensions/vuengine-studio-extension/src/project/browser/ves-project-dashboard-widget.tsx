import { CommandService, MessageService, nls, QuickPickService } from '@theia/core';
import { ExtractableWidget, HoverService, LocalStorageService, Message, OpenerService, PreferenceService, StatusBar, StatusBarEntry } from '@theia/core/lib/browser';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { EditorsContext } from '../../editors/browser/ves-editors-types';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import ProjectDashboard from './components/ProjectDashboard';
import { VesProjectService } from './ves-project-service';

@injectable()
export class VesProjectDashboardWidget extends ReactWidget implements ExtractableWidget {
    @inject(ColorRegistry)
    private readonly colorRegistry: ColorRegistry;
    @inject(CommandService)
    protected readonly commandService: CommandService;
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
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesImagesService)
    protected readonly vesImagesService: VesImagesService;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;
    @inject(VesRumblePackService)
    private readonly vesRumblePackService: VesRumblePackService;
    @inject(WindowService)
    private readonly windowService: WindowService;
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    static readonly ID = 'vesProjectDashboardWidget';
    static readonly LABEL = nls.localize('vuengine/project/dashboard', 'Project Dashboard');

    protected resource = '';

    isExtractable: boolean = true;
    secondaryWindow: Window | undefined;

    @postConstruct()
    protected init(): void {
        this.doInit();

        const label = nls.localize('vuengine/project/project', 'Project');
        this.id = VesProjectDashboardWidget.ID;
        this.title.label = label;
        this.title.caption = 'Project Dashboard';
        this.title.iconClass = 'codicon codicon-home';
        this.title.closable = true;
        this.node.style.outline = 'none';

        this.update();
    }

    protected async doInit(): Promise<void> {
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.tabIndex = 0;
        this.node.focus();
    }

    protected render(): React.ReactNode {
        return (
            <div className="jsonforms-container">
                <EditorsContext.Provider
                    // @ts-ignore
                    value={{
                        setStatusBarItem: (id: string, entry: StatusBarEntry) => this.statusBar.setElement(id, entry),
                        removeStatusBarItem: (id: string) => this.statusBar.removeElement(id),
                        services: {
                            colorRegistry: this.colorRegistry,
                            commandService: this.commandService,
                            fileService: this.fileService,
                            fileDialogService: this.fileDialogService,
                            hoverService: this.hoverService,
                            messageService: this.messageService,
                            localStorageService: this.localStorageService,
                            openerService: this.openerService,
                            quickPickService: this.quickPickService,
                            preferenceService: this.preferenceService,
                            themeService: this.themeService,
                            vesBuildService: this.vesBuildService,
                            vesCommonService: this.vesCommonService,
                            vesImagesService: this.vesImagesService,
                            vesProjectService: this.vesProjectService,
                            vesRumblePackService: this.vesRumblePackService,
                            windowService: this.windowService,
                            workspaceService: this.workspaceService,
                        }
                    }}
                >
                    <ProjectDashboard />
                </EditorsContext.Provider>
            </div>
        );
    }
}
