import {
    MAX_TICK_DURATION,
    MIN_TICK_DURATION,
    NOTE_RESOLUTION,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TEMPO_DEFAULT,
    TIMER_RESOLUTION_DEFAULT,
    TIMER_RESOLUTIONS,
} from '../SoundEditorTypes';

// The timer resolution is the period in ms of the timer interrupts of the stages the sound plays in. The player's ticks
// last that long, and tempos are multiples of it per 1/16 note, so that every note on the grid starts on an interrupt.
// That makes playback steady in stages with that period or a finer one which divides it.
export const getTimerResolution = (soundData: SoundData): number =>
    TIMER_RESOLUTIONS.includes(soundData.timerResolution) ? soundData.timerResolution : TIMER_RESOLUTION_DEFAULT;

// the tempos, i.e. durations of a 1/16 note in ms, the given timer resolution allows, from fastest to slowest
export const getTempoOptions = (timerResolution: number): number[] => {
    const result: number[] = [];
    for (let tempo = Math.ceil(MIN_TICK_DURATION / timerResolution) * timerResolution; tempo <= MAX_TICK_DURATION; tempo += timerResolution) {
        result.push(tempo);
    }

    return result;
};

// the closest tempo the given timer resolution allows
export const snapTempo = (msPerColumn: number, timerResolution: number): number => {
    const options = getTempoOptions(timerResolution);

    return Math.min(
        Math.max(Math.round(msPerColumn / timerResolution) * timerResolution, options[0]),
        options[options.length - 1]
    );
};

// the sound with the given timer resolution, and its tempos snapped to it
export const withTimerResolution = (soundData: SoundData, timerResolution: number): SoundData => ({
    ...soundData,
    timerResolution,
    tempo: snapTempo(soundData.tempo ?? TEMPO_DEFAULT, timerResolution),
    events: Object.fromEntries(Object.entries(soundData.events ?? {}).map(([step, events]) => [
        step,
        events[SoundEvent.Tempo] !== undefined
            ? { ...events, [SoundEvent.Tempo]: snapTempo(events[SoundEvent.Tempo], timerResolution) }
            : events,
    ])),
});

// A part of the sound with the same tempo, from its first sub-step on. The tempo is the duration of a 1/16 note in ms,
// like the sound's tempo, which is the one at its start. Tempo changes apply from the start of the 1/16 note they are
// on, and tempos get snapped to the timer resolution, so that all 1/16 notes start on a tick.
export interface TempoSegment {
    startStep: number
    startMs: number
    msPerStep: number
}

export const getTempoSegments = (soundData: SoundData): TempoSegment[] => {
    const timerResolution = getTimerResolution(soundData);
    const changes: Record<number, number> = {
        0: soundData.tempo ?? TEMPO_DEFAULT,
    };
    Object.entries(soundData.events ?? {}).forEach(([step, events]) => {
        if (events[SoundEvent.Tempo] !== undefined) {
            changes[Math.floor(parseInt(step) / SUB_NOTE_RESOLUTION) * SUB_NOTE_RESOLUTION] = events[SoundEvent.Tempo];
        }
    });

    const result: TempoSegment[] = [];
    Object.keys(changes).map(s => parseInt(s)).sort((a, b) => a - b).forEach(startStep => {
        const previous = result[result.length - 1];
        result.push({
            startStep,
            startMs: previous ? previous.startMs + (startStep - previous.startStep) * previous.msPerStep : 0,
            msPerStep: snapTempo(changes[startStep], timerResolution) / SUB_NOTE_RESOLUTION,
        });
    });

    return result;
};

// the last segment for which the given property does not exceed the given value, found by binary search,
// as songs with a swing can have a tempo change on every step
const findSegment = (segments: TempoSegment[], property: 'startStep' | 'startMs', value: number): TempoSegment => {
    let low = 0;
    let high = segments.length - 1;
    while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (segments[middle][property] <= value) {
            low = middle;
        } else {
            high = middle - 1;
        }
    }

    return segments[low];
};

// the time in ms at which the given sub-step plays
export const getMsAtStep = (segments: TempoSegment[], step: number): number => {
    const segment = findSegment(segments, 'startStep', step);

    return segment.startMs + (step - segment.startStep) * segment.msPerStep;
};

// the sub-step (possibly a fraction) which plays at the given time in ms
export const getStepAtMs = (segments: TempoSegment[], ms: number): number => {
    const segment = findSegment(segments, 'startMs', ms);

    return segment.startStep + (ms - segment.startMs) / segment.msPerStep;
};

// Tempos are stored as the duration of a 1/16 note in ms, but shown as beats per minute, with quarter notes as beats
const COLUMNS_PER_BEAT = NOTE_RESOLUTION / 4;

export const getBpm = (msPerColumn: number): number =>
    60000 / (msPerColumn * COLUMNS_PER_BEAT);

// rounded to one decimal, which is dropped for whole numbers
export const roundBpm = (bpm: number): number =>
    Math.round(bpm * 10) / 10;

export const formatTempo = (msPerColumn: number): string =>
    `${roundBpm(getBpm(msPerColumn))} BPM`;

// the number of the player's ticks, which last as long as the timer resolution, after which the given sub-step plays
export const getTicksAtStep = (segments: TempoSegment[], timerResolution: number, step: number): number =>
    Math.round(getMsAtStep(segments, step) / timerResolution);

// the sub-step (possibly a fraction) which plays after the given number of the player's ticks
export const getStepAtTicks = (segments: TempoSegment[], timerResolution: number, ticks: number): number =>
    getStepAtMs(segments, ticks * timerResolution);
