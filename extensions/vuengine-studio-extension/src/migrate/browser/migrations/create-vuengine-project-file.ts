import { MessageService, nls } from '@theia/core';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { VesGlobService } from '../../../glob/common/ves-glob-service-protocol';
import { Migration, Version } from '../ves-migrate-types';

export function get(
    fileService: FileService,
    messageService: MessageService,
    vesCommonService: VesCommonService,
    vesGlobService: VesGlobService,
    workspaceService: WorkspaceService,
): Migration {
    return {
        fromVersion: Version.Preview,
        toVersion: Version['1.0.0'],
        name: 'Create .vuengine Project File',
        description: 'Create project file (from workspace file, if exists) and move configuration (e.g. config/Project.json file) into it.',
        function: async () => migrate(
            fileService,
            messageService,
            vesCommonService,
            vesGlobService,
            workspaceService,
        ),
    };
};

const migrate = async (
    fileService: FileService,
    messageService: MessageService,
    vesCommonService: VesCommonService,
    vesGlobService: VesGlobService,
    workspaceService: WorkspaceService,
) => {
    // find workspace root
    const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
        return messageService.error(
            nls.localize(
                'vuengine/migrate/createVuengineProjectFile/couldNotDetermineWorkspaceRootUri',
                'Could not determine Workspace root URI.',
            ),
        );
    }

    // find and parse workspace file
    const workspaceFiles = await vesGlobService.find(
        await fileService.fsPath(workspaceRootUri),
        '*.theia-workspace'
    );
    if (!workspaceFiles.length) {
        return messageService.error(
            nls.localize(
                'vuengine/migrate/createVuengineProjectFile/couldNotFindTheiaWorkspaceFileInProjectRoot',
                'Could not find theia-workspace file in project root.',
            ),
        );
    }

    const filename = vesCommonService.basename(workspaceFiles[0]);
    if (!filename) {
        return messageService.error(
            nls.localize(
                'vuengine/migrate/createVuengineProjectFile/couldNotDetermineTheiaWorkspaceFileBasename',
                'Could not determine theia-workspace file basename.',
            ),
        );
    }

    const workspaceFileUri = workspaceRootUri?.resolve(filename);
    const projectFileUri = workspaceRootUri?.resolve(filename.replace(
        '.theia-workspace', '.vuengine'
    ));

    let workspaceConfig = {};
    try {
        const workspaceFileContent = await fileService.readFile(workspaceFileUri);
        workspaceConfig = JSON.parse(workspaceFileContent.value.toString());
    } catch (error) {
        return messageService.error(
            nls.localize(
                'vuengine/migrate/createVuengineProjectFile/couldNotParseWorkspaceFile',
                'Could not parse workspace file.',
            ),
        );
    }

    // write to new project file
    try {
        await fileService.writeFile(
            projectFileUri,
            BinaryBuffer.fromString(JSON.stringify(workspaceConfig, undefined, 4))
        );
        await fileService.delete(workspaceFileUri);
    } catch (error) {
        return messageService.error(
            nls.localize(
                'vuengine/migrate/createVuengineProjectFile/couldNotWriteProjectFile',
                'Could not write project file.',
            ),
        );
    }

    // delete old workspace file
    await fileService.delete(workspaceFileUri);
};
