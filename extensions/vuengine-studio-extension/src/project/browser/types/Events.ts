import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const EventsType: ProjectDataType = {
    file: 'Events',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/events', 'Events'),
        properties: {
            events: {
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
        scope: '#/properties/events'
    },
    icon: 'codicon codicon-symbol-event',
    templates: [
        'GameEvents'
    ]
};
