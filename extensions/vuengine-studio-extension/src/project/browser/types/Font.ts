import { nls } from '@theia/core';
import { FontsCTemplate } from '../template/FontsC';
import { FontsHTemplate } from '../template/FontsH';
import { FontSpecTemplate } from '../template/FontSpec';
import { ProjectDataType } from '../ves-project-types';

export const FontType: ProjectDataType = {
    file: '.font',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/font', 'Font'),
        properties: {
            offset: {
                type: 'integer',
                default: 0,
                minimum: 0,
                maximum: 255
            },
            characterCount: {
                type: 'integer',
                default: 256,
                minimum: 1,
                maximum: 256
            },
            size: {
                type: 'object',
                properties: {
                    x: {
                        type: 'integer',
                        default: 1,
                        minimum: 1,
                        maximum: 4
                    },
                    y: {
                        type: 'integer',
                        default: 1,
                        minimum: 1,
                        maximum: 4
                    }
                },
                additionalProperties: false
            },
            variableSize: {
                type: 'object',
                properties: {
                    enabled: {
                        type: 'boolean',
                        default: false
                    },
                    x: {
                        type: 'array',
                        items: {
                            type: 'integer',
                            default: 8,
                            minimum: 1,
                            maximum: 32
                        },
                        default: []
                    },
                    y: {
                        type: 'integer',
                        default: 8,
                        minimum: 1,
                        maximum: 32
                    }
                },
                additionalProperties: false
            },
            section: {
                type: 'string',
                default: 'rom'
            },
            compression: {
                type: 'string',
                default: 'none'
            },
            pageSize: {
                type: 'integer',
                default: 256,
                minimum: 1,
                maximum: 256
            },
            characters: {
                type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'array',
                        items: {
                            type: 'integer',
                            default: 0,
                            minimum: 0,
                            maximum: 3
                        }
                    }
                },
                default: []
            }
        },
        required: []
    },
    uiSchema: {
        type: 'FontEditor',
        scope: '#'
    },
    icon: 'codicon codicon-case-sensitive',
    templates: [
        FontsCTemplate,
        FontsHTemplate,
        FontSpecTemplate
    ]
};
