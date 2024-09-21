import { isOSX } from '@theia/core';
import {
    bindViewContribution,
    FrontendApplicationContribution, WidgetFactory
} from '@theia/core/lib/browser';
import { WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/titlebar/browser/style/index.css';
import { VesTitlebarActionButtonsContribution } from './action-buttons/ves-titlebar-action-buttons-view';
import { VesTitlebarActionButtonsWidget } from './action-buttons/ves-titlebar-action-buttons-widget';
import { VesTitlebarApplicationTitleContribution } from './application-title/ves-titlebar-application-title-view';
import { VesTitlebarApplicationTitleWidget } from './application-title/ves-titlebar-application-title-widget';
import { VesWindowTitleService } from './application-title/ves-window-title-service';
import { VesTitlebarWindowControlsContribution } from './window-controls/ves-titlebar-window-controls-view';
import { VesTitlebarWindowControlsWidget } from './window-controls/ves-titlebar-window-controls-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // window title service
    rebind(WindowTitleService).to(VesWindowTitleService).inSingletonScope();

    // title bar application title
    bindViewContribution(bind, VesTitlebarApplicationTitleContribution);
    bind(FrontendApplicationContribution).toService(VesTitlebarApplicationTitleContribution);
    bind(VesTitlebarApplicationTitleWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: VesTitlebarApplicationTitleWidget.ID,
            createWidget: () =>
                ctx.container.get<VesTitlebarApplicationTitleWidget>(
                    VesTitlebarApplicationTitleWidget
                ),
        }))
        .inSingletonScope();

    // title bar window controls
    if (!isOSX) {
        bindViewContribution(bind, VesTitlebarWindowControlsContribution);
        bind(FrontendApplicationContribution).toService(VesTitlebarWindowControlsContribution);
        bind(VesTitlebarWindowControlsWidget).toSelf();
        bind(WidgetFactory)
            .toDynamicValue(ctx => ({
                id: VesTitlebarWindowControlsWidget.ID,
                createWidget: () =>
                    ctx.container.get<VesTitlebarWindowControlsWidget>(
                        VesTitlebarWindowControlsWidget
                    ),
            }))
            .inSingletonScope();
    }

    // title bar action buttons
    bindViewContribution(bind, VesTitlebarActionButtonsContribution);
    bind(FrontendApplicationContribution).toService(VesTitlebarActionButtonsContribution);
    bind(VesTitlebarActionButtonsWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: VesTitlebarActionButtonsWidget.ID,
            createWidget: () =>
                ctx.container.get<VesTitlebarActionButtonsWidget>(
                    VesTitlebarActionButtonsWidget
                ),
        }))
        .inSingletonScope();
});
