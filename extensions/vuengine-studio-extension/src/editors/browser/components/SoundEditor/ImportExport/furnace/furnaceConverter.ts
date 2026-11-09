import { VsuChannelEnvelopeData, VsuEnvelopeDirection } from '../../Emulator/VsuTypes';
import { DEFAULT_STEREO_LEVELS, getVolumeAndPanningFromStereoLevels } from '../../Other/volume';
import { EventsMap, SoundData, SoundEditorTrackType, SoundEvent, SoundEventMap, SUB_NOTE_RESOLUTION } from '../../SoundEditorTypes';
import { DEFAULT_WAVEFORM } from '../../Waveforms/WaveFormPresets';
import {
    addTrack,
    createInstrument,
    createSoundData,
    DEFAULT_IMPORT_ENVELOPE,
    getNoteLabel,
    getNoteSlide,
    getTempo,
    getWaveformFromSamples,
    mergeNoteContinuations,
    newInstrumentId,
    PatternSlot,
    setTempoAtColumn
} from '../importHelpers';
import {
    FURNACE_MACRO_RELEASE,
    FURNACE_NOTE_OFF,
    FURNACE_NOTE_RELEASE,
    FurnaceCell,
    FurnaceInstrument,
    FurnaceMacro,
    FurnaceMacroCode,
    FurnaceSong
} from './furnaceParser';

// Furnace's Virtual Boy channels map to the editor's tracks one to one. Instruments get the waveform their wave macro starts with,
// and a decaying volume macro becomes an envelope, while other volume macros and volume slides become volume events. Each row
// becomes a 1/16 note. Pitch slides and portamentos become note slides, for which notes get split where slides start and end.

const TRACK_TYPES = [
    SoundEditorTrackType.WAVE,
    SoundEditorTrackType.WAVE,
    SoundEditorTrackType.WAVE,
    SoundEditorTrackType.WAVE,
    SoundEditorTrackType.SWEEPMOD,
    SoundEditorTrackType.NOISE,
];

const EFFECT_PITCH_SLIDE_UP = 0x01;
const EFFECT_PITCH_SLIDE_DOWN = 0x02;
const EFFECT_PORTAMENTO = 0x03;
const EFFECT_VOLUME_SLIDE = 0x0A;
const EFFECT_JUMP_TO_ORDER = 0x0B;
const EFFECT_BREAK_PATTERN = 0x0D;
const EFFECT_SET_SPEED_1 = 0x09;
const EFFECT_SET_SPEED_2 = 0x0F;
const EFFECT_SET_TICK_RATE = 0xF0;
const EFFECT_PANNING = 0x08;
const EFFECT_PANNING_FULL = 0x80;
const EFFECT_NOTE_CUT = 0xEC;
const EFFECT_NOTE_DELAY = 0xED;
const EFFECT_WAVE = 0x10;
const EFFECT_NOISE_LENGTH = 0x11;
const EFFECT_NOTE_SLIDE_UP = 0xE1;
const EFFECT_NOTE_SLIDE_DOWN = 0xE2;
// semitones per tick of pitch slides and portamentos of 1, in linear pitch mode with the default pitch slide speed, and of note
// slides, which are four times as fast
const PITCH_SLIDE_UNIT = 1 / 32;
const NOTE_SLIDE_UNIT = 4 * PITCH_SLIDE_UNIT;
// levels per tick of volume slides of 1, as Furnace slides the volume in 1/256 levels
const VOLUME_SLIDE_UNIT = 64 / 256;
const PITCH_MIN = 0;
const PITCH_MAX = 127;
// Furnace's notes start at C-5, MIDI's at C-1
const FURNACE_NOTE_OFFSET = 48;
const VSU_LEVEL_MAX = 15;
const VSU_WAVE_MAX = 63;
const VSU_ENVELOPE_STEP_MS = 15.4;
const VSU_ENVELOPE_STEP_TIME_MAX = 7;

interface Segment {
    order: number
    startRow: number
    // exclusive
    endRow: number
    startColumn: number
}

