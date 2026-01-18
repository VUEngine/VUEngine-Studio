import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const MessagesTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/Messages.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'Messages.h.njk'
};
