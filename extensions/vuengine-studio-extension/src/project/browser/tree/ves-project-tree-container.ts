import { interfaces } from '@theia/core/shared/inversify';
import { createTreeContainer, defaultTreeProps, Tree, TreeImpl, TreeProps, TreeWidget } from '@theia/core/lib/browser';
import { Container } from '@theia/core/shared/inversify';
import { VesProjectTree } from './ves-project-tree';
import { VesProjectTreeWidget } from './ves-project-tree-widget';

function createVesProjectTreeContainer(parent: interfaces.Container): Container {
    const child = createTreeContainer(parent);

    child.unbind(TreeImpl);
    child.bind(VesProjectTree).toSelf().inSingletonScope();
    child.rebind(Tree).toService(VesProjectTree);

    child.bind(VesProjectTreeWidget).toSelf().inSingletonScope();
    child.rebind(TreeWidget).toService(VesProjectTreeWidget);

    child.rebind(TreeProps).toConstantValue({
        ...defaultTreeProps,
        search: true,
    });

    return child;
}

export function createVesProjectTreeWidget(parent: interfaces.Container): VesProjectTreeWidget {
    return createVesProjectTreeContainer(parent).get(VesProjectTreeWidget);
}
