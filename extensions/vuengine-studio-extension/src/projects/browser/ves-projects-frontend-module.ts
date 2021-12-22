import { PreferenceContribution } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common/command';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesNewProjectDialog, VesNewProjectDialogProps } from './new-project/ves-projects-new-project-dialog';
import { VesProjectsContribution } from './ves-projects-contribution';
import { VesProjectsPathsService } from './ves-projects-paths-service';
import { VesProjectsPreferenceSchema } from './ves-projects-preferences';
import { VesProjectsService } from './ves-projects-service';
import '../../../src/projects/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesProjectsContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesProjectsContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesProjectsPreferenceSchema });

    // project service
    bind(VesProjectsService).toSelf().inSingletonScope();
    bind(VesProjectsPathsService).toSelf().inSingletonScope();

    // new project dialog
    bind(VesNewProjectDialog).toSelf().inSingletonScope();
    bind(VesNewProjectDialogProps).toConstantValue({ title: 'Create New Project' });
});
