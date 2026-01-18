import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const PluginConfigMakeTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'config.make',
        root: ProjectDataTemplateTargetRoot.file,
    }],
    template: 'PluginConfig.make.njk',
    itemSpecific: 'PluginFile'
};
