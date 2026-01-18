import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const PluginConfigTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/Config.h',
        root: ProjectDataTemplateTargetRoot.file,
    }],
    template: 'PluginConfig.h.njk',
    itemSpecific: 'PluginFile'
};
