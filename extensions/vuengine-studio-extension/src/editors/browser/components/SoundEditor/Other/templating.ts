import { deepClone, isString } from '@theia/core';
import { crc32 } from 'crc';
import { clamp, hexFromBitsArray, intToHex } from '../../Common/Utils';
import {
    ModulationData,
    VsuChannelEnvelopeData,
    VsuChannelIntervalData,
    VsuChannelStereoLevelsData,
    VsuChannelSweepModulationData,
    VsuSweepModulationFunction,
    WaveformData
} from '../Emulator/VsuTypes';
import {
    InstrumentConfig,
    EventsMap,
    InstrumentMap,
    MASTER_VOLUME_DEFAULT,
    MASTER_VOLUME_EVENT_MAX,
    NOTES,
    PatternConfig,
    PatternMap,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SoundEventMap,
    SUB_NOTE_RESOLUTION,
    NOTE_SLIDE_STEPS_DEFAULT,
    NOTE_SLIDE_STEPS_MAX,
    NOTE_SLIDE_STEPS_MIN,
    TrackConfig
} from '../SoundEditorTypes';
import { getTempoSegments, getTicksAtStep, getTimerResolution } from './tempo';
import { getEffectiveVolumeAndPanning, getMasterVolume, getRegisterLevels } from './volume';

interface withArtificialNotes {
    artificial?: true
    muted?: true
}
type SoundEventMapWithArtificialNotes = SoundEventMap & withArtificialNotes;
type EventsMapWithArtificialNotes = Record<number, SoundEventMapWithArtificialNotes>;

interface Keyframe {
    SxINT?: string
    SxLRV?: string
    SxFQ?: string
    SxEV0?: string
    SxEV1?: string
    SxRAM?: string
    SxSWP?: string
    SxMOD?: string
}

type KeyframeMap = Record<number, Keyframe>;

const KEYFRAME_DURATION_MAX = 0xFFFF;

interface TrackKeyframes {
    keyframeMap: KeyframeMap,
    loopKeyframe: number,
    totalSize: number
}

interface TrackKeyframesPrepared {
    values: {
        SxINT: string[]
        SxLRV: string[]
        SxFQ: string[]
        SxEV0: string[]
        SxEV1: string[]
        SxRAM: string[]
        SxSWP: string[]
        SxMOD: string[]
    },
    keyframes: {
        duration: number,
        flags: EventName[]
    }[],
    loopKeyframe: number,
}

enum EventName {
    'Noise' = 'kSoundTrackEventNoise',
    'Start' = 'kSoundTrackEventStart',
    'SweepMod' = 'kSoundTrackEventSweepMod',
    'SxEV0' = 'kSoundTrackEventSxEV0',
    'SxEV1' = 'kSoundTrackEventSxEV1',
    'SxFQ' = 'kSoundTrackEventSxFQ',
    'SxINT' = 'kSoundTrackEventSxINT',
    'SxLRV' = 'kSoundTrackEventSxLRV',
    'SxMOD' = 'kSoundTrackEventSxMOD',
    'SxRAM' = 'kSoundTrackEventSxRAM',
    'SxSWP' = 'kSoundTrackEventSxSWP',
}

const SxINT = (enableChannel: boolean, interval: VsuChannelIntervalData, resetSxINT: boolean): string => hexFromBitsArray([
    [Number(enableChannel), 1],
    // We utilize the following, otherwise unused bit to signal to the engine to force-write to SxINT in order to reset the VSU's internal counters
    [Number(resetSxINT), 1],
    [Number(interval.enabled), 1],
    [interval.value, 5]
]);

const SxLRV = (volume: VsuChannelStereoLevelsData): string => hexFromBitsArray([
    [volume.left, 4],
    [volume.right, 4]
]);

const SxFQ = (frequency: number): string => intToHex(frequency, 4);

const SxEV0 = (envelope: VsuChannelEnvelopeData, initialValue: number): string => hexFromBitsArray([
    [initialValue, 4],
    [envelope.direction, 1],
    [envelope.stepTime, 3]
]);

