import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const vbLdTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'lib/compiler/linker/vb_shipping.ld',
        root: ProjectDataTemplateTargetRoot.project
    }, {
        path: 'lib/compiler/linker/vb_release.ld',
        root: ProjectDataTemplateTargetRoot.project
    }, {
        path: 'lib/compiler/linker/vb_beta.ld',
        root: ProjectDataTemplateTargetRoot.project
    }],
    template: 'vb.ld.njk'
};
