import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const ActorImageDataTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_filename}ActorImageData.c',
        root: ProjectDataTemplateTargetRoot.file,
        conditions: { '>': [{ 'var': 'components.sprites.length' }, 0] }
    }],
    template: 'ActorImageData.c.njk',
    itemSpecific: 'Actor'
};
