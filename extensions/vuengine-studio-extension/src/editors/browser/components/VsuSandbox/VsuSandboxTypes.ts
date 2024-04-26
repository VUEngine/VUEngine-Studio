export interface VsuChannelEnvelopeData {
    enabled: boolean
    repeat: boolean
    decay: boolean
    initialValue: number
    stepTime: number
}

export interface VsuChannelIntervalData {
    enabled: boolean
    value: number
}

export interface VsuChannelSweepModulationData {
    enabled: boolean
    repeat: boolean
    decay: boolean
    frequency: number
    interval: number
    sweepDown: boolean
    shift: number
}

export interface VsuChannelStereoLevelsData {
    left: number
    right: number
}

export interface VsuChannelData {
    enabled: boolean
    interval: VsuChannelIntervalData
    frequency: number
    waveform: number
    stereoLevels: VsuChannelStereoLevelsData
    envelope: VsuChannelEnvelopeData
    sweepModulation: VsuChannelSweepModulationData
    tapLocation: number
}

export interface VsuData {
    channels: VsuChannelData[]
    waveforms: number[][]
    modulation: number[]
}

export const NUMBER_OF_WAVEFORM_BANKS = 5;
export const NUMBER_OF_CHANNELS = 6;
