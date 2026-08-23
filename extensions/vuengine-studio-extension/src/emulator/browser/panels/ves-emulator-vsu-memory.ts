/**
 * The VSU's (Virtual Sound Unit) memory map, and decoders for the registers
 * living in it.
 *
 * Base addresses and the register block's layout are transcribed from
 * `applications/electron/vb/libgccvb/source/audio.h`. That header's own bit
 * tables are hedged ("this table is for the most part untested, but looks to
 * be accurate"), so the per-bit layout below instead follows the more
 * trustworthy source: the encoder this project already ships for these same
 * registers, `.../editors/browser/components/SoundEditor/Other/templating.ts`
 * (the SxINT/SxLRV/SxEV0/SxEV1/S5SWP functions), which real ROMs are built
 * with and is therefore exercised on every VSU sound they play. Its packing
 * order, read from LSB up, is reproduced here as unpacking, from bit 0 up.
 *
 * Everything in this module is pure so it can be reasoned about, and reused,
 * without a running emulator.
 */

/**
 * Five waveform banks, each 32 samples. Like the VIP's VRAM, the VSU's bus is
 * wider than the eight-bit values it stores, so only every fourth byte holds
 * a sample; the rest is unused padding.
 */
export const VSU_WAVEFORM_BASES = [0x01000000, 0x01000080, 0x01000100, 0x01000180, 0x01000200];
export const VSU_WAVEFORM_COUNT = VSU_WAVEFORM_BASES.length;
export const VSU_WAVEFORM_SAMPLES = 32;
export const VSU_WAVEFORM_SAMPLE_STRIDE = 4;
export const VSU_WAVEFORM_BYTES = VSU_WAVEFORM_SAMPLES * VSU_WAVEFORM_SAMPLE_STRIDE;

/** Modulation data: the one channel in Modulation mode reads its frequency deltas from here. Same layout as a waveform bank. */
export const VSU_MODULATION_BASE = 0x01000280;
export const VSU_MODULATION_SAMPLES = 32;

/** Six channel register blocks, 0x40 bytes apart, starting here. */
export const VSU_REGISTER_BASE = 0x01000400;
export const VSU_CHANNEL_STRIDE = 0x40;
export const VSU_CHANNEL_COUNT = 6;
export const VSU_REGISTER_BLOCK_BYTES = VSU_CHANNEL_COUNT * VSU_CHANNEL_STRIDE;

/** Write-only: any write here silences every channel at once. Not part of the readable register block. */
export const VSU_SSTOP = 0x01000580;

export function vsuChannelAddress(index: number): number {
    return VSU_REGISTER_BASE + index * VSU_CHANNEL_STRIDE;
}

/** Register offsets in bytes, from a channel's own base. */
export enum VsuChannelRegister {
    SxINT = 0x00,
    SxLRV = 0x04,
    SxFQL = 0x08,
    SxFQH = 0x0c,
    SxEV0 = 0x10,
    SxEV1 = 0x14,
    /** Waveform bank select. Channels 0-4 (every channel but Noise) only. */
    SxRAM = 0x18,
    /** Sweep/Modulation control. Channel 4 (Sweep/Modulation) only. */
    S5SWP = 0x1c,
}

export enum VsuChannelKind {
    WAVE1 = 0,
    WAVE2 = 1,
    WAVE3 = 2,
    WAVE4 = 3,
    SWEEP = 4,
    NOISE = 5,
}

export const VSU_CHANNEL_NAMES: Record<VsuChannelKind, string> = {
    [VsuChannelKind.WAVE1]: 'Wave 1',
    [VsuChannelKind.WAVE2]: 'Wave 2',
    [VsuChannelKind.WAVE3]: 'Wave 3',
    [VsuChannelKind.WAVE4]: 'Wave 4',
    [VsuChannelKind.SWEEP]: 'Sw./Mod.',
    [VsuChannelKind.NOISE]: 'Noise',
};

export enum VsuEnvelopeDirection {
    DECAY = 0,
    GROW = 1,
}

export enum VsuSweepModulationFunction {
    SWEEP = 0,
    MODULATION = 1,
}