const SxEV1 = (
    envelope: VsuChannelEnvelopeData,
    sweepMod: VsuChannelSweepModulationData,
    tap: number,
    type: SoundEditorTrackType,
    resetSxEV: boolean,
    resetS5SWP: boolean
): string => {
    if (type === SoundEditorTrackType.NOISE) {
        return hexFromBitsArray([
            // We utilize the following, otherwise unused bit to signal to the engine to force-write to SxEV0/1 in order to reset the VSU's internal counters
            [Number(resetSxEV), 1],
            [tap, 3],
            // We utilize the following, otherwise unused bit to signal to the engine to force-write to S5SWP in order to reset the VSU's internal counters
            [Number(resetS5SWP), 1],
            [undefined, 1],
            [Number(envelope.repeat), 1],
            [Number(envelope.enabled), 1]
        ]);
    } else {
        return hexFromBitsArray([
            // We utilize the following, otherwise unused bit to signal to the engine to force-write to SxEV0/1 in order to reset the VSU's internal counters
            [Number(resetSxEV), 1],
            [Number(sweepMod.enabled), 1],
            [Number(sweepMod.repeat), 1],
            [Number(sweepMod.function), 1],
            // We utilize the following, otherwise unused bit to signal to the engine to force-write to S5SWP in order to reset the VSU's internal counters
            [Number(resetS5SWP), 1],
            [undefined, 1],
            [Number(envelope.repeat), 1],
            [Number(envelope.enabled), 1]
        ]);
    }
};

const SxRAM = (specName: string, waveformRegistry: WaveformData[], waveform: WaveformData, type: SoundEditorTrackType): string => {
    if (type !== SoundEditorTrackType.NOISE) {
        const checksum = crc32(JSON.stringify(waveform));
        return `&${specName}Waveform${waveformRegistry[checksum]}`;
    }

    return 'NULL';
};

const S5SWP = (sweepMod: VsuChannelSweepModulationData): string => hexFromBitsArray([
    [sweepMod.frequency, 1],
    [sweepMod.interval, 3],
    [sweepMod.direction, 1],
    [sweepMod.shift, 3]
]);

const S5MOD = (
    specName: string,
    modulationDataRegistry: ModulationData[],
    modData: ModulationData,
    sweepMod: VsuChannelSweepModulationData,
    type: SoundEditorTrackType
): string => {
    if (type === SoundEditorTrackType.SWEEPMOD && sweepMod.function) {
        const checksum = crc32(JSON.stringify(modData));
        return `${specName}ModulationData${modulationDataRegistry[checksum]}`;
    }

    return 'NULL';
};

// create a single full-length sequence from patterns
const mergePatterns = (
    track: TrackConfig,
    patterns: PatternMap,
    totalSize: number,
): EventsMapWithArtificialNotes => {
    const trackEventsMap: EventsMapWithArtificialNotes = {};

    // patterns can only start at whole steps
    const sequenceColumns = Object.keys(track.sequence)
        .map(column => parseFloat(column))
        .filter(column => column >= 0
            && track.sequence[column]
            && Math.round(column * SUB_NOTE_RESOLUTION) / SUB_NOTE_RESOLUTION === column
        )
        .sort((a, b) => a - b);

    // only visit the patterns' events instead of every step of the sound
    sequenceColumns.forEach((column, index) => {
        const pattern: PatternConfig | undefined = patterns[track.sequence[column]];
        if (!pattern) {
            return;
        }
        const patternStartStep = Math.round(column * SUB_NOTE_RESOLUTION);
        // a pattern gets cut off by the next one in the sequence and by the end of the sound
        const nextColumn = sequenceColumns[index + 1];
        const patternEndStep = Math.min(
            totalSize,
            patternStartStep + pattern.size * SUB_NOTE_RESOLUTION,
            nextColumn !== undefined ? nextColumn * SUB_NOTE_RESOLUTION : Infinity,
        );

        Object.keys(pattern.events ?? {}).forEach(patternStepStr => {
            const patternStep = parseFloat(patternStepStr);
            const step = patternStartStep + patternStep;
            if (Number.isInteger(patternStep) && patternStep >= 0 && step < patternEndStep && pattern.events[patternStep]) {
                trackEventsMap[step] = { ...pattern.events[patternStep] };
            }
        });
    });

    return trackEventsMap;
};

// remove empty events
const filterEmptyEvents = (
    trackEventsMap: EventsMapWithArtificialNotes,
): EventsMapWithArtificialNotes => {
    const result: EventsMapWithArtificialNotes = {};

    const sortedTrackSteps: number[] = Object.keys(trackEventsMap)
        .map(step => parseInt(step))
        .sort((a, b) => a - b);

    sortedTrackSteps.forEach(step => {
        if (Object.keys(trackEventsMap[step]).length) {
            result[step] = deepClone(trackEventsMap[step]);
        }
    });

    return result;
};

