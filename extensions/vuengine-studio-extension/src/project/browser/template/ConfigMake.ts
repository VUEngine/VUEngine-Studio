import { ProjectDataTemplate, ProjectDataTemplateEventType, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const ConfigMakeTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'config.make',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'config.make.njk',
    events: [{
        type: ProjectDataTemplateEventType.installedPluginsChanged
    }]
};
