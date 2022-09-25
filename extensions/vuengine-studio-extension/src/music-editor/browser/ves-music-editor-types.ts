export interface MusicEditorStateApi {
    setName: (name: string) => void,
    setPlaying: (playing: boolean) => void,
    setRecording: (recording: boolean) => void,
    setBar: (bar: number) => void,
    setSpeed: (speed: number) => void,
    setVolume: (volume: number) => void,
    setChannels: (channels: ChannelConfig[]) => void,
    setPatterns: (patterns: PatternConfig[]) => void,
    setCurrentChannel: (id: number) => void,
    setCurrentPattern: (channel: number, pattern: number) => void,
    setCurrentNote: (id: number) => void,
    setNote: (channel: number, patternId: number, noteIndex: number, note: NoteConfig) => void,
    toggleChannelMuted: (channelId: number) => void,
    toggleChannelSolo: (channelId: number) => void,
    toggleChannelCollapsed: (channelId: number) => void,
    addChannelPattern: (channelId: number, patternId: number) => void,
    removeChannelPattern: (channelId: number, index: number) => void,
    setPatternSize: (channelId: number, patternId: number, size: number) => void,
}

export interface PatternConfig {
    id: number,
    channel: number,
    size: number,
    notes: (NoteConfig | undefined)[]
}

export interface ChannelConfig {
    name: string,
    patterns: number[],
    muted: boolean,
    solo: boolean,
    collapsed: boolean
}

export interface NoteConfig {
    note: number | undefined,
    volumeL: number | undefined,
    volumeR: number | undefined,
    effects: string[],
}

export const Notes = [
    'B9', 'A#9', 'A9', 'G#9', 'G9', 'F#9', 'F9', 'E9', 'D#9', 'D9', 'C#9', 'C9',
    'B8', 'A#8', 'A8', 'G#8', 'G8', 'F#8', 'F8', 'E8', 'D#8', 'D8', 'C#8', 'C8',
    'B7', 'A#7', 'A7', 'G#7', 'G7', 'F#7', 'F7', 'E7', 'D#7', 'D7', 'C#7', 'C7',
    'B6', 'A#6', 'A6', 'G#6', 'G6', 'F#6', 'F6', 'E6', 'D#6', 'D6', 'C#6', 'C6',
    'B5', 'A#5', 'A5', 'G#5', 'G5', 'F#5', 'F5', 'E5', 'D#5', 'D5', 'C#5', 'C5',
    'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4',
    'B3', 'A#3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3', 'C3',
    'B2', 'A#2', 'A2', 'G#2', 'G2', 'F#2', 'F2', 'E2', 'D#2', 'D2', 'C#2', 'C2',
    'B1', 'A#1', 'A1', 'G#1', 'G1', 'F#1', 'F1', 'E1', 'D#1', 'D1', 'C#1', 'C1',
    'B0', 'A#0', 'A0', 'G#0', 'G0', 'F#0', 'F0', 'E0', 'D#0', 'D0', 'C#0', 'C0',
];

export const LOWEST_NOTE = 92; // D#2;
export const HIGHEST_NOTE = 21; // D8;

export const MAX_SPEED = 300;
export const MIN_SPEED = 60;

export const PATTERN_HEIGHT_FACTOR = 0.5;
export const PATTERN_NOTE_WIDTH = 2;

export const VOLUME_STEPS = 16;

export const MUSIC_EDITOR_STATE_TEMPLATE = {
    name: 'New',
    channels: [...Array(6)].map((c, index) => ({
        name: '',
        patterns: index === 0 ? [1] : [],
        muted: false,
        solo: false,
        collapsed: false,
    })),
    patterns: [{
        id: 1,
        channel: 1,
        size: 32,
        notes: [],
    }],
    currentChannel: 1,
    currentPattern: 1,
    currentNote: -1,
    playing: false,
    recording: false,
    speed: 120,
    volume: 100,
    bar: 4,
};
