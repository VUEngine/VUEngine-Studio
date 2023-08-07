import { injectable } from '@theia/core/shared/inversify';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { VES_PREFERENCE_DIR } from './ves-preference-configurations';

@injectable()
export class VesFileSystemFrontendContribution extends FileSystemFrontendContribution {
    protected updateAssociations(): void {
        const projectFilePattern = `*${VES_PREFERENCE_DIR}`;
        const fileAssociations: {[filePattern: string]: string} = {
            ...{
                [projectFilePattern]: 'jsonc',
                '*.make': 'Makefile',
                '*.ld': 'c',
                'makefile-common': 'Makefile',
                'makefile-compile': 'Makefile',
                'makefile-compiler': 'Makefile',
                'makefile-game': 'Makefile',
                'makefile-preprocess': 'Makefile',
            },
            ...this.preferences['files.associations'],
        };
        const mimeAssociations = Object.keys(fileAssociations).map(filepattern => ({ id: fileAssociations[filepattern], filepattern }));
        this.mimeService.setAssociations(mimeAssociations);
    }
}
