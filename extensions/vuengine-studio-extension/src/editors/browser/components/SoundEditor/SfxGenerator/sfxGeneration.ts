import { DEFAULT_IMPORT_ENVELOPE, addTrack, createInstrument, createSoundData, getNoteLabel, getVolume, HIGHEST_MIDI_NOTE, LOWEST_MIDI_NOTE } from '../ImportExport/importHelpers';
import { getTempoSegments, getTimerResolution } from '../Other/tempo';
import {
    EventsMap,
    InstrumentConfig,
    NOTE_SLIDE_STEPS_MAX,
    NOTE_SLIDE_STEPS_MIN,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    WAVEFORM_MAX,
} from '../SoundEditorTypes';
import { WAVEFORM_PRESETS } from '../Waveforms/WaveFormPresets';

// Generates sound effects like sfxr does, from a few parameters, as notes, note slides and volume events. The pitch and volume
// get worked out for each of the player's ticks first, then the pitch gets approximated by as few notes as possible, each of
// which slides in a straight line.

export interface SfxParams {
    // wave or noise
    type: SoundEditorTrackType
    waveform: number[]
    tap: number
    // ms
    attack: number
    sustain: number
    // % by which the volume starts above the sustain level
    punch: number
    // ms
    decay: number
    // MIDI notes
    start: number
    // semitones per second
    slide: number
    // semitones per second, per second
    slideChange: number
    // the sound stops when it falls below this note, it is off at the lowest one
    stopBelow: number
    // semitones
    vibratoDepth: number
    // Hz
    vibratoSpeed: number
    // semitones
    arpeggioJump: number
    // ms
    arpeggioAfter: number
    // ms, the sound starts over this often, it is off at 0
    repeat: number
    // %
    volume: number
}

export type SfxNumericParam = Exclude<keyof SfxParams, 'type' | 'waveform' | 'tap'>;
export type SfxLockableParam = SfxNumericParam | 'waveform';

export interface SfxParamSpec {
    min: number
    max: number
    step: number
}

export const SFX_STOP_BELOW_OFF = LOWEST_MIDI_NOTE - 1;

export const SFX_PARAM_SPECS: Record<SfxNumericParam, SfxParamSpec> = {
    attack: { min: 0, max: 1000, step: 10 },
    sustain: { min: 0, max: 1500, step: 10 },
    punch: { min: 0, max: 100, step: 1 },
    decay: { min: 0, max: 2000, step: 10 },
    start: { min: LOWEST_MIDI_NOTE, max: HIGHEST_MIDI_NOTE, step: 1 },
    slide: { min: -96, max: 96, step: 1 },
    slideChange: { min: -96, max: 96, step: 1 },
    stopBelow: { min: SFX_STOP_BELOW_OFF, max: HIGHEST_MIDI_NOTE, step: 1 },
    // notes can only be a semitone apart
    vibratoDepth: { min: 0, max: 4, step: 1 },
    vibratoSpeed: { min: 0, max: 20, step: 0.5 },
    arpeggioJump: { min: -24, max: 24, step: 1 },
    arpeggioAfter: { min: 0, max: 1000, step: 10 },
    repeat: { min: 0, max: 1000, step: 10 },
    volume: { min: 0, max: 100, step: 1 },
};

const getWaveformPreset = (name: string): number[] =>
    [...(WAVEFORM_PRESETS.find(p => p.name === name) ?? WAVEFORM_PRESETS[0]).values];

export const DEFAULT_SFX_PARAMS: SfxParams = {
    type: SoundEditorTrackType.WAVE,
    waveform: getWaveformPreset('Pulse (50%)'),
    tap: 0,
    attack: 0,
    sustain: 100,
    punch: 0,
    decay: 200,
    start: 84,
    slide: 0,
    slideChange: 0,
    stopBelow: SFX_STOP_BELOW_OFF,
    vibratoDepth: 0,
    vibratoSpeed: 6,
    arpeggioJump: 0,
    arpeggioAfter: 100,
    repeat: 0,
    volume: 100,
};

export enum SfxPreset {
    Pickup = 'pickup',
    Laser = 'laser',
    Explosion = 'explosion',
    PowerUp = 'powerUp',
    Hit = 'hit',
    Jump = 'jump',
    Blip = 'blip',
}

const between = (min: number, max: number): number => min + Math.random() * (max - min);
const pick = <T>(values: T[]): T => values[Math.floor(Math.random() * values.length)];

