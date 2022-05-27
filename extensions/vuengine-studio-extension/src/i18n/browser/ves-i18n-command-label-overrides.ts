import { nls } from '@theia/core';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';

export default function reassignTheiaCommandLabels(): void {

    WorkspaceCommands.CLOSE.label = 'Close Project' &&
        nls.localize('vuengine/project/commands/closeProject', 'Close Project');
    WorkspaceCommands.CLOSE.originalLabel = 'Close Project';
    WorkspaceCommands.CLOSE.category = 'Projects' &&
        nls.localize('vuengine/project/commands/category', 'Projects');
    WorkspaceCommands.CLOSE.originalCategory = 'Projects';

    WorkspaceCommands.OPEN_RECENT_WORKSPACE.label = 'Open Recent Project...' &&
        nls.localize('vuengine/project/commands/openRecentProject', 'Open Recent Project...');
    WorkspaceCommands.OPEN_RECENT_WORKSPACE.originalLabel = 'Open Recent Project...';

    WorkspaceCommands.OPEN_WORKSPACE.label = 'Open Project...' &&
        nls.localize('vuengine/project/commands/openProject', 'Open Project...');
    WorkspaceCommands.OPEN_WORKSPACE.originalLabel = 'Open Project...';

    WorkspaceCommands.OPEN_WORKSPACE_FILE.label = 'Open Project File' &&
        nls.localize('vuengine/project/commands/openProjectFile', 'Open Project File');
    WorkspaceCommands.OPEN_WORKSPACE_FILE.originalLabel = 'Open Project File';
    WorkspaceCommands.OPEN_WORKSPACE_FILE.category = 'Projects' &&
        nls.localize('vuengine/project/commands/category', 'Projects');
    WorkspaceCommands.OPEN_WORKSPACE_FILE.originalCategory = 'Projects';

    WorkspaceCommands.SAVE_WORKSPACE_AS.label = 'Save Project As...' &&
        nls.localize('vuengine/project/commands/saveProjectAs', 'Save Project As...');
    WorkspaceCommands.SAVE_WORKSPACE_AS.originalLabel = 'Save Project As...';
    WorkspaceCommands.SAVE_WORKSPACE_AS.category = 'Projects' &&
        nls.localize('vuengine/project/commands/category', 'Projects');
    WorkspaceCommands.SAVE_WORKSPACE_AS.originalCategory = 'Projects';

}
