import { nls } from '@theia/core';
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';
import { VesEmulatorSidebarCommands } from './ves-emulator-sidebar-view-contribution';
import { VbLinkStatus } from './ves-emulator-types';

@injectable()
export class VesEmulatorStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesEmulatorService)
    protected readonly vesEmulatorService: VesEmulatorService;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();
    };

    updateStatusBar(): void {
        this.setCurrentEmulatorStatusBar();
        this.setVbLinkStatusBar();

        this.vesEmulatorService.onDidChangeEmulator(() => this.setCurrentEmulatorStatusBar());
        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesEmulatorPreferenceIds.DEFAULT_EMULATOR) {
                this.setCurrentEmulatorStatusBar();
            }
        });
        this.vesEmulatorService.onDidChangeVbLinkStatus(() => this.setVbLinkStatusBar());
    }

    setCurrentEmulatorStatusBar(): void {
        const label = this.preferenceService.get(VesEmulatorPreferenceIds.DEFAULT_EMULATOR) ||
            nls.localize('vuengine/emulator/builtIn', 'Built-In');
        this.statusBar.setElement('ves-current-emulator', {
            alignment: StatusBarAlignment.LEFT,
            command: VesEmulatorCommands.SELECT.id,
            priority: 2,
            text: `$(codicon-play) ${label}`,
            tooltip: VesEmulatorCommands.SELECT.label,
        });
    }

    setVbLinkStatusBar(): void {
        if (this.vesEmulatorService.vbLinkStatus.status === VbLinkStatus.idle) {
            this.statusBar.removeElement('ves-vblink-status');
        } else {
            const label = nls.localize('vuengine/emulator/redViper/transferring', 'Transferring to 3DS...');
            const progress = Math.round(
                this.vesEmulatorService.vbLinkStatus.done * 100 / this.vesEmulatorService.vbLinkStatus.total
            );
            this.statusBar.setElement('ves-vblink-status', {
                alignment: StatusBarAlignment.LEFT,
                command: VesEmulatorSidebarCommands.WIDGET_TOGGLE.id,
                priority: 1,
                text: `$(codicon-loading~spin) ${label} (${progress}%)`,
            });
        }
    }
}
