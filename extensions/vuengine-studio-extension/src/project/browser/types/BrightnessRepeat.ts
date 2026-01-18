import { nls } from '@theia/core';
import { BrightnessRepeatSpecTemplate } from '../template/BrightnessRepeatSpec';
import { ProjectDataType } from '../ves-project-types';

export const BrightnessRepeatType: ProjectDataType = {
    file: '.brightness',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/brightnessRepeat', 'Brightness Repeat'),
        properties: {
            description: {
                type: 'string'
            },
            mirror: {
                type: 'boolean',
                default: true
            },
            values: {
                type: 'array',
                items: {
                    type: 'integer',
                    default: 0,
                    minimum: 0,
                    maximum: 15
                },
                maxItems: 96,
                minItems: 48
            }
        },
        required: []
    },
    uiSchema: {
        type: 'BrightnessRepeatEditor',
        scope: '#'
    },
    icon: 'codicon codicon-color-mode',
    templates: [
        BrightnessRepeatSpecTemplate
    ]
};
