// Reads ScreamTracker 3 modules, see https://moddingwiki.shikadi.net/wiki/S3M_Format

export const S3M_NOTE_EMPTY = 255;
export const S3M_NOTE_CUT = 254;
export const S3M_ORDER_SKIP = 254;
export const S3M_ORDER_END = 255;
export const S3M_ROWS_PER_PATTERN = 64;

export interface S3mCell {
    // octave * 12 + semitone, or S3M_NOTE_CUT
    note?: number
    // 1-based
    instrument?: number
    // 0-64
    volume?: number
    // 1 is A, 2 is B, and so on
    command?: number
    info?: number
}

export interface S3mInstrument {
    name: string
    // 1 is a sample, others are AdLib instruments
    type: number
    // 0-64
    volume: number
    c2spd: number
    looped: boolean
    loopStart: number
    loopEnd: number
    // between -1 and 1, the left channel of stereo samples
    samples: number[]
}

export interface S3mSong {
    title: string
    initialSpeed: number
    initialTempo: number
    // indexes of the channels that are in use
    channels: number[]
    orders: number[]
    instruments: S3mInstrument[]
    // by pattern, row and channel
    patterns: S3mCell[][][]
}

export const parseS3mSong = (buffer: ArrayBuffer): S3mSong | undefined => {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    const text = (offset: number, length: number) => String.fromCharCode(...bytes.subarray(offset, offset + length)).split('\0')[0].trim();
    if (bytes.length < 0x60 || text(0x2C, 4) !== 'SCRM') {
        return;
    }

    const orderCount = view.getUint16(0x20, true);
    const instrumentCount = view.getUint16(0x22, true);
    const patternCount = view.getUint16(0x24, true);
    // 1 for signed, 2 for unsigned samples
    const sampleFormat = view.getUint16(0x2A, true);

    // channels 0-15 play samples, 16-31 AdLib instruments, higher values and those with bit 7 set are off
    const channels: number[] = [];
    for (let channel = 0; channel < 32; channel++) {
        if (bytes[0x40 + channel] < 32) {
            channels.push(channel);
        }
    }

    const orders = Array.from(bytes.subarray(0x60, 0x60 + orderCount));
    const instrumentPointersOffset = 0x60 + orderCount;
    const patternPointersOffset = instrumentPointersOffset + instrumentCount * 2;

    const instruments: S3mInstrument[] = [];
    for (let i = 0; i < instrumentCount; i++) {
        const offset = view.getUint16(instrumentPointersOffset + i * 2, true) * 16;
        const type = bytes[offset];
        const flags = bytes[offset + 0x1F];
        const instrument: S3mInstrument = {
            name: text(offset + 0x30, 28),
            type,
            volume: bytes[offset + 0x1C],
            c2spd: view.getUint32(offset + 0x20, true),
            looped: (flags & 1) !== 0,
            loopStart: view.getUint32(offset + 0x14, true),
            loopEnd: view.getUint32(offset + 0x18, true),
            samples: [],
        };
        if (type === 1) {
            const dataOffset = ((bytes[offset + 0x0D] << 16) | view.getUint16(offset + 0x0E, true)) * 16;
            const length = view.getUint32(offset + 0x10, true);
            const sixteenBit = (flags & 4) !== 0;
            const signed = sampleFormat === 1;
            for (let s = 0; s < length; s++) {
                const at = dataOffset + s * (sixteenBit ? 2 : 1);
                if (at + (sixteenBit ? 1 : 0) >= bytes.length) {
                    break;
                }
                instrument.samples.push(sixteenBit
                    ? (signed ? view.getInt16(at, true) : view.getUint16(at, true) - 0x8000) / 0x8000
                    : (signed ? view.getInt8(at) : bytes[at] - 0x80) / 0x80);
            }
        }
        instruments.push(instrument);
    }

    const patterns: S3mCell[][][] = [];
    for (let p = 0; p < patternCount; p++) {
        const rows: S3mCell[][] = Array.from({ length: S3M_ROWS_PER_PATTERN }, () => []);
        const pointer = view.getUint16(patternPointersOffset + p * 2, true) * 16;
        if (pointer !== 0) {
            // the packed length comes first
            let at = pointer + 2;
            let row = 0;
            while (row < S3M_ROWS_PER_PATTERN && at < bytes.length) {
                const what = bytes[at++];
                if (what === 0) {
                    row++;
                    continue;
                }
                const cell: S3mCell = {};
                if (what & 32) {
                    if (bytes[at] !== S3M_NOTE_EMPTY) {
                        const note = bytes[at];
                        cell.note = note === S3M_NOTE_CUT ? S3M_NOTE_CUT : (note >> 4) * 12 + (note & 15);
                    }
                    if (bytes[at + 1] !== 0) {
                        cell.instrument = bytes[at + 1];
                    }
                    at += 2;
                }
                if (what & 64) {
                    cell.volume = bytes[at++];
                }
                if (what & 128) {
                    cell.command = bytes[at++];
                    cell.info = bytes[at++];
                }
                rows[row][what & 31] = cell;
            }
        }
        patterns.push(rows);
    }

    return {
        title: text(0, 28),
        initialSpeed: bytes[0x31] || 6,
        initialTempo: bytes[0x32] || 125,
        channels,
        orders,
        instruments,
        patterns,
    };
};