interface PlayingNote {
    step: number
    // in semitones, as a MIDI note
    startPitch: number
    // per row of the slide
    ticks: number
    sliding: boolean
    // how many ticks it has played for
    tick: number
    // notes of instruments with envelopes do not get split, as their envelope would start anew
    splittable: boolean
    // a changing volume macro that no envelope can stand for
    volumeMacro: FurnaceMacro | undefined
    // of the volume column, as a volume macro that stays the same sets the instrument's volume
    levelShare: number
    instrumentId: string
}

// an effect's value, or the default value for effects without one
const getEffect = (cell: FurnaceCell | undefined, code: number, defaultValue?: number): number | undefined => {
    const effect = cell?.effects.find(e => e[0] === code);
    return effect ? effect[1] ?? defaultValue : undefined;
};

// the orders as they play, following jumps and pattern breaks, until the song ends or jumps back to where it has been
const getSegments = (song: FurnaceSong): { segments: Segment[], loopColumn: number | undefined } => {
    const segments: Segment[] = [];
    const visited: Record<string, number> = {};
    let order = 0;
    let startRow = 0;
    let column = 0;
    while (order < song.orders.length) {
        const key = `${order}:${startRow}`;
        if (visited[key] !== undefined) {
            return { segments, loopColumn: visited[key] };
        }
        visited[key] = column;

        let endRow = song.patternLength;
        let nextOrder = order + 1;
        let nextRow = 0;
        for (let row = startRow; row < song.patternLength && endRow === song.patternLength; row++) {
            song.orders[order].forEach((pattern, channel) => {
                const cell = song.patterns[`${channel}:${pattern}`]?.[row];
                const breakRow = getEffect(cell, EFFECT_BREAK_PATTERN);
                const jumpOrder = getEffect(cell, EFFECT_JUMP_TO_ORDER);
                if (breakRow !== undefined) {
                    endRow = row + 1;
                    nextRow = Math.min(song.patternLength - 1, breakRow);
                }
                if (jumpOrder !== undefined) {
                    endRow = row + 1;
                    nextOrder = jumpOrder;
                }
            });
        }

        segments.push({ order, startRow, endRow, startColumn: column });
        column += endRow - startRow;
        order = nextOrder;
        startRow = nextRow;
    }

    return { segments, loopColumn: 0 };
};

const forEachRow = (song: FurnaceSong, segments: Segment[], callback: (cells: (FurnaceCell | undefined)[], column: number) => void): void => {
    segments.forEach(segment => {
        for (let row = segment.startRow; row < segment.endRow; row++) {
            callback(
                song.orders[segment.order].map((pattern, channel) => song.patterns[`${channel}:${pattern}`]?.[row]),
                segment.startColumn + row - segment.startRow
            );
        }
    });
};

const getMacro = (instrument: FurnaceInstrument | undefined, code: FurnaceMacroCode) => instrument?.macros.find(m => m.code === code && m.values.length > 0);

// a macro's value after a number of ticks, where it loops if it has a loop, or else stays at its last value, or its release
// point, which it would go past when the note gets released
const getMacroValue = (macro: FurnaceMacro, tick: number): number => {
    const position = Math.floor(Math.max(0, tick - macro.delay) / macro.speed);
    const end = macro.release < macro.values.length ? macro.release + 1 : macro.values.length;
    if (position < end) {
        return macro.values[position];
    }
    return macro.loop < end
        ? macro.values[macro.loop + (position - end) % (end - macro.loop)]
        : macro.values[end - 1];
};

