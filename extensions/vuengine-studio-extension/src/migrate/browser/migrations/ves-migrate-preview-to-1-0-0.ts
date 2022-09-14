import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { Version } from '../ves-migrate-types';
import { VesAbstractMigration } from './ves-abstract-migration';

export class VesMigrateFromPreviewTo100 extends VesAbstractMigration {
    fromVersion = Version.Preview;
    toVersion = Version['1.0.0'];
    description = 'Create project file (from workspace file; if exists) and move configuration (e.g. config/Project.json file) into it.';

    async migrate(): Promise<boolean> {
        this.appendHeadline('Project File');

        // find workspace root
        const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
        if (!workspaceRootUri) {
            this.appendError('Could not determine Workspace root URI.');
            return false;
        }

        // find and parse workspace file
        const workspaceFiles = await this.vesGlobService.find(
            await this.fileService.fsPath(workspaceRootUri),
            '*.theia-workspace'
        );
        if (!workspaceFiles.length) {
            this.appendError('Could not find theia-workspace file in project root.');
            return false;
        }

        const filename = this.vesCommonService.basename(workspaceFiles[0]);
        if (!filename) {
            this.appendError('Could not determine theia-workspace file basename.');
            return false;
        }

        const workspaceFileUri = workspaceRootUri?.resolve(filename);
        const projectFileUri = workspaceRootUri?.resolve(filename.replace(
            '.theia-workspace', '.vuengine'
        ));

        let workspaceConfig = {};
        try {
            const workspaceFileContent = await this.fileService.readFile(workspaceFileUri);
            workspaceConfig = JSON.parse(workspaceFileContent.value.toString());
        } catch (error) {
            this.appendError('Could not parse workspace file.');
            return false;
        }

        // write to new project file
        try {
            await this.fileService.writeFile(
                projectFileUri,
                BinaryBuffer.fromString(JSON.stringify(workspaceConfig, undefined, 4))
            );
            await this.fileService.delete(workspaceFileUri);

            this.appendInfo('Create project file', true);
        } catch (error) {
            this.appendError('Could not write project file.');
            return false;
        }

        return true;
    };
};
