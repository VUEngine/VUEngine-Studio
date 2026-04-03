import { nls } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PreferencesWidget } from '@theia/preferences/lib/browser/views/preference-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class ViewModePreferencesWidget extends PreferencesWidget {
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    static readonly LABEL = nls.localize('vuengine/general/ideSettings', 'IDE Settings');

    protected init(): void {
        super.init();

        this.title.label = ViewModePreferencesWidget.LABEL;
        this.title.caption = ViewModePreferencesWidget.LABEL;
        this.title.closable = false;

        this.doInit();
    }

    protected async doInit(): Promise<void> {
        await this.workspaceService.ready;
        this.title.closable = !this.workspaceService.opened;
    }
}
