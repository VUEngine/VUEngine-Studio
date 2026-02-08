import { nls } from '@theia/core';
import { LanguagesCTemplate } from '../template/LanguagesC';
import { LanguagesHTemplate } from '../template/LanguagesH';
import { ProjectDataType } from '../ves-project-types';

export const TranslationsType: ProjectDataType = {
    file: 'Translations',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/translations', 'Translations'),
        properties: {
            languages: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string'
                        },
                        code: {
                            type: 'string',
                            maxLength: 2,
                            minLength: 2
                        },
                        flagActorId: {
                            type: 'string'
                        }
                    },
                    additionalProperties: false
                }
            },
            translations: {
                type: 'object',
                additionalProperties: {
                    type: 'object',
                    additionalProperties: {
                        type: 'string'
                    }
                }
            }
        },
        required: []
    },
    uiSchema: {
        type: 'TranslationsEditor',
        scope: '#'
    },
    icon: 'codicon codicon-comment-discussion',
    templates: [
        LanguagesCTemplate,
        LanguagesHTemplate
    ]
};
