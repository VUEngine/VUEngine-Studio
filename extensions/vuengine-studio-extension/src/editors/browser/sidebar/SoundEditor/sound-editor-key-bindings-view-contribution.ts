import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SoundEditorKeyBindingsWidget } from './sound-editor-key-bindings-widget';

@injectable()
export class SoundEditorKeyBindingsViewContribution extends AbstractViewContribution<SoundEditorKeyBindingsWidget> {
    constructor() {
        super({
            widgetId: SoundEditorKeyBindingsWidget.ID,
            widgetName: SoundEditorKeyBindingsWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 700,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
