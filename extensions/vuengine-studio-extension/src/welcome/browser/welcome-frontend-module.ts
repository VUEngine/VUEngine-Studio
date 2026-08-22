import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WelcomeViewContribution } from './welcome-view-contribution';
import { WelcomeWidget } from './welcome-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bindViewContribution(bind, WelcomeViewContribution);
    bind(FrontendApplicationContribution).toService(WelcomeViewContribution);
    bind(WelcomeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: WelcomeWidget.ID,
        createWidget: () => ctx.container.get<WelcomeWidget>(WelcomeWidget)
    })).inSingletonScope();
});
