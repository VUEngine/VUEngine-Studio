import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const vbToolsLdTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'lib/compiler/linker/vb_tools.ld',
        root: ProjectDataTemplateTargetRoot.project
    }, {
        path: 'lib/compiler/linker/vb_debug.ld',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'vb_tools.ld.njk'
};