export enum VsuSweepDirection {
    DOWN = 0,
    UP = 1,
}

/** Milliseconds per envelope step, indexed by SxEV0's three-bit step time. */
export const VSU_ENVELOPE_STEP_TIME_MS = [15.4, 30.7, 46.1, 61.4, 76.8, 92.2, 107.5, 122.9];

/** Milliseconds per interval, indexed by SxINT's five-bit interval value. */
export const VSU_INTERVAL_DURATION_MS = [
    3.8, 7.7, 11.5, 15.4, 19.2, 23.0, 26.9, 30.7,
    34.6, 38.4, 42.2, 46.1, 49.9, 53.8, 57.6, 61.4,
    65.3, 69.1, 73.0, 76.8, 80.6, 84.5, 88.3, 92.2,
    96.0, 99.8, 103.7, 107.5, 111.4, 115.2, 119.0, 122.9,
];

/**
 * Sweep/Modulation interval durations in milliseconds: the first seven for
 * the slow clock (S5SWP's "frequency" bit clear), the next seven for the fast
 * one (set), indexed by the three-bit interval field minus one (zero disables
 * sweep/modulation entirely).
 */
export const VSU_SWEEP_MODULATION_INTERVAL_MS = [
    0.96, 1.92, 2.88, 3.84, 4.8, 5.76, 6.72,
    7.68, 15.36, 23.04, 30.72, 38.4, 46.08, 53.76,
];
const VSU_SWEEP_MODULATION_INTERVAL_MS_PER_CLOCK = VSU_SWEEP_MODULATION_INTERVAL_MS.length / 2;

/** Noise channel taps, indexed by SxEV1's three-bit tap select: [tap bit, LFSR period]. */
export const VSU_NOISE_TAP: ReadonlyArray<readonly [number, number]> = [
    [14, 32767],
    [10, 1953],
    [13, 254],
    [4, 217],
    [8, 73],
    [6, 63],
    [9, 42],
    [11, 28],
];

export interface VsuChannelInterval {
    enabled: boolean;
    /** Five-bit register value. */
    value: number;
    durationMs: number;
}

/** Shape only; the on/off and repeat bits live on VsuChannel itself, since hardware packs them alongside this. */
export interface VsuChannelEnvelope {
    direction: VsuEnvelopeDirection;
    /** Four-bit register value, 0-15. */
    initialValue: number;
    /** Three-bit register value. */
    stepTime: number;
    stepMs: number;
}

/** Channel 4 (Sweep/Modulation) only. */
export interface VsuChannelSweepModulation {
    enabled: boolean;
    repeat: boolean;
    function: VsuSweepModulationFunction;
    direction: VsuSweepDirection;
    /** Three-bit register value, 0-7. */
    shift: number;
    /** Zero disables sweep/modulation outright, regardless of `enabled`. */
    interval: number;
    intervalMs: number;
}

/** Channel 5 (Noise) only. */
export interface VsuChannelNoise {
    /** Three-bit register value, 0-7. */
    tap: number;
    tapBit: number;
    period: number;
}

export interface VsuChannel {
    index: number;
    kind: VsuChannelKind;
    name: string;
    /** SxEV1 bit 0: the channel is currently sounding. */
    enabled: boolean;
    /** SxEV1 bit 1: envelope/interval repeats instead of firing once. */
    repeat: boolean;
    /** Eleven-bit register value. */
    frequencyRaw: number;
    frequencyHz: number;
    /** Four-bit register values, 0-15 each. */
    left: number;
    right: number;
    interval: VsuChannelInterval;
    envelope: VsuChannelEnvelope;
    /** Three-bit register value, 0-7; only banks 0-4 exist. Channels 0-4 only. */
    waveform?: number;
    sweepModulation?: VsuChannelSweepModulation;
    noise?: VsuChannelNoise;
    raw: {
        SxINT: number;
        SxLRV: number;
        SxFQL: number;
        SxFQH: number;
        SxEV0: number;
        SxEV1: number;
        SxRAM: number;
        S5SWP: number;
    };
}

