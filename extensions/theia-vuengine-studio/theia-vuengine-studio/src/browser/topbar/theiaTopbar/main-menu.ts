import { interfaces } from "inversify";
import { isOSX } from "@theia/core/lib/common";
import {
    BrowserMenuBarContribution,
    BrowserMainMenuFactory,
} from "@theia/core/lib/browser/menu/browser-menu-plugin";
import { FrontendApplicationContribution } from "@theia/core/lib/browser";

export function bindVesTopBarMainMenu(bind: interfaces.Bind): void {
    if (!isOSX) {
        bind(BrowserMainMenuFactory).toSelf().inSingletonScope();
        bind(BrowserMenuBarContribution).toSelf().inSingletonScope();
        bind(FrontendApplicationContribution).toService(BrowserMenuBarContribution);
    }
}
