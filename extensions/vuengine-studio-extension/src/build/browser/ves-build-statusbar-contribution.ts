import { inject, injectable, interfaces } from '@theia/core/shared/inversify';
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildService } from './ves-build-service';

@injectable()
export class VesBuildStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;
    @inject(VesBuildService) protected readonly vesBuildService: VesBuildService;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();
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
        let label = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) || 'Build Mode';
        let command = VesBuildCommands.SET_MODE.id;
        let className = undefined;
        if (this.vesBuildService.buildStatus.active) {
            label = `Building... ${this.vesBuildService.buildStatus.progress}%`;
            command = VesBuildCommands.TOGGLE_WIDGET.id;
            className = 'active';
        }
        this.statusBar.setElement('ves-build-mode', {
            alignment: StatusBarAlignment.LEFT,
            className,
            command,
            priority: 3,
            text: `$(wrench) ${label}`,
            tooltip: VesBuildCommands.SET_MODE.label,
        });
    }
}

export function bindVesBuildStatusBar(bind: interfaces.Bind): void {
    bind(VesBuildStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesBuildStatusBarContribution);
}