import { nls } from '@theia/core';
import { EditorCommands } from '../../ves-editors-types';

export const FontEditorCommands: EditorCommands = {
    PALETTE_SELECT_INDEX_1: {
        id: 'editors.fontEditor.paletteSelectIndex1',
        label: nls.localize('vuengine/editors/font/commands/paletteSelectIndex1', 'Select Palette Index 1'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: '1',
    },
    PALETTE_SELECT_INDEX_2: {
        id: 'editors.fontEditor.paletteSelectIndex2',
        label: nls.localize('vuengine/editors/font/commands/paletteSelectIndex2', 'Select Palette Index 2'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: '2',
    },
    PALETTE_SELECT_INDEX_3: {
        id: 'editors.fontEditor.paletteSelectIndex3',
        label: nls.localize('vuengine/editors/font/commands/paletteSelectIndex3', 'Select Palette Index 3'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: '3',
    },
    PALETTE_SELECT_INDEX_4: {
        id: 'editors.fontEditor.paletteSelectIndex4',
        label: nls.localize('vuengine/editors/font/commands/paletteSelectIndex4', 'Select Palette Index 4'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: '4',
    },
    PALETTE_SELECT_INDEX_5: {
        id: 'editors.fontEditor.paletteSelectIndex5',
        label: nls.localize('vuengine/editors/font/commands/paletteSelectIndex5', 'Select Palette Index 5'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: '5',
    },
    PALETTE_SELECT_INDEX_6: {
        id: 'editors.fontEditor.paletteSelectIndex6',
        label: nls.localize('vuengine/editors/font/commands/paletteSelectIndex6', 'Select Palette Index 6'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: '6',
    },
    PALETTE_SELECT_INDEX_7: {
        id: 'editors.fontEditor.paletteSelectIndex7',
        label: nls.localize('vuengine/editors/font/commands/paletteSelectIndex7', 'Select Palette Index 7'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: '7',
    },
    SWAP_COLORS: {
        id: 'editors.fontEditor.swapColors',
        label: nls.localize('vuengine/editors/font/commands/swapColors', 'Swap Colors'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'x',
    },
    ALPHABET_NAVIGATE_PREV_CHAR: {
        id: 'editors.fontEditor.alphabetNavigatePrevChar',
        label: nls.localize('vuengine/editors/font/commands/alphabetNavigatePrevChar', 'Alphabet: Navigate Previous Character'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'left',
    },
    ALPHABET_NAVIGATE_NEXT_CHAR: {
        id: 'editors.fontEditor.alphabetNavigateNextChar',
        label: nls.localize('vuengine/editors/font/commands/alphabetNavigateNextChar', 'Alphabet: Navigate Next Character'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'right',
    },
    ALPHABET_NAVIGATE_LINE_UP: {
        id: 'editors.fontEditor.alphabetNavigateLineUp',
        label: nls.localize('vuengine/editors/font/commands/alphabetNavigateLineUp', 'Alphabet: Navigate Line Up'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'up',
    },
    ALPHABET_NAVIGATE_LINE_DOWN: {
        id: 'editors.fontEditor.alphabetNavigateLineDown',
        label: nls.localize('vuengine/editors/font/commands/alphabetNavigateLineDown', 'Alphabet: Navigate Line Down'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'down',
    },
    TOOL_DRAG: {
        id: 'editors.fontEditor.toolDrag',
        label: nls.localize('vuengine/editors/font/commands/toolDrag', 'Tool: Drag'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'v',
    },
    TOOL_PENCIL: {
        id: 'editors.fontEditor.toolPencil',
        label: nls.localize('vuengine/editors/font/commands/toolPencil', 'Tool: Pencil'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'b',
    },
    TOOL_ERASER: {
        id: 'editors.fontEditor.toolEraser',
        label: nls.localize('vuengine/editors/font/commands/toolEraser', 'Tool: Eraser'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'e',
    },
    TOOL_PAINT_BUCKET: {
        id: 'editors.fontEditor.toolPaintBucket',
        label: nls.localize('vuengine/editors/font/commands/toolPaintBucket', 'Tool: Paint Bucket'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'g',
    },
    TOOL_LINE: {
        id: 'editors.fontEditor.toolLine',
        label: nls.localize('vuengine/editors/font/commands/toolLine', 'Tool: Line'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'l',
    },
    TOOL_RECTANGLE: {
        id: 'editors.fontEditor.toolRectangle',
        label: nls.localize('vuengine/editors/font/commands/toolRectangle', 'Tool: Rectangle'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'u',
    },
    TOOL_RECTANGLE_FILLED: {
        id: 'editors.fontEditor.toolRectangleFilled',
        label: nls.localize('vuengine/editors/font/commands/toolRectangleFilled', 'Tool: Rectangle (Filled)'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'ctrlcmd+u',
    },
    TOOL_ELLIPSE: {
        id: 'editors.fontEditor.toolEllipse',
        label: nls.localize('vuengine/editors/font/commands/toolEllipse', 'Tool: Ellipse'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'i',
    },
    TOOL_ELLIPSE_FILLED: {
        id: 'editors.fontEditor.toolEllipseFilled',
        label: nls.localize('vuengine/editors/font/commands/toolEllipseFilled', 'Tool: Ellipse (Filled)'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'ctrlcmd+i',
    },
    TOOL_MARQUEE: {
        id: 'editors.fontEditor.toolMarquee',
        label: nls.localize('vuengine/editors/font/commands/toolMarquee', 'Tool: Marquee'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'm',
    },
    COPY_CHARACTER: {
        id: 'editors.fontEditor.copyCharacter',
        label: nls.localize('vuengine/editors/font/commands/copyCharacter', 'Copy Character'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'ctrlcmd+c',
    },
    PASTE_CHARACTER: {
        id: 'editors.fontEditor.pasteCharacter',
        label: nls.localize('vuengine/editors/font/commands/pasteCharacter', 'Paste Character'),
        category: nls.localize('vuengine/editors/font/commands/category', 'Font Editor'),
        keybinding: 'ctrlcmd+v',
    },
};
