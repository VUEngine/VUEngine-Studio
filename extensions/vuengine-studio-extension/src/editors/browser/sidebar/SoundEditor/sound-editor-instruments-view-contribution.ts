import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SoundEditorInstrumentsWidget } from './sound-editor-instruments-widget';

@injectable()
export class SoundEditorInstrumentsViewContribution extends AbstractViewContribution<SoundEditorInstrumentsWidget> {
    constructor() {
        super({
            widgetId: SoundEditorInstrumentsWidget.ID,
            widgetName: SoundEditorInstrumentsWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 200,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
