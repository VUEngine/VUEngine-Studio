import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const ColumnTableSpecTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_filename}ColumnTableSpec.c',
        root: ProjectDataTemplateTargetRoot.file
    }],
    template: 'ColumnTableSpec.c.njk',
    itemSpecific: 'ColumnTable'
};
