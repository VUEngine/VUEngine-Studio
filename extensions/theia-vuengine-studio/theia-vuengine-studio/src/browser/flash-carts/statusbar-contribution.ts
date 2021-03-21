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
        this.vesState.onDidChangeConnectedFlashCarts(() => {
            this.setConnectedFlashCartStatusBar();
        });
    }

    setConnectedFlashCartStatusBar() {
        let label = "";
        let className = "";
        if (this.vesState.isFlashing) {
            label = "Flashing...";
            // TODO: move overall progress to state
            let activeCarts = 0;
            let activeCartsProgress = 0;
            for (const connectedFlashCart of this.vesState.connectedFlashCarts) {
                if (connectedFlashCart.status.progress > -1) {
                    activeCarts++;
                    activeCartsProgress += connectedFlashCart.status.progress;
                }
            }
            if (activeCarts >= 0) {
                const overallProgress = Math.floor(activeCartsProgress / activeCarts);
                label += ` ${overallProgress}%`;
            }
            className = "active";
        } else if (this.vesState.connectedFlashCarts.length > 0) {
            const connectedFlashCartsNames = [];
            for (const connectedFlashCart of this.vesState.connectedFlashCarts) {
                connectedFlashCartsNames.push(connectedFlashCart.config.name);
            }
            label = connectedFlashCartsNames.join(", ");
        } else {
            label = "No Flash Carts";
            className = "disabled";
        }
        this.statusBar.setElement("ves-flash-carts", {
            alignment: StatusBarAlignment.LEFT,
            command: VesOpenFlashCartsWidgetCommand.id,
            className: className,
            priority: 1,
            text: `$(usb) ${label}`,
            tooltip: "Connected Flash Carts"
        });
    }
}

export function bindVesFlashCartsStatusBar(bind: interfaces.Bind): void {
    bind(VesFlashCartsStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesFlashCartsStatusBarContribution);
}
