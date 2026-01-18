import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const InGameTypesTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/InGameTypes.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'InGameTypes.h.njk'
};