// Like sfxr's, each preset gives another variant every time, within the ranges that make it sound like what it is called. They
// follow sfxr's, converted to the editor's units: sfxr slides the period exponentially, which is a steady change in semitones.
const SFX_PRESETS: Record<SfxPreset, () => Partial<SfxParams>> = {
    // a short tone that jumps up a fourth or so, and rings out
    [SfxPreset.Pickup]: () => ({
        waveform: getWaveformPreset(pick(['Pulse (50%)', 'Pulse (25%)'])),
        start: between(79, 88),
        sustain: between(20, 60),
        punch: between(30, 60),
        decay: between(200, 450),
        arpeggioJump: pick([4, 5, 7]),
        arpeggioAfter: between(50, 90),
    }),
    // a high tone that falls fast
    [SfxPreset.Laser]: () => ({
        waveform: getWaveformPreset(pick(['Pulse (25%)', 'Pulse (12.5%)', 'Pulse (50%)', 'Saw'])),
        start: between(88, 103),
        slide: between(-140, -60),
        sustain: between(60, 160),
        punch: between(0, 40),
        decay: between(60, 180),
    }),
    // low noise from the longest sequences, which sounds like hiss rather than a tone, that rumbles out slowly
    [SfxPreset.Explosion]: () => ({
        type: SoundEditorTrackType.NOISE,
        tap: pick([0, 0, 1]),
        start: between(44, 60),
        slide: between(-24, 0),
        sustain: between(100, 300),
        punch: between(40, 80),
        decay: between(500, 1100),
    }),
    // a rising trill
    [SfxPreset.PowerUp]: () => ({
        waveform: getWaveformPreset(pick(['Pulse (50%)', 'Pulse (25%)', 'Square'])),
        start: between(55, 67),
        slide: between(20, 40),
        vibratoDepth: pick([2, 3]),
        vibratoSpeed: between(10, 16),
        sustain: between(350, 550),
        decay: between(150, 300),
    }),
    // a short burst that drops steeply
    [SfxPreset.Hit]: () => ({
        type: Math.random() < 0.7 ? SoundEditorTrackType.WAVE : SoundEditorTrackType.NOISE,
        waveform: getWaveformPreset(pick(['Saw', 'Pulse (50%)'])),
        tap: 0,
        start: between(70, 84),
        slide: between(-220, -120),
        sustain: between(0, 30),
        punch: between(30, 60),
        decay: between(80, 180),
    }),
    // a quick sweep up of about an octave
    [SfxPreset.Jump]: () => ({
        waveform: getWaveformPreset(pick(['Pulse (25%)', 'Pulse (50%)'])),
        start: between(62, 72),
        slide: between(40, 70),
        sustain: between(60, 140),
        decay: between(100, 180),
    }),
    // a very short tone
    [SfxPreset.Blip]: () => ({
        waveform: getWaveformPreset(pick(['Pulse (50%)', 'Pulse (25%)', 'Saw'])),
        start: between(72, 88),
        sustain: between(30, 70),
        decay: between(10, 60),
    }),
};

const snap = (value: number, spec: SfxParamSpec): number =>
    Math.max(spec.min, Math.min(spec.max, Math.round(value / spec.step) * spec.step));

export const getSfxPresetParams = (preset: SfxPreset): SfxParams => {
    const params: SfxParams = { ...DEFAULT_SFX_PARAMS, ...SFX_PRESETS[preset]() };
    (Object.keys(SFX_PARAM_SPECS) as SfxNumericParam[]).forEach(param => {
        params[param] = snap(params[param], SFX_PARAM_SPECS[param]);
    });

    return params;
};

// a few random harmonics, sometimes pushed towards their extremes, in the VSU's range of values
export const getRandomWaveform = (): number[] => {
    const harmonics = [...Array(1 + Math.floor(Math.random() * 5))].map(() => ({
        harmonic: 1 + Math.floor(Math.random() * 7),
        amplitude: Math.random(),
        phase: Math.random() * 2 * Math.PI,
    }));
    const squared = Math.random() < 0.3;
    const values = [...Array(32)].map((_, i) => {
        const v = harmonics.reduce((sum, h) => sum + h.amplitude * Math.sin(2 * Math.PI * h.harmonic * i / 32 + h.phase), 0);
        return squared ? Math.sign(v) * Math.sqrt(Math.abs(v)) : v;
    });
    const min = Math.min(...values);
    const range = (Math.max(...values) - min) || 1;

    return values.map(v => Math.round((v - min) / range * WAVEFORM_MAX));
};

