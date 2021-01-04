import { inject, injectable, interfaces } from "inversify";
import { remote } from 'electron';
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesZoomCommands } from "./commands";

@injectable()
export class VesZoomStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.setZoomFactorStatusBar();
    }

    setZoomFactorStatusBar() {
        const currentWindow = remote.getCurrentWindow();
        const ZoomFactor = currentWindow.webContents.getZoomFactor();

        if (ZoomFactor === 1) {
            this.statusBar.removeElement("ves-zoom-factor");
        } else {
            const icon = (ZoomFactor === 1)
                ? "search"
                : (ZoomFactor < 1)
                    ? "search-minus"
                    : "search-plus";

            this.statusBar.setElement("ves-zoom-factor", {
                alignment: StatusBarAlignment.LEFT,
                command: VesZoomCommands.RESET_ZOOM.id,
                priority: -100,
                text: `$(${icon}) ${Math.round(ZoomFactor * 100)}%`,
                tooltip: "Reset zoom",
            });
        }
    }
}

export function bindVesZoomStatusBar(bind: interfaces.Bind): void {
    bind(VesZoomStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesZoomStatusBarContribution);
}
