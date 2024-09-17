export interface VsuChannelEnvelopeData {
    enabled: boolean
    repeat: boolean
    direction: boolean
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
    function: boolean
    frequency: number
    interval: number
    direction: boolean
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
    sweepMod: VsuChannelSweepModulationData
    tapLocation: number
}

export type WaveformData = number[];

export interface VsuData {
    channels: VsuChannelData[]
    waveforms: WaveformData[]
    modulation: number[]
}

export const VSU_SAMPLE_RATE = 41667;
export const VSU_NUMBER_OF_WAVEFORM_BANKS = 5;
export const VSU_NUMBER_OF_CHANNELS = 6;
export const VSU_FREQUENCY_MIN = 0;
export const VSU_FREQUENCY_MAX = 2047;
export const VSU_ENVELOPE_INITIAL_VALUE_MIN = 0;
export const VSU_ENVELOPE_INITIAL_VALUE_MAX = 15;
export const VSU_ENVELOPE_STEP_TIME_MIN = 0;
export const VSU_ENVELOPE_STEP_TIME_MAX = 7;
export const VSU_SWEEP_MODULATION_INTERVAL_MIN = 0;
export const VSU_SWEEP_MODULATION_INTERVAL_MAX = 7;
export const VSU_SWEEP_MODULATION_FREQUENCY_MIN = 0;
export const VSU_SWEEP_MODULATION_FREQUENCY_MAX = 1;
export const VSU_SWEEP_MODULATION_SHIFT_MIN = 0;
export const VSU_SWEEP_MODULATION_SHIFT_MAX = 7;

export const VSU_ENVELOPE_STEP_TIME_VALUES = [
    15.4,
    30.7,
    46.1,
    61.4,
    76.8,
    92.2,
    107.5,
    122.9,
];

export const VSU_INTERVAL_VALUES = [
    3.8,
    7.7,
    11.5,
    15.4,
    19.2,
    23.0,
    26.9,
    30.7,
    34.6,
    38.4,
    42.2,
    46.1,
    49.9,
    53.8,
    57.6,
    61.4,
    65.3,
    69.1,
    73.0,
    76.8,
    80.6,
    84.5,
    88.3,
    92.2,
    96.0,
    99.8,
    103.7,
    107.5,
    111.4,
    115.2,
    119.0,
    122.9,
];

export const VSU_NOISE_TAP_LOCATIONS = [
    15 - 1,
    11 - 1,
    14 - 1,
    5 - 1,
    9 - 1,
    7 - 1,
    10 - 1,
    12 - 1,
];
