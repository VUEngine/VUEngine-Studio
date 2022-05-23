import { createBasicTreeContainer } from '@eclipse-emfcloud/theia-tree-editor';
import '@eclipse-emfcloud/theia-tree-editor/style/forms.css';
import '@eclipse-emfcloud/theia-tree-editor/style/index.css';
import { CommandContribution, MenuContribution } from '@theia/core';
import { createTreeContainer, LabelProviderContribution, NavigatableWidgetOptions, OpenHandler, TreeProps, TreeWidget, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesMasterTreeWidget, VES_TREE_PROPS } from './tree/ves-editors-master-tree-widget';
import { VesEditorsTreeEditorOptions, VesEditorsTreeEditorWidget } from './tree/ves-editors-tree-editor-widget';
import { VesEditorsTreeLabelProvider } from './tree/ves-editors-tree-label-provider';
import { VesEditorsTreeModelService } from './tree/ves-editors-tree-model-service';
import { VesEditorsTreeNodeFactory } from './tree/ves-editors-tree-node-factory';
import { VesDetailFormWidget } from './ves-editors-detail-form-widget';
import { VesEditorsOpenHandler } from './ves-editors-open-handler';
import { VesEditorsTreeContribution } from './ves-editors-tree-contribution';
import { VesEditorsTreeLabelProviderContribution } from './ves-editors-tree-label-provider-contribution';
import '../../../src/editors/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(LabelProviderContribution).to(VesEditorsTreeLabelProviderContribution);
    bind(OpenHandler).to(VesEditorsTreeContribution);
    bind(MenuContribution).to(VesEditorsTreeContribution);
    bind(CommandContribution).to(VesEditorsTreeContribution);
    bind(LabelProviderContribution).to(VesEditorsTreeLabelProvider);

    bind(VesEditorsTreeModelService).toSelf().inSingletonScope();
    bind(VesEditorsTreeLabelProvider).toSelf().inSingletonScope();

    bind(VesDetailFormWidget).toSelf();

    bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
        id: VesEditorsTreeEditorWidget.WIDGET_ID,
        createWidget: (options: NavigatableWidgetOptions) => {
            const treeContainer = createBasicTreeContainer(
                context.container,
                VesEditorsTreeEditorWidget,
                VesEditorsTreeModelService,
                VesEditorsTreeNodeFactory
            );
            treeContainer.bind(VesEditorsTreeEditorOptions).toConstantValue(options);

            return treeContainer.get(VesEditorsTreeEditorWidget);
        }
    }));
    bind(VesEditorsOpenHandler).toSelf().inSingletonScope();
    bind(OpenHandler).toService(VesEditorsOpenHandler);

    bind(VesMasterTreeWidget).toDynamicValue(context => {
        const treeContainer = createTreeContainer(context.container);
        treeContainer.unbind(TreeWidget);
        treeContainer.bind(VesMasterTreeWidget).toSelf();
        treeContainer.rebind(TreeProps).toConstantValue(VES_TREE_PROPS);
        return treeContainer.get(VesMasterTreeWidget);
    });
});
