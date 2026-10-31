import { DataSection } from '../../Common/CommonTypes';
import { nanoid } from '../../Common/Utils';
import {
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuChannelEnvelopeData,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction
} from '../Emulator/VsuTypes';
import { snapTempo } from '../Other/tempo';
import { DEFAULT_STEREO_LEVELS, getVolumeAndPanningFromStereoLevels } from '../Other/volume';
import {
    EventsMap,
    InstrumentConfig,
    MASTER_VOLUME_DEFAULT,
    NOTES_LABELS,
    NOTES_PER_OCTAVE,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SoundGroup,
    SUB_NOTE_RESOLUTION,
    TEMPO_DEFAULT,
    TIMER_RESOLUTION_DEFAULT,
    TRACK_PRIORITY_DEFAULT
} from '../SoundEditorTypes';

// Helpers for the importers of formats which, unlike the editor, have no notion of the VSU's channels and patterns per channel

export const IMPORTED_PATTERN_SIZE = 64;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const VSU_LEVEL_MAX = 15;

export const DEFAULT_IMPORT_ENVELOPE: VsuChannelEnvelopeData = {
    direction: VsuEnvelopeDirection.Decay,
    enabled: false,
    initialValue: VSU_LEVEL_MAX,
    repeat: false,
    stepTime: VSU_ENVELOPE_STEP_TIME_MIN,
};

export const createSoundData = (name: string, author: string = '', comment: string = ''): SoundData => ({
    name,
    author,
    comment,
    tracks: [],
    patterns: {},
    instruments: {},
    size: 0,
    tempo: TEMPO_DEFAULT,
    timerResolution: TIMER_RESOLUTION_DEFAULT,
    timeSignature: {
        0: '4/4'
    },
    loop: false,
    loopPoint: 0,
    volume: MASTER_VOLUME_DEFAULT,
    events: {},
    section: DataSection.ROM,
    group: SoundGroup.None,
});

export const createInstrument = (
    name: string,
    type: SoundEditorTrackType,
    waveform: number[],
    color: number,
    envelope: VsuChannelEnvelopeData = DEFAULT_IMPORT_ENVELOPE,
    tap: number = 0
): InstrumentConfig => ({
    name,
    type,
    color,
    waveform: [...waveform],
    envelope: { ...envelope },
    interval: {
        enabled: false,
        value: VSU_INTERVAL_MIN,
    },
    modulationData: new Array(32).fill(0),
    sweepMod: {
        direction: VsuSweepDirection.Down,
        enabled: false,
        frequency: VSU_SWEEP_MODULATION_FREQUENCY_MIN,
        function: VsuSweepModulationFunction.Sweep,
        interval: VSU_SWEEP_MODULATION_INTERVAL_MIN,
        repeat: false,
        shift: VSU_SWEEP_MODULATION_SHIFT_MIN,
    },
    tap,
    ...getVolumeAndPanningFromStereoLevels(DEFAULT_STEREO_LEVELS, envelope),
});

