import { WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import '../../../src/getting-started/browser/style/index.css';
import { VesGettingStartedWidget } from './ves-getting-started-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesGettingStartedWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: GettingStartedWidget.ID,
        createWidget: () => context.container.get<VesGettingStartedWidget>(VesGettingStartedWidget),
    })).inSingletonScope();
});
