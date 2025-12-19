export interface EditorSettings {
    Octave: number
    RowHighlight: number
    Step: number
}

export enum EffectName {
    Arpeggio = 'Arpeggio',
    Pitch = 'Pitch',
    Volume = 'Volume',
    Waveform = 'Waveform',
}

export interface Effect {
    Name: EffectName
    On: boolean
    Sequence: string
}

export interface Instrument {
    Effect: Effect[]
    ID: number
    Name: string
}

export enum EffectCommandType {
    Arpeggio = '0',
    PitchSlideUp = '1',
    PitchSlideDown = '2',
    Portamento = '3',
    Vibrato = '4',
    Tremolo = '7',
    VolumeSlide = 'A',
    Jump = 'B',
    Halt = 'C',
    Skip = 'D',
    Speed = 'F',
    NoteDelay = 'G',
    PitchOffset = 'P',
    NoteSlideUp = 'Q',
    NoteSlideDown = 'R',
    NoteCut = 'S',
    Waveform = 'V',
    LoadWaveform = 'W',
    Custom = 'X',
}

export type EffectCommand = `${EffectCommandType}${number}`;

export interface PatternRow {
    FX0?: EffectCommand
    FX1?: EffectCommand
    FX2?: EffectCommand
    FX3?: EffectCommand
    ID: number
    Inst?: number
    Note?: number
    VolL?: number
    VolR?: number
}

export interface Pattern {
    Channel: number
    ID: number
    Row: PatternRow[]
}

export interface Frame {
    Data: number[]
    ID: number
}

export interface PatternMap {
    Frame: Frame[]
}

export interface SongSettings {
    Author: string
    Comment: string
    Frames: number
    Rows: number
    Speed: number
    Title: string
}

export interface Waveform {
    Data: number[]
    ID: number
    Name: string
}

export interface VBMusicFile {
    EditorSettings: EditorSettings
    Instrument: Instrument[]
    Pattern: Pattern[]
    PatternMap: PatternMap
    SongSettings: SongSettings
    Version: string
    Waveform: Waveform[]
}
