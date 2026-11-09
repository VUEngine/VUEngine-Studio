import { DataSection } from '../../../Common/CommonTypes';
import { clamp, nanoid } from '../../../Common/Utils';
import {
    VSU_ENVELOPE_STEP_TIME_MAX,
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_INTERVAL_MAX,
    VSU_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MAX,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuChannelEnvelopeData,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction,
    VSU_NOISE_TAP,
    WaveformData
} from '../../Emulator/VsuTypes';
import { snapTempo } from '../../Other/tempo';
import { DEFAULT_STEREO_LEVELS, getVolumeAndPanningFromStereoLevels } from '../../Other/volume';
import {
    EventsMap,
    InstrumentConfig,
    INSTRUMENT_PANNING_MAX,
    InstrumentMap,
    MASTER_VOLUME_DEFAULT,
    MASTER_VOLUME_EVENT_MAX,
    NOTES_LABELS,
    NOTES_LABELS_REVERSED,
    NOTES_SPECTRUM,
    PatternConfig,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SoundEventMap,
    SoundGroup,
    SUB_NOTE_RESOLUTION,
    TEMPO_DEFAULT,
    TIMER_RESOLUTION_DEFAULT,
    TRACK_PRIORITY_DEFAULT,
    TrackConfig
} from '../../SoundEditorTypes';
import { DutyInstrument, NoiseInstrument, PatternCell, Song, WaveInstrument } from './ugeHelper';
import { EffectCommandType } from './ugeTypes';

const GB_NOTE_OFFSET = 12 - 12; // adjust for frequency ranges (+12) and transpose down an octave (-12)
const CONVERTED_PATTERN_SIZE = 64;

const WAVE_CHANNEL_VOLUME_LOOKUP = [0, 15, 7, 3];
const WAVE_TRACK_INDEX = 2;
const NOISE_TRACK_INDEX = 3;
const GB_VOLUME_MAX = 15;
const GB_MASTER_VOLUME_STEPS = 8;
// hUGETracker ticks on every frame (59.73 Hz), but GB Studio, which most songs are made for, ticks at 64 Hz,
// and so does the timer interrupt, which counts at 4096 Hz, when a song enables it
const GB_TICK_RATE = 64;
const GB_TIMER_RATE = 4096;
const GB_TIMER_COUNTER_MAX = 256;
const GB_PERIOD_MAX = 2047;
// all channels on both sides
const GB_PANNING_REGISTER_DEFAULT = 0xFF;
// the periods of the notes, as in hUGEDriver's note table
const GB_NOTE_PERIODS = [
    44, 156, 262, 363, 457, 547, 631, 710, 786, 854, 923, 986, 1046, 1102, 1155, 1205, 1253, 1297, 1339, 1379, 1417, 1452, 1486, 1517,
    1546, 1575, 1602, 1627, 1650, 1673, 1694, 1714, 1732, 1750, 1767, 1783, 1798, 1812, 1825, 1837, 1849, 1860, 1871, 1881, 1890, 1899, 1907, 1915,
    1923, 1930, 1936, 1943, 1949, 1954, 1959, 1964, 1969, 1974, 1978, 1982, 1985, 1988, 1992, 1995, 1998, 2001, 2004, 2006, 2009, 2011, 2013, 2015,
];

const DUTY_WAVEFORMS: WaveformData[] = [
    [0, 0, 0, 0, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63], // Pulse (12.5%)
    [0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63], // Pulse (25%)
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63], // Pulse (50%)
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 63, 63, 63, 63], // Pulse (75%)
];

const DUTY_COLORS = [1, 16, 31, 46, 2, 17, 32, 47, 3, 18, 33, 48, 4, 19, 34, 49];
const WAVE_COLORS = [6, 21, 36, 51, 7, 22, 37, 52, 8, 23, 38, 53, 9, 24, 39, 54];
const NOISE_COLORS = [11, 26, 41, 56, 12, 27, 42, 57, 13, 28, 43, 58, 14, 29, 44, 59];

interface ConvertedInstrument {
    id: string
    instrumentConfig: InstrumentConfig
}

interface ConvertedPattern {
    id: string
    patternConfig: PatternConfig
}

// a part of a pattern as it gets played, which jumps and pattern breaks can cut short
interface PlaybackSegment {
    patternIndex: number
    startRow: number
    endRow: number
    startColumn: number
}

