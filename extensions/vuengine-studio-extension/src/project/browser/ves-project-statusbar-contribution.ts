import { nls } from '@theia/core';
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesProjectService } from './ves-project-service';

@injectable()
export class VesProjectStatusBarContribution implements FrontendApplicationContribution {
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();
    };

    updateStatusBar(): void {
        this.setUpdatingFilesStatusBar();
        this.vesProjectService.onDidChangeIsUpdatingFiles(() => this.setUpdatingFilesStatusBar());
    }

    setUpdatingFilesStatusBar(): void {
        if (!this.vesProjectService.isUpdatingFiles) {
            this.statusBar.removeElement('ves-project-updating-files');
        } else {
            const label = nls.localize('vuengine/project/updatingFiles', 'Updating Files...');
            this.statusBar.setElement('ves-project-updating-files', {
                alignment: StatusBarAlignment.LEFT,
                priority: 1,
                text: `$(codicon-loading~spin) ${label}`,
            });
        }
    }
}
