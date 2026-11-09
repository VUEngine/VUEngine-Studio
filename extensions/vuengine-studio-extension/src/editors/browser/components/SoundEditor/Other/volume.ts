import {
    VSU_ENVELOPE_INITIAL_VALUE_MAX,
    VSU_ENVELOPE_INITIAL_VALUE_MIN,
    VSU_ENVELOPE_STEP_TIME_VALUES,
    VSU_VOLUME_DEFAULT,
    VSU_VOLUME_MAX,
    VSU_VOLUME_MIN,
    VsuChannelEnvelopeData,
    VsuChannelStereoLevelsData,
    VsuEnvelopeDirection
} from '../Emulator/VsuTypes';
import { clamp } from '../../Common/Utils';
import {
    INSTRUMENT_PANNING_MAX,
    INSTRUMENT_PANNING_MIN,
    INSTRUMENT_VOLUME_MAX,
    InstrumentConfig,
    MASTER_VOLUME_DEFAULT,
    MASTER_VOLUME_EVENT_MAX,
    PANNING_STEPS
} from '../SoundEditorTypes';

export interface RegisterLevels {
    stereoLevels: VsuChannelStereoLevelsData
    envelopeInitialValue: number
}

// stereo levels used by imported instruments
export const DEFAULT_STEREO_LEVELS: VsuChannelStereoLevelsData = {
    left: VSU_VOLUME_DEFAULT,
    right: VSU_VOLUME_DEFAULT,
};

interface VolumeAndPanning {
    volume: number
    panning: number
}

// the output level the VSU computes for one side of a channel
export const getVsuOutputLevel = (stereoLevel: number, envelopeValue: number): number =>
    ((stereoLevel * envelopeValue) >> 3) + (stereoLevel !== 0 && envelopeValue !== 0 ? 1 : 0);

const VSU_OUTPUT_LEVEL_MAX = getVsuOutputLevel(VSU_VOLUME_MAX, VSU_ENVELOPE_INITIAL_VALUE_MAX);

const outputLevelToVolume = (outputLevel: number): number => Math.round(outputLevel * INSTRUMENT_VOLUME_MAX / VSU_OUTPUT_LEVEL_MAX);

export const panningStepToPanning = (step: number): number => Math.round(step * INSTRUMENT_PANNING_MAX / PANNING_STEPS);

export const panningToPanningStep = (panning: number): number => Math.round(panning * PANNING_STEPS / INSTRUMENT_PANNING_MAX);

export const snapPanning = (panning: number): number => panningStepToPanning(panningToPanningStep(panning));

// the closest volume the VSU can put out
export const snapVolume = (volume: number): number => getReachableVolumes({
    enabled: false,
    repeat: false,
    direction: VsuEnvelopeDirection.Decay,
    initialValue: VSU_ENVELOPE_INITIAL_VALUE_MAX,
    stepTime: 0,
}).reduce((closest, v) => Math.abs(v - volume) < Math.abs(closest - volume) ? v : closest);

// an enabled hardware envelope owns the envelope value, which then is at its peak at the start of a decay or the end of a grow
const getPeakEnvelopeValue = (envelope: VsuChannelEnvelopeData): number | undefined => {
    if (!envelope.enabled) {
        return undefined;
    }

    return envelope.direction === VsuEnvelopeDirection.Grow
        ? VSU_ENVELOPE_INITIAL_VALUE_MAX
        : envelope.initialValue;
};

// all volumes an instrument with the given envelope can reach, in percent, sorted ascending
export const getReachableVolumes = (envelope: VsuChannelEnvelopeData): number[] => {
    const peakEnvelopeValue = getPeakEnvelopeValue(envelope);
    const volumes = new Set<number>();
    for (let e = peakEnvelopeValue ?? VSU_ENVELOPE_INITIAL_VALUE_MIN; e <= (peakEnvelopeValue ?? VSU_ENVELOPE_INITIAL_VALUE_MAX); e++) {
        for (let l = VSU_VOLUME_MIN; l <= VSU_VOLUME_MAX; l++) {
            volumes.add(outputLevelToVolume(getVsuOutputLevel(l, e)));
        }
    }

    return [...volumes].sort((a, b) => a - b);
};

const getClosestStereoLevel = (targetLevel: number, envelopeValue: number): { level: number, error: number } => {
    let result = { level: VSU_VOLUME_MIN, error: Infinity };
    for (let l = VSU_VOLUME_MIN; l <= VSU_VOLUME_MAX; l++) {
        const error = (getVsuOutputLevel(l, envelopeValue) - targetLevel) ** 2;
        if (error < result.error) {
            result = { level: l, error };
        }
    }

    return result;
};

