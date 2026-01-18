import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const ColumnTableType: ProjectDataType = {
    file: '.ctable',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/columnTable', 'Column Table'),
        properties: {
            description: {
                type: 'string',
                default: ''
            },
            mirror: {
                type: 'boolean',
                default: true
            },
            values: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        repeat: {
                            type: 'integer',
                            default: 16,
                            minimum: 1,
                            maximum: 16
                        },
                        time: {
                            type: 'integer',
                            default: 16,
                            minimum: 1,
                            maximum: 16
                        }
                    },
                    additionalProperties: false
                },
                maxItems: 256,
                minItems: 128,
                default: []
            }
        },
        required: []
    },
    uiSchema: {
        type: 'ColumnTableEditor',
        scope: '#'
    },
    icon: 'codicon codicon-table',
    templates: [
        'ColumnTableSpec'
    ]
};
