import { ProjectDataTemplate, ProjectDataTemplateEncoding, ProjectDataTemplateEventType, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const LanguagesCTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'assets/Languages.c',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'Languages.c.njk',
    encoding: ProjectDataTemplateEncoding.win1252,
    events: [{
        type: ProjectDataTemplateEventType.installedPluginsChanged
    }]
};
