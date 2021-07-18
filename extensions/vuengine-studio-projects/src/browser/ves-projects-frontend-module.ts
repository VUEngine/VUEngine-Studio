import { ContainerModule } from 'inversify';
import { PreferenceContribution } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common/command';

import { VesProjectsContribution } from './ves-projects-contribution';
import { VesProjectsPreferenceSchema } from './ves-projects-preferences';
import { VesNewProjectDialog, VesNewProjectDialogProps } from './ves-projects-new-project-dialog';

import '../../src/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesProjectsContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesProjectsContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesProjectsPreferenceSchema });

    // new project dialog
    bind(VesNewProjectDialog).toSelf().inSingletonScope();
    bind(VesNewProjectDialogProps).toConstantValue({ title: 'New Project' });
});
