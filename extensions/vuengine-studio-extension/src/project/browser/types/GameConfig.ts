import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const GameConfigType: ProjectDataType = {
    file: 'GameConfig',
    excludeFromDashboard: true,
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/gameConfig', 'Game Config'),
        properties: {
            dashboard: {
                type: 'object',
                properties: {
                    positions: {
                        type: 'object',
                        properties: {},
                        additionalProperties: true,
                    },
                },
                additionalProperties: false,
            },
            plugins: {
                type: 'object',
                properties: {},
                additionalProperties: true,
            },
            projectAuthor: {
                type: 'string'
            },
            projectTitle: {
                type: 'string'
            },
            additionalProperties: false,
        },
        required: []
    },
    icon: 'codicon codicon-gear',
    templates: [
        'PluginsConfig'
    ]
};
