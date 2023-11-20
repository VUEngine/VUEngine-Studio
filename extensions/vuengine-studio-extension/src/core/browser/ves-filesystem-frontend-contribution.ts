import { inject, injectable } from '@theia/core/shared/inversify';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VES_PREFERENCE_DIR } from './ves-preference-configurations';

@injectable()
export class VesFileSystemFrontendContribution extends FileSystemFrontendContribution {
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;

    protected async updateAssociations(): Promise<void> {
        const fa: { [filePattern: string]: string } = {
            [`*${VES_PREFERENCE_DIR}`]: 'jsonc',
            '*.make': 'makefile',
            '*.ld': 'c',
            'makefile*': 'makefile',
        };

        await this.vesProjectService.projectDataReady;
        const types = this.vesProjectService.getProjectDataTypes();
        for (const type of Object.values(types || {})) {
            if (type.file?.startsWith('.')) {
                fa[`*${type.file}`] = 'json';
            } else {
                fa[type.file] = 'json';
            }
        }

        const fileAssociations: { [filePattern: string]: string } = {
            ...fa,
            ...this.preferences['files.associations'],
        };
        const mimeAssociations = Object.keys(fileAssociations).map(filepattern => ({ id: fileAssociations[filepattern], filepattern }));
        this.mimeService.setAssociations(mimeAssociations);
    }
}