export const convertUgeSong = (song: Song): SoundData => {
    const result: SoundData = {
        name: song.name,
        author: song.artist,
        comment: song.comment,
        tracks: [],
        patterns: {},
        instruments: {},
        size: 0,
        tempo: TEMPO_DEFAULT,
        timerResolution: TIMER_RESOLUTION_DEFAULT,
        timeSignature: {
            0: '4/4'
        },
        loop: true,
        loopPoint: 0,
        volume: MASTER_VOLUME_DEFAULT,
        events: {},
        section: DataSection.ROM,
        group: SoundGroup.None,
    };

    const dutyInstrumentsLookup = convertDutyInstruments(song.duty_instruments);
    const waveInstrumentsLookup = convertWaveInstruments(song.wave_instruments, song.waves);
    const noiseInstrumentsLookup = convertNoiseInstruments(song.noise_instruments);

    const instrumentsLookup: ConvertedInstrument[][] = [
        dutyInstrumentsLookup,
        dutyInstrumentsLookup,
        waveInstrumentsLookup,
        noiseInstrumentsLookup,
    ];
    const playback = getPlaybackSegments(song);
    applyTempoEffects(song, playback.segments, result);
    result.loopPoint = playback.loopColumn;
    result.size = playback.size;

    const patternsLookup = convertPatterns(song.patterns, instrumentsLookup, getTicksPerRowAtPatternStarts(song, playback.segments));
    const segmentPatterns = getSegmentPatterns(playback.segments, patternsLookup);

    // add patterns to song
    segmentPatterns.forEach(convertedPatterns => {
        convertedPatterns.forEach(p => {
            result.patterns[p.id] = p.patternConfig;
        });
    });

    // add instruments to song
    Object.values(instrumentsLookup).forEach(convertedInstruments => {
        convertedInstruments.forEach(i => {
            result.instruments[i.id] = i.instrumentConfig;
        });
    });

    const tracks: TrackConfig[] = [
        // Duty 1
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: '',
            sequence: {},
            type: SoundEditorTrackType.SWEEPMOD
        },
        // Duty 2
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: '',
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        // Wave
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: '',
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        // Noise
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: '',
            sequence: {},
            type: SoundEditorTrackType.NOISE
        }];
    playback.segments.forEach((segment, segmentIndex) => {
        [...Array(tracks.length)].map((h, trackIndex) => {
            const foundPattern = segmentPatterns[segmentIndex][trackIndex];
            if (Object.keys(foundPattern.patternConfig.events).length > 0) {
                // add pattern to sequence
                tracks[trackIndex].sequence[segment.startColumn] = foundPattern.id;
            }
        });
    });

    // find and set default instruments
    tracks.forEach((t, trackIndex) => {
        if (Object.keys(t.sequence).length > 0) {
            // ... to either the first defined instrument for the track type
            let defaultInstrument: ConvertedInstrument = instrumentsLookup[trackIndex][0];
            // ... or to the instrument set on the very first note for the track
            const firstSequencePatternId = Object.values(t.sequence)[0];
            if (firstSequencePatternId !== undefined) {
                const firstSequencePattern = result.patterns[firstSequencePatternId];
                const firstSequencePatternFirstEvent = Object.values(firstSequencePattern.events)[0];
                if (firstSequencePatternFirstEvent !== undefined && firstSequencePatternFirstEvent[SoundEvent.Instrument] !== undefined) {
                    const initialInstrumentId = firstSequencePatternFirstEvent[SoundEvent.Instrument];
                    const initialInstrument = instrumentsLookup[trackIndex].filter(i => i.id === initialInstrumentId)[0];
                    if (initialInstrument !== undefined) {
                        defaultInstrument = initialInstrument;
                    }
                }
            }

            // set default instrument
            t.instrument = defaultInstrument.id;
        }
    });

    applyMasterVolumeEffects(song, playback.segments, result);
    setImplicitInstruments(song, playback.segments, segmentPatterns, tracks, instrumentsLookup);
    applyVolumeEffects(song, playback.segments, segmentPatterns, tracks, instrumentsLookup, result.instruments);
    applyPanningEffects(song, playback.segments, segmentPatterns, tracks, result.instruments);

    // remove explicit default instrument assignments from notes
    tracks.forEach(t => {
        Object.keys(t.sequence).forEach(step => {
            const stepInt = parseInt(step);
            const patternId = t.sequence[stepInt];
            Object.keys(result.patterns[patternId].events).forEach(eventStep => {
                const eventStepInt = parseInt(eventStep);
                const event = result.patterns[patternId].events[eventStepInt];
                if (event[SoundEvent.Instrument] !== undefined) {
                    if (event[SoundEvent.Instrument] === t.instrument) {
                        delete event[SoundEvent.Instrument];
                    }
                }
            });
        });
    });

    // add non-empty tracks to song
    tracks.forEach(t => {
        if (Object.keys(t.sequence).length > 0) {
            // add track to song
            result.tracks.push(t);
        }
    });

    return result;
};

const convertWaveform = (wave: Uint8Array): number[] => {
    const result: number[] = [];

    Object.values(wave).forEach(i => {
        result.push(
            i > 0
                ? ((i + 1) * 4) - 1
                : 0
        );
    });

    return result;
};

const convertDutyInstruments = (instruments: DutyInstrument[]): ConvertedInstrument[] => {
    const result: ConvertedInstrument[] = [];

    instruments.forEach((i, index) => {
        // TODO: subpattern support
        const envelope: VsuChannelEnvelopeData = {
            direction: i.volume_sweep_change > 0
                ? VsuEnvelopeDirection.Grow
                : VsuEnvelopeDirection.Decay,
            enabled: i.volume_sweep_change !== 0,
            initialValue: i.initial_volume,
            repeat: false,
            stepTime: clamp(
                Math.ceil((i.volume_sweep_change > 0 ? i.volume_sweep_change : i.volume_sweep_change + 8) / 2) - 1,
                VSU_ENVELOPE_STEP_TIME_MIN,
                VSU_ENVELOPE_STEP_TIME_MAX
            )
        };
        result.push({
            id: nanoid(),
            instrumentConfig: {
                color: DUTY_COLORS[index],
                envelope,
                interval: {
                    enabled: i.length !== null,
                    value: i.length !== null
                        ? clamp(
                            i.length,
                            VSU_INTERVAL_MIN,
                            VSU_INTERVAL_MAX
                        )
                        : 0
                },
                modulationData: [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ],
                name: i.name,
                sweepMod: {
                    direction: i.frequency_sweep_shift > 0
                        ? VsuSweepDirection.Up
                        : VsuSweepDirection.Down,
                    enabled: i.frequency_sweep_shift !== 0,
                    frequency: 1, // ≈ 7.68 ms (130.2 Hz)
                    function: VsuSweepModulationFunction.Sweep,
                    interval: i.frequency_sweep_time,
                    repeat: false,
                    shift: clamp(
                        Math.abs(i.frequency_sweep_shift) - 1,
                        VSU_SWEEP_MODULATION_SHIFT_MIN,
                        VSU_SWEEP_MODULATION_SHIFT_MAX
                    )
                },
                tap: 0,
                type: index === 0
                    ? SoundEditorTrackType.SWEEPMOD
                    : SoundEditorTrackType.WAVE,
                ...getVolumeAndPanningFromStereoLevels(DEFAULT_STEREO_LEVELS, envelope),
                waveform: DUTY_WAVEFORMS[i.duty_cycle],
            },
        });
    });

    return result;
};

