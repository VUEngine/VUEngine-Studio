import { VsuEnvelopeDirection } from '../../Emulator/VsuTypes';
import { EventsMap, SoundData, SoundEditorTrackType, SoundEvent, SUB_NOTE_RESOLUTION } from '../../SoundEditorTypes';
import { DEFAULT_WAVEFORM } from '../../Waveforms/WaveFormPresets';
import {
    addTrack,
    createInstrument,
    createSoundData,
    DEFAULT_IMPORT_ENVELOPE,
    getMidiNoteFromFrequency,
    getNoteLabel,
    getNoteSlide,
    getTempo,
    getVolume,
    getWaveformFromSamples,
    mergeNoteContinuations,
    newInstrumentId,
    PatternSlot,
    setTempoAtColumn
} from '../importHelpers';
import { S3M_NOTE_CUT, S3M_ORDER_END, S3M_ORDER_SKIP, S3M_ROWS_PER_PATTERN, S3mCell, S3mInstrument, S3mSong } from './s3mParser';

// Each channel of a module becomes a track, each row a 1/16 note. The VSU plays waveforms of 32 values instead of samples, so each
// sample's waveform and pitch get taken from a single cycle of it. Samples without a pitch, like drums, become noise. Volume slides
// become volume events, pitch slides and portamentos note slides, for which notes get split where slides start and end.

const COMMAND_SET_SPEED = 1; // A
const COMMAND_JUMP_TO_ORDER = 2; // B
const COMMAND_BREAK_PATTERN = 3; // C
const COMMAND_VOLUME_SLIDE = 4; // D
const COMMAND_PORTAMENTO_DOWN = 5; // E
const COMMAND_PORTAMENTO_UP = 6; // F
const COMMAND_PORTAMENTO = 7; // G
const COMMAND_VIBRATO_VOLUME_SLIDE = 11; // K
const COMMAND_PORTAMENTO_VOLUME_SLIDE = 12; // L
const COMMAND_SPECIAL = 19; // S
const COMMAND_SET_TEMPO = 20; // T
const SPECIAL_NOTE_CUT = 0xC;
const SPECIAL_NOTE_DELAY = 0xD;
const S3M_VOLUME_MAX = 64;
// a note's octave 4 plays a sample at its C4 speed
const S3M_C4 = 48;
const MIDI_C4 = 60;
// samples correlate with themselves at least this much a cycle later to have a pitch
const PITCH_CORRELATION_MIN = 0.7;
const ANALYSIS_WINDOW = 2048;
const PITCH_FREQUENCY_MIN = 30;
const PITCH_FREQUENCY_MAX = 4000;
// the period of C-0 at a C4 speed of 8363 Hz
const PERIOD_C0 = 27392;
const PERIOD_MIN = 1;

interface Segment {
    pattern: number
    startRow: number
    // exclusive
    endRow: number
    startColumn: number
}

interface PlayingNote {
    step: number
    // the note, as octave * 12 + semitone, which slides might have moved off the semitones
    startValue: number
    c2spd: number
    transpose: number
    // per row of the slide
    ticks: number
    sliding: boolean
    pitched: boolean
}

interface SampleAnalysis {
    pitched: boolean
    // silent samples stop notes
    silent: boolean
    waveform: number[]
    // semitones from C4 at which the sample sounds when played at its C4 speed
    transpose: number
}

// the orders as they play, following jumps and pattern breaks, until the song ends or jumps back to where it has been
const getSegments = (song: S3mSong): { segments: Segment[], loopColumn: number | undefined } => {
    const segments: Segment[] = [];
    const visited: Record<string, number> = {};
    let order = 0;
    let startRow = 0;
    let column = 0;
    while (order < song.orders.length && song.orders[order] !== S3M_ORDER_END) {
        const pattern = song.orders[order];
        if (pattern === S3M_ORDER_SKIP || song.patterns[pattern] === undefined) {
            order++;
            startRow = 0;
            continue;
        }
        const key = `${order}:${startRow}`;
        if (visited[key] !== undefined) {
            return { segments, loopColumn: visited[key] };
        }
        visited[key] = column;

        let endRow = S3M_ROWS_PER_PATTERN;
        let nextOrder = order + 1;
        let nextRow = 0;
        for (let row = startRow; row < S3M_ROWS_PER_PATTERN && endRow === S3M_ROWS_PER_PATTERN; row++) {
            song.patterns[pattern][row].forEach(cell => {
                if (cell?.command === COMMAND_BREAK_PATTERN) {
                    endRow = row + 1;
                    nextRow = Math.min(S3M_ROWS_PER_PATTERN - 1, (cell.info! >> 4) * 10 + (cell.info! & 15));
                }
            });
            song.patterns[pattern][row].forEach(cell => {
                if (cell?.command === COMMAND_JUMP_TO_ORDER) {
                    endRow = row + 1;
                    nextOrder = cell.info!;
                }
            });
        }

        segments.push({ pattern, startRow, endRow, startColumn: column });
        column += endRow - startRow;
        order = nextOrder;
        startRow = nextRow;
    }

    return { segments, loopColumn: undefined };
};

