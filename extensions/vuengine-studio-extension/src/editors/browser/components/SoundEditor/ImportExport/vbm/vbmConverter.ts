import { DataSection } from '../../../Common/CommonTypes';
import { COLOR_PALETTE } from '../../../Common/PaletteColorSelect';
import { clamp, nanoid } from '../../../Common/Utils';
import {
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuChannelEnvelopeData,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction,
    WaveformData
} from '../../Emulator/VsuTypes';
import { snapTempo } from '../../Other/tempo';
import { DEFAULT_STEREO_LEVELS, getVolumeAndPanningFromStereoLevels } from '../../Other/volume';
import {
    InstrumentConfig,
    MASTER_VOLUME_DEFAULT,
    NOTES_LABELS_REVERSED,
    NOTES_SPECTRUM,
    PatternConfig,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SoundEventMap,
    SoundGroup,
    SUB_NOTE_RESOLUTION,
    TRACK_PRIORITY_DEFAULT,
    TIMER_RESOLUTION_DEFAULT,
    TrackConfig
} from '../../SoundEditorTypes';
import { DEFAULT_WAVEFORM } from '../../Waveforms/WaveFormPresets';
import { EffectCommandType, EffectName, PatternRow, VBMusicFile } from './vbmTypes';

const DEFAULT_ENVELOPE: VsuChannelEnvelopeData = {
    direction: VsuEnvelopeDirection.Decay,
    enabled: false,
    initialValue: 15,
    repeat: false,
    stepTime: VSU_ENVELOPE_STEP_TIME_MIN
};

const DEFAULT_INSTRUMENT_ID = 'default';
const DEFAULT_INSTRUMENT = {
    color: 4,
    envelope: DEFAULT_ENVELOPE,
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
    ...getVolumeAndPanningFromStereoLevels(DEFAULT_STEREO_LEVELS, DEFAULT_ENVELOPE),
    waveform: DEFAULT_WAVEFORM,
};

const getVolumeEvents = (left: number, right: number): SoundEventMap => {
    const { volume, panning } = getVolumeAndPanningFromStereoLevels({ left, right }, DEFAULT_ENVELOPE);

    return {
        [SoundEvent.Volume]: volume,
        [SoundEvent.Panning]: panning,
    };
};

interface ConvertedInstrument {
    id: string
    instrumentConfig: InstrumentConfig
}

interface ConvertedPattern {
    id: string
    patternConfig: PatternConfig
}

