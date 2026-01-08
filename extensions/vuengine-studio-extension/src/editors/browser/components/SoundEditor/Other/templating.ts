import { crc32 } from 'crc';
import { hexFromBitsArray, intToHex } from '../../Common/Utils';
import { ModulationData, VsuChannelEnvelopeData, VsuChannelIntervalData, VsuChannelStereoLevelsData, VsuChannelSweepModulationData, WaveformData } from '../Emulator/VsuTypes';
import { BAR_NOTE_RESOLUTION, NOTES, PatternConfig, SEQUENCER_RESOLUTION, SoundData, SoundEditorTrackType, TrackConfig } from '../SoundEditorTypes';

interface Keyframe {
    duration: number,
    flags: EventName[]
}

interface TrackKeyframes {
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
    keyframes: Keyframe[],
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

const SxRAM = (sanitizedSpecName: string, waveformRegistry: WaveformData[], waveform: WaveformData, type: SoundEditorTrackType): string => {
    if (type !== SoundEditorTrackType.NOISE) {
        const checksum = crc32(JSON.stringify(waveform));
        return `&${sanitizedSpecName}Waveform${waveformRegistry[checksum]}`;
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
    sanitizedSpecName: string,
    modulationDataRegistry: ModulationData[],
    modData: ModulationData,
    sweepMod: VsuChannelSweepModulationData,
    type: SoundEditorTrackType
): string => {
    if (type === SoundEditorTrackType.SWEEPMOD && sweepMod.function) {
        const checksum = crc32(JSON.stringify(modData));
        return `${sanitizedSpecName}ModulationData${modulationDataRegistry[checksum]}`;
    }

    return 'NULL';
};

const getBaseEvents = (
    track: TrackConfig,
    sanitizedSpecName: string,
    totalSize: number,
    loopPoint: number,
    waveformRegistry: WaveformData[],
    modulationDataRegistry: ModulationData[],
    soundData: SoundData
): TrackKeyframes => {
    const defaultInstrumentId = track.instrument;
    const defaultInstrument = soundData.instruments[defaultInstrumentId];

    const result = {
        values: {
            SxINT: [SxINT(true, defaultInstrument.interval)],
            SxLRV: ['0x00'], // Explicit silent note. Initial instrument's volume is set on the first event.
            SxFQ: ['0x0000'],
            SxEV0: [SxEV0(defaultInstrument.envelope)],
            SxEV1: [SxEV1(defaultInstrument.envelope, defaultInstrument.sweepMod, defaultInstrument.tap, track.type)],
            SxRAM: [SxRAM(sanitizedSpecName, waveformRegistry, defaultInstrument.waveform, track.type)],
            SxSWP: [S5SWP(defaultInstrument.sweepMod)],
            SxMOD: [S5MOD(sanitizedSpecName, modulationDataRegistry, defaultInstrument.modulationData, defaultInstrument.sweepMod, track.type)],
        },
        keyframes: [{
            duration: 0,
            flags: [EventName.Start]
        }],
        loopKeyframe: 0,
    };

    let initialVolumeSet = false;
    let prevNoteStep = 0;
    let currentInstrumentId = defaultInstrumentId;
    let currentNoteDuration = -1;
    let needsVolumeReset = false;
    let pattern: PatternConfig | undefined;
    let patternStartStep: number = 0;
    let event;
    let flags: EventName[];

    for (let step = 0; step < totalSize; step++) {
        // Update running variables
        currentNoteDuration--;

        // Does a pattern start at the current step?
        if (track.sequence[step / BAR_NOTE_RESOLUTION * SEQUENCER_RESOLUTION]) {
            pattern = soundData.patterns[track.sequence[step / BAR_NOTE_RESOLUTION * SEQUENCER_RESOLUTION]];
            patternStartStep = step;
        }

        // Is there an event for the current step in the current pattern?
        if (pattern && pattern.events[step - patternStartStep]) {
            event = pattern.events[step - patternStartStep];
            flags = [];

            // "PLAY NOTE" EVENT
            if (event['note'] !== undefined) {
                flags.push(EventName.SxFQ);
                result.values.SxFQ.push(SxFQ(NOTES[event['note']]));
                currentNoteDuration = -1;
                if (event['duration'] !== undefined) {
                    currentNoteDuration = event['duration'];
                }
            }

            // "VOLUME CHANGE" EVENT
            if (event['volume'] !== undefined) {
                const newValueSxLRV = intToHex(event['volume'], 2);
                if (result.values.SxLRV[result.values.SxLRV.length - 1] !== newValueSxLRV) {
                    flags.push(EventName.SxLRV);
                    result.values.SxLRV.push(newValueSxLRV);
                }
            }

            // "INSTRUMENT CHANGE" EVENT
            // Change back to default instrument if none set
            if (event['instrument'] !== currentInstrumentId) {
                let newInstrumentId = defaultInstrumentId;
                if (event['instrument'] !== undefined) {
                    newInstrumentId = event['instrument'];
                }
                currentInstrumentId = newInstrumentId;
                const newInstrument = soundData.instruments[newInstrumentId];

                const newValueSxINT = SxINT(true, newInstrument.interval);
                if (result.values.SxINT[result.values.SxINT.length - 1] !== newValueSxINT) {
                    flags.push(EventName.SxINT);
                    result.values.SxINT.push(newValueSxINT);
                }

                const newValueSxLRV = SxLRV(newInstrument.volume);
                if (result.values.SxLRV[result.values.SxLRV.length - 1] !== newValueSxLRV) {
                    flags.push(EventName.SxLRV);
                    result.values.SxLRV.push(newValueSxLRV);
                }

                const newValueSxEV0 = SxEV0(newInstrument.envelope);
                if (result.values.SxEV0[result.values.SxEV0.length - 1] !== newValueSxEV0) {
                    flags.push(EventName.SxEV0);
                    result.values.SxEV0.push(newValueSxEV0);
                }

                const newValueSxEV1 = SxEV1(newInstrument.envelope, newInstrument.sweepMod, newInstrument.tap, track.type);
                if (result.values.SxEV1[result.values.SxEV1.length - 1] !== newValueSxEV1) {
                    flags.push(EventName.SxEV1);
                    result.values.SxEV1.push(newValueSxEV1);
                }

                if (track.type !== SoundEditorTrackType.NOISE) {
                    const newValueSxRAM = SxRAM(sanitizedSpecName, waveformRegistry, newInstrument.waveform, track.type);
                    if (result.values.SxRAM[result.values.SxRAM.length - 1] !== newValueSxRAM) {
                        flags.push(EventName.SxRAM);
                        result.values.SxRAM.push(newValueSxRAM);
                    }
                }

                if (track.type === SoundEditorTrackType.SWEEPMOD) {
                    const newValueSxSWP = S5SWP(newInstrument.sweepMod);
                    if (result.values.SxSWP[result.values.SxSWP.length - 1] !== newValueSxSWP) {
                        flags.push(EventName.SxSWP);
                        result.values.SxSWP.push(newValueSxSWP);
                    }
                    const newValueSxMOD = S5MOD(sanitizedSpecName, modulationDataRegistry, newInstrument.modulationData, newInstrument.sweepMod, track.type);
                    if (result.values.SxMOD[result.values.SxMOD.length - 1] !== newValueSxMOD) {
                        flags.push(EventName.SxMOD);
                        result.values.SxMOD.push(newValueSxMOD);
                    }
                }
            }

            // Set initial volume on the very first event (after the start event)
            if (!initialVolumeSet) {
                initialVolumeSet = true;
                // Do nothing if the event sets the volume explicitly
                if (!flags.includes(EventName.SxLRV)) {
                    flags.push(EventName.SxLRV);
                    result.values.SxLRV.push(SxLRV(defaultInstrument.volume));
                }
            }

            // Ensure events for sweep/mod and noise are played on the respective channels
            if (track.type === SoundEditorTrackType.SWEEPMOD) {
                flags.push(EventName.SweepMod);
            }
            if (track.type === SoundEditorTrackType.NOISE) {
                flags.push(EventName.Noise);
            }

            // Now that it is known, set duration on the previous event
            const keyframe = {
                duration: step - prevNoteStep,
                flags: result.keyframes[result.keyframes.length - 1].flags
            };
            result.keyframes[result.keyframes.length - 1] = keyframe;

            // Finally, append to list of keyframes
            result.keyframes.push({ duration: 0, flags: flags });

            // Take note of this note's step to compute its duration later
            prevNoteStep = step;
        } else {
            event = {};
            flags = [];
        }

        // Mute if note duration is over, or reset if note event is set
        // Ignore, if LRV gets set anyway in the current keyframe or new value is same as previous
        if (currentNoteDuration === 0) {
            if (result.values.SxLRV[result.values.SxLRV.length - 1] !== '0x00' && !flags.includes(EventName.SxLRV)) {
                needsVolumeReset = true;

                // Add new keyframe if there is none
                if (prevNoteStep !== step) {
                    // Set duration on the previous event
                    result.keyframes[result.keyframes.length - 1] = {
                        duration: step - prevNoteStep,
                        flags: result.keyframes[result.keyframes.length - 1].flags
                    };

                    // Add new keyframe
                    result.values.SxLRV.push('0x00');
                    result.keyframes.push({ duration: 0, flags: [EventName.SxLRV] });

                    prevNoteStep = step;
                } else {
                    flags.push(EventName.SxLRV);
                    result.values.SxLRV.push('0x00');
                }
            }
        } else if (needsVolumeReset && event['note']) {
            needsVolumeReset = false;
            if (!flags.includes(EventName.SxLRV)) {
                const newValueSxLRV = SxLRV(soundData.instruments[currentInstrumentId].volume);
                if (result.values.SxLRV[result.values.SxLRV.length - 1] !== newValueSxLRV) {
                    flags.push(EventName.SxLRV);
                    result.values.SxLRV.push(newValueSxLRV);
                }
            }
        }

        // Find loop back keyframe
        if (loopPoint > 0 && step === (loopPoint * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION)) {
            // Add "dummy" keyframe to loop back to if there is none at this step
            if (prevNoteStep !== step) {
                // Set duration on the previous event
                result.keyframes[result.keyframes.length - 1] = {
                    duration: step - prevNoteStep,
                    flags: result.keyframes[result.keyframes.length - 1].flags
                };

                // Add empty keyframe
                result.keyframes.push({ duration: 0, flags: [] });

                prevNoteStep = step;
            }

            result.loopKeyframe = result.keyframes.length - 1;
        }

        if (step === totalSize - 1) {
            // Set duration of the last event
            result.keyframes[result.keyframes.length - 1] = {
                duration: step - prevNoteStep + 1,
                flags: result.keyframes[result.keyframes.length - 1].flags
            };
        }
    }

    return result;
};

export const getTrackKeyframes = (
    track: TrackConfig,
    sanitizedSpecName: string,
    totalSize: number,
    loopPoint: number,
    waveformRegistry: WaveformData[],
    modulationDataRegistry: ModulationData[],
    soundData: SoundData
): TrackKeyframes => {
    const result = getBaseEvents(track, sanitizedSpecName, totalSize, loopPoint, waveformRegistry, modulationDataRegistry, soundData);

    return result;
};
