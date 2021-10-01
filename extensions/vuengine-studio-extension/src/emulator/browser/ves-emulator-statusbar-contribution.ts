import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorService } from './ves-emulator-service';

@injectable()
export class VesEmulatorStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;
    @inject(VesEmulatorService) protected readonly vesEmulatorService: VesEmulatorService;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();
    };

    updateStatusBar(): void {
        this.setEmulatorStatusBar();

        this.vesEmulatorService.onDidChangeEmulator(() => this.setEmulatorStatusBar());
        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesEmulatorPreferenceIds.DEFAULT_EMULATOR) {
                this.setEmulatorStatusBar();
            }
        });
    }

    setEmulatorStatusBar(): void {
        const label = this.preferenceService.get(VesEmulatorPreferenceIds.DEFAULT_EMULATOR) || 'Built-In';
        this.statusBar.setElement('ves-emulator', {
            alignment: StatusBarAlignment.LEFT,
            command: VesEmulatorCommands.SELECT.id,
            priority: 2,
            text: `$(codicon-play) ${label}`,
            tooltip: VesEmulatorCommands.SELECT.label,
        });
    }
}
