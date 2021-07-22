import { interfaces } from 'inversify';
import { createTreeContainer, Tree, TreeImpl, TreeModel, TreeModelImpl, TreeWidget } from '@theia/core/lib/browser';

import { VesDocumentationTree } from './ves-documentation-tree';
import { VesDocumentationTreeModel } from './ves-documentation-tree-model';
import { VesDocumentationTreeWidget } from './ves-documentation-tree-widget';
import { Container } from '@theia/core/shared/inversify';

function createVesDocumentationTreeContainer(parent: interfaces.Container): Container {
    const child = createTreeContainer(parent);

    child.unbind(TreeImpl);
    child.bind(VesDocumentationTree).toSelf();
    child.rebind(Tree).toService(VesDocumentationTree);

    child.unbind(TreeModelImpl);
    child.bind(VesDocumentationTreeModel).toSelf();
    child.rebind(TreeModel).toService(VesDocumentationTreeModel);

    child.bind(VesDocumentationTreeWidget).toSelf();
    child.rebind(TreeWidget).toService(VesDocumentationTreeWidget);

    return child;
}

export function createVesDocumentationTreeWidget(parent: interfaces.Container): VesDocumentationTreeWidget {
    return createVesDocumentationTreeContainer(parent).get(VesDocumentationTreeWidget);
}
