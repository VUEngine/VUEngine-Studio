import { nls } from '@theia/core';
import { DataSection } from '../Common/CommonTypes';
import { VsuChannelEnvelopeData, VsuChannelIntervalData, VsuChannelStereoLevelsData, VsuChannelSweepModulationData } from './Emulator/VsuTypes';

export type InstrumentMap = Record<string, InstrumentConfig>;

export interface SoundData {
    name: string
    author: string
    comment: string
    tracks: TrackConfig[]
    patterns: PatternMap
    instruments: InstrumentMap
    size: number
    speed: SpeedMap
    timeSignature: TimeSignatureMap
    loop: boolean
    loopPoint: number
    section: DataSection
}

export enum SoundEditorTool {
    EDIT,
    ERASER,
    MARQUEE,
    DRAG,
    // RECORD,
}
export enum SoundEditorMarqueeMode {
    REPLACE,
    ADD,
    SUBTRACT,
}

export enum SoundEvent {
    Duration = 'duration',
    Instrument = 'instrument',
    Note = 'note',
    NoteSlide = 'noteSlide',
    Volume = 'volume',
}

export const SOUND_EVENT_LABELS = {
    [SoundEvent.Duration]: nls.localize('vuengine/editors/sound/duration', 'Duration'),
    [SoundEvent.Instrument]: nls.localize('vuengine/editors/sound/instrument', 'Instrument'),
    [SoundEvent.Note]: nls.localize('vuengine/editors/sound/note', 'Note'),
    [SoundEvent.NoteSlide]: nls.localize('vuengine/editors/sound/noteSlide', 'Note Slide'),
    [SoundEvent.Volume]: nls.localize('vuengine/editors/sound/volume', 'Volume'),
};

export interface TrackSettings {
    muted: boolean
    solo: boolean
    seeThrough: boolean
}

export const DEFAULT_TRACK_SETTINGS = {
    muted: false,
    solo: false,
    seeThrough: true,
};

export const EXCLUDED_SOUND_EVENTS = [
    SoundEvent.Duration,
    SoundEvent.Instrument,
    SoundEvent.Note,
];

export type SoundEventMap = Record<string, any>;
export type EventsMap = Record<number, SoundEventMap>;
export type PatternMap = Record<string, PatternConfig>;
export type SequenceMap = Record<number, string>;
export type SpeedMap = Record<number, number>;
export type TimeSignatureMap = Record<number, string>;

export interface PatternConfig {
    name: string
    type: SoundEditorTrackType
    size: number
    events: EventsMap
}

export interface TrackConfig {
    type: SoundEditorTrackType
    instrument: string
    sequence: SequenceMap
    allowSkip: boolean
}

export interface InstrumentConfig {
    name: string
    type: SoundEditorTrackType
    color: number
    waveform: number[]
    volume: VsuChannelStereoLevelsData
    interval: VsuChannelIntervalData
    envelope: VsuChannelEnvelopeData
    sweepMod: VsuChannelSweepModulationData
    modulationData: number[]
    tap: number
}

export interface ScrollWindow {
    x: number
    y: number
    w: number
    h: number
}

export const ALL_TRACK_TYPES = 'any';
export enum SoundEditorTrackType {
    WAVE = 'wave',
    SWEEPMOD = 'sweepMod',
    NOISE = 'noise',
}

export const TRACK_TYPE_INSTRUMENT_COMPATIBILITY = {
    [SoundEditorTrackType.WAVE]: [SoundEditorTrackType.WAVE, SoundEditorTrackType.SWEEPMOD],
    [SoundEditorTrackType.SWEEPMOD]: [SoundEditorTrackType.WAVE, SoundEditorTrackType.SWEEPMOD],
    [SoundEditorTrackType.NOISE]: [SoundEditorTrackType.NOISE]
};

export const TRACK_TYPE_LABELS: { [type: string]: string } = {
    [SoundEditorTrackType.WAVE]: nls.localize('vuengine/editors/sound/trackType/wave', 'Wave'),
    [SoundEditorTrackType.SWEEPMOD]: nls.localize('vuengine/editors/sound/trackType/sweepMod', 'Wave + Sweep/Modulation'),
    [SoundEditorTrackType.NOISE]: nls.localize('vuengine/editors/sound/trackType/noise', 'Noise'),
};

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
    // Upper end of audible range
    // (Higher sounds are audible, but will not produce a pure, specific note)
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
    // Lower end of audible range
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

export const NOTES_LABELS = Object.keys(NOTES);
export const NOTES_LABELS_REVERSED = [...NOTES_LABELS].reverse();
export const NOTES_SPECTRUM = NOTES_LABELS.length;
export const NOTES_PER_OCTAVE = 12;
export const NOTE_RESOLUTION = 16; // 1/16 note
export const SUB_NOTE_RESOLUTION = 50; // sub-steps per 1/16 note

export const DEFAULT_PLAY_RANGE_SIZE = 64;
export const DEFAULT_NEW_NOTE = 'C4';

export const SEQUENCER_PATTERN_HEIGHT_MIN = 28;
export const SEQUENCER_PATTERN_HEIGHT_MAX = 64;
export const SEQUENCER_PATTERN_HEIGHT_DEFAULT = 40;
export const SEQUENCER_PATTERN_WIDTH_MIN = 8;
export const SEQUENCER_PATTERN_WIDTH_MAX = 120;
export const SEQUENCER_PATTERN_WIDTH_DEFAULT = 32;
export const SEQUENCER_NOTE_HEIGHT = 3;
export const PATTERN_SIZE_MIN = 1;
export const PATTERN_SIZE_MAX = 2048;
export const PATTERN_SIZE_DEFAULT = 16;
export const SEQUENCER_GRID_METER_HEIGHT = 14;
export const SEQUENCER_GRID_WIDTH = 1;
export const SEQUENCER_ADD_TRACK_BUTTON_HEIGHT = 16;

export const PIANO_ROLL_GRID_METER_HEIGHT = 16;
export const PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT = 16;
export const PIANO_ROLL_GRID_WIDTH = 1;
export const PIANO_ROLL_NOTE_HEIGHT_MIN = 2;
export const PIANO_ROLL_NOTE_HEIGHT_MAX = 24;
export const PIANO_ROLL_NOTE_HEIGHT_DEFAULT = 14;
export const PIANO_ROLL_NOTE_WIDTH_MIN = 1;
export const PIANO_ROLL_NOTE_WIDTH_MAX = 512;
export const PIANO_ROLL_NOTE_WIDTH_DEFAULT = 20;
export const PIANO_ROLL_KEY_WIDTH = 75;

export const MIN_TICK_DURATION = 5;
export const MAX_TICK_DURATION = 256;

export const VOLUME_STEPS = 16;

export const EFFECTS_PANEL_COLLAPSED_HEIGHT = 18;
export const EFFECTS_PANEL_EXPANDED_HEIGHT = 128;

export const NEW_PATTERN_ID = '+';
export const TRACK_DEFAULT_INSTRUMENT_ID = 'trackDefault';
export const TRACK_DEFAULT_INSTRUMENT_NAME = nls.localize('vuengine/editors/sound/trackDefaultInstrument', 'Track Default Instrument');

export const SCROLL_BAR_WIDTH = 10;

export const WAVEFORM_MIN = 0;
export const WAVEFORM_MAX = 63;
