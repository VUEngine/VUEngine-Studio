import { Command, nls } from '@theia/core';

export namespace VesEditorsCommands {
    export const GENERATE: Command = Command.toLocalizedCommand(
        {
            id: 'editors.generate',
            label: 'Generate File(s)',
            category: 'Editor',
            iconClass: 'codicon codicon-server-process',
        },
        'vuengine/editors/commands/generate',
        'vuengine/editors/commands/category'
    );
    export const OPEN_IN_EDITOR: Command = Command.toLocalizedCommand(
        {
            id: 'editors.openInEditor',
            label: 'Open in graphical editor',
            category: 'Editor',
            iconClass: 'codicon codicon-preview',
        },
        'vuengine/editors/commands/openInEditor',
        'vuengine/editors/commands/category'
    );
    export const OPEN_SOURCE: Command = Command.toLocalizedCommand(
        {
            id: 'editors.showSource',
            label: 'Show Source',
            category: 'Editor',
            iconClass: 'codicon codicon-json',
        },
        'vuengine/editors/commands/showSource',
        'vuengine/editors/commands/category'
    );

    export const GENERATE_ID: Command = Command.toLocalizedCommand(
        {
            id: 'editors.generateId',
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
        category: nls.localize('vuengine/editors/commands/fontEditor/category', 'Font Editor'),
        commands: {
            paletteSelectIndex1: {
                id: 'editors.fontEditor.paletteSelectIndex1',
                label: nls.localize('vuengine/editors/commands/fontEditor/paletteSelectIndex1', 'Select Palette Index 1'),
                keybinding: '1',
            },
            paletteSelectIndex2: {
                id: 'editors.fontEditor.paletteSelectIndex2',
                label: nls.localize('vuengine/editors/commands/fontEditor/paletteSelectIndex2', 'Select Palette Index 2'),
                keybinding: '2',
            },
            paletteSelectIndex3: {
                id: 'editors.fontEditor.paletteSelectIndex3',
                label: nls.localize('vuengine/editors/commands/fontEditor/paletteSelectIndex3', 'Select Palette Index 3'),
                keybinding: '3',
            },
            paletteSelectIndex4: {
                id: 'editors.fontEditor.paletteSelectIndex4',
                label: nls.localize('vuengine/editors/commands/fontEditor/paletteSelectIndex4', 'Select Palette Index 4'),
                keybinding: '4',
            },
            swapColors: {
                id: 'editors.fontEditor.swapColors',
                label: nls.localize('vuengine/editors/commands/fontEditor/swapColors', 'Swap Colors'),
                keybinding: 'x',
            },
            alphabetNavigatePrevChar: {
                id: 'editors.fontEditor.alphabetNavigatePrevChar',
                label: nls.localize('vuengine/editors/commands/fontEditor/alphabetNavigatePrevChar', 'Alphabet: Navigate Previous Character'),
                keybinding: 'shift+left',
            },
            alphabetNavigateNextChar: {
                id: 'editors.fontEditor.alphabetNavigateNextChar',
                label: nls.localize('vuengine/editors/commands/fontEditor/alphabetNavigateNextChar', 'Alphabet: Navigate Next Character'),
                keybinding: 'shift+right',
            },
            alphabetNavigateLineUp: {
                id: 'editors.fontEditor.alphabetNavigateLineUp',
                label: nls.localize('vuengine/editors/commands/fontEditor/alphabetNavigateLineUp', 'Alphabet: Navigate Line Up'),
                keybinding: 'shift+up',
            },
            alphabetNavigateLineDown: {
                id: 'editors.fontEditor.alphabetNavigateLineDown',
                label: nls.localize('vuengine/editors/commands/fontEditor/alphabetNavigateLineDown', 'Alphabet: Navigate Line Down'),
                keybinding: 'shift+down',
            },
            toolDrag: {
                id: 'editors.fontEditor.toolDrag',
                label: nls.localize('vuengine/editors/commands/fontEditor/toolDrag', 'Tool: Drag'),
                keybinding: 'v',
            },
            toolPencil: {
                id: 'editors.fontEditor.toolPencil',
                label: nls.localize('vuengine/editors/commands/fontEditor/toolPencil', 'Tool: Pencil'),
                keybinding: 'b',
            },
            toolEraser: {
                id: 'editors.fontEditor.toolEraser',
                label: nls.localize('vuengine/editors/commands/fontEditor/toolEraser', 'Tool: Eraser'),
                keybinding: 'e',
            },
            toolPaintBucket: {
                id: 'editors.fontEditor.toolPaintBucket',
                label: nls.localize('vuengine/editors/commands/fontEditor/toolPaintBucket', 'Tool: Paint Bucket'),
                keybinding: 'g',
            },
            toolMarquee: {
                id: 'editors.fontEditor.toolMarquee',
                label: nls.localize('vuengine/editors/commands/fontEditor/toolMarquee', 'Tool: Marquee'),
                keybinding: 'm',
            },
        },
    },
};
