import {
    VSU_ENVELOPE_INITIAL_VALUE_MAX,
    VSU_ENVELOPE_INITIAL_VALUE_MIN,
    VSU_VOLUME_DEFAULT,
    VSU_VOLUME_MAX,
    VSU_VOLUME_MIN,
    VsuChannelEnvelopeData,
    VsuChannelStereoLevelsData,
    VsuEnvelopeDirection
} from '../Emulator/VsuTypes';
import { INSTRUMENT_PANNING_MAX, InstrumentConfig } from '../SoundEditorTypes';

export interface InstrumentRegisterLevels {
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

// an enabled hardware envelope owns the envelope value, which then is at its peak at the start of a decay or the end of a grow
const getPeakEnvelopeValue = (envelope: VsuChannelEnvelopeData): number | undefined => {
    if (!envelope.enabled) {
        return undefined;
    }

    return envelope.direction === VsuEnvelopeDirection.Grow
        ? VSU_ENVELOPE_INITIAL_VALUE_MAX
        : envelope.initialValue;
};

// all volumes an instrument with the given envelope can reach, sorted ascending
export const getReachableVolumes = (envelope: VsuChannelEnvelopeData): number[] => {
    const peakEnvelopeValue = getPeakEnvelopeValue(envelope);
    const volumes = new Set<number>();
    for (let e = peakEnvelopeValue ?? VSU_ENVELOPE_INITIAL_VALUE_MIN; e <= (peakEnvelopeValue ?? VSU_ENVELOPE_INITIAL_VALUE_MAX); e++) {
        for (let l = VSU_VOLUME_MIN; l <= VSU_VOLUME_MAX; l++) {
            volumes.add(getVsuOutputLevel(l, e));
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

// find the register values that come closest to the instrument's volume and panning
export const getInstrumentRegisterLevels = (instrument: InstrumentConfig): InstrumentRegisterLevels => {
    const { volume, panning, envelope } = instrument;
    const targetLeft = panning > 0 ? volume * (1 - panning / INSTRUMENT_PANNING_MAX) : volume;
    const targetRight = panning < 0 ? volume * (1 + panning / INSTRUMENT_PANNING_MAX) : volume;

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

export const getVolumeAndPanningFromStereoLevels = (
    stereoLevels: VsuChannelStereoLevelsData,
    envelope: VsuChannelEnvelopeData
): VolumeAndPanning => {
    const envelopeValue = getPeakEnvelopeValue(envelope) ?? envelope.initialValue;
    const left = getVsuOutputLevel(stereoLevels.left, envelopeValue);
    const right = getVsuOutputLevel(stereoLevels.right, envelopeValue);
    const louder = Math.max(left, right);
    if (louder === 0) {
        return { volume: 0, panning: 0 };
    }

    const panning = Math.round(INSTRUMENT_PANNING_MAX * (1 - Math.min(left, right) / louder));

    return {
        volume: louder,
        panning: panning === 0
            ? 0
            : left > right ? -panning : panning,
    };
};
