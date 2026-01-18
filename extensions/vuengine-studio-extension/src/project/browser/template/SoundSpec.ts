import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const SoundSpecTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_filename}SoundSpec.c',
        root: ProjectDataTemplateTargetRoot.file
    }],
    template: 'SoundSpec.c.njk',
    itemSpecific: 'Sound'
};