const getLabelOfMidiNote = (note: number): string => `${NOTE_NAMES[note % NOTES_PER_OCTAVE]}${Math.floor(note / NOTES_PER_OCTAVE) - 1}`;
const getMidiNoteOfLabel = (label: string): number => {
    const octave = parseInt(label.replace(/^[A-G]#?/, ''));
    return NOTE_NAMES.indexOf(label.replace(/-?\d+$/, '')) + (octave + 1) * NOTES_PER_OCTAVE;
};
const MIDI_NOTES_IN_RANGE = NOTES_LABELS.map(getMidiNoteOfLabel);
const LOWEST_MIDI_NOTE = Math.min(...MIDI_NOTES_IN_RANGE);
const HIGHEST_MIDI_NOTE = Math.max(...MIDI_NOTES_IN_RANGE);

// the editor's note for a MIDI note number (60 is C4), moved by octaves into the range the VSU can play
export const getNoteLabel = (midiNote: number): string => {
    let note = Math.round(midiNote);
    while (note < LOWEST_MIDI_NOTE) {
        note += NOTES_PER_OCTAVE;
    }
    while (note > HIGHEST_MIDI_NOTE) {
        note -= NOTES_PER_OCTAVE;
    }

    return getLabelOfMidiNote(note);
};

// the editor's note slide from a MIDI note to another, starting at the note getNoteLabel gives for the first, and ending at the
// highest or lowest note at the most
export const getNoteSlide = (fromMidiNote: number, toMidiNote: number): number => {
    const from = getMidiNoteOfLabel(getNoteLabel(fromMidiNote));
    return Math.max(LOWEST_MIDI_NOTE, Math.min(HIGHEST_MIDI_NOTE, from + Math.round(toMidiNote) - Math.round(fromMidiNote))) - from;
};

// the MIDI note number for a frequency in Hz
export const getMidiNoteFromFrequency = (frequency: number): number => 69 + NOTES_PER_OCTAVE * Math.log2(frequency / 440);

// the editor's volume for a share of the maximum, as one of the VSU's 16 levels
export const getVolume = (share: number): number => getVolumeAndPanningFromStereoLevels(
    {
        left: Math.round(Math.max(0, Math.min(1, share)) * VSU_LEVEL_MAX),
        right: Math.round(Math.max(0, Math.min(1, share)) * VSU_LEVEL_MAX),
    },
    DEFAULT_IMPORT_ENVELOPE
).volume;

// the editor's tempo, ms per 1/16 note, as close as the timer resolution allows
export const getTempo = (msPerSixteenth: number, soundData: SoundData): number =>
    snapTempo(msPerSixteenth, soundData.timerResolution);

// a tempo change at the start of the given column, unless the tempo stays the same
export const setTempoAtColumn = (soundData: SoundData, column: number, tempo: number, previousTempo: number | undefined): void => {
    if (column === 0) {
        soundData.tempo = tempo;
        return;
    }
    if (tempo === previousTempo) {
        return;
    }
    const step = column * SUB_NOTE_RESOLUTION;
    soundData.events[step] = {
        ...soundData.events[step],
        [SoundEvent.Tempo]: tempo,
    };
};

export const setTimeSignatureAtColumn = (soundData: SoundData, column: number, timeSignature: string): void => {
    if (column === 0) {
        soundData.timeSignature = { 0: timeSignature };
        return;
    }
    const step = column * SUB_NOTE_RESOLUTION;
    soundData.events[step] = {
        ...soundData.events[step],
        [SoundEvent.TimeSignature]: timeSignature,
    };
};

export interface PatternSlot {
    // in columns
    start: number
    size: number
}

// patterns of the same size, one after the other, over the whole song
export const getUniformPatternSlots = (size: number, patternSize: number = IMPORTED_PATTERN_SIZE): PatternSlot[] =>
    Array.from({ length: Math.ceil(size / patternSize) }, (_, i) => ({
        start: i * patternSize,
        size: Math.min(patternSize, size - i * patternSize),
    }));

// adds a track with the given events, by step from the start of the song, cut into patterns at the given slots. Notes end with their
// pattern at the latest, and empty patterns get left out.
export const addTrack = (
    soundData: SoundData,
    events: EventsMap,
    type: SoundEditorTrackType,
    instrumentId: string,
    slots: PatternSlot[],
    name: string
): void => {
    const sequence: Record<number, string> = {};
    const steps = Object.keys(events).map(s => parseInt(s)).sort((a, b) => a - b);
    slots.forEach((slot, slotIndex) => {
        const start = slot.start * SUB_NOTE_RESOLUTION;
        const end = (slot.start + slot.size) * SUB_NOTE_RESOLUTION;
        const patternEvents: EventsMap = {};
        steps.filter(step => step >= start && step < end).forEach(step => {
            const stepEvents = { ...events[step] };
            if (stepEvents[SoundEvent.Duration] !== undefined) {
                stepEvents[SoundEvent.Duration] = Math.max(1, Math.min(stepEvents[SoundEvent.Duration], end - step));
            }
            patternEvents[step - start] = stepEvents;
        });
        if (Object.keys(patternEvents).length === 0) {
            return;
        }

        const patternId = nanoid();
        soundData.patterns[patternId] = {
            name: `${name} ${slotIndex + 1}`,
            size: slot.size,
            type,
            events: patternEvents,
        };
        sequence[slot.start] = patternId;
    });

    if (Object.keys(sequence).length === 0) {
        return;
    }

    soundData.tracks.push({
        type,
        instrument: instrumentId,
        sequence,
        priority: TRACK_PRIORITY_DEFAULT,
        skippable: true,
    });
};

// a single cycle waveform of 32 values in the VSU's range of 0 to 63, from samples between -1 and 1
export const getWaveformFromSamples = (samples: number[]): number[] => {
    if (samples.length === 0) {
        return new Array(32).fill(32);
    }
    const resampled = Array.from({ length: 32 }, (_, i) => {
        // the average of the samples this value stands for
        const from = Math.floor(i * samples.length / 32);
        const to = Math.max(from + 1, Math.floor((i + 1) * samples.length / 32));
        const part = samples.slice(from, to);
        return part.reduce((sum, s) => sum + s, 0) / part.length;
    });
    const min = Math.min(...resampled);
    const max = Math.max(...resampled);
    const range = max - min || 1;

    return resampled.map(s => Math.round((s - min) / range * 63));
};

export const newInstrumentId = (): string => nanoid();

// notes that the importers split up where slides start and end, at the given steps, get joined with the part before them again if
// they slide less than a semitone
export const mergeNoteContinuations = (events: EventsMap, continuationSteps: number[]): void => {
    const noteSteps = Object.keys(events).map(step => parseInt(step)).filter(step => events[step][SoundEvent.Note] !== undefined).sort((a, b) => a - b);
    continuationSteps.forEach(step => {
        const previousStep = noteSteps[noteSteps.indexOf(step) - 1];
        const previous = events[previousStep];
        const continuation = events[step];
        if (previous === undefined || previous[SoundEvent.NoteSlide] !== undefined || continuation[SoundEvent.NoteSlide] !== undefined ||
            previous[SoundEvent.Note] !== continuation[SoundEvent.Note] || previousStep + previous[SoundEvent.Duration] !== step) {
            return;
        }
        previous[SoundEvent.Duration] += continuation[SoundEvent.Duration];
        delete continuation[SoundEvent.Note];
        delete continuation[SoundEvent.Duration];
        delete continuation[SoundEvent.Instrument];
        if (Object.keys(continuation).length === 0) {
            delete events[step];
        }
        noteSteps.splice(noteSteps.indexOf(step), 1);
    });
};

const VSU_WAVE_CHANNELS = 4;

// as many tracks as the VSU has channels for get selected for importing, those with the most notes first. The first wave track that
// does not fit any more plays on the sweep/modulation channel.
export const getDefaultImportTrackSettings = (soundData: SoundData): { enabled: boolean, type: SoundEditorTrackType }[] => {
    const noteCounts = soundData.tracks.map(track => Object.values(track.sequence).reduce((count, patternId) =>
        count + Object.values(soundData.patterns[patternId]?.events ?? {}).filter(e => e[SoundEvent.Note] !== undefined).length, 0));
    const byNoteCount = soundData.tracks.map((_, i) => i).sort((a, b) => noteCounts[b] - noteCounts[a]);
    const result = soundData.tracks.map(track => ({ enabled: false, type: track.type }));
    const fits = (type: SoundEditorTrackType) => result.filter(r => r.enabled && r.type === type).length < (type === SoundEditorTrackType.WAVE ? VSU_WAVE_CHANNELS : 1);

    // tracks of a fixed type first, then wave tracks move to the sweep/modulation channel if it is free
    byNoteCount.forEach(i => {
        if (fits(result[i].type)) {
            result[i].enabled = true;
        }
    });
    byNoteCount.forEach(i => {
        if (!result[i].enabled && result[i].type === SoundEditorTrackType.WAVE && fits(SoundEditorTrackType.SWEEPMOD)) {
            result[i] = { enabled: true, type: SoundEditorTrackType.SWEEPMOD };
        }
    });

    return result;
};
