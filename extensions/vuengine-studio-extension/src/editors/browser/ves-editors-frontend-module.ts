import { bindViewContribution, FrontendApplicationContribution, OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/editors/browser/style/index.css';
import { VesEditorsContextKeyService } from './ves-editors-context-key-service';
import { VesEditorsOpenHandler } from './ves-editors-open-handler';
import { VesEditorsViewContribution } from './ves-editors-view';
import { VesEditorsWidget, VesEditorsWidgetOptions } from './ves-editors-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // context key service
    bind(VesEditorsContextKeyService)
        .toSelf()
        .inSingletonScope();

    // editor view
    bindViewContribution(bind, VesEditorsViewContribution);
    bind(FrontendApplicationContribution).toService(VesEditorsViewContribution);
    bind(TabBarToolbarContribution).toService(VesEditorsViewContribution);
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