const convertWaveInstruments = (instruments: WaveInstrument[], waves: Uint8Array[]): ConvertedInstrument[] => {
    const result: ConvertedInstrument[] = [];

    instruments.forEach((i, index) => {
        // TODO: subpattern support
        const volume = WAVE_CHANNEL_VOLUME_LOOKUP[i.volume];
        const envelope: VsuChannelEnvelopeData = {
            direction: VsuEnvelopeDirection.Decay,
            enabled: false,
            initialValue: volume,
            repeat: false,
            stepTime: VSU_ENVELOPE_STEP_TIME_MIN
        };
        result.push({
            id: nanoid(),
            instrumentConfig: {
                color: WAVE_COLORS[index],
                envelope,
                interval: {
                    enabled: i.length !== null,
                    value: i.length !== null
                        ? clamp(
                            i.length,
                            VSU_INTERVAL_MIN,
                            VSU_INTERVAL_MAX
                        )
                        : 0
                },
                modulationData: [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ],
                name: i.name,
                sweepMod: {
                    direction: VsuSweepDirection.Down,
                    enabled: false,
                    frequency: VSU_SWEEP_MODULATION_FREQUENCY_MIN,
                    function: VsuSweepModulationFunction.Sweep,
                    interval: VSU_SWEEP_MODULATION_INTERVAL_MIN,
                    repeat: false,
                    shift: VSU_SWEEP_MODULATION_SHIFT_MIN
                },
                tap: 0,
                type: SoundEditorTrackType.WAVE,
                ...getVolumeAndPanningFromStereoLevels(DEFAULT_STEREO_LEVELS, envelope),
                waveform: convertWaveform(waves[(i as WaveInstrument).wave_index]),
            },
        });
    });

    return result;
};

const convertNoiseInstruments = (instruments: NoiseInstrument[]): ConvertedInstrument[] => {
    const result: ConvertedInstrument[] = [];

    instruments.forEach((i, index) => {
        // TODO: subpattern support
        const envelope: VsuChannelEnvelopeData = {
            direction: (i.volume_sweep_change) > 0
                ? VsuEnvelopeDirection.Grow
                : VsuEnvelopeDirection.Decay,
            enabled: (i.volume_sweep_change) !== 0,
            initialValue: Math.round(i.initial_volume * 0.9),
            repeat: false,
            stepTime: clamp(
                Math.ceil((i.volume_sweep_change > 0 ? i.volume_sweep_change : i.volume_sweep_change + 8) / 2) - 1,
                VSU_ENVELOPE_STEP_TIME_MIN,
                VSU_ENVELOPE_STEP_TIME_MAX
            )
        };
        result.push({
            id: nanoid(),
            instrumentConfig: {
                color: NOISE_COLORS[index],
                envelope,
                interval: {
                    enabled: i.length !== null,
                    value: i.length !== null
                        ? clamp(
                            i.length,
                            VSU_INTERVAL_MIN,
                            VSU_INTERVAL_MAX
                        )
                        : 0
                },
                modulationData: [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ],
                name: i.name,
                sweepMod: {
                    direction: VsuSweepDirection.Down,
                    enabled: false,
                    frequency: VSU_SWEEP_MODULATION_FREQUENCY_MIN,
                    function: VsuSweepModulationFunction.Sweep,
                    interval: VSU_SWEEP_MODULATION_INTERVAL_MIN,
                    repeat: false,
                    shift: VSU_SWEEP_MODULATION_SHIFT_MIN
                },
                tap: getNoiseTap(i.bit_count),
                type: SoundEditorTrackType.NOISE,
                ...getVolumeAndPanningFromStereoLevels(DEFAULT_STEREO_LEVELS, envelope),
                waveform: [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ],
            },
        });
    });

    return result;
};

