import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const GameMessagesTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/GameMessages.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'GameMessages.h.njk'
};
