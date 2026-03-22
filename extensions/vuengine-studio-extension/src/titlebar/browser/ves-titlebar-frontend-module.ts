import {
    bindViewContribution,
    FrontendApplicationContribution, WidgetFactory
} from '@theia/core/lib/browser';
import { WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/titlebar/browser/style/index.css';
import { VesWindowTitleService } from './ves-window-title-service';
import { TitlebarContribution } from './ves-titlebar-view';
import { TitlebarWidget } from './ves-titlebar-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // window title service
    rebind(WindowTitleService).to(VesWindowTitleService).inSingletonScope();

    // title bar widget
    bindViewContribution(bind, TitlebarContribution);
    bind(FrontendApplicationContribution).toService(TitlebarContribution);
    bind(TitlebarWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: TitlebarWidget.ID,
            createWidget: () =>
                ctx.container.get<TitlebarWidget>(
                    TitlebarWidget
                ),
        }))
        .inSingletonScope();
});
