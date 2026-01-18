import { nls } from '@theia/core';
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
            sustainPositive: {
                type: 'integer',
                maximum: 255,
                minimum: 0,
                default: 255
            },
            sustainNegative: {
                type: 'integer',
                maximum: 255,
                minimum: 0,
                default: 255
            },
            overdrive: {
                type: 'integer',
                maximum: 126,
                minimum: 0,
                default: 126
            },
            break: {
                type: 'integer',
                maximum: 255,
                minimum: 0,
                default: 255
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
    icon: 'codicon codicon-screen-full',
    templates: [
        'RumbleEffectSpec',
        'RumbleEffects'
    ]
};
