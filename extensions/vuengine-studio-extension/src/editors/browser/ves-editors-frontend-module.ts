import { CommandContribution, MenuContribution } from '@theia/core';
import { FrontendApplicationContribution, LabelProviderContribution, OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WorkspaceCommandContribution } from '@theia/workspace/lib/browser';
import '../../../src/editors/browser/style/index.css';
import { VesEditorsContextKeyService } from './ves-editors-context-key-service';
import { VesEditorsLabelProviderContribution } from './ves-editors-label-provider';
import { VesEditorsOpenHandler } from './ves-editors-open-handler';
import { VesEditorsViewContribution } from './ves-editors-view';
import { VesEditorsWidget, VesEditorsWidgetOptions } from './ves-editors-widget';
import { VesWorkspaceCommandContribution } from './ves-workspace-commands';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // override new file dialog
    bind(VesWorkspaceCommandContribution).toSelf().inSingletonScope();
    rebind(WorkspaceCommandContribution).toService(VesWorkspaceCommandContribution);

    // context key service
    bind(VesEditorsContextKeyService)
        .toSelf()
        .inSingletonScope();

    // editor view
    bind(VesEditorsViewContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesEditorsViewContribution);
    bind(CommandContribution).toService(VesEditorsViewContribution);
    bind(MenuContribution).toService(VesEditorsViewContribution);
    bind(TabBarToolbarContribution).toService(VesEditorsViewContribution);
    bind(LabelProviderContribution).to(VesEditorsLabelProviderContribution).inSingletonScope();
    bind(OpenHandler).to(VesEditorsOpenHandler).inSingletonScope();
    bind(VesEditorsWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: VesEditorsWidget.ID,
        createWidget: (options: VesEditorsWidgetOptions) => {
            const child = container.createChild();
            child.bind(VesEditorsWidgetOptions).toConstantValue(options);
            child.bind(VesEditorsWidget).toSelf();
            return child.get(VesEditorsWidget);
        },
    }));
});
