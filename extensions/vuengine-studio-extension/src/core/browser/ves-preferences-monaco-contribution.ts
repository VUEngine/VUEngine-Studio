import * as monaco from '@theia/monaco-editor-core';
import { VUENGINE_EXT } from '../../project/common/custom-project-file/ves-project-utils';

monaco.languages.register({
    id: 'jsonc',
    'aliases': [
        'JSON with Comments'
    ],
    'filenames': [
        'settings.json'
    ],
    'extensions': [
        `.${VUENGINE_EXT}`
    ]
});