const convertPatterns = (
    patterns: PatternCell[][][],
    instrumentsLookup: ConvertedInstrument[][],
    ticksPerRowAtPatternStarts: number[]
): ConvertedPattern[][] => {
    const result: ConvertedPattern[][] = [];
    patterns.forEach((pattern, index) => {
        const displayIndex = index + 1;
        const newPattern: ConvertedPattern[] = [{
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `Duty1-${displayIndex}`,
                size: CONVERTED_PATTERN_SIZE,
                type: SoundEditorTrackType.SWEEPMOD,
            }
        }, {
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `Duty2-${displayIndex}`,
                size: CONVERTED_PATTERN_SIZE,
                type: SoundEditorTrackType.WAVE,
            }
        }, {
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `Wave-${displayIndex}`,
                size: CONVERTED_PATTERN_SIZE,
                type: SoundEditorTrackType.WAVE,
            }
        }, {
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `Noise-${displayIndex}`,
                size: CONVERTED_PATTERN_SIZE,
                type: SoundEditorTrackType.NOISE,
            }
        }];

        pattern.forEach((tick, tickIndex) => {
            tick.forEach((channelTick, trackIndex) => {
                const adjustedTickIndex = tickIndex * SUB_NOTE_RESOLUTION;
                const event: SoundEventMap = {};

                if (channelTick.note !== null) {
                    // on the game boy, the wave channel sounds an octave lower than the others, since its period spans the
                    // 32 samples of a waveform instead of the 8 steps of a duty cycle. It is kept in the octave of the others
                    // nevertheless, since the VSU can not play the lowest notes, and an octave lower sounds too low on it.
                    event[SoundEvent.Note] = NOTES_LABELS_REVERSED[clamp(channelTick.note + GB_NOTE_OFFSET, 0, NOTES_SPECTRUM - 1)];

                    let length = 1;
                    while (pattern[tickIndex + length] && pattern[tickIndex + length][trackIndex].note === null) {
                        length++;
                    }
                    event[SoundEvent.Duration] = length * SUB_NOTE_RESOLUTION;
                }

                if (channelTick.instrument !== null) {
                    event[SoundEvent.Instrument] = instrumentsLookup[trackIndex][channelTick.instrument].id;
                }

                if (channelTick.effectcode !== null && channelTick.effectparam !== null) {
                    // TODO: add support for the missing effects below
                    switch (channelTick.effectcode) {
                        case EffectCommandType.Arpeggio: break;
                        case EffectCommandType.TonePortamento: break;
                        case EffectCommandType.Vibrato: break;
                        case EffectCommandType.CallRoutine: break;
                        case EffectCommandType.NoteDelay: break;
                        case EffectCommandType.SetDutyCycle: break;
                        case EffectCommandType.SetSpeed: break;
                    }
                }

                if (Object.keys(event).length > 0) {
                    newPattern[trackIndex].patternConfig.events[adjustedTickIndex] = event;
                }
            });
        });

        newPattern.forEach((convertedPattern, trackIndex) =>
            applyNoteCutsAndSlides(pattern, trackIndex, convertedPattern.patternConfig.events, ticksPerRowAtPatternStarts[index])
        );

        result.push(newPattern);
    });

    return result;
};

// removes the note at the given step, keeping other events there
const removeNote = (events: EventsMap, step: number): void => {
    const event = events[step];
    if (!event) {
        return;
    }
    delete event[SoundEvent.Note];
    delete event[SoundEvent.Duration];
    delete event[SoundEvent.NoteSlide];
    delete event[SoundEvent.NoteSlideSteps];
    delete event[SoundEvent.Instrument];
    if (Object.keys(event).length === 0) {
        delete events[step];
    }
};

// the note slide in semitones that comes closest to changing the given note's period by the given amount
const getNoteSlide = (gbNote: number, periodChange: number, noteLabel: string): number => {
    const period = GB_NOTE_PERIODS[clamp(gbNote, 0, GB_NOTE_PERIODS.length - 1)];
    const targetPeriod = clamp(period + periodChange, 0, GB_PERIOD_MAX);
    // the frequency is proportional to 1 / (2048 - period)
    const semitones = Math.round(12 * Math.log2((GB_PERIOD_MAX + 1 - period) / (GB_PERIOD_MAX + 1 - targetPeriod)));
    // the target note must exist, notes are sorted from highest to lowest
    const noteIndex = NOTES_LABELS.indexOf(noteLabel);

    return clamp(semitones, noteIndex - (NOTES_SPECTRUM - 1), noteIndex);
};

