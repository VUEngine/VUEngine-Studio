// Reads Furnace modules, see https://github.com/tildearrow/furnace/blob/master/papers/format.md and newIns.md. Supports the song info
// block of versions before 240, which is what Furnace wrote until then, and the pattern and instrument formats of the versions since.

const FURNACE_MAGIC = '-Furnace module-';
const CHIP_VIRTUAL_BOY = 0x9C;
const VIRTUAL_BOY_CHANNELS = 6;
const SONG_INFO_VERSION_NEW = 240;
// patterns are in the format of this version and later
const PATTERN_VERSION_MIN = 157;

export const FURNACE_NOTE_OFF = 180;
export const FURNACE_NOTE_RELEASE = 181;
export const FURNACE_MACRO_RELEASE = 182;

export enum FurnaceMacroCode {
    Volume = 0,
    Arpeggio = 1,
    Duty = 2,
    Wave = 3,
}

export interface FurnaceMacro {
    code: number
    loop: number
    release: number
    delay: number
    speed: number
    values: number[]
}

export interface FurnaceInstrument {
    name: string
    type: number
    macros: FurnaceMacro[]
    // the wave the wavetable synthesizer starts with, if it is on
    synthesizerWave?: number
}

export interface FurnaceCell {
    // 0 is C-(-5), or one of the FURNACE_NOTE_* values
    note?: number
    instrument?: number
    volume?: number
    // effect code and value pairs
    effects: [number, number | undefined][]
}

export interface FurnaceSong {
    version: number
    name: string
    author: string
    comment: string
    timeBase: number
    speeds: number[]
    ticksPerSecond: number
    virtualTempoNumerator: number
    virtualTempoDenominator: number
    patternLength: number
    // by order row and channel
    orders: number[][]
    instruments: FurnaceInstrument[]
    // values of 0 to height
    wavetables: { values: number[], height: number }[]
    // by channel and pattern index, then by row
    patterns: Record<string, FurnaceCell[]>
    channelNames: string[]
}

class Reader {
    offset = 0;
    protected readonly view: DataView;

    constructor(readonly bytes: Uint8Array) {
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }

    u8(): number { return this.view.getUint8(this.offset++); }
    s8(): number { return this.view.getInt8(this.offset++); }
    u16(): number { const v = this.view.getUint16(this.offset, true); this.offset += 2; return v; }
    s16(): number { const v = this.view.getInt16(this.offset, true); this.offset += 2; return v; }
    u32(): number { const v = this.view.getUint32(this.offset, true); this.offset += 4; return v; }
    s32(): number { const v = this.view.getInt32(this.offset, true); this.offset += 4; return v; }
    f32(): number { const v = this.view.getFloat32(this.offset, true); this.offset += 4; return v; }
    skip(count: number): void { this.offset += count; }
    text(length: number): string { const t = String.fromCharCode(...this.bytes.subarray(this.offset, this.offset + length)); this.offset += length; return t; }
    str(): string {
        const end = this.bytes.indexOf(0, this.offset);
        const t = new TextDecoder().decode(this.bytes.subarray(this.offset, end === -1 ? this.bytes.length : end));
        this.offset = end === -1 ? this.bytes.length : end + 1;
        return t;
    }
}

