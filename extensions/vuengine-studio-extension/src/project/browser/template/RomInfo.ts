import { ProjectDataTemplate, ProjectDataTemplateEncoding, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const RomInfoTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'headers/RomInfo.h',
        root: ProjectDataTemplateTargetRoot.project,
    }],
    template: 'RomInfo.h.njk',
    encoding: ProjectDataTemplateEncoding.ShiftJIS
};