// Note cuts (Exx) end the playing note on tick xx of their row, like setting the volume to 0 (C00) does on the first one.
// Portamentos (1xx, 2xx) change the playing note's period by xx on every but the first tick of their row, which becomes a
// note slide over the whole note, which changes the pitch once per tick, too. Both only work within the pattern.
const applyNoteCutsAndSlides = (pattern: PatternCell[][], trackIndex: number, events: EventsMap, ticksPerRowAtStart: number): void => {
    let ticksPerRow = ticksPerRowAtStart;
    let noteRow = -1;
    let noteTicksPerRow = ticksPerRow;
    let periodChange = 0;

    const applySlide = () => {
        const event = events[noteRow * SUB_NOTE_RESOLUTION];
        if (noteRow > -1 && periodChange !== 0 && event?.[SoundEvent.Note] !== undefined) {
            const noteSlide = getNoteSlide(pattern[noteRow][trackIndex].note!, periodChange, event[SoundEvent.Note]);
            if (noteSlide !== 0) {
                event[SoundEvent.NoteSlide] = noteSlide;
                event[SoundEvent.NoteSlideSteps] = noteTicksPerRow;
            }
        }
        periodChange = 0;
    };

    pattern.forEach((row, rowIndex) => {
        ticksPerRow = getTicksPerRow(row, ticksPerRow);
        const cell = row[trackIndex];
        if (cell.note !== null) {
            applySlide();
            noteRow = rowIndex;
            noteTicksPerRow = ticksPerRow;
        }

        const noteStep = noteRow * SUB_NOTE_RESOLUTION;
        const noteEvent = events[noteStep];
        const rowStep = rowIndex * SUB_NOTE_RESOLUTION;
        if (noteRow === -1 || noteEvent?.[SoundEvent.Duration] === undefined || noteStep + noteEvent[SoundEvent.Duration] <= rowStep) {
            return;
        }

        let cutTick: number | undefined;
        if (cell.effectcode === EffectCommandType.NoteCut && cell.effectparam !== null && cell.effectparam < ticksPerRow) {
            cutTick = cell.effectparam;
        } else if (cell.effectcode === EffectCommandType.SetVolume && cell.effectparam !== null && (cell.effectparam & 0x0F) === 0) {
            cutTick = 0;
        } else if (
            (cell.effectcode === EffectCommandType.PortamentoUp || cell.effectcode === EffectCommandType.PortamentoDown) &&
            cell.effectparam !== null && trackIndex !== NOISE_TRACK_INDEX
        ) {
            periodChange += (cell.effectcode === EffectCommandType.PortamentoUp ? 1 : -1) * cell.effectparam * (ticksPerRow - 1);
        }

        if (cutTick !== undefined) {
            const duration = rowStep + Math.round(cutTick * SUB_NOTE_RESOLUTION / ticksPerRow) - noteStep;
            if (duration > 0) {
                noteEvent[SoundEvent.Duration] = duration;
            } else {
                removeNote(events, noteStep);
                noteRow = -1;
                periodChange = 0;
            }
        }
    });
    applySlide();
};

// Set master volume (5xy) writes the game boy's master volume register, which scales all channels by (x + 1) / 8 on the
// left and (y + 1) / 8 on the right on the row's first tick. It becomes a global master volume event, without the
// panning, which master volume events do not have, so the louder side counts.
const applyMasterVolumeEffects = (song: Song, segments: PlaybackSegment[], soundData: SoundData): void => {
    let masterVolume = MASTER_VOLUME_EVENT_MAX;
    segments.forEach(segment => {
        forEachSegmentRow(song, segment, (tick, step, column) => {
            // channels get processed in order, so the last one wins
            tick.forEach(cell => {
                if (cell.effectcode !== EffectCommandType.SetMasterVolume || cell.effectparam === null) {
                    return;
                }
                const level = Math.max((cell.effectparam >> 4) & 0x07, cell.effectparam & 0x07);
                const value = Math.round((level + 1) * MASTER_VOLUME_EVENT_MAX / GB_MASTER_VOLUME_STEPS);
                if (value !== masterVolume) {
                    const globalStep = column * SUB_NOTE_RESOLUTION;
                    soundData.events[globalStep] = {
                        ...soundData.events[globalStep],
                        [SoundEvent.MasterVolume]: value,
                    };
                    masterVolume = value;
                }
            });
        });
    });
};

// In hUGETracker, notes without an instrument play the last one set, while in the SoundEditor, they play the track's default
// instrument. So these notes explicitly get the instrument they play with, if it is not the default one anyway.
// Patterns used more than once keep the instruments of their first occurence.
const setImplicitInstruments = (
    song: Song,
    segments: PlaybackSegment[],
    segmentPatterns: ConvertedPattern[][],
    tracks: TrackConfig[],
    instrumentsLookup: ConvertedInstrument[][],
): void => {
    tracks.forEach((track, trackIndex) => {
        if (track.instrument === '') {
            return;
        }

        let instrumentId = track.instrument;
        const visitedPatternIds = new Set<string>();

        segments.forEach((segment, segmentIndex) => {
            const convertedPattern = segmentPatterns[segmentIndex][trackIndex];
            const isInSequence = track.sequence[segment.startColumn] === convertedPattern.id;
            const isFirstOccurence = !visitedPatternIds.has(convertedPattern.id);
            visitedPatternIds.add(convertedPattern.id);
            const events = convertedPattern.patternConfig.events;

            forEachSegmentRow(song, segment, (tick, step) => {
                const cell = tick[trackIndex];
                if (cell.instrument !== null) {
                    instrumentId = instrumentsLookup[trackIndex][cell.instrument]?.id ?? instrumentId;
                } else if (
                    cell.note !== null && isInSequence && isFirstOccurence && instrumentId !== track.instrument &&
                    events[step]?.[SoundEvent.Note] !== undefined
                ) {
                    events[step] = {
                        ...events[step],
                        [SoundEvent.Instrument]: instrumentId,
                    };
                }
            });
        });
    });
};

