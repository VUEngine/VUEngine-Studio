import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const RumbleEffectsTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/RumbleEffects.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'RumbleEffects.h.njk'
};
