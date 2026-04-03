import { WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WelcomeWidget } from './welcome-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(WelcomeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: WelcomeWidget.ID,
        createWidget: () => context.container.get<WelcomeWidget>(WelcomeWidget),
    })).inSingletonScope();
});
