import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesState } from "../common/ves-state";
import { VesFlashCartsCommands } from "./flash-carts-commands";

@injectable()
export class VesFlashCartsStatusBarContribution implements FrontendApplicationContribution {
    @inject(StatusBar) protected readonly statusBar: StatusBar;
    @inject(VesState) protected readonly vesState: VesState;

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
            label = `Flashing... ${this.vesState.flashingProgress}%`;
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
            command: VesFlashCartsCommands.OPEN_WIDGET.id,
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
