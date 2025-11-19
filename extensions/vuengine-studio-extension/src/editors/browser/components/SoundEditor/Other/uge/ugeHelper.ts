// Taken from https://github.com/chrismaltby/gb-studio/blob/2e2e73b4937855276f94d6d10d2ec0f767791b97/src/shared/lib/uge/ugeHelper.ts
/* eslint-disable no-null/no-null */

export interface DutyInstrument {
    index: number;
    name: string;
    length: number | null;
    duty_cycle: number;
    initial_volume: number;
    volume_sweep_change: number;
    frequency_sweep_time: number;
    frequency_sweep_shift: number;
    subpattern_enabled: boolean;
    subpattern: SubPatternCell[];
};

export interface WaveInstrument {
    index: number;
    name: string;
    length: number | null;
    volume: number;
    wave_index: number;
    subpattern_enabled: boolean;
    subpattern: SubPatternCell[];
};

export interface NoiseInstrument {
    index: number;
    name: string;
    length: number | null;
    initial_volume: number;
    volume_sweep_change: number;
    dividing_ratio: number;
    bit_count: 7 | 15;
    /**
     * @deprecated noise macros aren't used starting uge v6
     */
    noise_macro?: number[];
    subpattern_enabled: boolean;
    subpattern: SubPatternCell[];
};

const LAST_VERSION = 6;

export class Song {
    version: number;
    name: string;
    artist: string;
    comment: string;
    filename: string;
    duty_instruments: DutyInstrument[];
    wave_instruments: WaveInstrument[];
    noise_instruments: NoiseInstrument[];
    waves: Uint8Array[];
    ticks_per_row: number;
    timer_enabled: boolean;
    timer_divider: number;
    patterns: PatternCell[][][];
    sequence: number[];

    constructor() {
        this.version = LAST_VERSION;
        this.name = '';
        this.artist = '';
        this.comment = '';
        this.filename = 'song';

        this.duty_instruments = [];
        this.wave_instruments = [];
        this.noise_instruments = [];
        this.waves = [];
        this.ticks_per_row = 6;

        this.timer_enabled = false;
        this.timer_divider = 0;

        this.patterns = [];
        this.sequence = [];
    }

    addDutyInstrument(instrument: DutyInstrument): void {
        const list = this.duty_instruments;
        instrument.index = list.length;
        list.push(instrument);
    }

    addWaveInstrument(instrument: WaveInstrument): void {
        const list = this.wave_instruments;
        instrument.index = list.length;
        list.push(instrument);
    }

    addNoiseInstrument(instrument: NoiseInstrument): void {
        const list = this.noise_instruments;
        instrument.index = list.length;
        list.push(instrument);
    }

    usesInstrument(type: string, index: number): boolean {
        let cols: number[] = [];
        if (type === 'duty') {
            cols = [0, 1];
        }
        if (type === 'wave') {
            cols = [2];
        }
        if (type === 'noise') {
            cols = [3];
        }

        for (const pattern of this.patterns) {
            for (const row of pattern) {
                for (const col of cols) {
                    if (row[col].instrument === index) { return true; }
                }
            }
        }
        return false;
    }

    removeInstrument(type: string, index: number): void {
        let list: (DutyInstrument | WaveInstrument | NoiseInstrument)[] = [];
        let cols: number[] = [];
        if (type === 'duty') {
            list = this.duty_instruments;
            cols = [0, 1];
        }
        if (type === 'wave') {
            list = this.wave_instruments;
            cols = [2];
        }
        if (type === 'noise') {
            list = this.noise_instruments;
            cols = [3];
        }

        for (const pattern of this.patterns) {
            for (const row of pattern) {
                for (const col of cols) {
                    const instrumentIndex = row[col].instrument;
                    if (instrumentIndex) {
                        if (instrumentIndex === index) {
                            row[col].instrument = null;
                        }
                        if (instrumentIndex > index) {
                            row[col].instrument = instrumentIndex - 1;
                        }
                    }
                }
            }
        }

        list.splice(index, 1);
        for (let idx = 0; idx < list.length; idx++) {
            list[idx].index = idx;
        }
    }
}

export class PatternCell {
    note: number | null;
    instrument: number | null;
    effectcode: number | null;
    effectparam: number | null;

    constructor() {
        this.note = null;
        this.instrument = null;
        this.effectcode = null;
        this.effectparam = null;
    }
}

