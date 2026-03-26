import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SoundEditorPropertiesWidget } from './sound-editor-properties-widget';

@injectable()
export class SoundEditorPropertiesViewContribution extends AbstractViewContribution<SoundEditorPropertiesWidget> {
    constructor() {
        super({
            widgetId: SoundEditorPropertiesWidget.ID,
            widgetName: SoundEditorPropertiesWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 100,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
