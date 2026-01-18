import { crc32 } from 'crc';
import { hexFromBitsArray, intToHex } from '../../Common/Utils';
import { ModulationData, VsuChannelEnvelopeData, VsuChannelIntervalData, VsuChannelStereoLevelsData, VsuChannelSweepModulationData, WaveformData } from '../Emulator/VsuTypes';
import {
    BAR_NOTE_RESOLUTION,
    EventsMap,
    InstrumentConfig,
    InstrumentMap,
    NOTES,
    PatternConfig,
    PatternMap,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TrackConfig
} from '../SoundEditorTypes';
import { isString } from '@theia/core';

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

const zeroVolume = {
    left: 0,
    right: 0
} as VsuChannelStereoLevelsData;

const SxINT = (channelEnabled: boolean, interval: VsuChannelIntervalData): string => hexFromBitsArray([
    [Number(channelEnabled), 1],
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
        const sequenceStep = track.sequence[step / BAR_NOTE_RESOLUTION * SEQUENCER_RESOLUTION];
        if (sequenceStep) {
            pattern = patterns[sequenceStep];
            patternStepSize = pattern.size * SUB_NOTE_RESOLUTION * SEQUENCER_RESOLUTION;
            patternStartStep = step;
        }

        // Is there an event for the current step in the current pattern?
        const patternStep = step - patternStartStep;
        if (pattern.events && patternStep < patternStepSize && pattern.events[patternStep]) {
            trackEventsMap[step] = pattern.events[patternStep];
        }
    }

    return trackEventsMap;
};

// if there's no note at step 0, set volume to 0 initially
const applyTrackInitialVolume = (
    trackEventsMap: EventsMap,
    initialInstrument: InstrumentConfig,
): EventsMap => {
    trackEventsMap[0][SoundEvent.Instrument] = initialInstrument;
    const trackSteps: number[] = Object.keys(trackEventsMap).map(step => parseInt(step)).sort((a, b) => a - b);
    const firstStep: number = trackSteps[0];
    if (firstStep > 0 && firstStep !== undefined) {
        trackEventsMap[0] = {
            [SoundEvent.Volume]: zeroVolume,
        };
        // set initial instrument volume on first step only if it does not set the volume explicitly
        if (trackEventsMap[firstStep][SoundEvent.Volume] === undefined) {
            trackEventsMap[firstStep][SoundEvent.Volume] = initialInstrument?.volume ?? zeroVolume;
        }
    }

    return trackEventsMap;
};