// a volume macro that falls or rises steadily, as most do for plucked or percussive sounds, as an envelope
const getEnvelope = (instrument: FurnaceInstrument | undefined, ticksPerSecond: number): VsuChannelEnvelopeData => {
    const macro = getMacro(instrument, FurnaceMacroCode.Volume);
    const initialValue = Math.min(VSU_LEVEL_MAX, macro?.values[0] ?? VSU_LEVEL_MAX);
    if (!macro || macro.values.length < 2) {
        return { ...DEFAULT_IMPORT_ENVELOPE, initialValue };
    }
    const values = macro.values;
    const last = values[values.length - 1];
    const falling = values.every((v, i) => i === 0 || v <= values[i - 1]) && last < initialValue;
    const rising = values.every((v, i) => i === 0 || v >= values[i - 1]) && last > initialValue;
    // those that loop over more than their last value, like a tremolo, do not end
    const looping = macro.loop < Math.min(values.length, macro.release + 1) - 1;
    if (!falling && !rising || looping) {
        return { ...DEFAULT_IMPORT_ENVELOPE, initialValue };
    }
    const msPerLevel = values.length * macro.speed * 1000 / ticksPerSecond / Math.abs(last - initialValue);

    return {
        ...DEFAULT_IMPORT_ENVELOPE,
        enabled: true,
        direction: falling ? VsuEnvelopeDirection.Decay : VsuEnvelopeDirection.Grow,
        initialValue,
        stepTime: Math.max(0, Math.min(VSU_ENVELOPE_STEP_TIME_MAX, Math.round(msPerLevel / VSU_ENVELOPE_STEP_MS) - 1)),
    };
};

const getVolumeAndPanning = (left: number, right: number): SoundEventMap => {
    const { volume, panning } = getVolumeAndPanningFromStereoLevels({ left, right }, DEFAULT_IMPORT_ENVELOPE);
    return {
        [SoundEvent.Volume]: volume,
        [SoundEvent.Panning]: panning,
    };
};

