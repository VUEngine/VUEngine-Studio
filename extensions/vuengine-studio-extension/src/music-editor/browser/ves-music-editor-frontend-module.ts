import { CommandContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/music-editor/browser/style/index.css';
import { VesMusicEditorViewContribution } from './ves-music-editor-view';
import { VesMusicEditorWidget, VesMusicEditorWidgetOptions } from './ves-music-editor-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // music editor view
    bindViewContribution(bind, VesMusicEditorViewContribution);
    bind(FrontendApplicationContribution).toService(VesMusicEditorViewContribution);
    bind(TabBarToolbarContribution).toService(VesMusicEditorViewContribution);
    bind(VesMusicEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: VesMusicEditorWidget.ID,
        createWidget: (options: VesMusicEditorWidgetOptions) => {
            const child = container.createChild();
            child.bind(VesMusicEditorWidgetOptions).toConstantValue(options);
            child.bind(VesMusicEditorWidget).toSelf();
            return child.get(VesMusicEditorWidget);
        },
    }));
    bind(CommandContribution).toService(VesMusicEditorViewContribution);
    bind(KeybindingContribution).toService(VesMusicEditorViewContribution);
});
