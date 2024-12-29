import { DataSection } from '../Common/CommonTypes';

export interface PCMData {
    sourceFile: string
    range: number
    loop: boolean
    section: DataSection
}

export const PCM_MIN_RANGE = 1;
export const PCM_MAX_RANGE = 5;