// new values for all parameters that are not locked, within the ranges that make for usable sound effects
export const getRandomSfxParams = (params: SfxParams, locks: Partial<Record<SfxLockableParam, boolean>>): SfxParams => {
    const result = { ...params };
    const set = (param: SfxNumericParam, value: number) => {
        if (!locks[param]) {
            result[param] = snap(value, SFX_PARAM_SPECS[param]);
        }
    };
    const random = Math.random;
    result.type = random() < 0.8 ? SoundEditorTrackType.WAVE : SoundEditorTrackType.NOISE;
    result.tap = Math.floor(random() * 8);
    if (!locks.waveform) {
        result.waveform = random() < 0.5
            ? [...WAVEFORM_PRESETS[Math.floor(random() * WAVEFORM_PRESETS.length)].values]
            : getRandomWaveform();
    }
    set('attack', Math.pow(random(), 3) * 400);
    set('sustain', random() * 400);
    set('punch', random() < 0.5 ? random() * 80 : 0);
    set('decay', 50 + random() * 700);
    set('start', LOWEST_MIDI_NOTE + 12 + random() * 60);
    set('slide', (random() - 0.5) * 120);
    set('slideChange', random() < 0.3 ? (random() - 0.5) * 120 : 0);
    set('stopBelow', SFX_STOP_BELOW_OFF);
    set('vibratoDepth', random() < 0.3 ? 1 + random() * 2 : 0);
    set('vibratoSpeed', 2 + random() * 14);
    set('arpeggioJump', random() < 0.4 ? (random() - 0.5) * 24 : 0);
    set('arpeggioAfter', 30 + random() * 300);
    set('repeat', random() < 0.2 ? 60 + random() * 200 : 0);

    return result;
};

// all parameters that are not locked changed a little
export const getMutatedSfxParams = (params: SfxParams, locks: Partial<Record<SfxLockableParam, boolean>>): SfxParams => {
    const result = { ...params };
    (Object.keys(SFX_PARAM_SPECS) as SfxNumericParam[])
        .filter(param => param !== 'volume' && param !== 'stopBelow' && !locks[param])
        .forEach(param => {
            const spec = SFX_PARAM_SPECS[param];
            result[param] = snap(params[param] + (Math.random() - 0.5) * 0.1 * (spec.max - spec.min), spec);
        });
    if (!locks.waveform) {
        result.waveform = params.waveform.map(v => Math.max(0, Math.min(WAVEFORM_MAX, v + Math.round((Math.random() - 0.5) * 10))));
    }

    return result;
};

export interface SfxTick {
    // MIDI note, possibly between semitones
    pitch: number
    // 0 to 15
    level: number
    // whether a new note has to start, as the sound starts over or jumps
    restart: boolean
}

// the pitch and volume level of the sound on each of the player's ticks
export const getSfxTicks = (params: SfxParams, tickMs: number): SfxTick[] => {
    const totalMs = Math.max(tickMs, params.attack + params.sustain + params.decay);
    const result: SfxTick[] = [];
    let stopped = false;
    let previousJumped = false;
    for (let tick = 0; tick < Math.ceil(totalMs / tickMs); tick++) {
        const ms = tick * tickMs;
        const localMs = params.repeat > 0 ? ms % params.repeat : ms;
        const restarted = tick > 0 && params.repeat > 0 && localMs < tickMs;
        if (restarted) {
            stopped = false;
        }
        const seconds = localMs / 1000;
        const jumped = params.arpeggioJump !== 0 && localMs >= params.arpeggioAfter;
        let pitch = params.start + params.slide * seconds + params.slideChange * seconds * seconds / 2;
        if (jumped) {
            pitch += params.arpeggioJump;
        }
        pitch += params.vibratoDepth * Math.sin(2 * Math.PI * params.vibratoSpeed * ms / 1000);
        if (pitch < LOWEST_MIDI_NOTE || pitch > HIGHEST_MIDI_NOTE || params.stopBelow > SFX_STOP_BELOW_OFF && pitch < params.stopBelow) {
            stopped = true;
        }

        let envelope: number;
        if (ms < params.attack) {
            envelope = ms / params.attack;
        } else if (ms < params.attack + params.sustain) {
            envelope = 1 + params.punch / 100 * (1 - (ms - params.attack) / params.sustain);
        } else {
            envelope = Math.max(0, 1 - (ms - params.attack - params.sustain) / Math.max(1, params.decay));
        }
        const level = stopped ? 0 : Math.round(envelope / (1 + params.punch / 100) * params.volume / 100 * 15);

        result.push({
            pitch: Math.max(LOWEST_MIDI_NOTE, Math.min(HIGHEST_MIDI_NOTE, pitch)),
            level,
            restart: restarted || jumped !== previousJumped,
        });
        previousJumped = jumped;
    }

    return result;
};

