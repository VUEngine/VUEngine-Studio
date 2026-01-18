import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const RumbleEffectSpecTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_filename}RumbleEffectSpec.c',
        root: ProjectDataTemplateTargetRoot.file
    }],
    template: 'RumbleEffectSpec.c.njk',
    itemSpecific: 'RumbleEffect'
};
