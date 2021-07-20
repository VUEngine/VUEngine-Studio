import { ContainerModule } from 'inversify';
import { CommandContribution, MenuContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

import { VesDocumentationContribution } from './ves-documentation-contribution';
import { VesDocumentationIFrameViewContribution } from './ves-documentation-iframe-view';
import { VesDocumentationIFrameWidget } from './ves-documentation-iframe-widget';

import '../../src/browser/style/index.css';
import { VesDocumentationViewContribution } from './ves-documentation-view';
import { VesDocumentationWidget } from './ves-documentation-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands and menus
    bind(VesDocumentationContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesDocumentationContribution);
    bind(MenuContribution).toService(VesDocumentationContribution);

    // sidebar view
    bindViewContribution(bind, VesDocumentationViewContribution);
    bind(FrontendApplicationContribution).toService(VesDocumentationViewContribution);
    bind(VesDocumentationWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationWidget.ID,
        createWidget: () => ctx.container.get<VesDocumentationWidget>(VesDocumentationWidget)
    })).inSingletonScope();

    // iframe view
    bindViewContribution(bind, VesDocumentationIFrameViewContribution);
    bind(FrontendApplicationContribution).toService(
        VesDocumentationIFrameViewContribution
    );
    bind(VesDocumentationIFrameWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationIFrameWidget.ID,
        createWidget: () => ctx.container.get<VesDocumentationIFrameWidget>(VesDocumentationIFrameWidget),
    })).inSingletonScope();
});
