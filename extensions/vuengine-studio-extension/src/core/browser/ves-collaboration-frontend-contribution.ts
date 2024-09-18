import { COLLABORATION_STATUS_BAR_ID, CollaborationFrontendContribution } from '@theia/collaboration/lib/browser/collaboration-frontend-contribution';
import { StatusBarAlignment, StatusBarEntry } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesCollaborationFrontendContribution extends CollaborationFrontendContribution {
    protected async setStatusBarEntry(entry: Omit<StatusBarEntry, 'alignment'>): Promise<void> {
        const icon = entry.text.split(' ')[0];
        await this.statusBar.setElement(COLLABORATION_STATUS_BAR_ID, {
            ...entry,
            text: icon,
            className: icon === '$(codicon-broadcast)' ? 'active' : '',
            alignment: StatusBarAlignment.LEFT,
            priority: 999999,
        });
    }

    /*
    // TODO: custom server
    protected async getCollaborationServerUrl(): Promise<string> {
        return ...;
    }
    */
}
