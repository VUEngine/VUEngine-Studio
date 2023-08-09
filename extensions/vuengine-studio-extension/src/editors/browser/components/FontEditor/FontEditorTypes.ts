import { ImageConverterCompressor } from '../../../../image-converter/browser/ves-image-converter-types';

export interface FontEditorState {
    active: boolean
    clipboard: number[][] | undefined
    tool: FontEditorTools
    paletteIndexL: number
    paletteIndexR: number
    currentCharacter: number
    charGrid: number
    alphabetGrid: number
}

export interface FontData {
    name: string
    offset: number
    characterCount: number
    size: Size
    variableSize: VariableSize
    section: DataSection
    compression: ImageConverterCompressor
    characters: number[][][]
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

export enum DataSection {
    ROM = 'rom',
    EXP = 'exp',
}

export enum FontEditorTools {
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
export const MAX_CHAR_SIZE = 4;
export const DEFAULT_CHAR_SIZE = MIN_CHAR_SIZE;

export const MIN_CHAR_COUNT = 1;
export const MAX_CHAR_COUNT = 256;
export const DEFAULT_CHAR_COUNT = 128;

export const MIN_OFFSET = 0;
export const MAX_OFFSET = MAX_CHAR_COUNT - MIN_CHAR_COUNT;
export const DEFAULT_OFFSET = MIN_OFFSET;

export const DEFAULT_VARIABLE_SIZE_ENABLED = false;
export const MIN_VARIABLE_CHAR_SIZE = 1;
export const MAX_VARIABLE_CHAR_SIZE = MAX_CHAR_SIZE * CHAR_PIXEL_SIZE;
export const DEFAULT_VARIABLE_CHAR_SIZE = DEFAULT_CHAR_SIZE * CHAR_PIXEL_SIZE;
