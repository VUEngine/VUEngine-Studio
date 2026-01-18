import { nls } from '@theia/core';
import { InGameTypesTemplate } from '../template/InGameTypes';
import { ProjectDataType } from '../ves-project-types';

export const InGameTypesType: ProjectDataType = {
    file: 'InGameTypes',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/inGameTypes', 'In-Game Types'),
        properties: {
            types: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'string'
                }
            }
        },
        required: []
    },
    uiSchema: {
        type: 'SimpleListEditor',
        scope: '#/properties/types'
    },
    icon: 'codicon codicon-broadcast',
    templates: [
        InGameTypesTemplate
    ]
};
