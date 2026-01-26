import { DataSection } from '../../../Common/CommonTypes';
import { COLOR_PALETTE } from '../../../Common/PaletteColorSelect';
import { clamp, nanoid } from '../../../Common/Utils';
import {
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuChannelStereoLevelsData,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction,
    WaveformData
} from '../../Emulator/VsuTypes';
import {
    InstrumentConfig,
    NOTES_LABELS_REVERSED,
    NOTES_SPECTRUM,
    PatternConfig,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SoundEventMap,
    SUB_NOTE_RESOLUTION,
    TrackConfig
} from '../../SoundEditorTypes';
import { EffectCommandType, EffectName, VBMusicFile } from './vbmTypes';

const DEFAULT_INSTRUMENT_ID = 'default';
const DEFAULT_INSTRUMENT = {
    color: 4,
    envelope: {
        direction: VsuEnvelopeDirection.Decay,
        enabled: false,
        initialValue: 15,
        repeat: false,
        stepTime: VSU_ENVELOPE_STEP_TIME_MIN
    },
    interval: {
        enabled: false,
        value: VSU_INTERVAL_MIN
    },
    modulationData: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    name: 'Default',
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
    volume: {
        left: 15,
        right: 15
    },
    waveform: [
        63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // Pulse (50%)
    ],
};

interface ConvertedInstrument {
    id: string
    instrumentConfig: InstrumentConfig
}

interface ConvertedPattern {
    id: string
    patternConfig: PatternConfig
}

const NOTE_OFFSET = 39;

