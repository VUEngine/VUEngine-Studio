import { injectable } from '@theia/core/shared/inversify';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { VES_PREFERENCE_DIR } from './ves-preference-configurations';

@injectable()
export class VesFileSystemFrontendContribution extends FileSystemFrontendContribution {
    protected updateAssociations(): void {
        const projectFilePattern = `*${VES_PREFERENCE_DIR}`;
        const fileAssociations: { [filePattern: string]: string } = {
            ...{
                [projectFilePattern]: 'jsonc',
                '*.make': 'makefile',
                '*.ld': 'c',
                'makefile-common': 'makefile',
                'makefile-compile': 'makefile',
                'makefile-compiler': 'makefile',
                'makefile-game': 'makefile',
                'makefile-preprocess': 'makefile',
            },
            ...this.preferences['files.associations'],
        };
        const mimeAssociations = Object.keys(fileAssociations).map(filepattern => ({ id: fileAssociations[filepattern], filepattern }));
        this.mimeService.setAssociations(mimeAssociations);
    }
}
