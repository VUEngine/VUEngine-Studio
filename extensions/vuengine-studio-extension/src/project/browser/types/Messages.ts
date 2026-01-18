import { nls } from '@theia/core';
import { MessagesTemplate } from '../template/Messages';
import { ProjectDataType } from '../ves-project-types';

export const MessagesType: ProjectDataType = {
    file: 'Messages',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/messages', 'Messages'),
        properties: {
            messages: {
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
        scope: '#/properties/messages'
    },
    icon: 'codicon codicon-comment',
    templates: [
        MessagesTemplate
    ]
};