export const getSfxDurationMs = (params: SfxParams, tickMs: number): number =>
    getSfxTicks(params, tickMs).length * tickMs;

// how many steps per 1/16 note the note slides take, so that the pitch changes on every tick
export const getSfxNoteSlideSteps = (msPerColumn: number, tickMs: number): number =>
    Math.max(NOTE_SLIDE_STEPS_MIN, Math.min(NOTE_SLIDE_STEPS_MAX, Math.round(msPerColumn / tickMs)));

// a straight slide from the first to the last of the ticks is off by less than half a semitone for all ticks between them
const fitsSlide = (ticks: SfxTick[], from: number, to: number): boolean => {
    for (let tick = from + 1; tick < to; tick++) {
        const expected = ticks[from].pitch + (ticks[to].pitch - ticks[from].pitch) * (tick - from) / (to - from);
        if (Math.abs(expected - ticks[tick].pitch) > 0.5) {
            return false;
        }
    }

    return true;
};

// the sound's events, by step from where it starts, with getStep giving the step that plays after the given ms
export const getSfxEvents = (
    params: SfxParams,
    tickMs: number,
    getStep: (ms: number) => number,
    instrumentId: string,
    noteSlideSteps: number,
): EventsMap => {
    const ticks = getSfxTicks(params, tickMs);
    const stepAt = (tick: number) => Math.round(getStep(tick * tickMs));
    const events: EventsMap = {};

    // the ticks the sound can be heard on, in runs that need a new note at their start
    const runs: [number, number][] = [];
    ticks.forEach((tick, i) => {
        const run = runs[runs.length - 1];
        if (tick.level === 0) {
            return;
        }
        if (run && run[1] === i && !tick.restart) {
            run[1] = i + 1;
        } else {
            runs.push([i, i + 1]);
        }
    });

    runs.forEach(([runStart, runEnd]) => {
        let from = runStart;
        while (from < runEnd) {
            let to = from;
            while (to + 1 < runEnd && fitsSlide(ticks, from, to + 1)) {
                to++;
            }
            const step = stepAt(from);
            const note = Math.round(ticks[from].pitch);
            const slide = Math.round(ticks[to].pitch) - note;
            events[step] = {
                ...events[step],
                [SoundEvent.Note]: getNoteLabel(note),
                [SoundEvent.Duration]: Math.max(1, stepAt(to + 1) - step),
                [SoundEvent.Instrument]: instrumentId,
            };
            if (slide !== 0) {
                events[step][SoundEvent.NoteSlide] = slide;
                events[step][SoundEvent.NoteSlideSteps] = noteSlideSteps;
            }
            from = to + 1;
        }
    });

    // a volume lasts until the instrument changes, so the first note gets one in any case
    let previousLevel: number | undefined;
    ticks.forEach((tick, i) => {
        if (tick.level > 0 && tick.level !== previousLevel) {
            const step = stepAt(i);
            events[step] = { ...events[step], [SoundEvent.Volume]: getVolume(tick.level / 15) };
            previousLevel = tick.level;
        }
    });

    return events;
};

export const createSfxInstrument = (params: SfxParams, name: string, color: number): InstrumentConfig =>
    createInstrument(name, params.type, params.waveform, color, DEFAULT_IMPORT_ENVELOPE, params.tap);

export const SFX_PREVIEW_INSTRUMENT_ID = 'sfxPreview';

// a sound of its own that plays the sound effect, with the tempo and timer resolution of the given sound
export const createSfxPreviewSoundData = (soundData: SoundData, params: SfxParams, name: string): SoundData => {
    const preview = createSoundData(name);
    preview.tempo = soundData.tempo;
    preview.timerResolution = soundData.timerResolution;
    const tickMs = getTimerResolution(preview);
    const msPerStep = getTempoSegments(preview)[0].msPerStep;
    const events = getSfxEvents(
        params,
        tickMs,
        ms => ms / msPerStep,
        SFX_PREVIEW_INSTRUMENT_ID,
        getSfxNoteSlideSteps(msPerStep * SUB_NOTE_RESOLUTION, tickMs)
    );
    const end = Math.max(1, ...Object.entries(events).map(([step, e]) => parseInt(step) + (e[SoundEvent.Duration] ?? 0)));
    preview.size = Math.ceil(end / SUB_NOTE_RESOLUTION) + 1;
    preview.instruments = {
        [SFX_PREVIEW_INSTRUMENT_ID]: createSfxInstrument(params, name, 0),
    };
    addTrack(preview, events, params.type, SFX_PREVIEW_INSTRUMENT_ID, [{ start: 0, size: preview.size }], name);

    return preview;
};