/**
 * Fout = 5,000,000 / (2048 - F) Hz, the standard VSU tone formula. F is
 * eleven bits, so this saturates rather than reaching infinity at F=2048.
 */
function vsuFrequencyHz(raw: number): number {
    return raw >= 2048 ? 0 : 5000000 / (2048 - raw);
}

/** Decode one channel's registers out of the full register block (VSU_REGISTER_BASE, VSU_REGISTER_BLOCK_BYTES). */
export function decodeVsuChannel(view: DataView, index: number): VsuChannel {
    const base = index * VSU_CHANNEL_STRIDE;
    const at = (offset: number): number => view.getUint8(base + offset);
    const kind = index as VsuChannelKind;

    const sxint = at(VsuChannelRegister.SxINT);
    const sxlrv = at(VsuChannelRegister.SxLRV);
    const sxfql = at(VsuChannelRegister.SxFQL);
    const sxfqh = at(VsuChannelRegister.SxFQH);
    const sxev0 = at(VsuChannelRegister.SxEV0);
    const sxev1 = at(VsuChannelRegister.SxEV1);
    const sxram = at(VsuChannelRegister.SxRAM);
    const s5swp = at(VsuChannelRegister.S5SWP);

    const frequencyRaw = ((sxfqh & 0x07) << 8) | sxfql;
    const intervalValue = sxint & 0x1f;
    const stepTime = sxev0 & 0x07;

    const channel: VsuChannel = {
        index,
        kind,
        name: VSU_CHANNEL_NAMES[kind],
        enabled: (sxev1 & 0x01) !== 0,
        repeat: (sxev1 & 0x02) !== 0,
        frequencyRaw,
        frequencyHz: vsuFrequencyHz(frequencyRaw),
        left: (sxlrv >> 4) & 0x0f,
        right: sxlrv & 0x0f,
        interval: {
            enabled: (sxint & 0x20) !== 0,
            value: intervalValue,
            durationMs: VSU_INTERVAL_DURATION_MS[intervalValue],
        },
        envelope: {
            direction: ((sxev0 >> 3) & 0x01) as VsuEnvelopeDirection,
            initialValue: (sxev0 >> 4) & 0x0f,
            stepTime,
            stepMs: VSU_ENVELOPE_STEP_TIME_MS[stepTime],
        },
        raw: { SxINT: sxint, SxLRV: sxlrv, SxFQL: sxfql, SxFQH: sxfqh, SxEV0: sxev0, SxEV1: sxev1, SxRAM: sxram, S5SWP: s5swp },
    };

    if (kind === VsuChannelKind.NOISE) {
        const tap = (sxev1 >> 4) & 0x07;
        const [tapBit, period] = VSU_NOISE_TAP[tap];
        channel.noise = { tap, tapBit, period };
    } else {
        channel.waveform = sxram & 0x07;
        if (kind === VsuChannelKind.SWEEP) {
            const clock = (s5swp >> 7) & 0x01;
            const interval = (s5swp >> 4) & 0x07;
            channel.sweepModulation = {
                enabled: ((sxev1 >> 6) & 0x01) !== 0,
                repeat: ((sxev1 >> 5) & 0x01) !== 0,
                function: ((sxev1 >> 4) & 0x01) as VsuSweepModulationFunction,
                direction: ((s5swp >> 3) & 0x01) as VsuSweepDirection,
                shift: s5swp & 0x07,
                interval,
                intervalMs: interval === 0
                    ? 0
                    : VSU_SWEEP_MODULATION_INTERVAL_MS[clock * VSU_SWEEP_MODULATION_INTERVAL_MS_PER_CLOCK + interval - 1],
            };
        }
    }

    return channel;
}

/** Every fourth byte holds a sample; six-bit unsigned (0-63). */
export function vsuWaveformSamples(bytes: Uint8Array): number[] {
    const samples: number[] = [];
    for (let i = 0; i < VSU_WAVEFORM_SAMPLES && i * VSU_WAVEFORM_SAMPLE_STRIDE < bytes.length; i++) {
        samples.push(bytes[i * VSU_WAVEFORM_SAMPLE_STRIDE] & 0x3f);
    }
    return samples;
}
