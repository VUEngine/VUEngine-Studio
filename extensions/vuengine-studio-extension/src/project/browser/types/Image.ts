import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const ImageType: ProjectDataType = {
    file: '.image',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/image', 'Image'),
        properties: {
            files: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            section: {
                type: 'string',
                oneOf: [
                    {
                        const: 'rom',
                        title: 'ROM Space'
                    },
                    {
                        const: 'exp',
                        title: 'Expansion Space'
                    }
                ],
                default: 'rom'
            },
            tileset: {
                type: 'object',
                properties: {
                    shared: {
                        type: 'boolean',
                        default: false
                    },
                    compression: {
                        type: 'string',
                        oneOf: [
                            {
                                const: 'none',
                                title: 'No compression'
                            },
                            {
                                const: 'rle',
                                title: 'Run Length Encoding (RLE)'
                            }
                        ],
                        default: 'none'
                    }
                },
                additionalProperties: false,
            },
            map: {
                type: 'object',
                properties: {
                    generate: {
                        type: 'boolean',
                        default: true
                    },
                    reduce: {
                        type: 'object',
                        properties: {
                            flipped: {
                                type: 'boolean',
                                default: false
                            },
                            unique: {
                                type: 'boolean',
                                default: false
                            }
                        },
                        additionalProperties: false,
                    },
                    compression: {
                        type: 'string',
                        oneOf: [
                            {
                                const: 'none',
                                title: 'No compression'
                            }
                        ],
                        default: 'none'
                    }
                },
                additionalProperties: false,
            },
            animation: {
                type: 'object',
                properties: {
                    isAnimation: {
                        type: 'boolean',
                        default: false
                    },
                    individualFiles: {
                        type: 'boolean',
                        default: false
                    },
                    frames: {
                        type: 'integer',
                        default: 0
                    },
                },
                additionalProperties: false,
            },
            imageProcessingSettings: {
                type: 'object',
                properties: {
                    distanceCalculator: {
                        type: 'string',
                        default: 'euclidean'
                    },
                    imageQuantizationAlgorithm: {
                        type: 'string',
                        default: 'nearest'
                    },
                    minimumColorDistanceToDither: {
                        type: 'number',
                        default: 0
                    },
                    serpentine: {
                        type: 'boolean',
                        default: false,
                    }
                },
                additionalProperties: false,
            },
            colorMode: {
                type: 'number',
                default: 0,
                min: 0,
                max: 1
            },
        },
        required: ['files', 'section']
    },
    uiSchema: {
        type: 'ImageEditor',
        scope: '#'
    },
    icon: 'codicon codicon-file-media',
    templates: [
        'Image'
    ],
    forFiles: [
        '.png'
    ]
};
