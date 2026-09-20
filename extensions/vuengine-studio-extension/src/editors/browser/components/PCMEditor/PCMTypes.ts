import { DataSection } from '../Common/CommonTypes';

export interface PCMData {
    author: string
    loop: boolean
    section: DataSection
    sourceFile: string
    timer: TimerConfig
}

export enum TimerResolution {
  '100US' = '100US',
  '20US' = '20US',
}

export interface TimerConfig {
    resolution: TimerResolution
    targetTimePerInterrupt: number
}
