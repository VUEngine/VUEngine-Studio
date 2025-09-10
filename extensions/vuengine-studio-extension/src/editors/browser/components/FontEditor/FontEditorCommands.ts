import { nls } from '@theia/core';
import { EditorCommand } from '../../ves-editors-types';

export namespace FontEditorCommands {
    export const ALPHABET_NAVIGATE_PREV_CHAR: EditorCommand = {
        id: 'editors.fontEditor.alphabetNavigatePrevChar',
        label: nls.localize('vuengine/editors/font/commands/alphabetNavigatePrevChar', 'Alphabet: Navigate Previous Character'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'left',
    };
    export const ALPHABET_NAVIGATE_NEXT_CHAR: EditorCommand = {
        id: 'editors.fontEditor.alphabetNavigateNextChar',
        label: nls.localize('vuengine/editors/font/commands/alphabetNavigateNextChar', 'Alphabet: Navigate Next Character'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'right',
    };
    export const ALPHABET_NAVIGATE_LINE_UP: EditorCommand = {
        id: 'editors.fontEditor.alphabetNavigateLineUp',
        label: nls.localize('vuengine/editors/font/commands/alphabetNavigateLineUp', 'Alphabet: Navigate Line Up'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'up',
    };
    export const ALPHABET_NAVIGATE_LINE_DOWN: EditorCommand = {
        id: 'editors.fontEditor.alphabetNavigateLineDown',
        label: nls.localize('vuengine/editors/font/commands/alphabetNavigateLineDown', 'Alphabet: Navigate Line Down'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'down',
    };
    export const COPY_CHARACTER: EditorCommand = {
        id: 'editors.fontEditor.copyCharacter',
        label: nls.localize('vuengine/editors/font/commands/copyCharacter', 'Copy Character'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'ctrlcmd+c',
    };
    export const PASTE_CHARACTER: EditorCommand = {
        id: 'editors.fontEditor.pasteCharacter',
        label: nls.localize('vuengine/editors/font/commands/pasteCharacter', 'Paste Character'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'ctrlcmd+v',
    };
};