export const convertVbmSong = (song: VBMusicFile): SoundData => {
    const convertedPatternSize = song.SongSettings.Rows;

    const result: SoundData = {
        name: song.SongSettings.Title,
        author: song.SongSettings.Author,
        comment: song.SongSettings.Comment,
        tracks: [],
        patterns: {},
        instruments: {},
        size: 0,
        speed: 2 * song.SongSettings.Speed, // TODO
        loop: false,
        loopPoint: 0,
        section: DataSection.ROM,
    };

    const instrumentsLookup = convertInstruments(song);
    const patternsLookup = convertPatterns(song, instrumentsLookup, convertedPatternSize);

    const tracks: TrackConfig[] = [
        {
            allowSkip: false,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        {
            allowSkip: false,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        {
            allowSkip: false,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        {
            allowSkip: false,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        {
            allowSkip: false,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.SWEEPMOD
        },
        {
            allowSkip: false,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.NOISE
        }];
    song.PatternMap.Frame.forEach(frame => {
        frame.Data.forEach((patternIndex, trackIndex) => {
            const sequenceIndex = frame.ID;
            const trackPatterns = patternsLookup[trackIndex];
            if (!trackPatterns) {
                return;
            }
            const foundPattern = trackPatterns[patternIndex];
            if (foundPattern?.patternConfig && Object.keys(foundPattern.patternConfig.events).length > 0) {
                // add pattern to sequence
                tracks[trackIndex].sequence[sequenceIndex * convertedPatternSize] = foundPattern.id;
                // add pattern to song
                result.patterns[foundPattern.id] = foundPattern.patternConfig;
                // add pattern's instruments to song
                Object.values(foundPattern.patternConfig.events).forEach(e => {
                    const instrumentId = e[SoundEvent.Instrument];
                    if (instrumentId !== undefined) {
                        const foundConvertedInstrument = instrumentsLookup.find(i => i.id === instrumentId);
                        if (foundConvertedInstrument !== undefined) {
                            result.instruments[instrumentId] = foundConvertedInstrument.instrumentConfig;
                        }
                    }
                });
            }
        });
    });

    // find track default instruments and settings from instrument events on first pattern's first event
    const firstPatternMapFrame = song.PatternMap.Frame[0];
    firstPatternMapFrame?.Data.forEach((patternIndex, trackIndex) => {
        const foundSourcePattern = song.Pattern.find(p => p.ID === 0 && p.Channel === trackIndex);
        if (foundSourcePattern?.Row[0].Inst !== undefined) {
            const instrumentId = foundSourcePattern.Row[0].Inst;
            const convertedInstrument = instrumentsLookup[instrumentId];

            // get volume
            const volume: VsuChannelStereoLevelsData = {
                left: foundSourcePattern?.Row[0].VolL ?? convertedInstrument.instrumentConfig.volume.left,
                right: foundSourcePattern?.Row[0].VolR ?? convertedInstrument.instrumentConfig.volume.right,
            };

            // get waveform/tap
            let waveform = convertedInstrument.instrumentConfig.waveform;
            let tap = convertedInstrument.instrumentConfig.tap;
            [
                foundSourcePattern?.Row[0]['FX0'],
                foundSourcePattern?.Row[0]['FX1'],
                foundSourcePattern?.Row[0]['FX2'],
                foundSourcePattern?.Row[0]['FX3'],
            ].forEach(fx => {
                if (fx !== undefined) {
                    const effectCommandType = fx.substring(0, 1);
                    const EffectCommandValue = parseInt(fx.substring(1));
                    switch (effectCommandType) {
                        case EffectCommandType.Waveform:
                            if (trackIndex === 5) {
                                tap = EffectCommandValue;
                            } else {
                                const waveformEffect = song.Waveform.find(w => w.ID === EffectCommandValue);
                                if (waveformEffect) {
                                    waveform = waveformEffect.Data as WaveformData;
                                }
                            }
                            break;
                    }
                }
            });

            // create new instrument as default for channel
            const convertedInstrumentId = nanoid();
            const trackDefaultInstrument: InstrumentConfig = {
                ...convertedInstrument.instrumentConfig,
                name: convertedInstrument.instrumentConfig.name + ` (CH${trackIndex + 1})`,
                type: tracks[trackIndex].type,
                tap,
                volume,
                waveform,
            };

            // set as track default instrument and add to song's instruments
            tracks[trackIndex].instrument = convertedInstrumentId;
            result.instruments[convertedInstrumentId] = trackDefaultInstrument;
        } else {
            // no initial instrument for this track, add default instrument to song's instruments
            result.instruments[DEFAULT_INSTRUMENT_ID] = DEFAULT_INSTRUMENT;
        }
    });

    // add non-empty tracks to song
    result.tracks = tracks.filter(t => Object.keys(t.sequence).length > 0);

    // remove instrument events from each track's first pattern
    result.tracks.forEach(t => {
        const firstPatternId = Object.values(t.sequence)[0];
        if (firstPatternId) {
            const pattern = result.patterns[firstPatternId];
            const firstEventKey = parseInt(Object.keys(pattern.events)[0]);
            const updatedEvents = { ...pattern.events };
            delete updatedEvents[firstEventKey][SoundEvent.Instrument];
            delete updatedEvents[firstEventKey][SoundEvent.Volume];
            result.patterns[firstPatternId] = {
                ...pattern,
                events: updatedEvents,
            };
        }
    });

    // determine song length
    let longestTrackSize = 0;
    result.tracks.forEach(t => {
        const lastStepIndex = Object.keys(t.sequence).pop() ?? '0';
        const trackSize = parseInt(lastStepIndex) + convertedPatternSize;
        if (trackSize > longestTrackSize) {
            longestTrackSize = trackSize;
        }
    });
    result.size = longestTrackSize;

    return result;
};

const convertInstruments = (song: VBMusicFile): ConvertedInstrument[] => {
    const result: ConvertedInstrument[] = [];

    song.Instrument.forEach((i, index) => {
        i.Effect.forEach(e => {
            if (!e.On) {
                return;
            }

            // TODO: support instrument effects via subpattern / software envelopes?
            switch (e.Name) {
                case EffectName.Arpeggio: break;
                case EffectName.Pitch: break;
                case EffectName.Volume: break;
                case EffectName.Waveform: break;
            }
        });

        result.push({
            id: nanoid(),
            instrumentConfig: {
                color: index * 8 % COLOR_PALETTE.length,
                envelope: {
                    direction: VsuEnvelopeDirection.Decay,
                    enabled: false,
                    initialValue: 15,
                    repeat: false,
                    stepTime: VSU_ENVELOPE_STEP_TIME_MIN
                },
                interval: {
                    enabled: false,
                    value: VSU_INTERVAL_MIN
                },
                modulationData: [
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ],
                name: i.Name,
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

const convertPatterns = (song: VBMusicFile, instrumentsLookup: ConvertedInstrument[], convertedPatternSize: number): ConvertedPattern[][] => {
    const result: ConvertedPattern[][] = [];
    song.Pattern.forEach(pattern => {
        const newPattern: ConvertedPattern = {
            id: nanoid(),
            patternConfig: {
                events: {},
                name: `CH${pattern.Channel + 1}-${pattern.ID + 1}`,
                size: convertedPatternSize,
                type: pattern.Channel === 5
                    ? SoundEditorTrackType.NOISE
                    : pattern.Channel === 4
                        ? SoundEditorTrackType.SWEEPMOD
                        : SoundEditorTrackType.WAVE,
            }
        };

        pattern.Row.forEach((tick, i) => {
            const event: SoundEventMap = {};

            if (tick.Note !== undefined) {
                event[SoundEvent.Note] = NOTES_LABELS_REVERSED[clamp(tick.Note - NOTE_OFFSET, 0, NOTES_SPECTRUM)];
                let length = 1;
                while (pattern.Row[i + length] && pattern.Row[i + length].Note === undefined) {
                    length++;
                }
                event[SoundEvent.Duration] = SUB_NOTE_RESOLUTION * (pattern.Row[i + length]
                    ? pattern.Row[i + length].ID - tick.ID
                    : song.SongSettings.Rows - tick.ID
                );
            }

            if (tick.Inst !== undefined) {
                event[SoundEvent.Instrument] = instrumentsLookup[tick.Inst].id;
            }

            if (tick.VolL !== undefined || tick.VolR !== undefined) {
                event[SoundEvent.Volume] = ((tick.VolL ?? 0) << 4) + (tick.VolR ?? 0);
            }

            [
                tick['FX0'],
                tick['FX1'],
                tick['FX2'],
                tick['FX3'],
            ].forEach(fx => {
                if (fx !== undefined) {
                    const effectCommandType = fx.substring(0, 1);
                    // const EffectCommandValue = parseInt(fx.substring(1));
                    // TODO: support effects
                    switch (effectCommandType) {
                        case EffectCommandType.Arpeggio: break;
                        case EffectCommandType.PitchSlideUp: break;
                        case EffectCommandType.PitchSlideDown: break;
                        case EffectCommandType.Portamento: break;
                        case EffectCommandType.Vibrato: break;
                        case EffectCommandType.Tremolo: break;
                        case EffectCommandType.VolumeSlide: break;
                        case EffectCommandType.Jump: break;
                        case EffectCommandType.Halt: break;
                        case EffectCommandType.Skip: break;
                        case EffectCommandType.Speed: break;
                        case EffectCommandType.NoteDelay: break;
                        case EffectCommandType.PitchOffset: break;
                        case EffectCommandType.NoteSlideUp: break;
                        case EffectCommandType.NoteSlideDown: break;
                        case EffectCommandType.NoteCut: break;
                        case EffectCommandType.Waveform: break;
                        case EffectCommandType.LoadWaveform: break;
                        case EffectCommandType.Custom: break;
                    }
                }
            });

            if (Object.keys(event).length > 0) {
                newPattern.patternConfig.events[tick.ID * SUB_NOTE_RESOLUTION] = event;
            }
        });

        if (result[pattern.Channel] === undefined) {
            result[pattern.Channel] = [];
        }

        result[pattern.Channel].push(newPattern);
    });

    return result;
};
