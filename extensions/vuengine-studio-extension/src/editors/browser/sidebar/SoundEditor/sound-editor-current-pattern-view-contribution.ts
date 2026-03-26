import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SoundEditorCurrentPatternWidget } from './sound-editor-current-pattern-widget';

@injectable()
export class SoundEditorCurrentPatternViewContribution extends AbstractViewContribution<SoundEditorCurrentPatternWidget> {
    constructor() {
        super({
            widgetId: SoundEditorCurrentPatternWidget.ID,
            widgetName: SoundEditorCurrentPatternWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 400,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
