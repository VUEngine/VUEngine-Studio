import {
    bindViewContribution,
    FrontendApplicationContribution,
    OpenHandler,
    PreferenceContribution, ViewContainerIdentifier, WidgetFactory, WidgetManager
} from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandContribution } from '@theia/core/lib/common/command';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/plugins/browser/style/index.css';
import { VesPlugin, VesPluginFactory, VesPluginOptions } from './ves-plugin';
import { VesPluginEditor } from './ves-plugin-editor';
import { VesPluginEditorManager } from './ves-plugin-editor-manager';
import { VesPluginTag, VesPluginTagFactory, VesPluginTagOptions } from './ves-plugin-tag';
import { VesPluginsContribution } from './ves-plugins-contribution';
import { VesPluginsModel } from './ves-plugins-model';
import { VesPluginsPathsService } from './ves-plugins-paths-service';
import { VesPluginsPreferenceSchema } from './ves-plugins-preferences';
import { VesPluginsSearchBar } from './ves-plugins-search-bar';
import { VesPluginsSearchModel } from './ves-plugins-search-model';
import { VesPluginsService } from './ves-plugins-service';
import { VesPluginsSourceOptions } from './ves-plugins-source';
import { VesPluginsViewContainer } from './ves-plugins-view-container';
import { VesPluginsViewContribution } from './ves-plugins-view-contribution';
import { VesPluginsWidget, VesPluginsWidgetOptions } from './ves-plugins-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesPluginsContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesPluginsContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesPluginsPreferenceSchema });

    // services
    bind(VesPluginsService).toSelf().inSingletonScope();
    bind(VesPluginsPathsService).toSelf().inSingletonScope();

    // view
    bind(VesPlugin).toSelf();
    bind(VesPluginTag).toSelf();
    bind(VesPluginFactory).toFactory(ctx => (option: VesPluginOptions) => {
        const child = ctx.container.createChild();
        child.bind(VesPluginOptions).toConstantValue(option);
        return child.get(VesPlugin);
    });
    bind(VesPluginTagFactory).toFactory(ctx => (option: VesPluginTagOptions) => {
        const child = ctx.container.createChild();
        child.bind(VesPluginTagOptions).toConstantValue(option);
        return child.get(VesPluginTag);
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
                VesPluginsSourceOptions.TAGS,
                VesPluginsSourceOptions.RECOMMENDED,
            ]) {
                const widget = await widgetManager.getOrCreateWidget(VesPluginsWidget.ID, { id });
                viewContainer.addWidget(widget, {
                    initiallyCollapsed: [
                        VesPluginsSourceOptions.TAGS,
                        VesPluginsSourceOptions.RECOMMENDED,
                    ].includes(id),
                });
            }
            return viewContainer;
        }
    })).inSingletonScope();

    bind(VesPluginsSearchModel).toSelf().inSingletonScope();
    bind(VesPluginsSearchBar).toSelf().inSingletonScope();

    bindViewContribution(bind, VesPluginsViewContribution);
    bind(FrontendApplicationContribution).toService(VesPluginsViewContribution);
    bind(TabBarToolbarContribution).toService(VesPluginsViewContribution);
});
