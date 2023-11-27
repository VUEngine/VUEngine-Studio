import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { IsGeneratingFilesStatus, VesEditorsService } from './ves-editors-service';
import { nls } from '@theia/core';

const ENTRY_KEY = 'ves-editors-generating';

@injectable()
export class VesEditorsStatusBarContribution implements FrontendApplicationContribution {
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesEditorsService)
    protected readonly vesEditorsService: VesEditorsService;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();
    };

    updateStatusBar(): void {
        this.setFileGeneratsStatusBar(IsGeneratingFilesStatus.hide);
        this.vesEditorsService.onDidChangeIsGeneratingFiles(status => this.setFileGeneratsStatusBar(status));
    }

    setFileGeneratsStatusBar(status: IsGeneratingFilesStatus): void {
        let icon = 'codicon-gear~spin';
        let label = nls.localize('vuengine/editors/generating', 'Generating...');

        if (status === IsGeneratingFilesStatus.done) {
            icon = 'codicon-check';
            const numberOfGeneratedFiles = this.vesEditorsService.getNumberOfGeneratedFiles();
            if (numberOfGeneratedFiles === 1) {
                label = nls.localize('vuengine/editors/generatedFile', 'Generated 1 File');
            } else {
                label = nls.localize('vuengine/editors/generatedFiles', 'Generated {0} Files', numberOfGeneratedFiles);
            }
        }

        if (status === IsGeneratingFilesStatus.hide) {
            this.statusBar.removeElement(ENTRY_KEY);
        } else {
            this.statusBar.setElement('ves-editors-generating', {
                alignment: StatusBarAlignment.LEFT,
                priority: -99999,
                text: `$(${icon}) ${label}`,
            });
        }
    }
}
