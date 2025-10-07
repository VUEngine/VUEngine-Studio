import { bindViewContribution, FrontendApplicationContribution, OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common/command';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WorkspaceFrontendContribution } from '@theia/workspace/lib/browser';
import { WorkspaceFileService } from '@theia/workspace/lib/common';
import '../../../src/project/browser/style/index.css';
import { VesWorkspaceFileService } from '../common/ves-workspace-file-service';
import { VesNewProjectDialog, VesNewProjectDialogProps } from './new-project/ves-new-project-dialog';
import { VesProjectCommands } from './ves-project-commands';
import { VesProjectContribution } from './ves-project-contribution';
import { VesProjectDashboardOpenHandler } from './ves-project-dashboard-open-handler';
import { VesProjectDashboardViewContribution } from './ves-project-dashboard-view';
import { VesProjectDashboardWidget } from './ves-project-dashboard-widget';
import { VesProjectPathsService } from './ves-project-paths-service';
import { VesProjectPreferenceSchema } from './ves-project-preferences';
import { VesProjectService } from './ves-project-service';
import { VesProjectStatusBarContribution } from './ves-project-statusbar-contribution';
import { VesWorkspaceFrontendContribution } from './ves-project-workspace-frontend-contribution';
import { PreferenceContribution } from '@theia/core';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesProjectContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesProjectContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesProjectPreferenceSchema });

    // status bar entry
    bind(VesProjectStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesProjectStatusBarContribution);

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

    // build view
    bindViewContribution(bind, VesProjectDashboardViewContribution);
    bind(FrontendApplicationContribution).toService(VesProjectDashboardViewContribution);
    bind(CommandContribution).toService(VesProjectDashboardViewContribution);
    bind(OpenHandler).to(VesProjectDashboardOpenHandler).inSingletonScope();
    bind(VesProjectDashboardWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesProjectDashboardWidget.ID,
        createWidget: () => ctx.container.get<VesProjectDashboardWidget>(VesProjectDashboardWidget)
    })).inSingletonScope();
});
