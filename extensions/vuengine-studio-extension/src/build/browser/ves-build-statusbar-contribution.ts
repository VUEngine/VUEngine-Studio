import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildService } from './ves-build-service';
import { nls } from '@theia/core';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class VesBuildStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    async onStart(app: FrontendApplication): Promise<void> {
        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            this.updateStatusBar();
        }
    };

    updateStatusBar(): void {
        this.setBuildModeStatusBar();

        this.vesBuildService.onDidChangeBuildStatus(() => this.setBuildModeStatusBar());
        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesBuildPreferenceIds.BUILD_MODE) {
                this.setBuildModeStatusBar();
            }
        });
    }

    setBuildModeStatusBar(): void {
        const label = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) ||
            nls.localize('vuengine/build/buildMode', 'Build Mode');
        this.statusBar.setElement('ves-build-mode', {
            alignment: StatusBarAlignment.LEFT,
            command: VesBuildCommands.SET_MODE.id,
            priority: 3,
            text: `$(codicon-symbol-property) ${label}`,
            tooltip: VesBuildCommands.SET_MODE.label,
        });
    }
}
