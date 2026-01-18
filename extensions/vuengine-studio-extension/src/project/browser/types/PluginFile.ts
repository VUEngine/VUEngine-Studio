import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const PluginFileType: ProjectDataType = {
    file: 'vuengine.plugin',
    excludeFromDashboard: true,
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/pluginFile', 'VUEngine Plugin'),
        properties: {
            displayName: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'string'
                }
            },
            author: {
                type: 'string'
            },
            description: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'string'
                }
            },
            repository: {
                type: 'string'
            },
            license: {
                type: 'string'
            },
            tags: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {},
                    additionalProperties: {
                        type: 'string'
                    }
                }
            },
            dependencies: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            configuration: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string'
                        },
                        label: {
                            type: 'string'
                        },
                        description: {
                            type: 'string'
                        },
                        dataType: {
                            type: 'string',
                        },
                        type: {
                            type: 'string',
                        },
                        min: {
                            type: 'integer',
                        },
                        max: {
                            type: 'integer',
                        },
                        step: {
                            type: 'integer',
                            minimum: 1,
                            default: 1,
                        },
                        default: {
                            type: 'integer',
                        },
                    },
                    additionalProperties: false,
                }
            },
        },
        required: []
    },
    uiSchema: {
        type: 'PluginFileEditor',
        scope: '#'
    },
    icon: 'codicon codicon-plug',
    templates: [
        'PluginConfig',
        'PluginConfigMake',
    ]
};
