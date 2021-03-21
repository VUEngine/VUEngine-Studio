import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { VesOpenFlashCartsWidgetCommand } from "./commands";

@injectable()
export class VesFlashCartsStatusBarContribution implements FrontendApplicationContribution {
    @inject(StatusBar) protected readonly statusBar: StatusBar;
    @inject(VesStateModel) protected readonly vesState: VesStateModel;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.setConnectedFlashCartStatusBar();

        this.vesState.onDidChangeIsFlashing(() => this.setConnectedFlashCartStatusBar());
        this.vesState.onDidChangeFlashingProgress(() => this.setConnectedFlashCartStatusBar());
        this.vesState.onDidChangeConnectedFlashCart(() => {
            this.setConnectedFlashCartStatusBar();
        });
    }

    setConnectedFlashCartStatusBar() {
        let label = "";
        let className = "";
        if (this.vesState.isFlashing) {
            label = `${this.vesState.flashingProgress.step}...`;
            if (this.vesState.flashingProgress.progress >= 0) {
                label += ` ${this.vesState.flashingProgress.progress}%`;
            }
            className = "active";
        } else if (this.vesState.connectedFlashCart) {
            label = this.vesState.connectedFlashCart.config.name;
        } else {
            label = "No Flash Cart";
            className = "disabled";
        }
        this.statusBar.setElement("ves-flash-cart", {
            alignment: StatusBarAlignment.LEFT,
            command: VesOpenFlashCartsWidgetCommand.id,
            className: className,
            priority: 1,
            text: `$(usb) ${label}`,
            tooltip: "Connected Flash Cart"
        });
    }
}

export function bindVesFlashCartsStatusBar(bind: interfaces.Bind): void {
    bind(VesFlashCartsStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesFlashCartsStatusBarContribution);
}
