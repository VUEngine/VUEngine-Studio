import { deepClone, isString } from '@theia/core';
import { crc32 } from 'crc';
import { hexFromBitsArray, intToHex } from '../../Common/Utils';
import { ModulationData, VsuChannelEnvelopeData, VsuChannelIntervalData, VsuChannelStereoLevelsData, VsuChannelSweepModulationData, WaveformData } from '../Emulator/VsuTypes';
import { getVolumeEventValueFromStereoLevels } from '../SoundEditor';
import {
    EventsMap,
    InstrumentConfig,
    InstrumentMap,
    NOTES,
    PatternConfig,
    PatternMap,
    SET_INT_DEFAULT,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TrackConfig
} from '../SoundEditorTypes';

const NOTE_SLIDE_STEP_DURATION = 10;

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

const SxINT = (setInt: boolean, interval: VsuChannelIntervalData): string => hexFromBitsArray([
    // VUEngine's sound player handles channel enablement internally to reduce pops caused by
    // resetting the VSU's internal counter due to SxINT being set. We can set the flag manually
    // to force the counter reset.
    [Number(setInt), 1],
    [undefined, 1],
    [Number(interval.enabled), 1],
    [interval.value, 5]
]);

const SxLRV = (volume: VsuChannelStereoLevelsData): string => hexFromBitsArray([
    [volume.left, 4],
    [volume.right, 4]
]);

const SxFQ = (frequency: number): string => intToHex(frequency, 4);

const SxEV0 = (envelope: VsuChannelEnvelopeData): string => hexFromBitsArray([
    [envelope.initialValue, 4],
    [envelope.direction, 1],
    [envelope.stepTime, 3]
]);

