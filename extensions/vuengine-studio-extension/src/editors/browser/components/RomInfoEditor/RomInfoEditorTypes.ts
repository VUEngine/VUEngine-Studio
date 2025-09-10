export interface RomInfoData {
    gameTitle: string
    gameCodeSystem: string
    gameCodeId: string
    gameCodeLanguage: string
    makerCode: string
    revision: number
}

export const GAME_TITLE_MIN_LENGTH = 0;
export const GAME_TITLE_MAX_LENGTH = 20;
export const MAKER_CODE_MIN_LENGTH = 2;
export const MAKER_CODE_MAX_LENGTH = 2;
export const GAME_CODE_SYSTEM_MIN_LENGTH = 1;
export const GAME_CODE_SYSTEM_MAX_LENGTH = 1;
export const GAME_CODE_ID_MIN_LENGTH = 2;
export const GAME_CODE_ID_MAX_LENGTH = 2;
export const GAME_CODE_LANGUAGE_MIN_LENGTH = 1;
export const GAME_CODE_LANGUAGE_MAX_LENGTH = 1;
export const REVISION_MIN_VALUE = 0;
export const REVISION_MAX_VALUE = 9;