// volume and panning events replace the instrument's settings until the next event or a note with a different instrument
// the master volume scales all of them, limited to the maximum volume
export const getEffectiveVolumeAndPanning = (
    instrument: InstrumentConfig,
    volumeEvent: number | undefined,
    panningEvent: number | undefined,
    masterVolume: number
): VolumeAndPanning => ({
    volume: Math.min(INSTRUMENT_VOLUME_MAX, (volumeEvent ?? instrument.volume) * masterVolume / MASTER_VOLUME_DEFAULT),
    panning: clamp(panningEvent ?? instrument.panning, INSTRUMENT_PANNING_MIN, INSTRUMENT_PANNING_MAX),
});

// the sound's master volume, scaled by a master volume event
export const getMasterVolume = (soundMasterVolume: number, masterVolumeEvent: number): number =>
    soundMasterVolume * masterVolumeEvent / MASTER_VOLUME_EVENT_MAX;

// find the register values that come closest to the given volume and panning percentages
export const getRegisterLevels = (volume: number, panning: number, envelope: VsuChannelEnvelopeData): RegisterLevels => {
    const outputLevel = volume * VSU_OUTPUT_LEVEL_MAX / INSTRUMENT_VOLUME_MAX;
    const targetLeft = panning > 0 ? outputLevel * (1 - panning / INSTRUMENT_PANNING_MAX) : outputLevel;
    const targetRight = panning < 0 ? outputLevel * (1 + panning / INSTRUMENT_PANNING_MAX) : outputLevel;

    const peakEnvelopeValue = getPeakEnvelopeValue(envelope);
    let best = { left: VSU_VOLUME_MIN, right: VSU_VOLUME_MIN, envelopeValue: VSU_ENVELOPE_INITIAL_VALUE_MAX, error: Infinity };
    // go from highest to lowest envelope value, so ties resolve to the highest one
    for (let e = peakEnvelopeValue ?? VSU_ENVELOPE_INITIAL_VALUE_MAX; e >= (peakEnvelopeValue ?? VSU_ENVELOPE_INITIAL_VALUE_MIN); e--) {
        const left = getClosestStereoLevel(targetLeft, e);
        const right = getClosestStereoLevel(targetRight, e);
        if (left.error + right.error < best.error) {
            best = { left: left.level, right: right.level, envelopeValue: e, error: left.error + right.error };
        }
    }

    return {
        stereoLevels: {
            left: best.left,
            right: best.right,
        },
        envelopeInitialValue: envelope.enabled ? envelope.initialValue : best.envelopeValue,
    };
};

export const getPanningLabel = (panning: number): string => panning < 0
    ? `L${-panning}`
    : panning > 0
        ? `R${panning}`
        : 'C';

const getVolumeAndPanningFromOutputLevels = (left: number, right: number): VolumeAndPanning => {
    const louder = Math.max(left, right);
    if (louder === 0) {
        return { volume: 0, panning: 0 };
    }

    const panning = INSTRUMENT_PANNING_MAX * (1 - Math.min(left, right) / louder);

    return {
        volume: outputLevelToVolume(louder),
        panning: left > right ? -panning : panning,
    };
};

export const getVolumeAndPanningFromStereoLevels = (
    stereoLevels: VsuChannelStereoLevelsData,
    envelope: VsuChannelEnvelopeData
): VolumeAndPanning => {
    const envelopeValue = getPeakEnvelopeValue(envelope) ?? envelope.initialValue;
    const { volume, panning } = getVolumeAndPanningFromOutputLevels(
        getVsuOutputLevel(stereoLevels.left, envelopeValue),
        getVsuOutputLevel(stereoLevels.right, envelopeValue)
    );

    return {
        volume,
        panning: snapPanning(panning) || 0,
    };
};

// the value a note's hardware envelope has reached after the given time
export const getEnvelopeValueAt = (envelope: VsuChannelEnvelopeData, elapsedMs: number): number => {
    const steps = Math.floor(elapsedMs / VSU_ENVELOPE_STEP_TIME_VALUES[envelope.stepTime]);
    if (envelope.direction === VsuEnvelopeDirection.Grow) {
        return envelope.repeat
            ? envelope.initialValue + steps % (VSU_ENVELOPE_INITIAL_VALUE_MAX - envelope.initialValue + 1)
            : Math.min(VSU_ENVELOPE_INITIAL_VALUE_MAX, envelope.initialValue + steps);
    }

    return envelope.repeat
        ? envelope.initialValue - steps % (envelope.initialValue + 1)
        : Math.max(VSU_ENVELOPE_INITIAL_VALUE_MIN, envelope.initialValue - steps);
};

// the volume the VSU puts out for the given stereo levels and envelope value
export const getOutputVolume = (stereoLevels: VsuChannelStereoLevelsData, envelopeValue: number): number =>
    outputLevelToVolume(getVsuOutputLevel(Math.max(stereoLevels.left, stereoLevels.right), envelopeValue));