class SubPatternCell {
    note: number | null;
    jump: number | null;
    effectcode: number | null;
    effectparam: number | null;

    constructor() {
        this.note = null;
        this.jump = null;
        this.effectcode = null;
        this.effectparam = null;
    }
}

interface InstrumentMap {
    [index: number]: number;
}

interface InstrumentData {
    idx: number;
    type: number;
    name: string;
    length: number;
    length_enabled: number;
    initial_volume: number;
    volume_sweep_amount: number;
    freq_sweep_time: number;
    freq_sweep_shift: number;
    duty: number;
    wave_output_level: number;
    wave_waveform_index: number;
    subpattern_enabled: number;
    subpattern: SubPatternCell[];
    noise_counter_step: number;
    noise_macro: number[];
}

export const loadUGESong = (data: ArrayBuffer): Song | null => {
    const uint8data = new Uint8Array(data);

    const readUint32 = () => new Uint32Array(data.slice(offset, (offset += 4)))[0];
    const readInt32 = () => new Int32Array(data.slice(offset, (offset += 4)))[0];
    const readUint8 = () => uint8data[offset++];

    const td = new TextDecoder();
    const readText = () => {
        const len = uint8data[offset];
        let text = '';
        if (len > 0) {
            // Need to check string length > 0 here to prevent
            // ERR_ENCODING_INVALID_ENCODED_DATA when this is run from Electron main process
            text = td.decode(data.slice(offset + 1, offset + 1 + len));
        }
        offset += 256;
        return text;
    };

    const song = new Song();

    // TODO: Sanity checks on data.
    // TODO: Use `DataView` object instead of loads of Uint32Arrays
    let offset = 0;
    const version = readUint32();

    if (version < 0 || version > 6) {
        throw new Error(`UGE version ${version} is not supported`);
    }

    song.name = readText();
    song.artist = readText();
    song.comment = readText();

    const instrument_count = version < 3 ? 15 : 45;

    const instrumentData: Array<InstrumentData> = [];
    for (let n = 0; n < instrument_count; n++) {
        const type = readUint32();
        const name = readText();

        const length = readUint32();
        const length_enabled = readUint8();
        let initial_volume = readUint8();
        if (initial_volume > 15) {
            initial_volume = 15; // ??? bug in the song files?
        }
        const volume_direction = readUint32();
        let volume_sweep_amount = readUint8();
        if (volume_sweep_amount !== 0) {
            volume_sweep_amount = 8 - volume_sweep_amount;
        }
        if (volume_direction) {
            volume_sweep_amount = -volume_sweep_amount;
        }

        const freq_sweep_time = readUint32();
        const freq_sweep_direction = readUint32();
        let freq_sweep_shift = readUint32();
        if (freq_sweep_direction) {
            freq_sweep_shift = -freq_sweep_shift;
        }

        const duty = readUint8();

        const wave_output_level = readUint32();
        const wave_waveform_index = readUint32();

        let subpattern_enabled = 0;
        let noise_counter_step = 0;

        const subpattern: SubPatternCell[] = [];
        if (version >= 6) {
            noise_counter_step = readUint32();

            subpattern_enabled = readUint8();

            for (let m = 0; m < 64; m++) {
                const note = readUint32();
                offset += 4; // unused uint32 field. increase offset by 4.
                const jump = readUint32();
                const effectcode = readUint32();
                const effectparam = readUint8();

                subpattern.push({
                    note: note === 90 ? null : note,
                    jump,
                    effectcode: effectcode === 0 && effectparam === 0 ? null : effectcode,
                    effectparam:
                        effectcode === 0 && effectparam === 0 ? null : effectparam,
                });
            }
        }

        const noise_macro = [];
        if (version < 6) {
            offset += 4; // unused uint32 field. increase offset by 4.
            noise_counter_step = readUint32();
            offset += 4; // unused uint32 field. increase offset by 4.
            if (version >= 4) {
                for (let x = 0; x < 6; x++) {
                    const uint8ref = readUint8();
                    const int8ref = uint8ref > 0x7f ? uint8ref - 0x100 : uint8ref;
                    noise_macro.push(int8ref);
                }
            }
        }

        instrumentData.push({
            idx: n,
            type,
            name,
            length,
            length_enabled,
            initial_volume,
            volume_sweep_amount,
            freq_sweep_time,
            freq_sweep_shift,
            duty,
            wave_output_level,
            wave_waveform_index,
            subpattern_enabled,
            subpattern,
            noise_counter_step,
            noise_macro,
        });
    }

    for (let n = 0; n < 16; n++) {
        song.waves.push(Uint8Array.from(uint8data.slice(offset, offset + 32)));
        offset += 32;
        if (version < 3) { offset += 1; } // older versions have an off-by-one error
    }

    song.ticks_per_row = readUint32();

    if (version >= 6) {
        song.timer_enabled = readUint8() !== 0;
        song.timer_divider = readUint32();
    }

    const pattern_count = new Uint32Array(data.slice(offset, offset + 4))[0];
    if (offset + pattern_count * 13 * 64 > data.byteLength) {
        throw new Error(`Song has too many patterns (${pattern_count})`);
    }
    offset += 4;
    const patterns = [];
    for (let n = 0; n < pattern_count; n++) {
        let patternId = 0;
        const pattern = [];
        if (version >= 5) {
            patternId = readUint32();
        } else {
            patternId = n;
        }
        for (let m = 0; m < 64; m++) {
            if (version < 6) {
                // modified to fix missing instrument value
                const note = readInt32();
                const instrument = readInt32();
                const effectcode = readInt32();
                const effectparam = readUint8();

                pattern.push([note, instrument, effectcode, effectparam]);
            } else if (version >= 6) {
                // modified to fix missing instrument value
                const note = readInt32();
                const instrument = readInt32();
                readInt32(); // unused
                const effectcode = readInt32();
                const effectparam = readUint8();

                pattern.push([note, instrument, effectcode, effectparam]);
            }
        }
        /*
         If there's a repeated pattern it probably means the song was saved
         with an old version of GB Studio (3.0.2 or earlier) that didn't save the
         unique pattern ids and instead expected them to always be consecutive.
        */
        if (version === 5 && patterns[patternId]) {
            patterns[n] = pattern;
        } else {
            patterns[patternId] = pattern;
        }
    }

    const orders = [];
    for (let n = 0; n < 4; n++) {
        const order_count = readUint32(); // The amount of pattern orders stored in the file has an off-by-one.
        orders.push(
            new Uint32Array(data.slice(offset, offset + 4 * (order_count - 1))),
        );
        offset += 4 * order_count;
    }
    // TODO: If version > 1 then custom routines follow.

    // Add instruments
    const duty_instrument_mapping: InstrumentMap = {};
    const wave_instrument_mapping: InstrumentMap = {};
    const noise_instrument_mapping: InstrumentMap = {};
    instrumentData.forEach((instrument: InstrumentData) => {
        const {
            idx,
            type,
            name,
            length,
            length_enabled,
            initial_volume,
            volume_sweep_amount,
            freq_sweep_time,
            freq_sweep_shift,
            duty,
            wave_output_level,
            wave_waveform_index,
            subpattern_enabled,
            subpattern,
            noise_counter_step,
            noise_macro,
        } = instrument;

        if (type === 0) {
            const instr = {} as DutyInstrument;

            if (length_enabled) {
                instr.length = 64 - length;
            } else {
                instr.length = null;
            }

            instr.name = name;
            instr.duty_cycle = duty;
            instr.initial_volume = initial_volume;
            instr.volume_sweep_change = volume_sweep_amount;

            instr.frequency_sweep_time = freq_sweep_time;
            instr.frequency_sweep_shift = freq_sweep_shift;

            if (version >= 6) {
                instr.subpattern_enabled = subpattern_enabled !== 0;
                instr.subpattern = subpattern;
            } else {
                instr.subpattern_enabled = false;
                instr.subpattern = [...Array(64)].map(() => new SubPatternCell());
            }

            duty_instrument_mapping[(idx % 15) + 1] = song.duty_instruments.length;
            song.addDutyInstrument(instr);
        } else if (type === 1) {
            const instr = {} as WaveInstrument;

            if (length_enabled) {
                instr.length = 256 - length;
            } else {
                instr.length = null;
            }

            instr.name = name;
            instr.volume = wave_output_level;
            instr.wave_index = wave_waveform_index;

            if (version >= 6) {
                instr.subpattern_enabled = subpattern_enabled !== 0;
                instr.subpattern = subpattern;
            } else {
                instr.subpattern_enabled = false;
                instr.subpattern = [...Array(64)].map(() => new SubPatternCell());
            }

            wave_instrument_mapping[(idx % 15) + 1] = song.wave_instruments.length;
            song.addWaveInstrument(instr);
        } else if (type === 2) {
            const instr = {} as NoiseInstrument;

            if (length_enabled) {
                instr.length = 64 - length;
            } else {
                instr.length = null;
            }

            instr.name = name;
            instr.initial_volume = initial_volume;
            instr.volume_sweep_change = volume_sweep_amount;

            instr.bit_count = noise_counter_step ? 7 : 15;
            if (version < 6) {
                if (version >= 4) {
                    instr.noise_macro = noise_macro;
                } else {
                    instr.noise_macro = [0, 0, 0, 0, 0, 0];
                }
            }

            if (version >= 6) {
                instr.subpattern_enabled = subpattern_enabled !== 0;
                instr.subpattern = subpattern;
            } else {
                /*
                  Older versions of the uge format had a noise macro field for the noise instrument that needs to be migrated to the subpattern.
                */
                if (noise_macro.length === 0) {
                    // if noise macro is empty create an empty subpattern and disable
                    // subpattern for this instrument
                    instr.subpattern_enabled = false;
                    instr.subpattern = [...Array(64)].map(() => new SubPatternCell());
                } else {
                    // if noise macro is not empty migrate to the subpattern
                    instr.subpattern_enabled = true;
                    instr.subpattern = subpatternFromNoiseMacro(
                        instr.noise_macro ?? [],
                        song.ticks_per_row,
                    );
                }
            }

            noise_instrument_mapping[(idx % 15) + 1] = song.noise_instruments.length;
            song.addNoiseInstrument(instr);
        } else {
            throw Error(`Invalid instrument type ${type} [${idx}, "${name}"]`);
        }
    });

    // Create proper flat patterns
    for (let n = 0; n < orders[0].length; n++) {
        const pattern: PatternCell[][] = [];
        for (let m = 0; m < 64; m++) {
            const row: PatternCell[] = [];
            for (let track = 0; track < 4; track++) {
                const cellData: number[] = patterns[orders[track][n]][m];
                const [note, instrument, effectcode, effectparam] = cellData;
                const cell = new PatternCell();
                if (note !== 90) { cell.note = note; };
                if (instrument !== 0) {
                    let mapping: InstrumentMap = {};
                    if (track < 2) { mapping = duty_instrument_mapping; };
                    if (track === 2) { mapping = wave_instrument_mapping; };
                    if (track === 3) { mapping = noise_instrument_mapping; };
                    if (instrument in mapping) { cell.instrument = mapping[instrument]; };
                }
                if (effectcode !== 0 || effectparam !== 0) {
                    cell.effectcode = effectcode;
                    cell.effectparam = effectparam;
                }
                row.push(cell);
            }
            pattern.push(row);
        }
        song.patterns.push(pattern);
        let added = false;
        for (let idx = 0; idx < song.patterns.length - 1; idx++) {
            if (
                comparePatterns(
                    song.patterns[idx],
                    song.patterns[song.patterns.length - 1],
                )
            ) {
                song.sequence.push(idx);
                song.patterns.pop();
                added = true;
            }
        }
        if (!added) { song.sequence.push(song.patterns.length - 1); };
    }

    return song;
};

const comparePatterns = function (a: PatternCell[][], b: PatternCell[][]): boolean {
    if (a.length !== b.length) { return false; }
    for (let idx = 0; idx < a.length; idx++) {
        if (!patternEqual(a[idx], b[idx])) { return false; }
    }
    return true;
};

const patternEqual = function (a: PatternCell[], b: PatternCell[]): boolean {
    if (a.length !== b.length) { return false; }
    for (let idx = 0; idx < a.length; idx++) {
        if (a[idx].note !== b[idx].note) { return false; }
        if (a[idx].instrument !== b[idx].instrument) { return false; }
        if (a[idx].effectcode !== b[idx].effectcode) { return false; }
        if (a[idx].effectparam !== b[idx].effectparam) { return false; }
    }
    return true;
};

const subpatternFromNoiseMacro = function (
    noise_macro: number[],
    ticks_per_row: number,
): SubPatternCell[] {
    const subpattern = [...Array(64)].map(() => new SubPatternCell());
    for (let n = 0; n < 6; n++) {
        subpattern[n + 1].note = noise_macro[n] + 36;
    }
    const wrapPoint = Math.min(ticks_per_row, 7);
    subpattern[wrapPoint - 1].jump = wrapPoint;
    return subpattern;
};
