import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/script-editor/browser/style/index.css';
import { VesScriptEditorContextKeyService } from './ves-script-editor-context-key-service';
import { VesScriptEditorViewContribution } from './ves-script-editor-view';
import { VesScriptEditorWidget, VesScriptEditorWidgetOptions } from './widget/ves-script-editor-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // context key service
    bind(VesScriptEditorContextKeyService)
        .toSelf()
        .inSingletonScope();

    // script editor view
    bindViewContribution(bind, VesScriptEditorViewContribution);
    bind(FrontendApplicationContribution).toService(VesScriptEditorViewContribution);
    bind(TabBarToolbarContribution).toService(VesScriptEditorViewContribution);
    bind(VesScriptEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: VesScriptEditorWidget.ID,
        createWidget: (options: VesScriptEditorWidgetOptions) => {
            const child = container.createChild();
            child.bind(VesScriptEditorWidgetOptions).toConstantValue(options);
            child.bind(VesScriptEditorWidget).toSelf();
            return child.get(VesScriptEditorWidget);
        },
    }));
});
