import { FrontendApplicationContribution, OpenHandler, WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/media-preview/browser/style/index.css';
import { VesMediaPreviewOpenHandler } from './ves-media-preview-open-handler';
import { VesMediaPreviewViewContribution } from './ves-media-preview-view';
import { VesMediaPreviewWidget, VesMediaPreviewWidgetOptions } from './ves-media-preview-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bindViewContribution(bind, VesMediaPreviewViewContribution);
    bind(FrontendApplicationContribution).toService(VesMediaPreviewViewContribution);
    bind(OpenHandler).to(VesMediaPreviewOpenHandler).inSingletonScope();
    bind(VesMediaPreviewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: VesMediaPreviewWidget.ID,
        createWidget: (options: VesMediaPreviewWidgetOptions) => {
            const child = container.createChild();
            child.bind(VesMediaPreviewWidgetOptions).toConstantValue(options);
            child.bind(VesMediaPreviewWidget).toSelf();
            return child.get(VesMediaPreviewWidget);
        },
    }));
});
