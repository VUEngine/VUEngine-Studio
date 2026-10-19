import { nls } from '@theia/core';
import { RumbleEffectSpecTemplate } from '../template/RumbleEffectSpec';
import { RumbleEffectsTemplate } from '../template/RumbleEffects';
import { ProjectDataType } from '../ves-project-types';

export const RumbleEffectType: ProjectDataType = {
    file: '.rumble',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/rumbleEffect', 'Rumble Effect'),
        properties: {
            effect: {
                type: 'integer',
                default: 1,
                maximum: 123,
                minimum: 1
            },
            frequency: {
                type: 'integer',
                default: 160
            },
            stopBeforeStarting: {
                type: 'boolean',
                default: true
            }
        },
        required: []
    },
    uiSchema: {
        type: 'RumbleEffectEditor',
        scope: '#'
    },
    icon: 'codicon codicon-target',
    templates: [
        RumbleEffectSpecTemplate,
        RumbleEffectsTemplate
    ]
};
