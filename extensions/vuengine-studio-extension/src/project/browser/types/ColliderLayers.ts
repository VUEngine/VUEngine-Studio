import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const ColliderLayersType: ProjectDataType = {
    file: 'ColliderLayers',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/colliderLayers', 'Collider Layers'),
        properties: {
            layers: {
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
        scope: '#/properties/layers'
    },
    icon: 'codicon codicon-activate-breakpoints',
    templates: [
        'ColliderLayers'
    ]
};
