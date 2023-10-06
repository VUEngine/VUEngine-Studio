import { bindViewContribution, FrontendApplicationContribution, PreferenceContribution, WidgetFactory } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common/command';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/project/browser/style/index.css';
import { VesNewProjectDialog, VesNewProjectDialogProps } from './new-project/ves-new-project-dialog';
import { createVesProjectTreeWidget } from './tree/ves-project-tree-container';
import { VesProjectTreeViewContribution } from './tree/ves-project-tree-view-contribution';
import { VesProjectTreeWidget } from './tree/ves-project-tree-widget';
import { VesProjectCommands } from './ves-project-commands';
import { VesProjectContribution } from './ves-project-contribution';
import { VesProjectPathsService } from './ves-project-paths-service';
import { VesProjectPreferenceSchema } from './ves-project-preferences';
import { VesProjectService } from './ves-project-service';
import { VesWorkspaceFrontendContribution } from './ves-project-workspace-frontend-contribution';
import { WorkspaceFrontendContribution } from '@theia/workspace/lib/browser';
import { VesWorkspaceFileService } from '../common/ves-workspace-file-service';
import { WorkspaceFileService } from '@theia/workspace/lib/common';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesProjectContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesProjectContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesProjectPreferenceSchema });

    // project service
    bind(VesProjectService).toSelf().inSingletonScope();
    bind(VesProjectPathsService).toSelf().inSingletonScope();

    // new project dialog
    bind(VesNewProjectDialog).toSelf().inSingletonScope();
    bind(VesNewProjectDialogProps).toConstantValue({ title: VesProjectCommands.NEW.label! });

    // sidebar view
    bindViewContribution(bind, VesProjectTreeViewContribution);
    bind(FrontendApplicationContribution).toService(VesProjectTreeViewContribution);
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesProjectTreeWidget.ID,
        createWidget: () => createVesProjectTreeWidget(ctx.container)
    })).inSingletonScope();

    bind(VesWorkspaceFrontendContribution).toSelf().inSingletonScope();
    rebind(WorkspaceFrontendContribution).to(VesWorkspaceFrontendContribution);

    // custom project file name
    bind(VesWorkspaceFileService).toSelf().inSingletonScope();
    rebind(WorkspaceFileService).to(VesWorkspaceFileService);
});
