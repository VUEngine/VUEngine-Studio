import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { PreferencesWidget } from '@theia/preferences/lib/browser/views/preference-widget';

@injectable()
export class ViewModePreferencesWidget extends PreferencesWidget {
    static readonly LABEL = nls.localize('vuengine/general/ideSettings', 'IDE Settings');

    protected init(): void {
        super.init();

        this.title.label = ViewModePreferencesWidget.LABEL;
        this.title.caption = ViewModePreferencesWidget.LABEL;
        this.title.closable = false;
    }
}
