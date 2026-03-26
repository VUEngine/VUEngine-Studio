import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SoundEditorUtilitiesWidget } from './sound-editor-utilities-widget';

@injectable()
export class SoundEditorUtilitiesViewContribution extends AbstractViewContribution<SoundEditorUtilitiesWidget> {
    constructor() {
        super({
            widgetId: SoundEditorUtilitiesWidget.ID,
            widgetName: SoundEditorUtilitiesWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 600,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
