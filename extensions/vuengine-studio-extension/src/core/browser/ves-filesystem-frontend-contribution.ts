import { inject, injectable } from '@theia/core/shared/inversify';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { PROJECT_TYPES } from '../../project/browser/ves-project-data';
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
            '*.plugin': 'json',
        };

        Object.values(PROJECT_TYPES).forEach(type => {
            const filenamePattern = type.file.startsWith('.')
                ? `*${type.file}`
                : type.file;
            fa[filenamePattern] = 'json';
        });

        await this.vesProjectService.projectDataReady;
        for (const type of Object.values(PROJECT_TYPES || {})) {
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
