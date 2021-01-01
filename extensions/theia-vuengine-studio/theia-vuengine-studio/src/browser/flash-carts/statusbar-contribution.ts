import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { FlashCartConfig } from "./commands/flash";

@injectable()
export class VesFlashCartsStatusBarContribution implements FrontendApplicationContribution {
    @inject(VesStateModel) protected readonly vesState: VesStateModel;
    @inject(StatusBar) protected readonly statusBar: StatusBar;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.setConnectedFlashCartStatusBar();

        this.vesState.onDidChangeConnectedFlashCart((flashCartConfig: FlashCartConfig | undefined) => {
            this.setConnectedFlashCartStatusBar(flashCartConfig ? flashCartConfig.name : undefined);
        });
    }

    setConnectedFlashCartStatusBar(name?: string) {
        const emulatorName = name ? name : "No Flash Cart";
        this.statusBar.setElement("ves-flash-cart", {
            alignment: StatusBarAlignment.LEFT,
            className: name ? "" : "disabled",
            priority: 101,
            text: `$(usb) ${emulatorName}`,
            tooltip: "Connected Flash Cart"
        });
    }
}

export function bindVesFlashCartsStatusBar(bind: interfaces.Bind): void {
    bind(VesFlashCartsStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesFlashCartsStatusBarContribution);
}
