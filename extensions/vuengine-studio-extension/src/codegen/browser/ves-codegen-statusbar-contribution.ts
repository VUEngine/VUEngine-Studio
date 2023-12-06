import { nls } from '@theia/core';
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCodeGenService } from '../../codegen/browser/ves-codegen-service';
import { IsGeneratingFilesStatus } from './ves-codegen-types';
import { VesCodeGenCommands } from './ves-codegen-commands';

const ENTRY_KEY = 'ves-codegen-generating';

@injectable()
export class VesCodeGenStatusBarContribution implements FrontendApplicationContribution {
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesCodeGenService)
    protected readonly vesCodeGenService: VesCodeGenService;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();
    };

    updateStatusBar(): void {
        this.setFileGenerateStatusBar(IsGeneratingFilesStatus.hide);
        this.vesCodeGenService.onDidChangeIsGeneratingFiles(status => this.setFileGenerateStatusBar(status));
    }

    setFileGenerateStatusBar(status: IsGeneratingFilesStatus): void {
        let icon = 'codicon-gear~spin';
        let label = nls.localize('vuengine/codegen/generating', 'Generating...');

        if (status === IsGeneratingFilesStatus.done) {
            icon = 'codicon-check';
            const numberOfGeneratedFiles = this.vesCodeGenService.getNumberOfGeneratedFiles();
            if (numberOfGeneratedFiles === 1) {
                label = nls.localize('vuengine/codegen/generatedFile', 'Generated 1 File');
            } else {
                label = nls.localize('vuengine/codegen/generatedFiles', 'Generated {0} Files', numberOfGeneratedFiles);
            }
        }

        if (status === IsGeneratingFilesStatus.hide) {
            this.statusBar.removeElement(ENTRY_KEY);
        } else {
            this.statusBar.setElement('ves-codegen-generating', {
                alignment: StatusBarAlignment.LEFT,
                priority: -99999,
                text: `$(${icon}) ${label}`,
                command: VesCodeGenCommands.SHOW_OUTPUT_CHANNEL.id,
            });
        }
    }
}
