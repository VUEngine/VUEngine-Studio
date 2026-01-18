import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const ColliderLayersTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/ColliderLayers.h',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'ColliderLayers.h.njk'
};
