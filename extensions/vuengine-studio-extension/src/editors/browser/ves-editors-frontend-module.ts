import { createBasicTreeContainer, NavigatableTreeEditorOptions } from '@eclipse-emfcloud/theia-tree-editor';
import '@eclipse-emfcloud/theia-tree-editor/style/forms.css';
import '@eclipse-emfcloud/theia-tree-editor/style/index.css';
import { CommandContribution, MenuContribution } from '@theia/core';
import { createTreeContainer, LabelProviderContribution, NavigatableWidgetOptions, OpenHandler, TreeProps, TreeWidget, WidgetFactory } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesMasterTreeWidget, VES_TREE_PROPS } from './tree/ves-editors-master-tree-widget';
import { VesEditorsTreeEditorWidget } from './tree/ves-editors-tree-editor-widget';
import { VesEditorsTreeLabelProvider } from './tree/ves-editors-tree-label-provider';
import { VesEditorsTreeModelService } from './tree/ves-editors-tree-model-service';
import { VesEditorsTreeNodeFactory } from './tree/ves-editors-tree-node-factory';
import { VesDetailFormWidget } from './ves-editors-detail-form-widget';
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

    bind(VesDetailFormWidget).toSelf().inSingletonScope();

    bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
        id: VesEditorsTreeEditorWidget.WIDGET_ID,
        createWidget: (options: NavigatableWidgetOptions) => {
            const treeContainer = createBasicTreeContainer(
                context.container,
                // @ts-ignore
                VesEditorsTreeEditorWidget,
                VesEditorsTreeModelService,
                VesEditorsTreeNodeFactory
            );
            const uri = new URI(options.uri);
            treeContainer.bind(NavigatableTreeEditorOptions).toConstantValue({ uri });

            return treeContainer.get(VesEditorsTreeEditorWidget);
        }
    }));

    bind(VesMasterTreeWidget).toDynamicValue(context => {
        // eslint-disable-next-line import/no-deprecated
        const treeContainer = createTreeContainer(context.container);
        treeContainer.unbind(TreeWidget);
        treeContainer.bind(VesMasterTreeWidget).toSelf();
        treeContainer.rebind(TreeProps).toConstantValue(VES_TREE_PROPS);
        return treeContainer.get(VesMasterTreeWidget);
    });
});
