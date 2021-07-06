import { interfaces } from "inversify";
import { FrontendApplicationContribution } from "@theia/core/lib/browser";
import { BrowserMenuBarContribution, BrowserMainMenuFactory } from "@theia/core/lib/browser/menu/browser-menu-plugin";
import { isOSX } from "@theia/core/lib/common";

export function bindVesTitleBarMainMenu(bind: interfaces.Bind): void {
    if (!isOSX) {
        bind(BrowserMainMenuFactory).toSelf().inSingletonScope();
        bind(BrowserMenuBarContribution).toSelf().inSingletonScope();
        bind(FrontendApplicationContribution).toService(BrowserMenuBarContribution);
    }
}
