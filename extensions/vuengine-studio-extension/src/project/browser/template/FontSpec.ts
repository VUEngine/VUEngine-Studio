import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const FontSpecTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_filename}FontSpec.c',
        root: ProjectDataTemplateTargetRoot.file
    }],
    template: 'FontSpec.c.njk',
    itemSpecific: 'Font'
};