// if there's no note at step 0, mute the track until the first note plays
const applyTrackInitialMute = (
    trackEventsMap: EventsMapWithArtificialNotes,
): EventsMapWithArtificialNotes => {
    const result: EventsMapWithArtificialNotes = deepClone(trackEventsMap);

    const sortedTrackStepsWithNote: number[] = Object.keys(result)
        .map(step => parseInt(step))
        .filter(step => result[step][SoundEvent.Note] !== undefined)
        .sort((a, b) => a - b);
    if (sortedTrackStepsWithNote.length > 0 && sortedTrackStepsWithNote[0] > 0) {
        result[0] = {
            ...(result[0] ?? {}),
            muted: true,
        };
    }

    return result;
};

const applyGlobalEvents = (
    trackEventsMap: EventsMapWithArtificialNotes,
    globalEvents: EventsMap,
    totalSize: number,
): EventsMapWithArtificialNotes => {
    const result: EventsMapWithArtificialNotes = deepClone(trackEventsMap);

    Object.keys(globalEvents ?? {}).forEach(s => {
        const step = parseInt(s);
        const {
            // filter out some events
            [SoundEvent.TimeSignature]: timeSignature,
            [SoundEvent.Tempo]: tempo,
            ...playbackEvents
        } = globalEvents[step];
        if (step < totalSize && Object.keys(playbackEvents).length > 0) {
            result[step] = {
                ...(result[step] ?? {}),
                ...playbackEvents,
            };
        }
    });

    return result;
};

// set initial instrument on step 0 for initialization
const applyTrackInitialInstrument = (
    trackEventsMap: EventsMapWithArtificialNotes,
    initialInstrumentId: string,
): EventsMapWithArtificialNotes => {
    const result: EventsMapWithArtificialNotes = deepClone(trackEventsMap);

    if (result[0] !== undefined && result[0][SoundEvent.Instrument] === undefined) {
        result[0][SoundEvent.Instrument] = initialInstrumentId;
    }

    return result;
};

// mute the track if a note's duration ends before a new note plays
const applyNoteDuration = (
    trackEventsMap: EventsMapWithArtificialNotes,
    totalSize: number,
): EventsMapWithArtificialNotes => {
    const result: EventsMapWithArtificialNotes = deepClone(trackEventsMap);

    const sortedTrackStepsWithNote: number[] = Object.keys(result)
        .map(step => parseInt(step))
        .filter(step => result[step][SoundEvent.Note] !== undefined)
        .sort((a, b) => a - b);
    sortedTrackStepsWithNote.forEach((step, index) => {
        const duration = result[step][SoundEvent.Duration];
        if (duration === undefined) {
            return;
        }

        const endStep = step + duration;
        const nextNoteStep = sortedTrackStepsWithNote[index + 1];
        if (endStep < totalSize && (nextNoteStep === undefined || nextNoteStep > endStep)) {
            result[endStep] = {
                ...(result[endStep] ?? {}),
                muted: true,
            };
        }
    });

    return result;
};

// replace note labels with frequencies
const notesToFrequencies = (
    trackEventsMap: EventsMapWithArtificialNotes,
): EventsMapWithArtificialNotes => {
    const result: EventsMapWithArtificialNotes = deepClone(trackEventsMap);

    const trackSteps: number[] = Object.keys(result)
        .map(step => parseInt(step));
    trackSteps.forEach(step => {
        const stepEvents = result[step];
        if (stepEvents[SoundEvent.Note] !== undefined) {
            if (isString(stepEvents[SoundEvent.Note]) && NOTES[stepEvents[SoundEvent.Note]] !== undefined) {
                result[step][SoundEvent.Note] = NOTES[stepEvents[SoundEvent.Note]];
            } else {
                delete result[step][SoundEvent.Note];
            }
        }
    });

    return result;
};

