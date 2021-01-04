import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { ConnectedFlashCart } from "./commands/flash";

@injectable()
export class VesFlashCartsStatusBarContribution implements FrontendApplicationContribution {
    @inject(VesStateModel) protected readonly vesState: VesStateModel;
    @inject(StatusBar) protected readonly statusBar: StatusBar;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.setConnectedFlashCartStatusBar();

        this.vesState.onDidChangeConnectedFlashCart((connectedFlashCart: ConnectedFlashCart | undefined) => {
            this.setConnectedFlashCartStatusBar(connectedFlashCart ? connectedFlashCart.config.name : undefined);
        });
    }

    setConnectedFlashCartStatusBar(name?: string) {
        const text = name ? name : "No Flash Cart Connected";
        this.statusBar.setElement("ves-flash-cart", {
            alignment: StatusBarAlignment.LEFT,
            className: name ? "" : "disabled",
            priority: 1,
            text: `$(usb) ${text}`,
            tooltip: "Connected Flash Cart"
        });
    }
}

export function bindVesFlashCartsStatusBar(bind: interfaces.Bind): void {
    bind(VesFlashCartsStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesFlashCartsStatusBarContribution);
}
