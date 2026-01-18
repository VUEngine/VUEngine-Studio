import { ProjectDataTemplate, ProjectDataTemplateTargetRoot } from '../ves-project-types';

export const ImageTemplate: ProjectDataTemplate = {
    targets: [{
        path: 'Converted/${_forEachOfBasename}.c',
        root: ProjectDataTemplateTargetRoot.file,
        forEachOf: { 'var': 'files' },
        conditions: {
            'and': [
                { '>': [{ 'var': 'files.length' }, 0] },
                {
                    'or': [
                        { '==': [{ 'var': 'animation.isAnimation' }, false] },
                        { '==': [{ 'var': 'animation.individualFiles' }, false] }
                    ]
                },
                { '==': [{ 'var': 'tileset.shared' }, false] }
            ]
        }
    }, {
        path: 'Converted/${_forEachOfBasename}.c',
        root: ProjectDataTemplateTargetRoot.file,
        forEachOf: { 'fileInFolder': ['*.png'] },
        conditions: {
            'and': [
                { '==': [{ 'var': 'files.length' }, 0] },
                {
                    'or': [
                        { '==': [{ 'var': 'animation.isAnimation' }, false] },
                        { '==': [{ 'var': 'animation.individualFiles' }, false] }
                    ]
                },
                { '==': [{ 'var': 'tileset.shared' }, false] }
            ]
        }
    }, {
        path: 'Converted/${_filename}.c',
        root: ProjectDataTemplateTargetRoot.file,
        conditions: {
            'or': [
                {
                    'and': [
                        { '==': [{ 'var': 'animation.isAnimation' }, true] },
                        { '==': [{ 'var': 'animation.individualFiles' }, true] }
                    ]
                },
                { '==': [{ 'var': 'tileset.shared' }, true] }
            ]
        }
    }],
    template: 'Image.c.njk',
    itemSpecific: 'Image'
};