// add additional note events for note slide effects
const applyNoteSlide = (
    trackEventsMap: EventsMapWithArtificialNotes,
): EventsMapWithArtificialNotes => {
    const result: EventsMapWithArtificialNotes = deepClone(trackEventsMap);
    // sorted from highest to lowest
    const noteFrequencies = Object.values(NOTES);

    const sortedNoteSteps: number[] = Object.keys(result)
        .map(step => parseInt(step))
        .filter(step => result[step][SoundEvent.Note] !== undefined)
        .sort((a, b) => a - b);
    sortedNoteSteps.forEach((step, index) => {
        const stepEvents = result[step];
        const noteSlide = stepEvents[SoundEvent.NoteSlide];
        if (noteSlide === undefined || noteSlide === 0) {
            return;
        }

        const frequency = stepEvents[SoundEvent.Note];
        const noteId = noteFrequencies.indexOf(frequency);
        const duration = stepEvents[SoundEvent.Duration];
        if (noteId === -1 || duration === undefined) {
            return;
        }

        // the slide must not reach into the next note
        const slideDuration = Math.min(duration, (sortedNoteSteps[index + 1] ?? Infinity) - step);
        const stepDuration = SUB_NOTE_RESOLUTION /
            clamp(stepEvents[SoundEvent.NoteSlideSteps] ?? NOTE_SLIDE_STEPS_DEFAULT, NOTE_SLIDE_STEPS_MIN, NOTE_SLIDE_STEPS_MAX);
        // a little tolerance, as the step duration might be a fraction
        const numberOfSteps = Math.floor(slideDuration / stepDuration + 0.001);
        if (numberOfSteps < 2) {
            return;
        }

        // the target is reached on the last step, and the frequency register value changes by the same amount on every
        // step, like a tracker's portamento does with the period. As the frequency is inversely proportional to the
        // register value's distance to its maximum, the pitch falls fast at first on slides down, and rises slowly at first on slides up.
        const targetFrequency = noteFrequencies[clamp(noteId - noteSlide, 0, noteFrequencies.length - 1)];

        let previousFrequency = frequency;
        for (let i = 1; i < numberOfSteps; i++) {
            const stepFrequency = Math.round(frequency + (targetFrequency - frequency) * i / (numberOfSteps - 1));
            // slow slides can stay on the same value for several steps
            if (stepFrequency === previousFrequency) {
                continue;
            }
            previousFrequency = stepFrequency;

            const artificialStep = step + Math.round(i * stepDuration);
            result[artificialStep] = {
                ...result[artificialStep],
                artificial: true,
                [SoundEvent.Note]: stepFrequency,
                [SoundEvent.Duration]: step + slideDuration - artificialStep,
            };
            if (stepEvents[SoundEvent.Instrument]) {
                result[artificialStep][SoundEvent.Instrument] = stepEvents[SoundEvent.Instrument];
            }
        }
    });

    return result;
};

