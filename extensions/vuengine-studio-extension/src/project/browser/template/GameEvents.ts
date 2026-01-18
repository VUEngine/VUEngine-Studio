import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const GameEventsTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/GameEvents.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'GameEvents.h.njk'
};
