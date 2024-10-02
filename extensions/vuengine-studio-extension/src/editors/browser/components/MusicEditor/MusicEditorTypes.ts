import { DataSection } from '../Common/CommonTypes';
import { VsuChannelEnvelopeData, VsuChannelIntervalData, VsuChannelStereoLevelsData, VsuChannelSweepModulationData } from '../VsuEmulator/VsuEmulatorTypes';

export interface SongData {
    name: string
    channels: ChannelConfig[]
    instruments: InstrumentConfig[]
    speed: number
    waveforms: number[][]
    noteResolution: number
    loop: boolean
    defaultBar: string
    section: DataSection
}

export interface PatternConfig {
    name: string
    bar: string
    notes: (number | undefined)[]
    volumeL: (number | undefined)[]
    volumeR: (number | undefined)[]
    effects: (string[] | undefined)[]
}

export interface ChannelConfig {
    id: number
    instrument: number
    sequence: number[]
    patterns: PatternConfig[]
    muted: boolean
    solo: boolean
}

export interface InstrumentConfig {
    name: string
    type: MusicEditorInstrumentType
    waveform: number
    volume: VsuChannelStereoLevelsData
    interval: VsuChannelIntervalData
    envelope: VsuChannelEnvelopeData
    sweepMod: VsuChannelSweepModulationData
    modulationData: number[]
    tapLocation: number
}

export interface SongNote {
    note: string | undefined
    volumeL: number | undefined
    volumeR: number | undefined
}

export enum MusicEditorInstrumentType {
    WAVE = 'wave',
    NOISE = 'noise',
}

export enum MusicEditorMode {
    PIANOROLL,
    TRACKER,
}

export enum MusicEditorTool {
    DEFAULT,
    ERASER,
    MARQUEE,
}

export enum NoteResolution {
    QUARTER = 4,
    EIGHTH = 8,
    SIXTEENTH = 16,
    THIRTYSECOND = 32,
}

export const NOTES: { [note: string]: number } = {
    /*
        'B9': 0,
        'A#9': 0,
        'A9': 0,
        'G#9': 0,
        'G9': 0,
        'F#9': 0,
        'F9': 0,
        'E9': 0,
        'D#9': 0,
        'D9': 0,
        'C#9': 0,
        'C9': 2029,
    */
    'B8': 2028,
    'A#8': 2027,
    'A8': 2026,
    'G#8': 2024,
    'G8': 2023,
    'F#8': 2022,
    'F8': 2020,
    'E8': 2018,
    'D#8': 2017,
    'D8': 2015,
    'C#8': 2013,
    'C8': 2011,
    'B7': 2008,
    'A#7': 2006,
    'A7': 2004,
    'G#7': 2001,
    'G7': 1998,
    'F#7': 1995,
    'F7': 1992,
    'E7': 1989,
    'D#7': 1985,
    'D7': 1981,
    'C#7': 1978,
    'C7': 1973,
    'B6': 1969,
    'A#6': 1964,
    'A6': 1960,
    'G#6': 1954,
    'G6': 1948,
    'F#6': 1942,
    'F6': 1936,
    'E6': 1930,
    'D#6': 1922,
    'D6': 1915,
    'C#6': 1907,
    'C6': 1899,
    'B5': 1890,
    'A#5': 1880,
    'A5': 1870,
    'G#5': 1860,
    'G5': 1849,
    'F#5': 1837,
    'F5': 1824,
    'E5': 1811,
    'D#5': 1797,
    'D5': 1782,
    'C#5': 1766,
    'C5': 1749,
    'B4': 1732,
    'A#4': 1713,
    'A4': 1693,
    'G#4': 1672,
    'G4': 1650,
    'F#4': 1625,
    'F4': 1600,
    'E4': 1574,
    'D#4': 1547,
    'D4': 1516,
    'C#4': 1484,
    'C4': 1451,
    'B3': 1415,
    'A#3': 1378,
    'A3': 1338,
    'G#3': 1296,
    'G3': 1251,
    'F#3': 1203,
    'F3': 1153,
    'E3': 1100,
    'D#3': 1044,
    'D3': 984,
    'C#3': 921,
    'C3': 854,
    'B2': 783,
    'A#2': 707,
    'A2': 628,
    'G#2': 543,
    'G2': 454,
    'F#2': 359,
    'F2': 258,
    'E2': 152,
    'D#2': 39,
    'D2': 0,
    'C#2': 0,
    'C2': 0,
    /*
        'B1': 0,
        'A#1': 0,
        'A1': 0,
        'G#1': 0,
        'G1': 0,
        'F#1': 0,
        'F1': 0,
        'E1': 0,
        'D#1': 0,
        'D1': 0,
        'C#1': 0,
        'C1': 0,
        'B0': 0,
        'A#0': 0,
        'A0': 0,
        'G#0': 0,
        'G0': 0,
        'F#0': 0,
        'F0': 0,
        'E0': 0,
        'D#0': 0,
        'D0': 0,
        'C#0': 0,
        'C0': 0,
    */
};

export const NOTES_SPECTRUM = Object.keys(NOTES).length;
export const PATTERN_HEIGHT = Math.round(NOTES_SPECTRUM / 4);
export const PATTERN_MAPPING_FACTOR = PATTERN_HEIGHT / NOTES_SPECTRUM;

export const PIANO_ROLL_NOTE_HEIGHT = 9;
export const PIANO_ROLL_NOTE_WIDTH = 15;

export const MAX_SPEED = 1200;
export const MIN_SPEED = 30;

export const VOLUME_STEPS = 16;

// length value is bar * 4
export const BAR_PATTERN_LENGTH_MULT_MAP: { [bar: string]: number } = {
    '2/2': 4,
    '3/2': 6,
    '2/4': 2,
    '3/4': 3,
    '4/4': 4,
    '5/4': 5,
    '6/4': 6,
    '3/8': 1.5,
    '4/8': 2,
    '6/8': 3,
    '7/8': 3.5,
    '11/8': 5.5,
    '4/16': 1,
    '15/16': 4.6875,
    '12/16': 3,
};

export const CHANNEL_BG_COLORS = [
    '#5a8ea3',
    '#a6d2d1',
    '#bcab43',
    '#efc24b',
    '#df6745',
    '#e370a9',
];
