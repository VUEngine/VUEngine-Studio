import * as monaco from '@theia/monaco-editor-core';
import { VUENGINE_EXT } from 'src/project/browser/ves-project-types';

monaco.languages.register({
    id: 'jsonc',
    'aliases': [
        'JSON with Comments'
    ],
    'extensions': [
        `.${VUENGINE_EXT}`
    ]
});
