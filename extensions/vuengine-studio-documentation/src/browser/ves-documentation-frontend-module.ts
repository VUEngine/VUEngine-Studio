import { ContainerModule, interfaces } from 'inversify';
import { CommandContribution, MenuContribution } from '@theia/core';
import { bindViewContribution, createTreeContainer, FrontendApplicationContribution, Tree, TreeImpl, TreeWidget, WidgetFactory } from '@theia/core/lib/browser';

import { VesDocumentationContribution } from './ves-documentation-contribution';
import { VesDocumentationIFrameViewContribution } from './ves-documentation-iframe-view';
import { VesDocumentationIFrameWidget } from './ves-documentation-iframe-widget';

import '../../src/browser/style/index.css';
import { VesDocumentationTreeWidget } from './tree/ves-documentation-tree-widget';
import { VesDocumentationTree } from './tree/ves-documentation-tree';
import { VesDocumentationTreeViewContribution } from './tree/ves-documentation-tree-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands and menus
    bind(VesDocumentationContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesDocumentationContribution);
    bind(MenuContribution).toService(VesDocumentationContribution);

    // iframe view
    bindViewContribution(bind, VesDocumentationIFrameViewContribution);
    bind(FrontendApplicationContribution).toService(VesDocumentationIFrameViewContribution);
    bind(VesDocumentationIFrameWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationIFrameWidget.ID,
        createWidget: () => ctx.container.get<VesDocumentationIFrameWidget>(VesDocumentationIFrameWidget),
    })).inSingletonScope();

    // sidebar view
    bindViewContribution(bind, VesDocumentationTreeViewContribution);
    bind(FrontendApplicationContribution).toService(VesDocumentationTreeViewContribution);
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: VesDocumentationTreeWidget.ID,
            createWidget: () => createVesDocumentationTreeWidget(ctx.container)
        }))
        .inSingletonScope();
});

function createVesDocumentationTreeWidget(
    parent: interfaces.Container
): VesDocumentationTreeWidget {
    const child = createTreeContainer(parent);

    child.unbind(TreeImpl);
    child.bind(VesDocumentationTree).toSelf();
    child.rebind(Tree).toService(VesDocumentationTree);

    child.unbind(TreeWidget);
    child.bind(VesDocumentationTreeWidget).toSelf();

    return child.get(VesDocumentationTreeWidget);
}
