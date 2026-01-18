import { ProjectDataTemplate, ProjectDataTemplateEventType, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const FontsHTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/Fonts.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'Fonts.h.njk',
    events: [{
        type: ProjectDataTemplateEventType.installedPluginsChanged
    }, {
        type: ProjectDataTemplateEventType.itemOfTypeGotDeleted,
        value: 'Font'
    }]
};
