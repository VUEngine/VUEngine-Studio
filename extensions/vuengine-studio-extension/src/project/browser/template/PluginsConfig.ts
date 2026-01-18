import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const PluginsConfigTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/PluginsConfig.h',
        root: ProjectDataTemplateTargetRoot.project,
    }],
    template: 'PluginsConfig.h.njk'
};
