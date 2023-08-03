import { injectable } from '@theia/core/shared/inversify';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { CONVERTED_FILE_ENDING } from '../../image-converter/browser/ves-image-converter-types';
import { VES_PREFERENCE_DIR } from './ves-preference-configurations';

@injectable()
export class VesFileSystemFrontendContribution extends FileSystemFrontendContribution {
    protected updateAssociations(): void {
        const assetCFilePattern = `*.${CONVERTED_FILE_ENDING}`;
        const projectFilePattern = `*${VES_PREFERENCE_DIR}`;
        const fileAssociations: {[filePattern: string]: string} = {
            ...{
                [assetCFilePattern]: 'c',
                [projectFilePattern]: 'jsonc',
            },
            ...this.preferences['files.associations'],
        };
        const mimeAssociations = Object.keys(fileAssociations).map(filepattern => ({ id: fileAssociations[filepattern], filepattern }));
        this.mimeService.setAssociations(mimeAssociations);
    }
}
