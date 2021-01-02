import { interfaces } from "inversify";
import { WidgetFactory, FrontendApplicationContribution, bindViewContribution } from "@theia/core/lib/browser";
import { WelcomeContribution } from "./welcome-contribution";
import { WelcomeWidget } from "./welcome-widget";

import "../../../src/browser/welcome/style/index.css";

export function bindVesWelcomeContributions(bind: interfaces.Bind): void {
    bindViewContribution(bind, WelcomeContribution);
    bind(FrontendApplicationContribution).toService(WelcomeContribution);
    bind(WelcomeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: WelcomeWidget.ID,
        createWidget: () => context.container.get<WelcomeWidget>(WelcomeWidget),
    })).inSingletonScope();
};