// interpret events, transform to actual register values
const transformToKeyframes = (
    trackEventsMap: EventsMapWithArtificialNotes,
    instruments: InstrumentMap,
    soundMasterVolume: number,
    totalSize: number,
    track: TrackConfig,
    specName: string,
    waveformRegistry: WaveformData[],
    modulationDataRegistry: ModulationData[],
): TrackKeyframes => {
    const trackSteps: number[] = Object.keys(trackEventsMap).map(step => parseInt(step)).sort((a, b) => a - b);
    const keyframeMap: KeyframeMap = {};

    let currentInstrumentId: string | undefined;
    let currentInstrument: InstrumentConfig = instruments[track.instrument];
    let volume: number | undefined;
    let panning: number | undefined;
    let masterVolumeEvent = MASTER_VOLUME_EVENT_MAX;
    let muted = false;
    const getCurrentRegisterLevels = () => {
        const effective = getEffectiveVolumeAndPanning(currentInstrument, volume, panning, getMasterVolume(soundMasterVolume, masterVolumeEvent));
        return getRegisterLevels(effective.volume, effective.panning, currentInstrument.envelope);
    };

    trackSteps.forEach((step, stepIndex) => {
        const stepEvents = trackEventsMap[step];
        const keyframe: Keyframe = {};

        // volume and panning persist until changed
        if (stepEvents[SoundEvent.Volume] !== undefined) {
            volume = stepEvents[SoundEvent.Volume];
        }
        if (stepEvents[SoundEvent.Panning] !== undefined) {
            panning = stepEvents[SoundEvent.Panning];
        }
        if (stepEvents[SoundEvent.MasterVolume] !== undefined) {
            masterVolumeEvent = stepEvents[SoundEvent.MasterVolume];
        }
        if (stepEvents.muted) {
            muted = true;
        }

        const sweepEnabled = track.type === SoundEditorTrackType.SWEEPMOD
            && currentInstrument.sweepMod.enabled
            && currentInstrument.sweepMod.function === VsuSweepModulationFunction.Sweep;

        // note event
        if (stepEvents[SoundEvent.Note] !== undefined) {
            muted = false;
            keyframe.SxFQ = SxFQ(stepEvents[SoundEvent.Note]);

            // explicity set registers to reset the VSU's internal counters for hardware envelopes,
            // except for the steps of a note slide, which must only change the frequency, as writing SxINT restarts the sound
            if (stepIndex !== 0 && !stepEvents.artificial) {
                keyframe.SxINT = SxINT(true, currentInstrument.interval, !stepEvents.artificial);
                if (currentInstrument.envelope.enabled || sweepEnabled) {
                    keyframe.SxEV0 = SxEV0(currentInstrument.envelope, getCurrentRegisterLevels().envelopeInitialValue);
                    keyframe.SxEV1 = SxEV1(
                        currentInstrument.envelope,
                        currentInstrument.sweepMod,
                        currentInstrument.tap,
                        track.type,
                        !stepEvents.artificial,
                        !stepEvents.artificial && sweepEnabled
                    );
                }
                if (sweepEnabled) {
                    keyframe.SxSWP = S5SWP(currentInstrument.sweepMod);
                }
            }
        }

        // instrument event, an instrument applies to its note, so steps without a note keep the current one
        if ((stepIndex === 0 || stepEvents[SoundEvent.Note] !== undefined) && stepEvents[SoundEvent.Instrument] !== currentInstrumentId) {
            const previousInstrument = currentInstrument;
            currentInstrumentId = stepEvents[SoundEvent.Instrument];
            currentInstrument = instruments[currentInstrumentId ?? track.instrument];

            // a different instrument brings its own volume and panning, unless effects at the same step set them
            if (currentInstrument !== previousInstrument) {
                volume = stepEvents[SoundEvent.Volume];
                panning = stepEvents[SoundEvent.Panning];
            }

            keyframe.SxINT = SxINT(true, currentInstrument.interval, !stepEvents.artificial);
            keyframe.SxEV0 = SxEV0(currentInstrument.envelope, getCurrentRegisterLevels().envelopeInitialValue);
            keyframe.SxEV1 = SxEV1(
                currentInstrument.envelope,
                currentInstrument.sweepMod,
                currentInstrument.tap,
                track.type,
                !stepEvents.artificial,
                !stepEvents.artificial && sweepEnabled
            );
            if (track.type !== SoundEditorTrackType.NOISE) {
                keyframe.SxRAM = SxRAM(specName, waveformRegistry, currentInstrument.waveform, track.type);
            }
            if (track.type === SoundEditorTrackType.SWEEPMOD) {
                keyframe.SxSWP = S5SWP(currentInstrument.sweepMod);
                keyframe.SxMOD = S5MOD(specName, modulationDataRegistry, currentInstrument.modulationData, currentInstrument.sweepMod, track.type);
            }
        }

        // set volume on every keyframe, unchanged values get removed in reduceKeyframes
        const registerLevels = getCurrentRegisterLevels();
        keyframe.SxLRV = SxLRV(muted ? { left: 0, right: 0 } : registerLevels.stereoLevels);
        // the envelope value is only free to change while the hardware envelope is disabled, writing it would restart the envelope otherwise
        if (!currentInstrument.envelope.enabled) {
            keyframe.SxEV0 = SxEV0(currentInstrument.envelope, registerLevels.envelopeInitialValue);
        }

        keyframeMap[step] = keyframe;
    });

    return {
        keyframeMap,
        loopKeyframe: 0,
        totalSize,
    };
};

const REDUCIBLE_REGISTERS: (keyof Keyframe)[] = ['SxINT', 'SxEV0', 'SxEV1', 'SxLRV', 'SxRAM', 'SxSWP', 'SxMOD'];

