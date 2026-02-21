import { nls } from '@theia/core';
import { EditorCommand } from '../../ves-editors-types';

export namespace PixelEditorCommands {
    export const PALETTE_SELECT_INDEX_1: EditorCommand = {
        id: 'editors.pixelEditor.paletteSelectIndex1',
        label: nls.localize('vuengine/editors/pixel/commands/paletteSelectIndex1', 'Select Palette Index 1'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: '1',
    };
    export const PALETTE_SELECT_INDEX_2: EditorCommand = {
        id: 'editors.pixelEditor.paletteSelectIndex2',
        label: nls.localize('vuengine/editors/pixel/commands/paletteSelectIndex2', 'Select Palette Index 2'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: '2',
    };
    export const PALETTE_SELECT_INDEX_3: EditorCommand = {
        id: 'editors.pixelEditor.paletteSelectIndex3',
        label: nls.localize('vuengine/editors/pixel/commands/paletteSelectIndex3', 'Select Palette Index 3'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: '3',
    };
    export const PALETTE_SELECT_INDEX_4: EditorCommand = {
        id: 'editors.pixelEditor.paletteSelectIndex4',
        label: nls.localize('vuengine/editors/pixel/commands/paletteSelectIndex4', 'Select Palette Index 4'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: '4',
    };
    export const PALETTE_SELECT_INDEX_5: EditorCommand = {
        id: 'editors.pixelEditor.paletteSelectIndex5',
        label: nls.localize('vuengine/editors/pixel/commands/paletteSelectIndex5', 'Select Palette Index 5'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: '5',
    };
    export const PALETTE_SELECT_INDEX_6: EditorCommand = {
        id: 'editors.pixelEditor.paletteSelectIndex6',
        label: nls.localize('vuengine/editors/pixel/commands/paletteSelectIndex6', 'Select Palette Index 6'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: '6',
    };
    export const PALETTE_SELECT_INDEX_7: EditorCommand = {
        id: 'editors.pixelEditor.paletteSelectIndex7',
        label: nls.localize('vuengine/editors/pixel/commands/paletteSelectIndex7', 'Select Palette Index 7'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: '7',
    };
    export const PALETTE_SELECT_INDEX_0: EditorCommand = {
        id: 'editors.pixelEditor.paletteSelectIndex0',
        label: nls.localize('vuengine/editors/pixel/commands/paletteSelectIndex0', 'Select Palette Index 0 (Transparent)'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: '0',
    };
    export const SWAP_COLORS: EditorCommand = {
        id: 'editors.pixelEditor.swapColors',
        label: nls.localize('vuengine/editors/pixel/commands/swapColors', 'Swap Colors'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'x',
    };
    export const TOOL_DRAG: EditorCommand = {
        id: 'editors.pixelEditor.toolDrag',
        label: nls.localize('vuengine/editors/pixel/commands/toolDrag', 'Tool: Drag'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'v',
    };
    export const TOOL_PENCIL: EditorCommand = {
        id: 'editors.pixelEditor.toolPencil',
        label: nls.localize('vuengine/editors/pixel/commands/toolPencil', 'Tool: Pencil'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'b',
    };
    export const TOOL_ERASER: EditorCommand = {
        id: 'editors.pixelEditor.toolEraser',
        label: nls.localize('vuengine/editors/pixel/commands/toolEraser', 'Tool: Eraser'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'e',
    };
    export const TOOL_PAINT_BUCKET: EditorCommand = {
        id: 'editors.pixelEditor.toolPaintBucket',
        label: nls.localize('vuengine/editors/pixel/commands/toolPaintBucket', 'Tool: Paint Bucket'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'g',
    };
    export const TOOL_LINE: EditorCommand = {
        id: 'editors.pixelEditor.toolLine',
        label: nls.localize('vuengine/editors/pixel/commands/toolLine', 'Tool: Line'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'l',
    };
    export const TOOL_RECTANGLE: EditorCommand = {
        id: 'editors.pixelEditor.toolRectangle',
        label: nls.localize('vuengine/editors/pixel/commands/toolRectangle', 'Tool: Rectangle'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'u',
    };
    export const TOOL_RECTANGLE_FILLED: EditorCommand = {
        id: 'editors.pixelEditor.toolRectangleFilled',
        label: nls.localize('vuengine/editors/pixel/commands/toolRectangleFilled', 'Tool: Rectangle (Filled)'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'ctrlcmd+u',
    };
    export const TOOL_ELLIPSE: EditorCommand = {
        id: 'editors.pixelEditor.toolEllipse',
        label: nls.localize('vuengine/editors/pixel/commands/toolEllipse', 'Tool: Ellipse'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'i',
    };
    export const TOOL_ELLIPSE_FILLED: EditorCommand = {
        id: 'editors.pixelEditor.toolEllipseFilled',
        label: nls.localize('vuengine/editors/pixel/commands/toolEllipseFilled', 'Tool: Ellipse (Filled)'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'ctrlcmd+i',
    };
    export const TOOL_MARQUEE: EditorCommand = {
        id: 'editors.pixelEditor.toolMarquee',
        label: nls.localize('vuengine/editors/pixel/commands/toolMarquee', 'Tool: Marquee'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
        keybinding: 'm',
    };
    export const TOGGLE_GRID: EditorCommand = {
        id: 'editors.pixelEditor.toggleGrid',
        label: nls.localize('vuengine/editors/pixel/commands/toggleGrid', 'Toggle Grid'),
        category: nls.localize('vuengine/editors/pixel/commands/category', 'Pixel Editor'),
    };
};
