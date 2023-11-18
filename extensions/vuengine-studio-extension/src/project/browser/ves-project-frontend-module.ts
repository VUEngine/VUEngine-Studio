import { PreferenceContribution } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common/command';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WorkspaceFrontendContribution } from '@theia/workspace/lib/browser';
import { WorkspaceFileService } from '@theia/workspace/lib/common';
import '../../../src/project/browser/style/index.css';
import { VesWorkspaceFileService } from '../common/ves-workspace-file-service';
import { VesNewProjectDialog, VesNewProjectDialogProps } from './new-project/ves-new-project-dialog';
import { VesProjectCommands } from './ves-project-commands';
import { VesProjectContribution } from './ves-project-contribution';
import { VesProjectPathsService } from './ves-project-paths-service';
import { VesProjectPreferenceSchema } from './ves-project-preferences';
import { VesProjectService } from './ves-project-service';
import { VesWorkspaceFrontendContribution } from './ves-project-workspace-frontend-contribution';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesProjectContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesProjectContribution);
    bind(TabBarToolbarContribution).toService(VesProjectContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesProjectPreferenceSchema });

    // project service
    bind(VesProjectService).toSelf().inSingletonScope();
    bind(VesProjectPathsService).toSelf().inSingletonScope();

    // new project dialog
    bind(VesNewProjectDialog).toSelf().inSingletonScope();
    bind(VesNewProjectDialogProps).toConstantValue({ title: VesProjectCommands.NEW.label! });

    bind(VesWorkspaceFrontendContribution).toSelf().inSingletonScope();
    rebind(WorkspaceFrontendContribution).to(VesWorkspaceFrontendContribution);

    // custom project file name
    bind(VesWorkspaceFileService).toSelf().inSingletonScope();
    rebind(WorkspaceFileService).to(VesWorkspaceFileService);
});
