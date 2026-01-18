import { ProjectDataTemplate, ProjectDataTemplateEventType, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const FontsCTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'assets/Fonts.c',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'Fonts.c.njk',
    events: [{
        type: ProjectDataTemplateEventType.installedPluginsChanged
    }, {
        type: ProjectDataTemplateEventType.itemOfTypeGotDeleted,
        value: 'Font'
    }]
};
