import { DataSection } from '../Common/CommonTypes';

export interface PCMData {
    sourceFile: string
    range: number
    loop: boolean
    section: DataSection
}

export const MIN_RANGE = 1;
export const MAX_RANGE = 5;