// modules are compressed with zlib, older ones might not be
const decompress = async (bytes: Uint8Array): Promise<Uint8Array> => {
    if (bytes[0] !== 0x78) {
        return bytes;
    }
    const stream = new Blob([bytes.slice()]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
};

const readInstrument = (reader: Reader): FurnaceInstrument => {
    const start = reader.offset;
    reader.skip(4);
    const size = reader.u32();
    const end = start + 8 + size;
    reader.skip(2);
    const instrument: FurnaceInstrument = { name: '', type: reader.u16(), macros: [] };
    while (reader.offset < end) {
        const code = reader.text(2);
        const length = reader.u16();
        const featureEnd = reader.offset + length;
        if (code === 'EN') {
            break;
        } else if (code === 'NA') {
            instrument.name = reader.str();
        } else if (code === 'WS') {
            const firstWave = reader.u32();
            reader.skip(4 + 2);
            if (reader.u8()) {
                instrument.synthesizerWave = firstWave;
            }
        } else if (code === 'MA') {
            const headerLength = reader.u16();
            while (reader.offset < featureEnd) {
                const macroStart = reader.offset;
                const macroCode = reader.u8();
                if (macroCode === 255) {
                    break;
                }
                const macroLength = reader.u8();
                const loop = reader.u8();
                const release = reader.u8();
                reader.skip(1);
                const wordSize = reader.u8() >> 6;
                const delay = reader.u8();
                const speed = reader.u8();
                reader.offset = macroStart + headerLength;
                const values: number[] = [];
                for (let i = 0; i < macroLength; i++) {
                    values.push([reader.u8, reader.s8, reader.s16, reader.s32][wordSize].call(reader));
                }
                instrument.macros.push({ code: macroCode, loop, release, delay, speed: Math.max(1, speed), values });
            }
        }
        reader.offset = featureEnd;
    }
    reader.offset = end;

    return instrument;
};

const readWavetable = (reader: Reader): { values: number[], height: number } => {
    reader.skip(8);
    reader.str();
    const width = reader.u32();
    reader.skip(4);
    const height = reader.u32();
    const values: number[] = [];
    for (let i = 0; i < width; i++) {
        values.push(reader.s32());
    }

    return { values, height };
};

const readPattern = (reader: Reader, version: number, patternLength: number): { channel: number, index: number, rows: FurnaceCell[] } => {
    reader.skip(8);
    reader.skip(1);
    const channel = version >= SONG_INFO_VERSION_NEW ? reader.u16() : reader.u8();
    const index = reader.u16();
    reader.str();
    const rows: FurnaceCell[] = [];
    let row = 0;
    while (row < patternLength) {
        const what = reader.u8();
        if (what === 0xFF) {
            break;
        } else if (what & 0x80) {
            row += (what & 0x7F) + 2;
            continue;
        } else if (what === 0) {
            row++;
            continue;
        }

        // which effects and effect values there are, two bits per effect
        let effectBits = (what & 8 ? 1 : 0) | (what & 16 ? 2 : 0);
        if (what & 32) {
            effectBits |= reader.u8();
        }
        if (what & 64) {
            effectBits |= reader.u8() << 8;
        }
        const cell: FurnaceCell = { effects: [] };
        if (what & 1) {
            cell.note = reader.u8();
            if (cell.note === 183) {
                reader.skip(4);
                cell.note = undefined;
            }
        }
        if (what & 2) {
            cell.instrument = reader.u8();
        }
        if (what & 4) {
            cell.volume = reader.u8();
        }
        for (let effect = 0; effect < 8; effect++) {
            const hasCode = effectBits & (1 << (effect * 2));
            const hasValue = effectBits & (1 << (effect * 2 + 1));
            if (hasCode || hasValue) {
                const code = hasCode ? reader.u8() : -1;
                const value = hasValue ? reader.u8() : undefined;
                if (code !== -1) {
                    cell.effects.push([code, value]);
                }
            }
        }
        rows[row++] = cell;
    }

    return { channel, index, rows };
};

export const parseFurnaceSong = async (buffer: ArrayBuffer): Promise<FurnaceSong | undefined> => {
    const reader = new Reader(await decompress(new Uint8Array(buffer)));
    if (reader.text(16) !== FURNACE_MAGIC) {
        return;
    }
    const version = reader.u16();
    reader.skip(2);
    reader.offset = reader.u32();
    if (version < PATTERN_VERSION_MIN || version >= SONG_INFO_VERSION_NEW || reader.text(4) !== 'INFO') {
        throw new Error('Only modules saved by Furnace 0.6pre5 to 0.6.8.1 are supported.');
    }

    reader.skip(4);
    const timeBase = reader.u8();
    const speed1 = reader.u8();
    const speed2 = reader.u8();
    reader.skip(1);
    const ticksPerSecond = reader.f32();
    const patternLength = reader.u16();
    const orderLength = reader.u16();
    reader.skip(2);
    const instrumentCount = reader.u16();
    const wavetableCount = reader.u16();
    const sampleCount = reader.u16();
    const patternCount = reader.u32();
    const chips = Array.from({ length: 32 }, () => reader.u8());
    const usedChips = chips.slice(0, chips.indexOf(0) === -1 ? 32 : chips.indexOf(0));
    if (usedChips.length !== 1 || usedChips[0] !== CHIP_VIRTUAL_BOY) {
        throw new Error('Only Furnace modules for the Virtual Boy alone are supported.');
    }
    const channels = VIRTUAL_BOY_CHANNELS;
    reader.skip(32 + 32 + 128);
    const name = reader.str();
    const author = reader.str();
    // A-4 tuning and compatibility flags
    reader.skip(4 + 20);
    const instrumentPointers = Array.from({ length: instrumentCount }, () => reader.u32());
    const wavetablePointers = Array.from({ length: wavetableCount }, () => reader.u32());
    reader.skip(4 * sampleCount);
    const patternPointers = Array.from({ length: patternCount }, () => reader.u32());
    const ordersByChannel = Array.from({ length: channels }, () => Array.from({ length: orderLength }, () => reader.u8()));
    reader.skip(channels * 3);
    const channelNames = Array.from({ length: channels }, () => reader.str());
    Array.from({ length: channels }, () => reader.str());
    const comment = reader.str();
    reader.skip(4);
    // extended compatibility flags
    reader.skip(28);
    const virtualTempoNumerator = reader.u16() || 150;
    const virtualTempoDenominator = reader.u16() || 150;
    reader.str();
    reader.str();
    const subsongCount = reader.u8();
    reader.skip(3 + 4 * subsongCount);
    // metadata, chip output settings and patchbay
    Array.from({ length: 6 }, () => reader.str());
    reader.skip(12 * usedChips.length);
    reader.skip(4 * reader.u32());
    reader.skip(1);
    // more compatibility flags, as many as the version has
    reader.skip(1 + [155, 168, 183, 184, 188, 191, 200].filter(v => version >= v).length);
    const speedPatternLength = reader.u8();
    const speedPattern = Array.from({ length: 16 }, () => reader.u8());
    const speeds = speedPatternLength >= 1 && speedPatternLength <= 16
        ? speedPattern.slice(0, speedPatternLength)
        : [speed1, speed2];

    const instruments = instrumentPointers.map(pointer => {
        reader.offset = pointer;
        return readInstrument(reader);
    });
    const wavetables = wavetablePointers.map(pointer => {
        reader.offset = pointer;
        return readWavetable(reader);
    });
    const patterns: Record<string, FurnaceCell[]> = {};
    patternPointers.forEach(pointer => {
        reader.offset = pointer;
        if (reader.text(4) !== 'PATN') {
            return;
        }
        reader.offset = pointer;
        const pattern = readPattern(reader, version, patternLength);
        patterns[`${pattern.channel}:${pattern.index}`] = pattern.rows;
    });

    return {
        version,
        name,
        author,
        comment,
        timeBase,
        speeds: speeds.map(s => Math.max(1, s)),
        ticksPerSecond: ticksPerSecond || 60,
        virtualTempoNumerator,
        virtualTempoDenominator,
        patternLength,
        orders: Array.from({ length: orderLength }, (_, order) => ordersByChannel.map(channel => channel[order])),
        instruments,
        wavetables,
        patterns,
        channelNames,
    };
};