// set volume to 0 if a note's duration end before a new note plays
const applyNoteDuration = (
    trackEventsMap: EventsMap,
    initialInstrument: InstrumentConfig,
    instruments: InstrumentMap,
    totalSize: number,
): EventsMap => {
    const trackSteps: number[] = Object.keys(trackEventsMap).map(step => parseInt(step)).sort((a, b) => a - b);
    let lastVolume = initialInstrument?.volume ?? zeroVolume;

    trackSteps.forEach((step, stepIndex) => {
        const stepEvents = trackEventsMap[step];

        // remember last set volume
        // explicit volume event has preference over instument event
        const instrumentId = stepEvents[SoundEvent.Instrument];
        if (instrumentId !== undefined) {
            const instrument = instruments[instrumentId];
            if (instrument !== undefined) {

                lastVolume = instrument.volume;
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
                if (trackEventsMap[i] !== undefined && trackEventsMap[i][SoundEvent.Note] !== undefined) {
                    break;
                }
                // if there's none until the final step...
                if (i === endStep &&
                    // ... and there's no explicit volume set at that step...
                    (trackEventsMap[i] === undefined || trackEventsMap[i][SoundEvent.Volume] === undefined)
                ) {
                    // ... then set volume to 0
                    trackEventsMap[i] = {
                        ...(trackEventsMap[i] ?? {}),
                        [SoundEvent.Volume]: zeroVolume,
                    };

                    // if there's a next step and it doesn't set the volume, reset it there
                    const nextStep = trackSteps[stepIndex + 1];
                    if (nextStep !== undefined) {
                        const nextStepEvents = trackEventsMap[nextStep];
                        if (nextStepEvents !== undefined &&
                            nextStepEvents[SoundEvent.Instrument] === undefined &&
                            nextStepEvents[SoundEvent.Volume] === undefined
                        ) {
                            trackEventsMap[nextStep] = {
                                ...(nextStepEvents ?? {}),
                                [SoundEvent.Volume]: lastVolume,
                            };
                        }
                    }
                }
            }
        }
    });

    return trackEventsMap;
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
    trackSteps.forEach(step => {
        const stepEvents = trackEventsMap[step];
        const keyframe: Keyframe = {};

        // note event
        if (stepEvents[SoundEvent.Note] !== undefined) {
            if (isString(stepEvents[SoundEvent.Note]) && NOTES[stepEvents[SoundEvent.Note]] !== undefined) {
                keyframe.SxFQ = SxFQ(NOTES[stepEvents[SoundEvent.Note]]);
            }
        }

        // instrument event
        if (stepEvents[SoundEvent.Instrument] !== currentInstrumentId) {
            currentInstrumentId = stepEvents[SoundEvent.Instrument];

            const newInstrument = instruments[currentInstrumentId ?? track.instrument];

            keyframe.SxINT = SxINT(true, newInstrument.interval);
            keyframe.SxLRV = SxLRV(newInstrument.volume);
            keyframe.SxEV0 = SxEV0(newInstrument.envelope);
            keyframe.SxEV1 = SxEV1(newInstrument.envelope, newInstrument.sweepMod, newInstrument.tap, track.type);
            if (track.type !== SoundEditorTrackType.NOISE) {
                keyframe.SxRAM = SxRAM(specName, waveformRegistry, newInstrument.waveform, track.type);
            }
            if (track.type === SoundEditorTrackType.SWEEPMOD) {
                keyframe.SxSWP = S5SWP(newInstrument.sweepMod);
                keyframe.SxMOD = S5MOD(specName, modulationDataRegistry, newInstrument.modulationData, newInstrument.sweepMod, track.type);
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
                    const prevStepValues = trackKeyframes.keyframeMap[prevStep];
                    // @ts-ignore
                    if (!foundPrev && prevStepValues[v] !== undefined) {
                        foundPrev = true;
                        // @ts-ignore
                        if (prevStepValues[v] === stepValues[v]) {
                            // @ts-ignore
                            delete stepValues[v];
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
            delete trackKeyframes.keyframeMap[step];
        }
    });

    return trackKeyframes;
};

// find keyframe (step index) of looping point
const applyLoopPoint = (
    trackKeyframes: TrackKeyframes,
    loopPoint: number,
): TrackKeyframes => {
    const loopPointStep = loopPoint * SUB_NOTE_RESOLUTION * SEQUENCER_RESOLUTION;

    // create dummy event if none exists at loop point
    if (trackKeyframes.keyframeMap[loopPointStep] === undefined) {
        trackKeyframes.keyframeMap[loopPointStep] = {};
    }

    const loopKeyframe = Object.keys(trackKeyframes.keyframeMap).indexOf(`${loopPointStep}`);

    return {
        ...trackKeyframes,
        loopKeyframe,
    };
};

// transform to final return format with event flags
const transformToKeyframesPrepared = (
    trackKeyframes: TrackKeyframes,
    initialInstrument: InstrumentConfig,
    trackType: SoundEditorTrackType,
    specName: string,
    waveformRegistry: WaveformData[],
    modulationDataRegistry: ModulationData[],
): TrackKeyframesPrepared => {
    const keyFrameSteps: number[] = Object.keys(trackKeyframes.keyframeMap).map(step => parseInt(step)).sort((a, b) => a - b);
    const trackKeyframesPrepared: TrackKeyframesPrepared = {
        values: {
            SxEV0: [SxEV0(initialInstrument.envelope)],
            SxEV1: [SxEV1(initialInstrument.envelope, initialInstrument.sweepMod, initialInstrument.tap, trackType)],
            SxFQ: ['0x0000'],
            SxINT: [SxINT(true, initialInstrument.interval)],
            SxLRV: ['0x00'], // explicit silent note. initial instrument's volume is set on the first event.
            SxRAM: [SxRAM(specName, waveformRegistry, initialInstrument.waveform, trackType)],
            SxSWP: [S5SWP(initialInstrument.sweepMod)],
            SxMOD: [S5MOD(specName, modulationDataRegistry, initialInstrument.modulationData, initialInstrument.sweepMod, trackType)],
        },
        keyframes: [{
            duration: keyFrameSteps[0],
            flags: [EventName.Start]
        }],
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

    let trackEventsMap = mergePatterns(track, soundData.patterns, totalSize);
    console.log('-----------------------------------------------------1');
    console.log('-----------------------------------------------------2');
    console.log('-----------------------------------------------------3');
    console.log('mergePatterns', trackEventsMap);
    trackEventsMap = applyTrackInitialVolume(trackEventsMap, initialInstrument);
    console.log('applyTrackInitialVolume', trackEventsMap);
    trackEventsMap = applyNoteDuration(trackEventsMap, initialInstrument, soundData.instruments, totalSize);
    console.log('applyNoteDuration', trackEventsMap);

    let trackKeyframes = transformToKeyframes(trackEventsMap, soundData.instruments, totalSize, track, specName, waveformRegistry, modulationDataRegistry);
    console.log('transformToKeyframes', trackKeyframes);
    trackKeyframes = reduceKeyframes(trackKeyframes);
    console.log('reduceKeyframes', trackKeyframes);
    trackKeyframes = applyLoopPoint(trackKeyframes, loopPoint);
    console.log('applyLoopPoint', trackKeyframes);

    const trackKeyframesPrepared = transformToKeyframesPrepared(trackKeyframes, initialInstrument, track.type, specName, waveformRegistry, modulationDataRegistry);
    console.log('transformToKeyframesPrepared', trackKeyframesPrepared);

    return trackKeyframesPrepared;
};
