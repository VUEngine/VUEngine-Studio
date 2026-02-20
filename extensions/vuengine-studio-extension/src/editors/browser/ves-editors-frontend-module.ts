import { CommandContribution, MenuContribution, PreferenceContribution } from '@theia/core';
import { FrontendApplicationContribution, KeybindingContribution, LabelProviderContribution, OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WorkspaceCommandContribution } from '@theia/workspace/lib/browser';
import '../../../src/editors/browser/style/index.css';
import { VesEditorsContextKeyService } from './ves-editors-context-key-service';
import { VesEditorsContribution } from './ves-editors-contribution';
import { VesEditorsLabelProviderContribution } from './ves-editors-label-provider';
import { VesEditorsNavigationContribution } from './ves-editors-navigation-contribution';
import { VesEditorsOpenHandler } from './ves-editors-open-handler';
import { VesEditorsPreferenceSchema } from './ves-editors-preferences';
import { VesEditorsViewContribution } from './ves-editors-view';
import { VesEditorsWidget, VesEditorsWidgetOptions } from './ves-editors-widget';
import { VesWorkspaceCommandContribution } from './ves-workspace-commands';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesEditorsPreferenceSchema });

    // override new file dialog
    rebind(WorkspaceCommandContribution).to(VesWorkspaceCommandContribution).inSingletonScope();

    // context key service
    bind(VesEditorsContextKeyService).toSelf().inSingletonScope();

    // open with
    bind(VesEditorsContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesEditorsContribution);

    // add to navigation history, e.g. "recently opened"
    bind(VesEditorsNavigationContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesEditorsNavigationContribution);

    // open handler
    bind(VesEditorsOpenHandler).toSelf().inSingletonScope();
    bind(OpenHandler).toService(VesEditorsOpenHandler);

    // editors view
    bind(VesEditorsViewContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesEditorsViewContribution);
    bind(KeybindingContribution).toService(VesEditorsViewContribution);
    bind(MenuContribution).toService(VesEditorsViewContribution);
    bind(TabBarToolbarContribution).toService(VesEditorsViewContribution);
    bind(LabelProviderContribution).to(VesEditorsLabelProviderContribution).inSingletonScope();
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
