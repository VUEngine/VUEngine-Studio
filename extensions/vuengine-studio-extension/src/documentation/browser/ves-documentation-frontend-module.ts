import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution, MenuContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesDocumentationContribution } from './ves-documentation-contribution';
import { VesDocumentationTreeWidget } from './tree/ves-documentation-tree-widget';
import { VesDocumentationTreeViewContribution } from './tree/ves-documentation-tree-view-contribution';
import { createVesDocumentationTreeWidget } from './tree/ves-documentation-tree-container';
import { VesDocumentationHandbookViewContribution } from './ves-documentation-handbook-view';
import { VesDocumentationHandbookWidget } from './ves-documentation-Handbook-widget';
import { VesDocumentationService } from './ves-documentation-service';
import '../../../src/documentation/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // menus
    bind(VesDocumentationContribution).toSelf().inSingletonScope();
    bind(MenuContribution).toService(VesDocumentationContribution);
    bind(CommandContribution).toService(VesDocumentationContribution);

    // documentation service
    bind(VesDocumentationService).toSelf().inSingletonScope();

    // handbook view
    bindViewContribution(bind, VesDocumentationHandbookViewContribution);
    bind(FrontendApplicationContribution).toService(VesDocumentationHandbookViewContribution);
    bind(VesDocumentationHandbookWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationHandbookWidget.ID,
        createWidget: () => ctx.container.get<VesDocumentationHandbookWidget>(VesDocumentationHandbookWidget),
    })).inSingletonScope();

    // sidebar view
    bindViewContribution(bind, VesDocumentationTreeViewContribution);
    bind(FrontendApplicationContribution).toService(VesDocumentationTreeViewContribution);
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationTreeWidget.ID,
        createWidget: () => createVesDocumentationTreeWidget(ctx.container)
    })).inSingletonScope();
});