// Follows the order list like hUGEDriver does: position jumps (Bxx) continue with order xx, or the next one for B00, and
// pattern breaks (Dxx) with row xx - 1 of the next order, D00 doing nothing. After the last order, the first one follows.
// As soon as playback reaches a place it already played, the song loops there.
const getPlaybackSegments = (song: Song): { segments: PlaybackSegment[], loopColumn: number, size: number } => {
    const segments: PlaybackSegment[] = [];
    const visited: Record<string, number> = {};
    let position = 0;
    let startRow = 0;
    let column = 0;

    while (song.sequence.length > 0) {
        const key = `${position}-${startRow}`;
        if (visited[key] !== undefined) {
            return { segments, loopColumn: visited[key], size: column };
        }
        visited[key] = column;

        const patternIndex = song.sequence[position];
        let endRow = CONVERTED_PATTERN_SIZE - 1;
        let nextPosition = position + 1;
        let nextRow = 0;
        for (let row = startRow; row < CONVERTED_PATTERN_SIZE; row++) {
            let jump: number | undefined;
            let rowBreak: number | undefined;
            song.patterns[patternIndex][row].forEach(cell => {
                if (cell.effectparam === null) {
                    return;
                }
                if (cell.effectcode === EffectCommandType.PositionJump) {
                    jump = cell.effectparam;
                } else if (cell.effectcode === EffectCommandType.PatternBreak && cell.effectparam > 0) {
                    rowBreak = cell.effectparam;
                }
            });
            if (jump !== undefined || rowBreak !== undefined) {
                endRow = row;
                nextPosition = jump ? jump - 1 : position + 1;
                nextRow = rowBreak !== undefined ? clamp(rowBreak - 1, 0, CONVERTED_PATTERN_SIZE - 1) : 0;
                break;
            }
        }

        segments.push({ patternIndex, startRow, endRow, startColumn: column });
        column += endRow - startRow + 1;
        position = nextPosition < song.sequence.length ? nextPosition : 0;
        startRow = nextRow;
    }

    return { segments, loopColumn: 0, size: 0 };
};

// calls the given function for each of the segment's rows, with the step and the column it plays at
const forEachSegmentRow = (
    song: Song,
    segment: PlaybackSegment,
    callback: (row: PatternCell[], step: number, column: number) => void,
): void => {
    for (let rowIndex = segment.startRow; rowIndex <= segment.endRow; rowIndex++) {
        const offset = rowIndex - segment.startRow;
        callback(song.patterns[segment.patternIndex][rowIndex], offset * SUB_NOTE_RESOLUTION, segment.startColumn + offset);
    }
};

// the converted patterns played by each segment, which are copies of just the played rows for segments that are cut short
const getSegmentPatterns = (segments: PlaybackSegment[], patternsLookup: ConvertedPattern[][]): ConvertedPattern[][] => {
    const copies: Record<string, ConvertedPattern[]> = {};

    return segments.map(segment => {
        const size = segment.endRow - segment.startRow + 1;
        if (size === CONVERTED_PATTERN_SIZE) {
            return patternsLookup[segment.patternIndex];
        }

        const key = `${segment.patternIndex}-${segment.startRow}-${segment.endRow}`;
        if (!copies[key]) {
            const startStep = segment.startRow * SUB_NOTE_RESOLUTION;
            copies[key] = patternsLookup[segment.patternIndex].map(convertedPattern => ({
                id: nanoid(),
                patternConfig: {
                    ...convertedPattern.patternConfig,
                    name: `${convertedPattern.patternConfig.name} (${segment.startRow + 1}-${segment.endRow + 1})`,
                    size,
                    events: Object.fromEntries(Object.entries(convertedPattern.patternConfig.events)
                        .map(([step, event]) => [parseInt(step) - startStep, { ...event }] as const)
                        .filter(([step]) => step >= 0 && step < size * SUB_NOTE_RESOLUTION)
                    ),
                },
            }));
        }

        return copies[key];
    });
};

// the panning register (NR51), as set by a set panning effect (8xx) in the given row, which applies to all channels.
// Its upper bits route the channels to the left, its lower bits to the right.
const getPanningRegister = (row: PatternCell[], panningRegister: number): number => {
    let result = panningRegister;
    row.forEach(cell => {
        if (cell.effectcode === EffectCommandType.SetPanning && cell.effectparam !== null) {
            result = cell.effectparam;
        }
    });

    return result;
};

const isChannelAudible = (panningRegister: number, trackIndex: number): boolean =>
    (panningRegister & ((0x10 | 0x01) << trackIndex)) !== 0;

// the editor's panning of a channel which the panning register routes to one or both sides
const getPanningFromRegister = (panningRegister: number, trackIndex: number): number => {
    const left = (panningRegister & (0x10 << trackIndex)) !== 0;
    const right = (panningRegister & (0x01 << trackIndex)) !== 0;

    return left && !right
        ? -INSTRUMENT_PANNING_MAX
        : right && !left
            ? INSTRUMENT_PANNING_MAX
            : 0;
};