const forEachRow = (song: S3mSong, segments: Segment[], callback: (cells: S3mCell[], column: number) => void): void => {
    segments.forEach(segment => {
        for (let row = segment.startRow; row < segment.endRow; row++) {
            callback(song.patterns[segment.pattern][row], segment.startColumn + row - segment.startRow);
        }
    });
};

// periods are how many units of time a sample's value lasts for, like on the Amiga, which slides change linearly
const getPeriod = (note: number, c2spd: number): number => PERIOD_C0 * 8363 / c2spd / Math.pow(2, note / 12);
const getNoteValue = (period: number, c2spd: number): number => 12 * Math.log2(PERIOD_C0 * 8363 / c2spd / period);

// how much a volume slide changes the volume on a tick, where Dx0 slides up and D0y down on all but the first tick, and DxF
// slides up and DFy down on the first tick only
const getVolumeSlide = (info: number, tick: number): number => {
    const up = info >> 4;
    const down = info & 15;
    if (down === 15 && up > 0) {
        return tick === 0 ? up : 0;
    } else if (up === 15 && down > 0) {
        return tick === 0 ? -down : 0;
    } else if (tick === 0) {
        return 0;
    }
    return down > 0 ? -down : up;
};

// a cycle of the sample, found by where it repeats itself best, gives its waveform and pitch
const analyzeSample = (instrument: S3mInstrument): SampleAnalysis => {
    const unpitched: SampleAnalysis = { pitched: false, silent: false, waveform: DEFAULT_WAVEFORM, transpose: 0 };
    const samples = instrument.samples;
    const c2spd = instrument.c2spd || 8363;

    if (!samples.some(s => Math.abs(s) > 0.01)) {
        return { ...unpitched, silent: true };
    }
    // drums can have a pitch, but are noise nonetheless
    if (isDrum(instrument.name)) {
        return unpitched;
    }

    // short loops are single cycles
    if (instrument.looped && instrument.loopEnd > instrument.loopStart && instrument.loopEnd - instrument.loopStart <= 1024) {
        const cycle = samples.slice(instrument.loopStart, instrument.loopEnd);
        return {
            pitched: true,
            silent: false,
            waveform: getWaveformFromSamples(cycle),
            transpose: Math.round(getMidiNoteFromFrequency(c2spd / cycle.length)) - MIDI_C4,
        };
    }

    const minLag = Math.max(2, Math.floor(c2spd / PITCH_FREQUENCY_MAX));
    const maxLag = Math.ceil(c2spd / PITCH_FREQUENCY_MIN);
    if (samples.length < ANALYSIS_WINDOW + maxLag) {
        return unpitched;
    }
    // past the attack, where a sound has settled
    const start = Math.min(Math.floor(samples.length * 0.1), samples.length - ANALYSIS_WINDOW - maxLag);
    const window = samples.slice(start, start + ANALYSIS_WINDOW + maxLag);

    const energy = (offset: number) => {
        let sum = 0;
        for (let i = offset; i < offset + ANALYSIS_WINDOW; i++) {
            sum += window[i] * window[i];
        }
        return sum;
    };
    const ownEnergy = energy(0);
    if (ownEnergy < 1e-6) {
        return unpitched;
    }
    const correlations: number[] = [];
    for (let lag = minLag; lag <= maxLag; lag++) {
        let sum = 0;
        for (let i = 0; i < ANALYSIS_WINDOW; i++) {
            sum += window[i] * window[i + lag];
        }
        correlations[lag] = sum / Math.sqrt(ownEnergy * energy(lag) || 1);
    }
    const best = Math.max(...correlations.filter(c => c !== undefined));
    if (best < PITCH_CORRELATION_MIN) {
        return unpitched;
    }
    // the shortest lag that repeats nearly as well as the best one, as multiples of a cycle repeat as well
    let period = minLag;
    while (period < maxLag && !(correlations[period] >= best * 0.8 &&
        correlations[period] >= (correlations[period - 1] ?? 0) && correlations[period] >= (correlations[period + 1] ?? 0))) {
        period++;
    }

    // starting where the cycle crosses zero upwards
    let from = 0;
    while (from < period && !(window[from] <= 0 && window[from + 1] > 0)) {
        from++;
    }
    from = from < period ? from : 0;

    return {
        pitched: true,
        silent: false,
        waveform: getWaveformFromSamples(window.slice(from, from + period)),
        transpose: Math.round(getMidiNoteFromFrequency(c2spd / period)) - MIDI_C4,
    };
};

