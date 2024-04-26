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
    sweep: boolean
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
export const ENVELOPE_INITIAL_VALUE_MIN = 0;
export const ENVELOPE_INITIAL_VALUE_MAX = 15;
export const ENVELOPE_STEP_TIME_MIN = 0;
export const ENVELOPE_STEP_TIME_MAX = 7;
export const SWEEP_MODULATION_INTERVAL_MIN = 0;
export const SWEEP_MODULATION_INTERVAL_MAX = 7;
export const SWEEP_MODULATION_FREQUENCY_MIN = 0;
export const SWEEP_MODULATION_FREQUENCY_MAX = 1;
export const SWEEP_MODULATION_SHIFT_MIN = 0;
export const SWEEP_MODULATION_SHIFT_MAX = 7;
