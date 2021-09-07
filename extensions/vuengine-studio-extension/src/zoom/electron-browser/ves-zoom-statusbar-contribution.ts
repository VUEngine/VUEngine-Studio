import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { VesZoomPreferenceIds } from './ves-zoom-preferences';
import { VesZoomCommands } from './ves-zoom-commands';

@injectable()
export class VesZoomStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();

        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if ([VesZoomPreferenceIds.ZOOM_LEVEL, VesZoomPreferenceIds.SHOW_STATUS_BAR_ENTRY].includes(preferenceName)) {
                this.updateStatusBar();
            }
        });
    };

    updateStatusBar(): void {
        this.setZoomFactorStatusBar();
    }

    setZoomFactorStatusBar(): void {
        const show = this.preferenceService.get(VesZoomPreferenceIds.SHOW_STATUS_BAR_ENTRY) as boolean;
        const zoomLevel = this.preferenceService.get(VesZoomPreferenceIds.ZOOM_LEVEL) as string;
        const zoomLevelInt = parseInt(zoomLevel.replace('%', ''));

        if (!show || zoomLevelInt === 100) {
            this.statusBar.removeElement('ves-zoom-factor');
        } else {
            const icon = (zoomLevelInt < 100)
                ? 'search-minus'
                : (zoomLevelInt > 100)
                    ? 'search-plus'
                    : 'search';

            this.statusBar.setElement('ves-zoom-factor', {
                alignment: StatusBarAlignment.LEFT,
                command: VesZoomCommands.RESET_ZOOM.id,
                priority: -100,
                text: `$(${icon}) ${zoomLevel}`,
                tooltip: 'Reset zoom',
            });
        }
    }
}