// Set panning (8xx) routes the channels to the left and/or right, which lasts until the next set panning effect, while
// in the editor, a panning event lasts until a note's instrument differs from the previous note's one. So it has to be
// followed through the song, adding panning events wherever the panning differs from what the editor would play.
// Patterns used more than once keep the panning events of their first occurence.
const applyPanningEffects = (
    song: Song,
    segments: PlaybackSegment[],
    segmentPatterns: ConvertedPattern[][],
    tracks: TrackConfig[],
    instruments: InstrumentMap,
): void => {
    tracks.forEach((track, trackIndex) => {
        if (track.instrument === '') {
            return;
        }

        let panningRegister = GB_PANNING_REGISTER_DEFAULT;
        let editorInstrumentId = track.instrument;
        let editorPanning: number | undefined;
        const visitedSteps = new Set<string>();

        segments.forEach((segment, segmentIndex) => {
            const convertedPattern = segmentPatterns[segmentIndex][trackIndex];
            const isInSequence = track.sequence[segment.startColumn] === convertedPattern.id;
            const events = convertedPattern.patternConfig.events;

            forEachSegmentRow(song, segment, (row, step) => {
                const previousPanning = getPanningFromRegister(panningRegister, trackIndex);
                panningRegister = getPanningRegister(row, panningRegister);
                const targetPanning = getPanningFromRegister(panningRegister, trackIndex);
                if (!isInSequence) {
                    return;
                }

                const stepKey = `${convertedPattern.id}-${step}`;
                const isFirstVisit = !visitedSteps.has(stepKey);
                visitedSteps.add(stepKey);

                const hasNote = events[step]?.[SoundEvent.Note] !== undefined;
                if (hasNote) {
                    const instrumentId = events[step][SoundEvent.Instrument] ?? track.instrument;
                    if (instrumentId !== editorInstrumentId) {
                        editorInstrumentId = instrumentId;
                        editorPanning = undefined;
                    }
                }

                if (!isFirstVisit) {
                    editorPanning = events[step]?.[SoundEvent.Panning] ?? editorPanning;
                    return;
                }
                if (!hasNote && targetPanning === previousPanning) {
                    return;
                }

                const instrumentPanning = instruments[editorInstrumentId]?.panning ?? 0;
                if (targetPanning !== (editorPanning ?? instrumentPanning)) {
                    events[step] = {
                        ...events[step],
                        [SoundEvent.Panning]: targetPanning,
                    };
                    editorPanning = targetPanning;
                }
            });
        });
    });
};

// the ticks per row, as changed by a set speed effect (Fxx) in the given row, which already applies to its own row,
// as it works on the row's first tick
const getTicksPerRow = (row: PatternCell[], ticksPerRow: number): number => {
    let result = ticksPerRow;
    row.forEach(cell => {
        if (cell.effectcode === EffectCommandType.SetSpeed && cell.effectparam) {
            result = cell.effectparam;
        }
    });

    return result;
};

// the ticks per row at the start of each pattern's first occurence in the sequence
const getTicksPerRowAtPatternStarts = (song: Song, segments: PlaybackSegment[]): number[] => {
    const result: number[] = song.patterns.map(() => song.ticks_per_row);
    const visitedPatterns = new Set<number>();
    let ticksPerRow = song.ticks_per_row;
    segments.forEach(segment => {
        if (!visitedPatterns.has(segment.patternIndex) && segment.startRow === 0) {
            visitedPatterns.add(segment.patternIndex);
            result[segment.patternIndex] = ticksPerRow;
        }
        forEachSegmentRow(song, segment, row => {
            ticksPerRow = getTicksPerRow(row, ticksPerRow);
        });
    });

    return result;
};

// The duration of a row in ms is the editor's tempo. Set speed effects (Fxx) change the number of ticks per row, which
// become tempo events, while the sound's tempo is the one at its start.
const applyTempoEffects = (song: Song, segments: PlaybackSegment[], soundData: SoundData): void => {
    const tickDuration = song.timer_enabled
        ? (GB_TIMER_COUNTER_MAX - song.timer_divider) * 1000 / GB_TIMER_RATE
        : 1000 / GB_TICK_RATE;
    // as close as the timer resolution allows
    const getTempo = (ticks: number) => snapTempo(ticks * tickDuration, soundData.timerResolution);

    let ticksPerRow = song.ticks_per_row;
    soundData.tempo = getTempo(ticksPerRow);
    let tempo: number | undefined;
    segments.forEach(segment => {
        forEachSegmentRow(song, segment, (row, step, column) => {
            ticksPerRow = getTicksPerRow(row, ticksPerRow);
            const rowTempo = getTempo(ticksPerRow);
            if (tempo === undefined) {
                soundData.tempo = rowTempo;
            } else if (rowTempo !== tempo) {
                const globalStep = column * SUB_NOTE_RESOLUTION;
                soundData.events[globalStep] = {
                    ...soundData.events[globalStep],
                    [SoundEvent.Tempo]: rowTempo,
                };
            }
            tempo = rowTempo;
        });
    });
};

// the noise tap with the sequence length closest to the one of the game boy's noise generator in its 15 or 7 bit mode
const getNoiseTap = (bitCount: number): number => {
    const sequenceLength = 2 ** bitCount - 1;
    const getDistance = (tap: number) => Math.abs(Math.log2(VSU_NOISE_TAP[tap][1] / sequenceLength));
    let result = 0;
    VSU_NOISE_TAP.forEach((_, tap) => {
        if (getDistance(tap) < getDistance(result)) {
            result = tap;
        }
    });

    return result;
};

// the editor's volume for the given volume register value (0-15) of the game boy, which is what instruments start with
const getVolumeFromGbVolume = (gbVolume: number, trackIndex: number): number => {
    const initialValue = trackIndex === WAVE_TRACK_INDEX
        // the wave channel's volume is quantized to 100%, 50% and 25%
        ? WAVE_CHANNEL_VOLUME_LOOKUP[gbVolume >= 10 ? 1 : gbVolume >= 5 ? 2 : gbVolume > 0 ? 3 : 0]
        : trackIndex === NOISE_TRACK_INDEX
            ? Math.round(gbVolume * 0.9)
            : gbVolume;

    return getVolumeAndPanningFromStereoLevels(DEFAULT_STEREO_LEVELS, {
        direction: VsuEnvelopeDirection.Decay,
        enabled: false,
        initialValue,
        repeat: false,
        stepTime: VSU_ENVELOPE_STEP_TIME_MIN,
    }).volume;
};

