/* eslint-disable no-null/no-null */
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
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction,
    WaveformData
} from '../../Emulator/VsuTypes';
import {
    InstrumentConfig,
    NOTES,
    NOTES_SPECTRUM,
    PatternConfig,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SoundEventMap,
    SUB_NOTE_RESOLUTION,
    TrackConfig
} from '../../SoundEditorTypes';
import { DutyInstrument, NoiseInstrument, PatternCell, Song, WaveInstrument } from './ugeHelper';

const NOTES_LABELS_REVERTED = Object.keys(NOTES).reverse();
const GB_NOTE_OFFSET = 9 - 12; // adjust for frequency ranges (+9) and transpose down an octave (-12)
const CONVERTED_PATTERN_SIZE = 64 / SEQUENCER_RESOLUTION;

const WAVE_CHANNEL_VOLUME_LOOKUP = [0, 15, 7, 3];

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

export const convertUgeSong = (song: Song): SoundData => {
    const result: SoundData = {
        name: song.name,
        author: song.artist,
        comment: song.comment,
        tracks: [],
        patterns: {},
        instruments: {},
        size: 0,
        speed: 18 * song.ticks_per_row,
        loop: false,
        loopPoint: 0,
        section: DataSection.ROM,
    };

    const dutyInstrumentsLookup = convertDutyInstruments(song.duty_instruments);
    console.log('dutyInstrumentsLookup', dutyInstrumentsLookup);
    const waveInstrumentsLookup = convertWaveInstruments(song.wave_instruments, song.waves);
    console.log('waveInstrumentsLookup', waveInstrumentsLookup);
    const noiseInstrumentsLookup = convertNoiseInstruments(song.noise_instruments);
    console.log('noiseInstrumentsLookup', noiseInstrumentsLookup);

    const instrumentsLookup: ConvertedInstrument[][] = [
        dutyInstrumentsLookup,
        dutyInstrumentsLookup,
        waveInstrumentsLookup,
        noiseInstrumentsLookup,
    ];
    const patternsLookup = convertPatterns(song.patterns, instrumentsLookup);
    console.log('patternsLookup', patternsLookup);

    // for unknown reasons, only every fourth entry, starting with 0, is valid. the rest is 1s.
    const cleanedSequence: number[] = [];
    for (let i = 0; i < song.sequence.length - 1; i += 4) {
        cleanedSequence.push(song.sequence[i]);
    }

    console.log('cleanedSequence', cleanedSequence);
    const tracks: TrackConfig[] = [
        // Duty 1
        {
            allowSkip: false,
            instrument: 'built-in-1',
            sequence: {},
            type: SoundEditorTrackType.SWEEPMOD
        },
        // Duty 2
        {
            allowSkip: false,
            instrument: 'built-in-1',
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        // Wave
        {
            allowSkip: false,
            instrument: 'built-in-1',
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        // Noise
        {
            allowSkip: false,
            instrument: 'built-in-1',
            sequence: {},
            type: SoundEditorTrackType.NOISE
        }];
    cleanedSequence.forEach((patternIndex, sequenceIndex) => {
        [...Array(tracks.length)].map((h, trackIndex) => {
            const foundPattern = patternsLookup[patternIndex][trackIndex];
            if (Object.keys(foundPattern.patternConfig.events).length > 0) {
                // add pattern to sequence
                tracks[trackIndex].sequence[sequenceIndex * CONVERTED_PATTERN_SIZE] = foundPattern.id;
                // add pattern to song
                result.patterns[foundPattern.id] = foundPattern.patternConfig;
                // add pattern's instruments to song
                Object.values(foundPattern.patternConfig.events).forEach(e => {
                    const instrumentId = e[SoundEvent.Instrument];
                    if (instrumentId !== undefined) {
                        const foundInstrument = instrumentsLookup[trackIndex].filter(i => i.id === instrumentId)[0];
                        if (foundInstrument !== undefined) {
                            result.instruments[instrumentId] = foundInstrument.instrumentConfig;
                        }
                    }
                });
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
            result.instruments[defaultInstrument.id] = defaultInstrument.instrumentConfig;
        }
    });

    // remove default instruments from notes
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

    // resort tracks (for W-SM-N order) and add non-empty ones to song
    [tracks[1], tracks[2], tracks[0], tracks[3]].forEach((t, trackIndex) => {
        if (Object.keys(t.sequence).length > 0) {
            // add track to song
            result.tracks.push(t);
        }
    });

    // determine song length
    let longestTrackSize = 0;
    result.tracks.forEach(t => {
        const lastStepIndex = Object.keys(t.sequence).pop() ?? '0';
        const trackSize = parseInt(lastStepIndex) + CONVERTED_PATTERN_SIZE;
        if (trackSize > longestTrackSize) {
            longestTrackSize = trackSize;
        }
    });
    result.size = longestTrackSize;

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
        result.push({
            id: nanoid(),
            instrumentConfig: {
                color: DUTY_COLORS[index],
                envelope: {
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
                },
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
                volume: {
                    left: 15,
                    right: 15
                },
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
        result.push({
            id: nanoid(),
            instrumentConfig: {
                color: WAVE_COLORS[index],
                envelope: {
                    direction: VsuEnvelopeDirection.Decay,
                    enabled: false,
                    initialValue: volume,
                    repeat: false,
                    stepTime: VSU_ENVELOPE_STEP_TIME_MIN
                },
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
                volume: {
                    left: 15,
                    right: 15
                },
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
        result.push({
            id: nanoid(),
            instrumentConfig: {
                color: NOISE_COLORS[index],
                envelope: {
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
                },
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
                volume: {
                    left: 15,
                    right: 15
                },
                waveform: [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ],
            },
        });
    });

    return result;
};

const convertPatterns = (patterns: PatternCell[][][], instrumentsLookup: ConvertedInstrument[][]): ConvertedPattern[][] => {
    const result: ConvertedPattern[][] = [];
    patterns.forEach((pattern, index) => {
        // for unknown reasons, index 1 is always messed up and unused
        const correctedDisplayIndex = index === 0 ? index + 1 : index;
        const newPattern: ConvertedPattern[] = [{
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `Duty1-${correctedDisplayIndex}`,
                size: CONVERTED_PATTERN_SIZE
            }
        }, {
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `Duty2-${correctedDisplayIndex}`,
                size: CONVERTED_PATTERN_SIZE
            }
        }, {
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `Wave-${correctedDisplayIndex}`,
                size: CONVERTED_PATTERN_SIZE
            }
        }, {
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `Noise-${correctedDisplayIndex}`,
                size: CONVERTED_PATTERN_SIZE
            }
        }];

        pattern.forEach((tick, tickIndex) => {
            tick.forEach((channelTick, trackIndex) => {
                const adjustedTickIndex = tickIndex * SUB_NOTE_RESOLUTION;
                const event: SoundEventMap = {};

                if (channelTick.note !== null) {
                    event[SoundEvent.Note] = NOTES_LABELS_REVERTED[clamp(channelTick.note + GB_NOTE_OFFSET, 0, NOTES_SPECTRUM)];
                    event[SoundEvent.Duration] = 50;
                }
                if (channelTick.instrument !== null) {
                    event[SoundEvent.Instrument] = instrumentsLookup[trackIndex][channelTick.instrument].id;
                }
                // TODO: effects

                if (Object.keys(event).length > 0) {
                    newPattern[trackIndex].patternConfig.events[adjustedTickIndex] = event;
                }
            });
        });

        result.push(newPattern);
    });

    return result;
};
