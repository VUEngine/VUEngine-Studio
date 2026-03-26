import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SoundEditorCurrentNoteWidget } from './sound-editor-current-note-widget';

@injectable()
export class SoundEditorCurrentNoteViewContribution extends AbstractViewContribution<SoundEditorCurrentNoteWidget> {
    constructor() {
        super({
            widgetId: SoundEditorCurrentNoteWidget.ID,
            widgetName: SoundEditorCurrentNoteWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 500,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
