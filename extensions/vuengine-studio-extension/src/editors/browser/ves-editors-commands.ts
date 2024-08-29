import { Command, nls } from '@theia/core';

export namespace VesEditorsCommands {
    export const GENERATE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:generate',
            label: 'Generate File(s)',
            category: 'Editor',
            iconClass: 'codicon codicon-server-process',
        },
        'vuengine/editors/commands/generate',
        'vuengine/editors/commands/category'
    );
    export const OPEN_IN_EDITOR: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:openInEditor',
            label: 'Open in graphical editor',
            category: 'Editor',
            iconClass: 'codicon codicon-preview',
        },
        'vuengine/editors/commands/openInEditor',
        'vuengine/editors/commands/category'
    );
    export const OPEN_SOURCE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:showSource',
            label: 'Show Source',
            category: 'Editor',
            iconClass: 'codicon codicon-json',
        },
        'vuengine/editors/commands/showSource',
        'vuengine/editors/commands/category'
    );

    export const GENERATE_ID: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:generateId',
            label: 'Generate new item ID',
            category: 'Editor',
            iconClass: 'codicon codicon-gear'
        },
        'vuengine/editors/commands/generateId',
        'vuengine/editors/commands/category'
    );
};

export const EDITORS_COMMANDS = {
    'FontEditor': {
        typeId: 'Font',
        category: nls.localize('Font Editor', 'vuengine/editors/commands/fontEditor/category'),
        commands: {
            paletteSelectIndex1: {
                id: 'ves:editors:fontEditor:paletteSelectIndex1',
                label: nls.localize('Select Palette Index 1', 'vuengine/editors/commands/fontEditor/paletteSelectIndex1'),
                keybinding: '1',
            },
            paletteSelectIndex2: {
                id: 'ves:editors:fontEditor:paletteSelectIndex2',
                label: nls.localize('Select Palette Index 2', 'vuengine/editors/commands/fontEditor/paletteSelectIndex2'),
                keybinding: '2',
            },
            paletteSelectIndex3: {
                id: 'ves:editors:fontEditor:paletteSelectIndex3',
                label: nls.localize('Select Palette Index 3', 'vuengine/editors/commands/fontEditor/paletteSelectIndex1'),
                keybinding: '3',
            },
            paletteSelectIndex4: {
                id: 'ves:editors:fontEditor:paletteSelectIndex4',
                label: nls.localize('Select Palette Index 4', 'vuengine/editors/commands/fontEditor/paletteSelectIndex1'),
                keybinding: '4',
            },
            swapColors: {
                id: 'ves:editors:fontEditor:swapColors',
                label: nls.localize('Swap Colors', 'vuengine/editors/commands/fontEditor/swapColors'),
                keybinding: 'x',
            },
            alphabetNavigatePrevChar: {
                id: 'ves:editors:fontEditor:alphabetNavigatePrevChar',
                label: nls.localize('Alphabet: Navigate Previous Character', 'vuengine/editors/commands/fontEditor/alphabetNavigatePrevChar'),
                keybinding: 'shift+left',
            },
            alphabetNavigateNextChar: {
                id: 'ves:editors:fontEditor:alphabetNavigateNextChar',
                label: nls.localize('Alphabet: Navigate Next Character', 'vuengine/editors/commands/fontEditor/alphabetNavigateNextChar'),
                keybinding: 'shift+right',
            },
            alphabetNavigateLineUp: {
                id: 'ves:editors:fontEditor:alphabetNavigateLineUp',
                label: nls.localize('Alphabet: Navigate Line Up', 'vuengine/editors/commands/fontEditor/alphabetNavigateLineUp'),
                keybinding: 'shift+up',
            },
            alphabetNavigateLineDown: {
                id: 'ves:editors:fontEditor:alphabetNavigateLineDown',
                label: nls.localize('Alphabet: Navigate Line Down', 'vuengine/editors/commands/fontEditor/alphabetNavigateLineDown'),
                keybinding: 'shift+down',
            },
        },
    },
};