// the noise frequency, as a note, that drums get, by their names
const DRUM_NOTES: [RegExp, string][] = [
    [/kick|\bbd\b|bass ?drum/, 'C3'],
    [/snare|\bsn\b|clap/, 'A5'],
    [/hh|hat/, 'C8'],
    [/cymbal|crash|ride/, 'F7'],
    [/tom/, 'C4'],
];
const isDrum = (name: string): boolean => DRUM_NOTES.some(([pattern]) => pattern.test(name.toLowerCase()));
const getDrumNote = (name: string, note: number): string =>
    DRUM_NOTES.find(([pattern]) => pattern.test(name.toLowerCase()))?.[1] ?? getNoteLabel(note + MIDI_C4 - S3M_C4);

const DRUM_ENVELOPE = {
    ...DEFAULT_IMPORT_ENVELOPE,
    enabled: true,
    direction: VsuEnvelopeDirection.Decay,
    stepTime: 1,
};

export const convertS3mSong = (song: S3mSong): SoundData => {
    const soundData = createSoundData(song.title);
    const { segments, loopColumn } = getSegments(song);
    const lastSegment = segments[segments.length - 1];
    soundData.size = Math.max(1, lastSegment ? lastSegment.startColumn + lastSegment.endRow - lastSegment.startRow : 1);
    soundData.loop = true;
    soundData.loopPoint = loopColumn ?? 0;
    const slots: PatternSlot[] = segments.map(s => ({ start: s.startColumn, size: s.endRow - s.startRow }));

    // ticks per row and the tempo, which sets how long a tick takes, as they change from row to row
    let speed = song.initialSpeed;
    let tempoBpm = song.initialTempo;
    let previousTempo: number | undefined;
    const speedAtColumn: number[] = [];
    forEachRow(song, segments, (cells, column) => {
        cells.forEach(cell => {
            if (cell?.command === COMMAND_SET_SPEED && cell.info) {
                speed = cell.info;
            } else if (cell?.command === COMMAND_SET_TEMPO && cell.info! >= 0x20) {
                tempoBpm = cell.info!;
            }
        });
        const tempo = getTempo(speed * 2500 / tempoBpm, soundData);
        setTempoAtColumn(soundData, column, tempo, previousTempo);
        previousTempo = tempo;
        speedAtColumn[column] = speed;
    });

    // an instrument per sample that gets played
    const analyses: SampleAnalysis[] = song.instruments.map(analyzeSample);
    const instrumentIds: Record<number, string> = {};
    const getInstrumentId = (instrument: number): string => {
        if (instrumentIds[instrument] === undefined) {
            const s3mInstrument = song.instruments[instrument - 1];
            const analysis = analyses[instrument - 1];
            const id = newInstrumentId();
            soundData.instruments[id] = analysis?.pitched
                ? createInstrument(s3mInstrument.name, SoundEditorTrackType.WAVE, analysis.waveform, (instrument * 8 + 1) % 64)
                : createInstrument(s3mInstrument?.name ?? `${instrument}`, SoundEditorTrackType.NOISE, DEFAULT_WAVEFORM, 11, DRUM_ENVELOPE);
            instrumentIds[instrument] = id;
        }
        return instrumentIds[instrument];
    };

    song.channels.forEach(channel => {
        const events: EventsMap = {};
        let instrument = 0;
        let defaultInstrument: number | undefined;
        let previousVolume: number | undefined;
        let previousInstrument: number | undefined;
        let pitchedNotes = 0;
        let unpitchedNotes = 0;
        // the note that plays, which gets split up where slides start and end
        let note: PlayingNote | undefined;
        // 0-64
        let channelVolume = S3M_VOLUME_MAX;
        let period = 0;
        let portamentoTarget: number | undefined;
        // the values that commands with an info of 0 reuse
        let volumeSlideMemory = 0;
        let pitchSlideMemory = 0;
        let portamentoMemory = 0;
        // where notes got split up
        const continuationSteps: number[] = [];

        const endNote = (step: number) => {
            if (note === undefined) {
                return;
            }
            if (events[note.step]?.[SoundEvent.Duration] === undefined) {
                events[note.step][SoundEvent.Duration] = Math.max(1, step - note.step);
            }
            if (note.sliding) {
                const offset = MIDI_C4 - S3M_C4 + note.transpose;
                const slide = getNoteSlide(note.startValue + offset, getNoteValue(period, note.c2spd) + offset);
                if (slide !== 0) {
                    events[note.step][SoundEvent.NoteSlide] = slide;
                    events[note.step][SoundEvent.NoteSlideSteps] = note.ticks;
                }
            }
            note = undefined;
        };
        const startNote = (step: number, value: number, c2spd: number, transpose: number, ticks: number) => {
            events[step] = { ...events[step], [SoundEvent.Note]: getNoteLabel(Math.round(value) + MIDI_C4 - S3M_C4 + transpose) };
            if (instrument !== defaultInstrument) {
                events[step][SoundEvent.Instrument] = getInstrumentId(instrument);
            }
            note = { step, startValue: value, c2spd, transpose, ticks, sliding: false, pitched: true };
        };

        forEachRow(song, segments, (cells, column) => {
            const cell: S3mCell = cells[channel] ?? {};
            const ticks = speedAtColumn[column] || 1;
            const rowStep = column * SUB_NOTE_RESOLUTION;
            const getTickStep = (tick: number) => rowStep + Math.round(tick * SUB_NOTE_RESOLUTION / ticks);
            const special = cell.command === COMMAND_SPECIAL ? cell.info! >> 4 : undefined;
            let step = rowStep;
            if (special === SPECIAL_NOTE_DELAY) {
                step = Math.min(rowStep + SUB_NOTE_RESOLUTION - 1, getTickStep(cell.info! & 15));
            }
            if (cell.instrument !== undefined) {
                instrument = cell.instrument;
                if (song.instruments[instrument - 1]) {
                    channelVolume = song.instruments[instrument - 1].volume;
                }
            }
            if (cell.volume !== undefined) {
                channelVolume = Math.min(S3M_VOLUME_MAX, cell.volume);
            }

            const isPortamento = cell.command === COMMAND_PORTAMENTO || cell.command === COMMAND_PORTAMENTO_VOLUME_SLIDE;
            let noteStarted = false;
            if (cell.note === S3M_NOTE_CUT || cell.note !== undefined && analyses[instrument - 1]?.silent) {
                endNote(step);
            } else if (cell.note !== undefined && isPortamento && note?.pitched) {
                // slides to the note instead of playing it
                portamentoTarget = getPeriod(cell.note, note.c2spd);
            } else if (cell.note !== undefined && instrument > 0 && song.instruments[instrument - 1]) {
                endNote(step);
                const analysis = analyses[instrument - 1];
                defaultInstrument = defaultInstrument ?? instrument;
                noteStarted = true;
                portamentoTarget = undefined;
                if (analysis.pitched) {
                    pitchedNotes++;
                    const c2spd = song.instruments[instrument - 1].c2spd || 8363;
                    period = getPeriod(cell.note, c2spd);
                    startNote(step, cell.note, c2spd, analysis.transpose, ticks);
                } else {
                    unpitchedNotes++;
                    events[step] = { ...events[step], [SoundEvent.Note]: getDrumNote(song.instruments[instrument - 1].name, cell.note) };
                    if (instrument !== defaultInstrument) {
                        events[step][SoundEvent.Instrument] = getInstrumentId(instrument);
                    }
                    note = { step, startValue: cell.note, c2spd: 8363, transpose: 0, ticks, sliding: false, pitched: false };
                }
            }

            // the period on each tick of the row
            const periods: number[] = [];
            let tickPeriod = period;
            for (let tick = 0; tick < ticks; tick++) {
                if (cell.command === COMMAND_PORTAMENTO_DOWN || cell.command === COMMAND_PORTAMENTO_UP) {
                    pitchSlideMemory = cell.info || pitchSlideMemory;
                    const direction = cell.command === COMMAND_PORTAMENTO_DOWN ? 1 : -1;
                    if (pitchSlideMemory >= 0xF0) {
                        tickPeriod += tick === 0 ? direction * (pitchSlideMemory & 15) * 4 : 0;
                    } else if (pitchSlideMemory >= 0xE0) {
                        tickPeriod += tick === 0 ? direction * (pitchSlideMemory & 15) : 0;
                    } else if (tick > 0) {
                        tickPeriod += direction * pitchSlideMemory * 4;
                    }
                } else if (isPortamento && tick > 0 && portamentoTarget !== undefined) {
                    portamentoMemory = (cell.command === COMMAND_PORTAMENTO ? cell.info : 0) || portamentoMemory;
                    tickPeriod = tickPeriod < portamentoTarget
                        ? Math.min(portamentoTarget, tickPeriod + portamentoMemory * 4)
                        : Math.max(portamentoTarget, tickPeriod - portamentoMemory * 4);
                }
                tickPeriod = Math.max(PERIOD_MIN, tickPeriod);
                periods.push(tickPeriod);
            }

            // notes get split where they start or stop sliding, as a slide lasts as long as its note
            const playing = note as PlayingNote | undefined;
            if (playing?.pitched) {
                const sliding = periods.some(p => p !== period);
                if (noteStarted) {
                    playing.sliding = sliding;
                } else if (sliding !== playing.sliding) {
                    endNote(rowStep);
                    startNote(rowStep, getNoteValue(period, playing.c2spd), playing.c2spd, playing.transpose, ticks);
                    continuationSteps.push(rowStep);
                    note!.sliding = sliding;
                }
                note!.ticks = sliding ? ticks : note!.ticks;
                period = periods[periods.length - 1];
            }

            // the volume on each tick of the row
            const volumeSlide = cell.command === COMMAND_VOLUME_SLIDE || cell.command === COMMAND_VIBRATO_VOLUME_SLIDE
                || cell.command === COMMAND_PORTAMENTO_VOLUME_SLIDE;
            if (volumeSlide) {
                volumeSlideMemory = cell.info || volumeSlideMemory;
            }
            for (let tick = 0; tick < ticks; tick++) {
                if (volumeSlide) {
                    channelVolume = Math.max(0, Math.min(S3M_VOLUME_MAX, channelVolume + getVolumeSlide(volumeSlideMemory, tick)));
                }
                const volume = getVolume(channelVolume / S3M_VOLUME_MAX);
                if (noteStarted && tick === 0) {
                    // a volume lasts until the instrument changes
                    if (volume !== previousVolume || instrument !== previousInstrument) {
                        events[step][SoundEvent.Volume] = volume;
                    }
                    previousVolume = volume;
                    previousInstrument = instrument;
                } else if (note !== undefined && volume !== previousVolume) {
                    const tickStep = Math.max(note.step, getTickStep(tick));
                    events[tickStep] = { ...events[tickStep], [SoundEvent.Volume]: volume };
                    previousVolume = volume;
                }
            }

            if (special === SPECIAL_NOTE_CUT && noteStarted) {
                endNote(Math.max(step + 1, getTickStep(cell.info! & 15)));
            }
        });
        // notes end with their pattern at the latest
        endNote(soundData.size * SUB_NOTE_RESOLUTION);
        mergeNoteContinuations(events, continuationSteps);

        if (defaultInstrument === undefined) {
            return;
        }
        addTrack(
            soundData,
            events,
            unpitchedNotes > pitchedNotes ? SoundEditorTrackType.NOISE : SoundEditorTrackType.WAVE,
            getInstrumentId(defaultInstrument),
            slots,
            `Channel ${channel + 1}`
        );
    });

    return soundData;
};
