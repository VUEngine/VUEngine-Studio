import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const RomInfoType: ProjectDataType = {
    file: 'RomInfo',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/romInfo', 'ROM Info'),
        properties: {
            gameTitle: {
                type: 'string',
                description: "The game's title",
                minLength: 0,
                maxLength: 20,
                default: 'VUENGINE PROJECT'
            },
            gameCodeSystem: {
                type: 'string',
                minLength: 1,
                maxLength: 1,
                default: 'V'
            },
            gameCodeId: {
                type: 'string',
                minLength: 2,
                maxLength: 2,
                default: 'VU'
            },
            gameCodeLanguage: {
                type: 'string',
                minLength: 1,
                maxLength: 1,
                default: 'E'
            },
            makerCode: {
                type: 'string',
                minLength: 2,
                maxLength: 2,
                default: '  '
            },
            revision: {
                type: 'integer',
                minimum: 0,
                maximum: 9,
                default: 0
            }
        }
    },
    uiSchema: {
        type: 'RomInfoEditor',
        scope: '#'
    },
    icon: 'codicon codicon-chip',
    templates: [
        'RomInfo'
    ]
};
