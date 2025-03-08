import { ColorMode } from '../../../../core/browser/ves-common-types';
import { Displays } from '../Common/VUEngineTypes';
import { PixelEditorCommands } from './PixelEditorCommands';

export const DEFAULT_IMAGE_SIZE = 16;

export interface LayerPixelData {
    id: string;
    data: (number | null)[][];
    displays: Displays
    isVisible: boolean
    name: string
    parallax: number
}

export interface SpriteData {
    colorMode: ColorMode
    dimensions: {
        x: number
        y: number
    }
    frames: LayerPixelData[][]
}

export const DOT_BRUSH_PATTERNS = [
    [
        [1],
    ],
    [
        [1, 1],
        [1, 1],
    ],
    [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
    ],
    [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
    ],
    [
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [0, 1, 1, 0],
    ],
    [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
    ],
    /*
    [
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
    ],
    [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0],
    ],
    [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
    ],
    */
];

export const INPUT_BLOCKING_COMMANDS = [
    PixelEditorCommands.PALETTE_SELECT_INDEX_1.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_2.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_3.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_4.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_5.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_6.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_7.id,
    PixelEditorCommands.SWAP_COLORS.id,
    PixelEditorCommands.TOOL_DRAG.id,
    PixelEditorCommands.TOOL_ELLIPSE.id,
    PixelEditorCommands.TOOL_ELLIPSE_FILLED.id,
    PixelEditorCommands.TOOL_ERASER.id,
    PixelEditorCommands.TOOL_LINE.id,
    PixelEditorCommands.TOOL_MARQUEE.id,
    PixelEditorCommands.TOOL_PAINT_BUCKET.id,
    PixelEditorCommands.TOOL_PENCIL.id,
    PixelEditorCommands.TOOL_RECTANGLE.id,
    PixelEditorCommands.TOOL_RECTANGLE_FILLED.id,
];