const NOTE_OFFSET = 42;
const VOLUME_MAX = 15;
// volume slides change the volume in eighths of a level
const VOLUME_SLIDE_RESOLUTION = 8;

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
        tempo: snapTempo(2 * song.SongSettings.Speed, TIMER_RESOLUTION_DEFAULT), // TODO
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
    };

    const instrumentsLookup = convertInstruments(song);
    const patternsLookup = convertPatterns(song, instrumentsLookup, convertedPatternSize);

    // add patterns to song
    Object.values(patternsLookup).forEach(convertedPatterns => {
        convertedPatterns.forEach(p => {
            result.patterns[p.id] = p.patternConfig;
        });
    });

    // add instruments to song
    Object.values(instrumentsLookup).forEach(i => {
        result.instruments[i.id] = i.instrumentConfig;
    });

    const tracks: TrackConfig[] = [
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.WAVE
        },
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
            instrument: DEFAULT_INSTRUMENT_ID,
            sequence: {},
            type: SoundEditorTrackType.SWEEPMOD
        },
        {
            skippable: true,
            priority: TRACK_PRIORITY_DEFAULT,
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
            }
        });
    });

    applyVolumeSlides(song, patternsLookup, tracks, convertedPatternSize);

    // find track default instruments and settings from instrument events on first pattern's first event
    const firstPatternMapFrame = song.PatternMap.Frame[0];
    firstPatternMapFrame?.Data.forEach((patternIndex, trackIndex) => {
        const foundSourcePattern = song.Pattern.find(p => p.ID === 0 && p.Channel === trackIndex);
        if (foundSourcePattern?.Row[0].Inst !== undefined) {
            const instrumentId = foundSourcePattern.Row[0].Inst;
            const convertedInstrument = instrumentsLookup[instrumentId];

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
                envelope: { ...DEFAULT_ENVELOPE },
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
                ...getVolumeAndPanningFromStereoLevels(DEFAULT_STEREO_LEVELS, DEFAULT_ENVELOPE),
                waveform: DEFAULT_WAVEFORM,
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
                event[SoundEvent.Note] = NOTES_LABELS_REVERSED[clamp(tick.Note - NOTE_OFFSET, 0, NOTES_SPECTRUM - 1)];
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
                Object.assign(event, getVolumeEvents(tick.VolL ?? 0, tick.VolR ?? 0));
            } else if (tick.Inst !== undefined) {
                Object.assign(event, getVolumeEvents(DEFAULT_STEREO_LEVELS.left, DEFAULT_STEREO_LEVELS.right));
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
                    // TODO: add support for missing effects listed below
                    switch (effectCommandType) {
                        case EffectCommandType.Arpeggio: break;
                        case EffectCommandType.PitchSlideUp: break;
                        case EffectCommandType.PitchSlideDown: break;
                        case EffectCommandType.Portamento: break;
                        case EffectCommandType.Vibrato: break;
                        case EffectCommandType.Tremolo: break;
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

// the change per tick of a volume slide (Axy), in eighths of a level
const getVolumeSlideRate = (fx: string): number => {
    const param = fx.substring(1).padStart(2, '0');
    const rate = parseInt(param.charAt(param.length - 2), 16) - parseInt(param.charAt(param.length - 1), 16);

    return isNaN(rate) ? 0 : rate;
};

// Volume slides (Axy) change the volume by (x - y) / 8 every tick, until A00 stops them, while setting the volume or an
// instrument sets the volume they start from. They get converted to volume events wherever the resulting volume changes,
// which requires following the song through its frames.
// Patterns used more than once keep the volume events of their first occurence.
const applyVolumeSlides = (
    song: VBMusicFile,
    patternsLookup: ConvertedPattern[][],
    tracks: TrackConfig[],
    convertedPatternSize: number,
): void => {
    const ticksPerRow = Math.max(1, song.SongSettings.Speed);
    const maxVolume = VOLUME_MAX * VOLUME_SLIDE_RESOLUTION;

    tracks.forEach((track, trackIndex) => {
        // patterns are looked up by their position among the channel's ones, like for the sequence
        const sourcePatterns = song.Pattern.filter(p => p.Channel === trackIndex);
        let left = DEFAULT_STEREO_LEVELS.left * VOLUME_SLIDE_RESOLUTION;
        let right = DEFAULT_STEREO_LEVELS.right * VOLUME_SLIDE_RESOLUTION;
        let rate = 0;
        let playedVolumeEvents = getVolumeEvents(DEFAULT_STEREO_LEVELS.left, DEFAULT_STEREO_LEVELS.right);
        const visitedPatternIds = new Set<string>();

        song.PatternMap.Frame.forEach(frame => {
            const patternIndex = frame.Data[trackIndex];
            const convertedPattern = patternsLookup[trackIndex]?.[patternIndex];
            const canAddEvents = convertedPattern !== undefined
                && track.sequence[frame.ID * convertedPatternSize] === convertedPattern.id
                && !visitedPatternIds.has(convertedPattern.id);
            if (convertedPattern) {
                visitedPatternIds.add(convertedPattern.id);
            }
            const rows: Record<number, PatternRow> = {};
            sourcePatterns[patternIndex]?.Row.forEach(row => {
                rows[row.ID] = row;
            });

            const slide = (step: number) => {
                if (rate === 0) {
                    return;
                }
                left = clamp(left + rate, 0, maxVolume);
                right = clamp(right + rate, 0, maxVolume);
                const volumeEvents = getVolumeEvents(
                    Math.floor(left / VOLUME_SLIDE_RESOLUTION),
                    Math.floor(right / VOLUME_SLIDE_RESOLUTION)
                );
                const changedEvents: SoundEventMap = {};
                [SoundEvent.Volume, SoundEvent.Panning].forEach(eventType => {
                    if (volumeEvents[eventType] !== playedVolumeEvents[eventType]) {
                        changedEvents[eventType] = volumeEvents[eventType];
                    }
                });
                playedVolumeEvents = volumeEvents;
                if (canAddEvents && Object.keys(changedEvents).length > 0) {
                    const events = convertedPattern.patternConfig.events;
                    events[step] = {
                        ...events[step],
                        ...changedEvents,
                    };
                }
            };

            for (let rowIndex = 0; rowIndex < convertedPatternSize; rowIndex++) {
                const row = rows[rowIndex];
                const rowStep = rowIndex * SUB_NOTE_RESOLUTION;

                // a running slide goes on on the row's first tick, unless the row sets the volume
                if (row?.VolL !== undefined || row?.VolR !== undefined) {
                    left = (row.VolL ?? 0) * VOLUME_SLIDE_RESOLUTION;
                    right = (row.VolR ?? 0) * VOLUME_SLIDE_RESOLUTION;
                    playedVolumeEvents = getVolumeEvents(row.VolL ?? 0, row.VolR ?? 0);
                } else if (row?.Inst !== undefined) {
                    left = DEFAULT_STEREO_LEVELS.left * VOLUME_SLIDE_RESOLUTION;
                    right = DEFAULT_STEREO_LEVELS.right * VOLUME_SLIDE_RESOLUTION;
                    playedVolumeEvents = getVolumeEvents(DEFAULT_STEREO_LEVELS.left, DEFAULT_STEREO_LEVELS.right);
                } else {
                    slide(rowStep);
                }

                const volumeSlide = [row?.FX0, row?.FX1, row?.FX2, row?.FX3]
                    .find(fx => fx?.startsWith(EffectCommandType.VolumeSlide));
                if (volumeSlide) {
                    rate = getVolumeSlideRate(volumeSlide);
                }

                for (let tick = 1; tick < ticksPerRow; tick++) {
                    slide(rowStep + Math.round(tick * SUB_NOTE_RESOLUTION / ticksPerRow));
                }
            }
        });
    });
};
