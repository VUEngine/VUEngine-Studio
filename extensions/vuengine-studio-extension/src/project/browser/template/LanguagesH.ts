import { ProjectDataTemplate, ProjectDataTemplateEventType, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const LanguagesHTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/Languages.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'Languages.h.njk',
    events: [{
        type: ProjectDataTemplateEventType.installedPluginsChanged
    }]
};
