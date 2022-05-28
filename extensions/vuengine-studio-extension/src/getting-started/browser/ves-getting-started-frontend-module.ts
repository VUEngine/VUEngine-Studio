import {
    bindViewContribution,
    FrontendApplicationContribution, PreferenceContribution, WidgetFactory
} from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/getting-started/browser/style/index.css';
import { VesGettingStartedPreferenceSchema } from './ves-getting-started-preferences';
import { VesGettingStartedViewContribution } from './ves-getting-started-view-contribution';
import { VesGettingStartedWidget } from './ves-getting-started-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesGettingStartedPreferenceSchema });

    // getting started view
    bindViewContribution(bind, VesGettingStartedViewContribution);
    bind(FrontendApplicationContribution).toService(VesGettingStartedViewContribution);
    bind(TabBarToolbarContribution).toService(VesGettingStartedViewContribution);
    bind(VesGettingStartedWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: VesGettingStartedWidget.ID,
        createWidget: () => context.container.get<VesGettingStartedWidget>(VesGettingStartedWidget),
    })).inSingletonScope();
});