// remove unnecessary steps, i.e. those which would cause no register value change
const reduceKeyframes = (
    trackKeyframes: TrackKeyframes,
): TrackKeyframes => {
    const keyframeMap: KeyframeMap = {};

    const trackSteps: number[] = Object.keys(trackKeyframes.keyframeMap)
        .map(step => parseInt(step))
        .sort((a, b) => a - b);

    // remove values that are same as previous occurence, remembering the last value of each register in a single pass
    const previousValues: Keyframe = {};
    trackSteps.forEach(step => {
        const stepValues = trackKeyframes.keyframeMap[step];
        // remove empty keyframes
        if (Object.keys(stepValues).length === 0) {
            return;
        }

        const reducedStepValues: Keyframe = {};
        (Object.keys(stepValues) as (keyof Keyframe)[]).forEach(v => {
            const value = stepValues[v];
            if (!REDUCIBLE_REGISTERS.includes(v) || value === undefined || previousValues[v] !== value) {
                reducedStepValues[v] = value;
            }
            if (value !== undefined) {
                previousValues[v] = value;
            }
        });
        keyframeMap[step] = reducedStepValues;
    });

    return {
        ...trackKeyframes,
        keyframeMap,
    };
};

// find keyframe (step index) of looping point
const applyLoopPoint = (
    trackKeyframes: TrackKeyframes,
    loopPoint: number,
): TrackKeyframes => {
    const result = deepClone(trackKeyframes);

    const loopPointStep = loopPoint * SUB_NOTE_RESOLUTION;

    // create dummy event if none exists at loop point
    if (result.keyframeMap[loopPointStep] === undefined) {
        result.keyframeMap[loopPointStep] = {};
    }

    const loopKeyframe = Object.keys(result.keyframeMap)
        .map(step => parseInt(step))
        .sort((a, b) => a - b)
        .indexOf(loopPointStep);

    return {
        ...result,
        loopKeyframe,
    };
};

// transform to final return format with event flags
const transformToKeyframesPrepared = (
    trackKeyframes: TrackKeyframes,
    trackType: SoundEditorTrackType,
    soundData: SoundData,
): TrackKeyframesPrepared => {
    // The durations are in the player's ticks, of which the tempo defines how many the steps take. They get rounded at the
    // keyframes' absolute positions, so that all tracks stay in sync. Keyframes which would start on the same tick get
    // merged, the later values replacing the earlier ones, and keyframes which would be too long get split.
    const tempoSegments = getTempoSegments(soundData);
    const timerResolution = getTimerResolution(soundData);
    const getTicks = (step: number) => getTicksAtStep(tempoSegments, timerResolution, step);

    const keyFrameSteps: number[] = Object.keys(trackKeyframes.keyframeMap).map(step => parseInt(step)).sort((a, b) => a - b);
    const loopStep = keyFrameSteps[trackKeyframes.loopKeyframe];
    const keyframeGroups: { ticks: number, steps: number[] }[] = [];
    keyFrameSteps.forEach(step => {
        const ticks = getTicks(step);
        const previousGroup = keyframeGroups[keyframeGroups.length - 1];
        if (previousGroup?.ticks === ticks) {
            previousGroup.steps.push(step);
        } else {
            keyframeGroups.push({ ticks, steps: [step] });
        }
    });

    const trackKeyframesPrepared: TrackKeyframesPrepared = {
        values: {
            SxEV0: [],
            SxEV1: [],
            SxFQ: [],
            SxINT: [],
            SxLRV: [],
            SxRAM: [],
            SxSWP: [],
            SxMOD: [],
        },
        keyframes: [],
        loopKeyframe: 0,
    };

    const typeFlags: EventName[] = [];
    if (trackType === SoundEditorTrackType.SWEEPMOD) {
        typeFlags.push(EventName.SweepMod);
    }
    if (trackType === SoundEditorTrackType.NOISE) {
        typeFlags.push(EventName.Noise);
    }

    const endTicks = getTicks(trackKeyframes.totalSize);
    keyframeGroups.forEach((group, groupIndex) => {
        const stepKeyframe: Keyframe = Object.assign({}, ...group.steps.map(step => trackKeyframes.keyframeMap[step]));
        const flags: EventName[] = [];

        ['SxFQ', 'SxINT', 'SxEV0', 'SxEV1', 'SxLRV', 'SxRAM', 'SxSWP', 'SxMOD'].forEach(v => {
            // @ts-ignore
            if (stepKeyframe[v] !== undefined) {
                // @ts-ignore
                trackKeyframesPrepared.values[v].push(stepKeyframe[v]);
                // @ts-ignore
                flags.push(EventName[v]);
            }
        });

        if (group.steps.includes(loopStep)) {
            trackKeyframesPrepared.loopKeyframe = trackKeyframesPrepared.keyframes.length;
        }

        let duration = Math.max(0, (keyframeGroups[groupIndex + 1]?.ticks ?? endTicks) - group.ticks);
        trackKeyframesPrepared.keyframes.push({ duration: Math.min(duration, KEYFRAME_DURATION_MAX), flags: [...flags, ...typeFlags] });
        duration -= KEYFRAME_DURATION_MAX;
        // the rest of a long keyframe follows in keyframes which change nothing
        while (duration > 0) {
            trackKeyframesPrepared.keyframes.push({ duration: Math.min(duration, KEYFRAME_DURATION_MAX), flags: [...typeFlags] });
            duration -= KEYFRAME_DURATION_MAX;
        }
    });

    return trackKeyframesPrepared;
};

