import { nls } from '@theia/core';
import { nanoid } from 'nanoid';
import { Displays } from '../../../editors/browser/components/Common/VUEngineTypes';
import { createEmptyPixelData } from '../../../editors/browser/components/PixelEditor/PixelEditor';
import { DEFAULT_IMAGE_SIZE } from '../../../editors/browser/components/PixelEditor/PixelEditorTypes';
import { ProjectDataType } from '../ves-project-types';

export const PixelType: ProjectDataType = {
    enabled: true,
    file: '.pixel',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/pixel', 'Pixel Art'),
        properties: {
            colorMode: {
                type: 'number'
            },
            frames: {
                type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string'
                            },
                            data: {
                                type: 'array',
                                items: {
                                    type: 'array',
                                    items: {
                                        type: 'number',
                                    }
                                }
                            },
                            isVisible: {
                                type: 'boolean',
                                default: true,
                            },
                            name: {
                                type: 'string'
                            },
                            parallax: {
                                type: 'number'
                            },
                            displays: {
                                type: 'string',
                                default: 'ON'
                            },
                        },
                        additionalProperties: false,
                    }
                },
                default: [[{
                    data: createEmptyPixelData(DEFAULT_IMAGE_SIZE, DEFAULT_IMAGE_SIZE),
                    displays: Displays.Both,
                    id: nanoid(),
                    isVisible: true,
                    name: '',
                    parallax: 0,
                }]]
            },
        },
        required: []
    },
    uiSchema: {
        type: 'PixelEditor',
        scope: '#'
    },
    icon: 'codicon codicon-symbol-color',
    templates: []
};
