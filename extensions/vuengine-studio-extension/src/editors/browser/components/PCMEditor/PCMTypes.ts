export interface PCMData {
    name: string
    sourceFile: string
    range: number
    loop: boolean
    section: DataSection
}

export enum DataSection {
    ROM = 'rom',
    EXP = 'exp',
}

export const MIN_RANGE = 1;
export const MAX_RANGE = 5;
