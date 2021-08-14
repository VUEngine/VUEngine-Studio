import { ContainerModule } from '@theia/core/shared/inversify';
import {
    bindViewContribution,
    FrontendApplicationContribution,
    OpenHandler,
    PreferenceContribution,
    WidgetFactory,
    ViewContainerIdentifier,
    WidgetManager
} from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandContribution } from '@theia/core/lib/common/command';
import { VesPluginsContribution } from './ves-plugins-contribution';
import { VesPluginsPreferenceSchema } from './ves-plugins-preferences';
import { VesPluginsService } from './ves-plugins-service';
import { VesPluginsViewContainer } from './ves-plugins-view-container';
import { VesPluginsWidget, VesPluginsWidgetOptions } from './ves-plugins-widget';
import { VesPluginsSourceOptions } from './ves-plugins-source';
import { VesPlugin, VesPluginFactory, VesPluginOptions } from './ves-plugin';
import { VesPluginsModel } from './ves-plugins-model';
import { VesPluginsSearchModel } from './ves-plugins-search-model';
import { VesPluginsSearchBar } from './ves-plugins-search-bar';
import { VesPluginEditorManager } from './ves-plugin-editor-manager';
import { VesPluginEditor } from './ves-plugin-editor';
import { VesPluginsViewContribution } from './ves-plugins-view-contribution';
import '../../../src/vuengine-plugins/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesPluginsContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesPluginsContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesPluginsPreferenceSchema });

    // service
    bind(VesPluginsService).toSelf().inSingletonScope();

    // view
    bind(VesPlugin).toSelf();
    bind(VesPluginFactory).toFactory(ctx => (option: VesPluginOptions) => {
        const child = ctx.container.createChild();
        child.bind(VesPluginOptions).toConstantValue(option);
        return child.get(VesPlugin);
    });
    bind(VesPluginsModel).toSelf().inSingletonScope();

    bind(VesPluginEditor).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesPluginEditor.ID,
        createWidget: async (options: VesPluginOptions) => {
            const plugin = await ctx.container.get(VesPluginsModel).resolve(options.id);
            const child = ctx.container.createChild();
            child.bind(VesPlugin).toConstantValue(plugin);
            return child.get(VesPluginEditor);
        }
    })).inSingletonScope();
    bind(VesPluginEditorManager).toSelf().inSingletonScope();
    bind(OpenHandler).toService(VesPluginEditorManager);

    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: VesPluginsWidget.ID,
        createWidget: async (options: VesPluginsWidgetOptions) => VesPluginsWidget.createWidget(container, options)
    })).inSingletonScope();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesPluginsViewContainer.ID,
        createWidget: async () => {
            const child = ctx.container.createChild();
            child.bind(ViewContainerIdentifier).toConstantValue({
                id: VesPluginsViewContainer.ID,
                progressLocationId: 'vuengine-plugins',
            });
            child.bind(VesPluginsViewContainer).toSelf();
            const viewContainer = child.get(VesPluginsViewContainer);
            const widgetManager = child.get(WidgetManager);
            for (const id of [
                VesPluginsSourceOptions.SEARCH_RESULT,
                VesPluginsSourceOptions.INSTALLED,
                VesPluginsSourceOptions.RECOMMENDED,
            ]) {
                const widget = await widgetManager.getOrCreateWidget(VesPluginsWidget.ID, { id });
                viewContainer.addWidget(widget, {
                    initiallyCollapsed: id === VesPluginsSourceOptions.RECOMMENDED
                });
            }
            return viewContainer;
        }
    })).inSingletonScope();

    bind(VesPluginsSearchModel).toSelf().inSingletonScope();
    bind(VesPluginsSearchBar).toSelf().inSingletonScope();

    bindViewContribution(bind, VesPluginsViewContribution);
    bind(FrontendApplicationContribution).toService(VesPluginsContribution);
    bind(TabBarToolbarContribution).toService(VesPluginsViewContribution);
});