const SxEV1 = (envelope: VsuChannelEnvelopeData, sweepMod: VsuChannelSweepModulationData, tap: number, type: SoundEditorTrackType): string => {
    if (type === SoundEditorTrackType.NOISE) {
        return hexFromBitsArray([
            [undefined, 1],
            [tap, 3],
            [undefined, 2],
            [Number(envelope.repeat), 1],
            [Number(envelope.enabled), 1]
        ]);
    } else {
        return hexFromBitsArray([
            [undefined, 1],
            [Number(sweepMod.enabled), 1],
            [Number(sweepMod.repeat), 1],
            [Number(sweepMod.function), 1],
            [undefined, 2],
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
): EventsMap => {
    const trackEventsMap: EventsMap = {};

    let patternStartStep = 0;
    let patternStepSize = 0;
    let pattern: PatternConfig = {} as PatternConfig;
    for (let step = 0; step < totalSize; step++) {
        // Does a pattern start at the current step?
        const sequenceStep = track.sequence[step / SUB_NOTE_RESOLUTION];
        if (sequenceStep) {
            pattern = patterns[sequenceStep];
            patternStepSize = pattern.size * SUB_NOTE_RESOLUTION;
            patternStartStep = step;
        }

        // Is there an event for the current step in the current pattern?
        const patternStep = step - patternStartStep;
        if (pattern.events && patternStep < patternStepSize && pattern.events[patternStep]) {
            trackEventsMap[step] = { ...pattern.events[patternStep] };
        }
    }

    return trackEventsMap;
};

// remove empty events
const filterEmptyEvents = (
    trackEventsMap: EventsMap,
): EventsMap => {
    const result: EventsMap = {};

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

// if there's no note at step 0, set volume to 0 initially
const applyTrackInitialVolume = (
    trackEventsMap: EventsMap,
    initialInstrument: InstrumentConfig,
): EventsMap => {
    const result: EventsMap = deepClone(trackEventsMap);

    const sortedTrackStepsWithNote: number[] = Object.keys(result)
        .map(step => parseInt(step))
        .filter(step => result[step][SoundEvent.Note] !== undefined)
        .sort((a, b) => a - b);
    if (sortedTrackStepsWithNote.length === 0) {
        return result;
    }

    const firstStepWithNote: number = Math.min(...sortedTrackStepsWithNote);
    if (firstStepWithNote && firstStepWithNote > 0) {
        result[0] = {
            [SoundEvent.Volume]: 0,
        };
        // set initial instrument volume on first step only if it does not set the volume explicitly
        if (result[firstStepWithNote][SoundEvent.Instrument] === undefined &&
            result[firstStepWithNote][SoundEvent.Volume] === undefined
        ) {
            result[firstStepWithNote][SoundEvent.Volume] = getVolumeEventValueFromStereoLevels(initialInstrument?.volume);
        }
    }

    return result;
};

// set initial instrument on step 0 for initialization
const applyTrackInitialInstrument = (
    trackEventsMap: EventsMap,
    initialInstrumentId: string,
): EventsMap => {
    const result: EventsMap = deepClone(trackEventsMap);

    if (result[0] !== undefined && result[0][SoundEvent.Instrument] === undefined) {
        result[0][SoundEvent.Instrument] = initialInstrumentId;
    }

    return result;
};

// set volume to 0 if a note's duration end before a new note plays
const applyNoteDuration = (
    trackEventsMap: EventsMap,
    initialInstrument: InstrumentConfig,
    instruments: InstrumentMap,
    totalSize: number,
): EventsMap => {
    const result: EventsMap = deepClone(trackEventsMap);

    const trackSteps: number[] = Object.keys(result).map(step => parseInt(step)).sort((a, b) => a - b);
    let lastVolume = getVolumeEventValueFromStereoLevels(initialInstrument?.volume);

    trackSteps.forEach((step, stepIndex) => {
        const stepEvents = result[step];

        // remember last set volume
        // explicit volume event has preference over instument event
        const instrumentId = stepEvents[SoundEvent.Instrument];
        if (instrumentId !== undefined) {
            const instrument = instruments[instrumentId];
            if (instrument !== undefined) {
                lastVolume = getVolumeEventValueFromStereoLevels(instrument.volume);
            }
        }
        const volume = stepEvents[SoundEvent.Volume];
        if (volume !== undefined) {
            lastVolume = volume;
        }

        // check duration expiration
        const duration = stepEvents[SoundEvent.Duration];
        const endStep = step + duration;
        if (duration !== undefined) {
            // follow all steps of duration
            for (let i = step + 1; i <= endStep; i++) {
                // if exceeding track length, stop
                if (i >= totalSize) {
                    break;
                }
                // if there's a note event along the way, stop
                if (result[i] !== undefined && result[i][SoundEvent.Note] !== undefined) {
                    break;
                }
                // if there's none until the final step...
                if (i === endStep &&
                    // ... and there's no explicit volume set at that step...
                    (result[i] === undefined || result[i][SoundEvent.Volume] === undefined)
                ) {
                    // ... then set volume to 0
                    result[i] = {
                        ...(result[i] ?? {}),
                        [SoundEvent.Volume]: 0,
                    };

                    // if there's a next step and it doesn't set the volume, reset it there
                    const nextStep = trackSteps[stepIndex + 1];
                    if (nextStep !== undefined) {
                        const nextStepEvents = result[nextStep];
                        if (nextStepEvents !== undefined &&
                            nextStepEvents[SoundEvent.Instrument] === undefined &&
                            nextStepEvents[SoundEvent.Volume] === undefined
                        ) {
                            result[nextStep] = {
                                ...(nextStepEvents ?? {}),
                                [SoundEvent.Volume]: lastVolume,
                            };
                        }
                    }
                }
            }
        }
    });

    return result;
};

// replace note labels with frequencies
const notesToFrequencies = (
    trackEventsMap: EventsMap,
): EventsMap => {
    const result: EventsMap = deepClone(trackEventsMap);

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
    trackEventsMap: EventsMap,
): EventsMap => {
    const result: EventsMap = deepClone(trackEventsMap);

    const sortedTrackSteps: number[] = Object.keys(result)
        .map(step => parseInt(step))
        .sort((a, b) => a - b);
    sortedTrackSteps.forEach(step => {
        const stepEvents = result[step];
        const noteSlide = stepEvents[SoundEvent.NoteSlide];
        if (noteSlide === undefined || noteSlide === 0) {
            return;
        }

        const note = stepEvents[SoundEvent.Note];
        const noteId = Object.values(NOTES).indexOf(note);
        const duration = stepEvents[SoundEvent.Duration];
        if (note === undefined || noteId === undefined || duration === undefined) {
            return;
        }

        const noteSlideDirection = noteSlide < 0 ? -1 : 1;
        const targetNote = Object.values(NOTES)[noteId - noteSlide];
        const distance = Math.abs(note - targetNote);

        const numberOfSteps = Math.round(duration / NOTE_SLIDE_STEP_DURATION);
        if (numberOfSteps <= 2) {
            return;
        }

        const changePerStep = Math.round(distance / numberOfSteps) * noteSlideDirection;

        for (let i = 0; i < numberOfSteps; i++) {
            const artificialStep = step + (i * NOTE_SLIDE_STEP_DURATION);
            if (result[artificialStep] === undefined) {
                result[artificialStep] = {};
            }
            result[artificialStep][SoundEvent.Note] = note + (i * changePerStep);
            result[artificialStep][SoundEvent.Duration] = NOTE_SLIDE_STEP_DURATION;
        }
    });

    return result;
};

// interpret events, transform to actual register values
const transformToKeyframes = (
    trackEventsMap: EventsMap,
    instruments: InstrumentMap,
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
    trackSteps.forEach(step => {
        const stepEvents = trackEventsMap[step];
        const keyframe: Keyframe = {};

        // note event
        if (stepEvents[SoundEvent.Note] !== undefined) {
            keyframe.SxFQ = SxFQ(stepEvents[SoundEvent.Note]);
        }

        // instrument event
        if (stepEvents[SoundEvent.Instrument] !== currentInstrumentId) {
            currentInstrumentId = stepEvents[SoundEvent.Instrument];
            currentInstrument = instruments[currentInstrumentId ?? track.instrument];

            keyframe.SxINT = SxINT(currentInstrument.setInt ?? SET_INT_DEFAULT, currentInstrument.interval);
            keyframe.SxLRV = SxLRV(currentInstrument.volume);
            keyframe.SxEV0 = SxEV0(currentInstrument.envelope);
            keyframe.SxEV1 = SxEV1(currentInstrument.envelope, currentInstrument.sweepMod, currentInstrument.tap, track.type);
            if (track.type !== SoundEditorTrackType.NOISE) {
                keyframe.SxRAM = SxRAM(specName, waveformRegistry, currentInstrument.waveform, track.type);
            }
            if (track.type === SoundEditorTrackType.SWEEPMOD) {
                keyframe.SxSWP = S5SWP(currentInstrument.sweepMod);
                keyframe.SxMOD = S5MOD(specName, modulationDataRegistry, currentInstrument.modulationData, currentInstrument.sweepMod, track.type);
            }
        }

        // volume event
        if (stepEvents[SoundEvent.Volume] !== undefined) {
            keyframe.SxLRV = SxLRV(stepEvents[SoundEvent.Volume]);
        }

        keyframeMap[step] = keyframe;
    });

    return {
        keyframeMap,
        loopKeyframe: 0,
        totalSize,
    };
};

// remove unnecessary steps, i.e. those which would cause no register value change
const reduceKeyframes = (
    trackKeyframes: TrackKeyframes,
): TrackKeyframes => {
    const result = deepClone(trackKeyframes);

    const trackSteps: number[] = Object.keys(trackKeyframes.keyframeMap).map(step => parseInt(step))
        .sort((a, b) => a - b)
        .reverse();

    // remove values that are same as previous occurence
    trackSteps.forEach(step => {
        const stepValues = trackKeyframes.keyframeMap[step];

        ['SxINT', 'SxLRV', 'SxEV0', 'SxEV1', 'SxRAM', 'SxSWP', 'SxMOD'].forEach(v => {
            // @ts-ignore
            if (stepValues[v] !== undefined) {
                let foundPrev = false;
                trackSteps.filter(prevStep => prevStep < step).forEach(prevStep => {
                    const prevStepValues = result.keyframeMap[prevStep];
                    // @ts-ignore
                    if (!foundPrev && prevStepValues[v] !== undefined) {
                        foundPrev = true;
                        // @ts-ignore
                        if (prevStepValues[v] === stepValues[v]) {
                            // @ts-ignore
                            delete result.keyframeMap[step][v];
                        }
                    }
                });
            }
        });
    });

    // remove empty keyframes
    trackSteps.forEach(step => {
        const stepValues = trackKeyframes.keyframeMap[step];

        if (Object.keys(stepValues).length === 0) {
            delete result.keyframeMap[step];
        }
    });

    return result;
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

    const loopKeyframe = Object.keys(result.keyframeMap).indexOf(`${loopPointStep}`);

    return {
        ...result,
        loopKeyframe,
    };
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

// transform to final return format with event flags
const transformToKeyframesPrepared = (
    trackKeyframes: TrackKeyframes,
    initialInstrument: InstrumentConfig,
    trackType: SoundEditorTrackType,
): TrackKeyframesPrepared => {
    const keyFrameSteps: number[] = Object.keys(trackKeyframes.keyframeMap).map(step => parseInt(step)).sort((a, b) => a - b);
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
        loopKeyframe: trackKeyframes.loopKeyframe,
    };

    // set volume on first keyframe
    const firstKeyframe = trackKeyframes.keyframeMap[keyFrameSteps[0]];
    if (firstKeyframe !== undefined && firstKeyframe.SxLRV === undefined) {
        trackKeyframes.keyframeMap[keyFrameSteps[0]].SxLRV = SxLRV(initialInstrument.volume);
    }

    keyFrameSteps.forEach((step, stepIndex) => {
        const stepKeyframe = trackKeyframes.keyframeMap[step];
        const duration: number = (keyFrameSteps[stepIndex + 1] ?? trackKeyframes.totalSize) - step;
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

        if (trackType === SoundEditorTrackType.SWEEPMOD) {
            flags.push(EventName.SweepMod);
        }
        if (trackType === SoundEditorTrackType.NOISE) {
            flags.push(EventName.Noise);
        }

        trackKeyframesPrepared.keyframes.push({ duration, flags });
    });

    return trackKeyframesPrepared;
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
    const initialInstrument = soundData.instruments[track.instrument];

    // console.log('-----------------------------------------------------');
    let trackEventsMap = mergePatterns(track, soundData.patterns, totalSize);
    // console.log('mergePatterns', deepClone(trackEventsMap));
    trackEventsMap = filterEmptyEvents(trackEventsMap);
    // console.log('filterEmptyEvents', deepClone(trackEventsMap));
    trackEventsMap = applyTrackInitialVolume(trackEventsMap, initialInstrument);
    // console.log('applyTrackInitialVolume', deepClone(trackEventsMap));
    trackEventsMap = applyTrackInitialInstrument(trackEventsMap, track.instrument);
    // console.log('applyTrackInitialInstrument', deepClone(trackEventsMap));
    trackEventsMap = notesToFrequencies(trackEventsMap);
    // console.log('notesToFrequencies', deepClone(trackEventsMap));
    trackEventsMap = applyNoteDuration(trackEventsMap, initialInstrument, soundData.instruments, totalSize);
    // console.log('applyNoteDuration', deepClone(trackEventsMap));
    trackEventsMap = applyNoteSlide(trackEventsMap);
    // console.log('applyNoteSlide', deepClone(trackEventsMap));

    let trackKeyframes = transformToKeyframes(trackEventsMap, soundData.instruments, totalSize, track, specName, waveformRegistry, modulationDataRegistry);
    // console.log('transformToKeyframes', deepClone(trackKeyframes));
    trackKeyframes = reduceKeyframes(trackKeyframes);
    // console.log('reduceKeyframes', deepClone(trackKeyframes));
    trackKeyframes = applyLoopPoint(trackKeyframes, loopPoint);
    // console.log('applyLoopPoint', deepClone(trackKeyframes));

    let trackKeyframesPrepared = transformToKeyframesPrepared(trackKeyframes, initialInstrument, track.type);
    // console.log('transformToKeyframesPrepared', deepClone(trackKeyframesPrepared));
    trackKeyframesPrepared = setStartEvent(trackKeyframesPrepared, track.type);
    // console.log('setStartEvent', deepClone(trackKeyframesPrepared));

    return trackKeyframesPrepared;
};
