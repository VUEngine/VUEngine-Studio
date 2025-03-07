import { ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { DataSection } from '../Common/CommonTypes';
import { PixelEditorCommands } from '../PixelEditor/PixelEditorCommands';
import { FontEditorCommands } from './FontEditorCommands';

export interface FontData {
    characterCount: number
    characters: number[][][]
    compression: ImageCompressionType
    pageSize: number
    offset: number
    section: DataSection
    size: Size
    variableSize: VariableSize
}

export interface Size {
    x: number,
    y: number
}

export interface VariableSize {
    enabled: boolean
    x: number[]
    y: number
}

export enum FontEditorTool {
    PENCIL,
    FILL,
    FILL_ALL,
}

export const win1252CharNames = [
    'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'HT', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
    'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US',
    'Space', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
    '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', '`',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', 'DEL',
    '€', '', '‚', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Œ', '', 'Ž', '',
    '', '‘', '’', '“', '”', '•', '–', '—', '˜', '™', 'š', '›', 'œ', '', 'ž', 'Ÿ',
    'NBSP', '¡', '¢', '£', '¤', '¥', '¦', '§', '¨', '©', 'ª', '«', '¬', 'SHY', '®', '¯',
    '°', '±', '²', '³', '´', 'µ', '¶', '·', '¸', '¹', 'º', '»', '¼', '½', '¾', '¿',
    'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï',
    'Ð', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', '×', 'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'Þ', 'ß',
    'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï',
    'ð', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', '÷', 'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'þ', 'ÿ ',
];

export const CHAR_PIXEL_SIZE = 8;
export const MIN_CHAR_SIZE = 1;
export const MAX_CHAR_SIZE = 64;
export const DEFAULT_CHAR_SIZE = MIN_CHAR_SIZE;

export const MIN_CHAR_COUNT = 1;
export const MAX_CHAR_COUNT = 256;
export const DEFAULT_CHAR_COUNT = MAX_CHAR_COUNT;

export const MIN_OFFSET = 0;
export const MAX_OFFSET = MAX_CHAR_COUNT - MIN_CHAR_COUNT;
export const DEFAULT_OFFSET = MIN_OFFSET;

export const MIN_PAGE_SIZE = MIN_CHAR_COUNT;
export const MAX_PAGE_SIZE = MAX_CHAR_COUNT;
export const DEFAULT_PAGE_SIZE = MAX_PAGE_SIZE;

export const DEFAULT_VARIABLE_SIZE_ENABLED = false;
export const MIN_VARIABLE_CHAR_SIZE = 1;
export const MAX_VARIABLE_CHAR_SIZE = MAX_CHAR_SIZE * CHAR_PIXEL_SIZE;
export const DEFAULT_VARIABLE_CHAR_SIZE = DEFAULT_CHAR_SIZE * CHAR_PIXEL_SIZE;

export const INPUT_BLOCKING_COMMANDS = [
    FontEditorCommands.ALPHABET_NAVIGATE_LINE_DOWN.id,
    FontEditorCommands.ALPHABET_NAVIGATE_LINE_UP.id,
    FontEditorCommands.ALPHABET_NAVIGATE_PREV_CHAR.id,
    FontEditorCommands.ALPHABET_NAVIGATE_NEXT_CHAR.id,
    FontEditorCommands.COPY_CHARACTER.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_1.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_2.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_3.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_4.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_5.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_6.id,
    PixelEditorCommands.PALETTE_SELECT_INDEX_7.id,
    FontEditorCommands.PASTE_CHARACTER.id,
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
