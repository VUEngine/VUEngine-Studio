import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SoundEditorCurrentTrackWidget } from './sound-editor-current-track-widget';

@injectable()
export class SoundEditorCurrentTrackViewContribution extends AbstractViewContribution<SoundEditorCurrentTrackWidget> {
    constructor() {
        super({
            widgetId: SoundEditorCurrentTrackWidget.ID,
            widgetName: SoundEditorCurrentTrackWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 300,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
