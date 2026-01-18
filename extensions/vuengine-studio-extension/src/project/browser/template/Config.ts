import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const ConfigTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/Config.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'Config.h.njk'
};
