import { interfaces } from 'inversify';
import { createTreeContainer, defaultTreeProps, Tree, TreeImpl, TreeProps, TreeWidget } from '@theia/core/lib/browser';

import { VesDocumentationTree } from './ves-documentation-tree';
import { VesDocumentationTreeWidget } from './ves-documentation-tree-widget';
import { Container } from '@theia/core/shared/inversify';

function createVesDocumentationTreeContainer(parent: interfaces.Container): Container {
    const child = createTreeContainer(parent);

    child.unbind(TreeImpl);
    child.bind(VesDocumentationTree).toSelf();
    child.rebind(Tree).toService(VesDocumentationTree);

    child.bind(VesDocumentationTreeWidget).toSelf();
    child.rebind(TreeWidget).toService(VesDocumentationTreeWidget);

    child.rebind(TreeProps).toConstantValue({
        ...defaultTreeProps,
        search: true,
    });

    return child;
}

export function createVesDocumentationTreeWidget(parent: interfaces.Container): VesDocumentationTreeWidget {
    return createVesDocumentationTreeContainer(parent).get(VesDocumentationTreeWidget);
}