// Set volume (Cxy) and volume slide (Axy) effects change the volume register on the row's first tick, the latter relative
// to its current value, and setting an instrument resets it. In the editor, a volume event lasts until a note's instrument
// differs from the previous note's one, which is the track's default instrument for notes without one. So the effects have
// to be followed through the sequence, adding volume events wherever the volume differs from what the editor would play.
// Patterns used more than once keep the volume events of their first occurence.
const applyVolumeEffects = (
    song: Song,
    segments: PlaybackSegment[],
    segmentPatterns: ConvertedPattern[][],
    tracks: TrackConfig[],
    instrumentsLookup: ConvertedInstrument[][],
    instruments: InstrumentMap,
): void => {
    const gbInstrumentVolumes = [
        song.duty_instruments.map(i => i.initial_volume),
        song.duty_instruments.map(i => i.initial_volume),
        song.wave_instruments.map(i => WAVE_CHANNEL_VOLUME_LOOKUP[i.volume]),
        song.noise_instruments.map(i => i.initial_volume),
    ];
    // instruments with an envelope that grows are audible even when starting at volume 0
    const gbInstrumentGrows = [
        song.duty_instruments.map(i => i.volume_sweep_change > 0),
        song.duty_instruments.map(i => i.volume_sweep_change > 0),
        song.wave_instruments.map(() => false),
        song.noise_instruments.map(i => i.volume_sweep_change > 0),
    ];

    tracks.forEach((track, trackIndex) => {
        if (track.instrument === '') {
            return;
        }

        let gbInstrumentIndex = instrumentsLookup[trackIndex].findIndex(i => i.id === track.instrument);
        let gbVolume = gbInstrumentVolumes[trackIndex][gbInstrumentIndex] ?? GB_VOLUME_MAX;
        // whether an effect changed the volume since the last instrument got set
        let volumeEffectActive = false;
        let editorInstrumentId = track.instrument;
        let editorVolume: number | undefined;
        let panningRegister = GB_PANNING_REGISTER_DEFAULT;
        const visitedSteps = new Set<string>();

        segments.forEach((segment, segmentIndex) => {
            const convertedPattern = segmentPatterns[segmentIndex][trackIndex];
            const isInSequence = track.sequence[segment.startColumn] === convertedPattern.id;
            const events = convertedPattern.patternConfig.events;

            forEachSegmentRow(song, segment, (tick, step) => {
                const cell = tick[trackIndex];
                // a channel which the panning register routes to neither side is silent
                const wasAudible = isChannelAudible(panningRegister, trackIndex);
                panningRegister = getPanningRegister(tick, panningRegister);
                const isAudible = isChannelAudible(panningRegister, trackIndex);

                if (cell.instrument !== null) {
                    gbInstrumentIndex = cell.instrument;
                    gbVolume = gbInstrumentVolumes[trackIndex][cell.instrument] ?? gbVolume;
                    volumeEffectActive = false;
                }
                const hasVolumeEffect = cell.effectparam !== null && (
                    cell.effectcode === EffectCommandType.SetVolume ||
                    // the volume slide works on the envelope registers, which the wave channel does not have
                    cell.effectcode === EffectCommandType.VolumeSlide && trackIndex !== WAVE_TRACK_INDEX
                );
                if (hasVolumeEffect) {
                    gbVolume = cell.effectcode === EffectCommandType.SetVolume
                        ? cell.effectparam! & 0x0F
                        : clamp(gbVolume - (cell.effectparam! & 0x0F) + (cell.effectparam! >> 4), 0, GB_VOLUME_MAX);
                    volumeEffectActive = true;
                }

                if (!isInSequence) {
                    return;
                }

                const stepKey = `${convertedPattern.id}-${step}`;
                const isFirstVisit = !visitedSteps.has(stepKey);
                visitedSteps.add(stepKey);

                // notes that start at volume 0 are silent, like those of instruments which are only used to end notes
                const isSilentNote = cell.note !== null && gbVolume === 0 && !gbInstrumentGrows[trackIndex][gbInstrumentIndex];
                if (isFirstVisit && isSilentNote) {
                    removeNote(events, step);
                }

                if (events[step]?.[SoundEvent.Note] !== undefined) {
                    const instrumentId = events[step][SoundEvent.Instrument] ?? track.instrument;
                    if (instrumentId !== editorInstrumentId) {
                        editorInstrumentId = instrumentId;
                        editorVolume = undefined;
                    }
                }

                if (!isFirstVisit) {
                    editorVolume = events[step]?.[SoundEvent.Volume] ?? editorVolume;
                    return;
                }
                if (isSilentNote || (cell.note === null && cell.instrument === null && !hasVolumeEffect && isAudible === wasAudible)) {
                    return;
                }

                const instrumentVolume = instruments[editorInstrumentId]?.volume;
                const targetVolume = !isAudible
                    ? 0
                    : volumeEffectActive
                        ? getVolumeFromGbVolume(gbVolume, trackIndex)
                        : instrumentVolume;
                if (targetVolume !== undefined && targetVolume !== (editorVolume ?? instrumentVolume)) {
                    events[step] = {
                        ...events[step],
                        [SoundEvent.Volume]: targetVolume,
                    };
                    editorVolume = targetVolume;
                }
            });
        });
    });
};
