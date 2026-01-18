import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const BrightnessRepeatSpecTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_filename}BrightnessRepeatSpec.c',
        root: ProjectDataTemplateTargetRoot.file
    }],
    template: 'BrightnessRepeatSpec.c.njk',
    itemSpecific: 'BrightnessRepeat'
};
