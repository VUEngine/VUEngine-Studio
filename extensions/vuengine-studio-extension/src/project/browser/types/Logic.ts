import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const LogicType: ProjectDataType = {
    enabled: false,
    file: '.logic',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/logic', 'Logic'),
        properties: {
            configuration: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string'
                        }
                    },
                    additionalProperties: false
                }
            },
            methods: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            default: 'custom'
                        },
                        name: {
                            type: 'string'
                        },
                        script: {
                            type: 'array',
                            items: {
                                type: 'object',
                                additionalProperties: true
                            }
                        }
                    },
                    additionalProperties: false
                }
            }
        },
        required: []
    },
    uiSchema: {
        type: 'LogicEditor',
        scope: '#'
    },
    icon: 'codicon codicon-pulse',
    templates: []
};
