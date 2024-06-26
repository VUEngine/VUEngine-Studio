import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { VesRumblePackService } from './ves-rumble-pack-service';
import { nls } from '@theia/core';

@injectable()
export class VesRumblePackStatusBarContribution implements FrontendApplicationContribution {
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesRumblePackService)
    protected readonly vesRumblePackService: VesRumblePackService;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();
    };

    updateStatusBar(): void {
        this.setConnectedRumblePackStatusBar();

        this.vesRumblePackService.onDidChangeConnectedRumblePack(() => {
            this.setConnectedRumblePackStatusBar();
        });
    }

    setConnectedRumblePackStatusBar(): void {
        if (this.vesRumblePackService.connectedRumblePack !== undefined) {
            this.statusBar.setElement('ves-rumble-pack', {
                alignment: StatusBarAlignment.LEFT,
                priority: 2,
                text: `$(codicon-screen-full codicon-rotate-90) ${nls.localize('vuengine/rumblePack/rumblePack', 'Rumble Pack')}`,
                tooltip: nls.localize('vuengine/rumblePack/rumblePackConnected', 'Rumble Pack Connected')
            });
        } else {
            this.statusBar.removeElement('ves-rumble-pack');
        }
    }
}
