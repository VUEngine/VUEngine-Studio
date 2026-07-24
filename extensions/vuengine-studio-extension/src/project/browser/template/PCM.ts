import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const PcmSpecTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_filename}PCMSpec.c',
        root: ProjectDataTemplateTargetRoot.file
    }],
    template: 'PCMSpec.c.njk',
    itemSpecific: 'PCM'
};
