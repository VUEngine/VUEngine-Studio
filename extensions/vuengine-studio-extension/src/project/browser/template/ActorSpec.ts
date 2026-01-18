import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const ActorSpecTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_filename}ActorSpec.c',
        root: ProjectDataTemplateTargetRoot.file,
    }],
    template: 'ActorSpec.c.njk',
    itemSpecific: 'Actor'
};