// set the very first keyframe's flags to just kSoundTrackEventStart
const setStartEvent = (
    trackKeyframesPrepared: TrackKeyframesPrepared,
    trackType: SoundEditorTrackType,
): TrackKeyframesPrepared => {
    const result = deepClone(trackKeyframesPrepared);

    // if there's no note on the first keyframe, set initial frequency to 0x00
    if (!result.keyframes[0].flags.includes(EventName.SxFQ)) {
        result.values.SxFQ.unshift('0x0000');
    }

    // set the very first keyframe's flags to just kSoundTrackEventStart
    const flags: EventName[] = [EventName.Start];
    if (trackType === SoundEditorTrackType.SWEEPMOD) {
        flags.push(EventName.SweepMod);
    }
    if (trackType === SoundEditorTrackType.NOISE) {
        flags.push(EventName.Noise);
    }
    result.keyframes[0].flags = flags;

    return result;
};

export const getTrackKeyframes = (
    track: TrackConfig,
    specName: string,
    totalSize: number,
    loopPoint: number,
    waveformRegistry: WaveformData[],
    modulationDataRegistry: ModulationData[],
    soundData: SoundData
): TrackKeyframesPrepared => {
    // console.log('-----------------------------------------------------');
    let trackEventsMap = mergePatterns(track, soundData.patterns, totalSize);
    // console.log('mergePatterns', deepClone(trackEventsMap));
    trackEventsMap = filterEmptyEvents(trackEventsMap);
    // console.log('filterEmptyEvents', deepClone(trackEventsMap));
    trackEventsMap = applyGlobalEvents(trackEventsMap, soundData.events, totalSize);
    // console.log('applyGlobalEvents', deepClone(trackEventsMap));
    trackEventsMap = applyTrackInitialMute(trackEventsMap);
    // console.log('applyTrackInitialMute', deepClone(trackEventsMap));
    trackEventsMap = applyTrackInitialInstrument(trackEventsMap, track.instrument);
    // console.log('applyTrackInitialInstrument', deepClone(trackEventsMap));
    trackEventsMap = notesToFrequencies(trackEventsMap);
    // console.log('notesToFrequencies', deepClone(trackEventsMap));
    trackEventsMap = applyNoteDuration(trackEventsMap, totalSize);
    // console.log('applyNoteDuration', deepClone(trackEventsMap));
    trackEventsMap = applyNoteSlide(trackEventsMap);
    // console.log('applyNoteSlide', deepClone(trackEventsMap));

    let trackKeyframes = transformToKeyframes(
        trackEventsMap,
        soundData.instruments,
        soundData.volume ?? MASTER_VOLUME_DEFAULT,
        totalSize,
        track,
        specName,
        waveformRegistry,
        modulationDataRegistry
    );
    // console.log('transformToKeyframes', deepClone(trackKeyframes));
    trackKeyframes = reduceKeyframes(trackKeyframes);
    // console.log('reduceKeyframes', deepClone(trackKeyframes));
    trackKeyframes = applyLoopPoint(trackKeyframes, loopPoint);
    // console.log('applyLoopPoint', deepClone(trackKeyframes));

    let trackKeyframesPrepared = transformToKeyframesPrepared(trackKeyframes, track.type, soundData);
    // console.log('transformToKeyframesPrepared', deepClone(trackKeyframesPrepared));
    trackKeyframesPrepared = setStartEvent(trackKeyframesPrepared, track.type);
    // console.log('setStartEvent', deepClone(trackKeyframesPrepared));

    return trackKeyframesPrepared;
};