export const convertFurnaceSong = (song: FurnaceSong): SoundData => {
    const soundData = createSoundData(song.name, song.author, song.comment);
    const { segments, loopColumn } = getSegments(song);
    const lastSegment = segments[segments.length - 1];
    soundData.size = Math.max(1, lastSegment ? lastSegment.startColumn + lastSegment.endRow - lastSegment.startRow : 1);
    soundData.loop = true;
    soundData.loopPoint = loopColumn ?? 0;
    const slots: PatternSlot[] = segments.map(s => ({ start: s.startColumn, size: s.endRow - s.startRow }));

    // the speed pattern advances with each row, a row lasts as many ticks as its speed says
    let speeds = [...song.speeds];
    let ticksPerSecond = song.ticksPerSecond;
    let speedIndex = 0;
    let previousTempo: number | undefined;
    const ticksPerRow: number[] = [];
    forEachRow(song, segments, (cells, column) => {
        cells.forEach(cell => {
            const speed1 = getEffect(cell, EFFECT_SET_SPEED_1);
            const speed2 = getEffect(cell, EFFECT_SET_SPEED_2);
            const tickRate = getEffect(cell, EFFECT_SET_TICK_RATE);
            if (speed1) {
                speeds = speeds.length > 1 ? [speed1, ...speeds.slice(1)] : [speed1];
            }
            if (speed2) {
                speeds = [speeds[0], speed2];
            }
            if (tickRate) {
                ticksPerSecond = tickRate * 2 / 5;
            }
        });
        const speed = speeds[speedIndex % speeds.length];
        speedIndex++;
        const tickMs = 1000 * song.virtualTempoDenominator / (ticksPerSecond * song.virtualTempoNumerator);
        const tempo = getTempo(speed * (song.timeBase + 1) * tickMs, soundData);
        setTempoAtColumn(soundData, column, tempo, previousTempo);
        previousTempo = tempo;
        ticksPerRow[column] = speed * (song.timeBase + 1);
    });

    // waveforms of any size and height, as the VSU's 32 values of 0 to 63
    const waveforms = song.wavetables.map(w => w.values.length === 32 && w.height === VSU_WAVE_MAX
        ? w.values.map(v => Math.max(0, Math.min(VSU_WAVE_MAX, v)))
        : getWaveformFromSamples(w.values));

    // an instrument for each combination of Furnace instrument, wave and noise length that plays
    const instrumentIds: Record<string, string> = {};
    const getInstrumentId = (instrument: number, type: SoundEditorTrackType, wave: number | undefined, noiseLength: number | undefined): string => {
        const furnaceInstrument = song.instruments[instrument];
        // the wavetable synthesizer, which blends waves, gets its first one
        const waveIndex = wave ?? getMacro(furnaceInstrument, FurnaceMacroCode.Wave)?.values[0] ?? furnaceInstrument?.synthesizerWave ?? 0;
        const tap = Math.max(0, Math.min(7, noiseLength ?? getMacro(furnaceInstrument, FurnaceMacroCode.Duty)?.values[0] ?? 0));
        const key = type === SoundEditorTrackType.NOISE ? `${instrument}:noise:${tap}` : `${instrument}:${waveIndex}`;
        if (instrumentIds[key] === undefined) {
            const envelope = getEnvelope(furnaceInstrument, song.ticksPerSecond);
            const id = newInstrumentId();
            const variant = type === SoundEditorTrackType.NOISE
                ? (tap > 0 ? ` (Tap ${tap})` : '')
                : (wave !== undefined ? ` (Wave ${waveIndex})` : '');
            soundData.instruments[id] = {
                ...createInstrument(
                    `${furnaceInstrument?.name || `Instrument ${instrument}`}${variant}`,
                    type,
                    waveforms[waveIndex] ?? DEFAULT_WAVEFORM,
                    (Object.keys(instrumentIds).length * 8 + 1) % 64,
                    envelope,
                    tap
                ),
                // without an envelope, the volume macro's first value is the volume
                ...getVolumeAndPanningFromStereoLevels(
                    envelope.enabled
                        ? DEFAULT_STEREO_LEVELS
                        : { left: envelope.initialValue, right: envelope.initialValue },
                    envelope.enabled ? envelope : DEFAULT_IMPORT_ENVELOPE
                ),
            };
            instrumentIds[key] = id;
        }
        return instrumentIds[key];
    };

    TRACK_TYPES.forEach((type, channel) => {
        const events: EventsMap = {};
        let instrument: number | undefined;
        let wave: number | undefined;
        let noiseLength: number | undefined;
        let defaultInstrumentId: string | undefined;
        let previousInstrumentId: string | undefined;
        // the note that plays, which gets split up where slides start and end, unless its envelope would restart
        let note: PlayingNote | undefined;
        const continuationSteps: number[] = [];
        // in semitones, as MIDI notes
        let pitch = 0;
        // semitones per tick
        let pitchSlide = 0;
        let portamento: { target: number, speed: number } | undefined;
        // the volume column's value lasts, the editor's volume only until the instrument changes
        let channelLevel: number | undefined;
        // levels per tick
        let volumeSlide = 0;
        let level: number | undefined;

        const endNote = (step: number) => {
            if (note === undefined) {
                return;
            }
            if (events[note.step][SoundEvent.Duration] === undefined) {
                events[note.step][SoundEvent.Duration] = Math.max(1, step - note.step);
            }
            const slide = getNoteSlide(note.startPitch, pitch);
            if (note.sliding && slide !== 0) {
                events[note.step][SoundEvent.NoteSlide] = slide;
                events[note.step][SoundEvent.NoteSlideSteps] = Math.min(SUB_NOTE_RESOLUTION, note.ticks);
            }
            note = undefined;
        };

        forEachRow(song, segments, (cells, column) => {
            const cell = cells[channel];
            const ticks = ticksPerRow[column] || 1;
            const rowStep = column * SUB_NOTE_RESOLUTION;
            const getTickStep = (tick: number) => rowStep + Math.min(SUB_NOTE_RESOLUTION - 1, Math.round(tick * SUB_NOTE_RESOLUTION / ticks));
            const delay = getEffect(cell, EFFECT_NOTE_DELAY);
            const step = delay !== undefined ? getTickStep(delay) : rowStep;
            if (cell?.instrument !== undefined) {
                instrument = cell.instrument;
            }
            wave = getEffect(cell, EFFECT_WAVE) ?? wave;
            noiseLength = getEffect(cell, EFFECT_NOISE_LENGTH) ?? noiseLength;
            if (cell?.volume !== undefined) {
                channelLevel = Math.min(VSU_LEVEL_MAX, cell.volume);
            }

            const stepEvents: SoundEventMap = {};
            const portamentoSpeed = getEffect(cell, EFFECT_PORTAMENTO, 0);
            let noteStarted = false;
            if (cell?.note === FURNACE_NOTE_OFF || cell?.note === FURNACE_NOTE_RELEASE || cell?.note === FURNACE_MACRO_RELEASE) {
                endNote(step);
            } else if (cell?.note !== undefined && portamentoSpeed !== undefined && note !== undefined) {
                // slides to the note instead of playing it
                portamento = portamentoSpeed > 0 ? { target: cell.note - FURNACE_NOTE_OFFSET, speed: portamentoSpeed * PITCH_SLIDE_UNIT } : undefined;
            } else if (cell?.note !== undefined && instrument !== undefined) {
                endNote(step);
                const instrumentId = getInstrumentId(instrument, type, wave, noiseLength);
                defaultInstrumentId = defaultInstrumentId ?? instrumentId;
                pitch = cell.note - FURNACE_NOTE_OFFSET;
                portamento = undefined;
                stepEvents[SoundEvent.Note] = getNoteLabel(pitch);
                if (instrumentId !== defaultInstrumentId) {
                    stepEvents[SoundEvent.Instrument] = instrumentId;
                }
                // the instrument's own volume applies when it changes
                if (instrumentId !== previousInstrumentId) {
                    level = undefined;
                }
                previousInstrumentId = instrumentId;
                const furnaceInstrument = song.instruments[instrument];
                const hasEnvelope = getEnvelope(furnaceInstrument, song.ticksPerSecond).enabled;
                const volumeMacro = getMacro(furnaceInstrument, FurnaceMacroCode.Volume);
                const changingVolume = !hasEnvelope && volumeMacro?.values.some(v => v !== volumeMacro.values[0]);
                note = {
                    step,
                    startPitch: pitch,
                    ticks,
                    sliding: false,
                    tick: 0,
                    splittable: !hasEnvelope,
                    volumeMacro: changingVolume ? volumeMacro : undefined,
                    levelShare: !hasEnvelope && volumeMacro ? Math.min(VSU_LEVEL_MAX, volumeMacro.values[0]) / VSU_LEVEL_MAX : 1,
                    instrumentId,
                };
                noteStarted = true;
            }

            // pitch slides and portamentos last until they get stopped
            const slideUp = getEffect(cell, EFFECT_PITCH_SLIDE_UP, 0);
            const slideDown = getEffect(cell, EFFECT_PITCH_SLIDE_DOWN, 0);
            const noteSlideUp = getEffect(cell, EFFECT_NOTE_SLIDE_UP, 0);
            const noteSlideDown = getEffect(cell, EFFECT_NOTE_SLIDE_DOWN, 0);
            if (slideUp !== undefined || slideDown !== undefined) {
                pitchSlide = slideUp !== undefined ? slideUp * PITCH_SLIDE_UNIT : -slideDown! * PITCH_SLIDE_UNIT;
                portamento = undefined;
            } else if (portamentoSpeed !== undefined && (portamentoSpeed === 0 || noteStarted)) {
                // a portamento without a note to slide to has nothing to do
                portamento = undefined;
                pitchSlide = 0;
            } else if (portamentoSpeed !== undefined) {
                pitchSlide = 0;
                if (portamento !== undefined) {
                    portamento.speed = portamentoSpeed * PITCH_SLIDE_UNIT;
                }
            } else if (noteSlideUp !== undefined || noteSlideDown !== undefined) {
                const value = noteSlideUp ?? noteSlideDown!;
                const direction = noteSlideUp !== undefined ? 1 : -1;
                portamento = (value & 15) > 0 && value >> 4 > 0
                    ? { target: Math.round(pitch) + direction * (value & 15), speed: (value >> 4) * NOTE_SLIDE_UNIT }
                    : undefined;
                pitchSlide = 0;
            }

            const volumeSlideValue = getEffect(cell, EFFECT_VOLUME_SLIDE, 0);
            if (volumeSlideValue !== undefined) {
                volumeSlide = volumeSlideValue >> 4 === 0
                    ? -(volumeSlideValue & 15) * VOLUME_SLIDE_UNIT
                    : (volumeSlideValue & 15) === 0 ? (volumeSlideValue >> 4) * VOLUME_SLIDE_UNIT : 0;
            }

            // the pitch on each tick of the row
            const rowPitch = pitch;
            for (let tick = 0; tick < ticks; tick++) {
                if (portamento !== undefined) {
                    pitch = pitch < portamento.target
                        ? Math.min(portamento.target, pitch + portamento.speed)
                        : Math.max(portamento.target, pitch - portamento.speed);
                    if (pitch === portamento.target) {
                        portamento = undefined;
                    }
                } else {
                    pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch + pitchSlide));
                }
            }
            const sliding = pitch !== rowPitch;
            if (note !== undefined) {
                if (noteStarted || !note.splittable) {
                    note.sliding = note.sliding || sliding;
                    note.ticks = sliding ? ticks : note.ticks;
                } else if (sliding !== note.sliding) {
                    // notes get split where they start or stop sliding, as a slide lasts as long as its note
                    const endPitch = pitch;
                    pitch = rowPitch;
                    const playing: PlayingNote = note;
                    endNote(rowStep);
                    pitch = endPitch;
                    events[rowStep] = { ...events[rowStep], [SoundEvent.Note]: getNoteLabel(Math.round(rowPitch)) };
                    if (playing.instrumentId !== defaultInstrumentId) {
                        events[rowStep][SoundEvent.Instrument] = playing.instrumentId;
                    }
                    note = { ...playing, step: rowStep, startPitch: rowPitch, ticks, sliding };
                    continuationSteps.push(rowStep);
                } else if (sliding) {
                    note.ticks = ticks;
                }
            } else {
                pitchSlide = 0;
            }

            if (Object.keys(stepEvents).length > 0) {
                events[step] = { ...events[step], ...stepEvents };
            }

            // the volume on each tick of the row, of the volume column, its slides and the volume macro
            for (let tick = 0; tick < ticks; tick++) {
                if (channelLevel !== undefined && volumeSlide !== 0) {
                    channelLevel = Math.max(0, Math.min(VSU_LEVEL_MAX, channelLevel + volumeSlide));
                    if (channelLevel === 0 || channelLevel === VSU_LEVEL_MAX) {
                        volumeSlide = 0;
                    }
                }
                if (note === undefined || noteStarted && getTickStep(tick) < step) {
                    continue;
                }
                const macroValue = note.volumeMacro !== undefined ? getMacroValue(note.volumeMacro, note.tick) : undefined;
                note.tick++;
                const tickLevel = macroValue !== undefined
                    ? Math.round(Math.min(VSU_LEVEL_MAX, macroValue) * (channelLevel ?? VSU_LEVEL_MAX) / VSU_LEVEL_MAX)
                    : channelLevel !== undefined ? Math.round(channelLevel * note.levelShare) : undefined;
                if (tickLevel !== undefined && tickLevel !== level) {
                    const tickStep = Math.max(note.step, getTickStep(tick));
                    events[tickStep] = { ...events[tickStep], [SoundEvent.Volume]: getVolumeAndPanning(tickLevel, tickLevel)[SoundEvent.Volume] };
                    level = tickLevel;
                }
            }

            const cut = getEffect(cell, EFFECT_NOTE_CUT);
            if (cut !== undefined && noteStarted) {
                endNote(Math.max(step + 1, getTickStep(cut)));
            }

            const panning = getEffect(cell, EFFECT_PANNING);
            const fullPanning = getEffect(cell, EFFECT_PANNING_FULL);
            if (panning !== undefined || fullPanning !== undefined) {
                const left = panning !== undefined ? panning >> 4 : Math.round(VSU_LEVEL_MAX * Math.min(1, (255 - fullPanning!) / 128));
                const right = panning !== undefined ? panning & 15 : Math.round(VSU_LEVEL_MAX * Math.min(1, fullPanning! / 128));
                events[step] = { ...events[step], [SoundEvent.Panning]: getVolumeAndPanning(left, right)[SoundEvent.Panning] };
            }
        });
        // notes end with their pattern at the latest
        endNote(soundData.size * SUB_NOTE_RESOLUTION);
        mergeNoteContinuations(events, continuationSteps);

        if (defaultInstrumentId === undefined) {
            return;
        }
        addTrack(soundData, events, type, defaultInstrumentId, slots, song.channelNames[channel] || `Channel ${channel + 1}`);
    });

    return soundData;
};
