import { ContainerModule } from 'inversify';
import { MenuContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

import { VesDocumentationContribution } from './ves-documentation-contribution';
import { VesDocumentationTechScrollViewContribution } from './ves-documentation-tech-scroll-view';
import { VesDocumentationTechScrollWidget } from './ves-documentation-tech-scroll-widget';
import { VesDocumentationTreeWidget } from './tree/ves-documentation-tree-widget';
import { VesDocumentationTreeViewContribution } from './tree/ves-documentation-tree-view-contribution';
import { createVesDocumentationTreeWidget } from './tree/ves-documentation-tree-container';
import { VesDocumentationHandbookViewContribution } from './ves-documentation-handbook-view';
import { VesDocumentationHandbookWidget } from './ves-documentation-Handbook-widget';

import '../../src/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // menus
    bind(VesDocumentationContribution).toSelf().inSingletonScope();
    bind(MenuContribution).toService(VesDocumentationContribution);

    // handbook view
    bindViewContribution(bind, VesDocumentationHandbookViewContribution);
    bind(FrontendApplicationContribution).toService(VesDocumentationHandbookViewContribution);
    bind(VesDocumentationHandbookWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationHandbookWidget.ID,
        createWidget: () => ctx.container.get<VesDocumentationHandbookWidget>(VesDocumentationHandbookWidget),
    })).inSingletonScope();

    // tech scroll view
    bindViewContribution(bind, VesDocumentationTechScrollViewContribution);
    bind(FrontendApplicationContribution).toService(VesDocumentationTechScrollViewContribution);
    bind(VesDocumentationTechScrollWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationTechScrollWidget.ID,
        createWidget: () => ctx.container.get<VesDocumentationTechScrollWidget>(VesDocumentationTechScrollWidget),
    })).inSingletonScope();

    // sidebar view
    bindViewContribution(bind, VesDocumentationTreeViewContribution);
    bind(FrontendApplicationContribution).toService(VesDocumentationTreeViewContribution);
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationTreeWidget.ID,
        createWidget: () => createVesDocumentationTreeWidget(ctx.container)
    })).inSingletonScope();
});
