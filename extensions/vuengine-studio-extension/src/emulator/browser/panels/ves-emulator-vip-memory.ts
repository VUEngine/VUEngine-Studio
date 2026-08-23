/**
 * The VIP's memory map, and decoders for the structures living in it.
 *
 * Addresses and bit layouts are transcribed from the hardware headers this
 * project already ships, `applications/electron/vb/libgccvb/source/`
 * (`video.h`, `vip.h`, `bgmap.h`, `world.h`, `object.h`), which are the
 * authority for everything here.
 *
 * Everything in this module is pure so it can be reasoned about, and reused,
 * without a running emulator.
 */

/**
 * Frame buffer memory: two ping-ponged buffers per eye (the VIP draws into
 * one while the other displays), each a full 384x224 image at two bits per
 * pixel. Unlike character or BGMap data, a frame buffer's two-bit values are
 * already resolved brightness levels (see vipBrightnessLevels) rather than
 * palette indices needing a GPLTn/JPLTn lookup — the VIP's drawing hardware
 * has already done that lookup on the way in.
 *
 * Per `__FRAME_BUFFERS_SIZE`/`__LEFT_FRAME_BUFFER_0`/etc. in
 * `applications/electron/vb/vuengine/platforms/VirtualBoy/headers/Config.h`,
 * and the pixel packing in `.../Hardware/FrameBuffers.c`'s `drawColorPixel`:
 * each column is 64 bytes (16 words) regardless of the 224 rows actually
 * used, i.e. up to 256 rows would fit — the leftover is simply unused.
 */
export const VIP_FRAME_BUFFER_WIDTH = 384;
export const VIP_FRAME_BUFFER_HEIGHT = 224;
export const VIP_FRAME_BUFFER_BYTES_PER_COLUMN = 64;
export const VIP_FRAME_BUFFER_BYTES = VIP_FRAME_BUFFER_WIDTH * VIP_FRAME_BUFFER_BYTES_PER_COLUMN;
export const VIP_LEFT_FRAME_BUFFER_0 = 0x00000000;
export const VIP_LEFT_FRAME_BUFFER_1 = 0x00008000;
export const VIP_RIGHT_FRAME_BUFFER_0 = 0x00010000;
export const VIP_RIGHT_FRAME_BUFFER_1 = 0x00018000;

/** Which eye something is drawn for; the two differ by parallax. */
export type VipEye = 'left' | 'right';

export function vipFrameBufferAddress(eye: VipEye, index: number): number {
    return (eye === 'left' ? VIP_LEFT_FRAME_BUFFER_0 : VIP_RIGHT_FRAME_BUFFER_0) + index * 0x00008000;
}

/** Random access to one frame buffer's pixels. */
export class VipFrameBuffer {

    constructor(protected readonly bytes: Uint8Array | undefined) { }

    /** The two-bit value of one pixel, or 0 when the buffer is missing. */
    pixel(x: number, y: number): number {
        if (!this.bytes) {
            return 0;
        }
        const offset = x * VIP_FRAME_BUFFER_BYTES_PER_COLUMN + (y >> 2);
        if (offset >= this.bytes.length) {
            return 0;
        }
        // Four rows per byte, two bits each, lowest row low — the same
        // little-endian-within-the-byte convention VipCharacters reads.
        return (this.bytes[offset] >> ((y & 3) * 2)) & 3;
    }
}

/** Character segments. Each holds 512 characters and they are not contiguous. */
export const VIP_CHAR_SEGMENTS = [0x00006000, 0x0000e000, 0x00016000, 0x0001e000];
export const VIP_CHARS_PER_SEGMENT = 512;
export const VIP_CHAR_COUNT = VIP_CHAR_SEGMENTS.length * VIP_CHARS_PER_SEGMENT;
/** 8x8 pixels at two bits each. */
export const VIP_CHAR_BYTES = 16;
export const VIP_CHAR_SIZE = 8;
export const VIP_CHAR_SEGMENT_BYTES = VIP_CHARS_PER_SEGMENT * VIP_CHAR_BYTES;

/** BGMap memory: 14 segments of 64x64 cells, two bytes per cell. */
export const VIP_BGMAP_BASE = 0x00020000;
export const VIP_BGMAP_BYTES = 0x2000;
export const VIP_BGMAP_COUNT = 14;
export const VIP_BGMAP_CELLS = 64;
/** A segment's size in pixels, which is what a world's source coordinates are in. */
export const VIP_BGMAP_SEGMENT_PIXELS = VIP_BGMAP_CELLS * VIP_CHAR_SIZE;

/** World attribute memory: 32 worlds of 32 bytes. */
export const VIP_WORLD_BASE = 0x0003d800;
export const VIP_WORLD_BYTES = 0x20;
export const VIP_WORLD_COUNT = 32;
export const VIP_WORLD_BLOCK_BYTES = VIP_WORLD_COUNT * VIP_WORLD_BYTES;

/** Object attribute memory: 1024 objects of 8 bytes. */
export const VIP_OAM_BASE = 0x0003e000;
export const VIP_OBJECT_BYTES = 8;
export const VIP_OBJECT_COUNT = 1024;
export const VIP_OAM_BLOCK_BYTES = VIP_OBJECT_COUNT * VIP_OBJECT_BYTES;

/** Register block. One read covers all of it. */
export const VIP_REGISTER_BASE = 0x0005f800;
export const VIP_REGISTER_BLOCK_BYTES = 0x80;

/**
 * Register offsets in bytes.
 *
 * `vip.h` indexes a `u16*`, so its mnemonics are halfword indices; these are
 * doubled to byte offsets from VIP_REGISTER_BASE.
 */
export enum VipRegister {
    INTPND = 0x00,
    INTENB = 0x02,
    INTCLR = 0x04,
    DPSTTS = 0x20,
    DPCTRL = 0x22,
    BRTA = 0x24,
    BRTB = 0x26,
    BRTC = 0x28,
    REST = 0x2a,
    FRMCYC = 0x2e,
    CTA = 0x30,
    XPSTTS = 0x40,
    XPCTRL = 0x42,
    VER = 0x44,
    SPT0 = 0x48,
    SPT1 = 0x4a,
    SPT2 = 0x4c,
    SPT3 = 0x4e,
    GPLT0 = 0x60,
    GPLT1 = 0x62,
    GPLT2 = 0x64,
    GPLT3 = 0x66,
    JPLT0 = 0x68,
    JPLT1 = 0x6a,
    JPLT2 = 0x6c,
    JPLT3 = 0x6e,
    BKCOL = 0x70,
}

export const VIP_BGMAP_PALETTES = [VipRegister.GPLT0, VipRegister.GPLT1, VipRegister.GPLT2, VipRegister.GPLT3];
export const VIP_OBJECT_PALETTES = [VipRegister.JPLT0, VipRegister.JPLT1, VipRegister.JPLT2, VipRegister.JPLT3];

export function vipCharSegmentAddress(segment: number): number {
    return VIP_CHAR_SEGMENTS[segment];
}

/**
 * Real hardware does not fully decode VIP addresses, so the four character
 * tables — 0x2000 bytes each, matching VIP_CHAR_SEGMENT_BYTES — repeat
 * contiguously starting here, unlike their primary addresses (VIP_CHAR_SEGMENTS),
 * which are spaced 0x8000 apart:
 *
 *   0x00078000-0x00079FFF  mirror of character table 0
 *   0x0007A000-0x0007BFFF  mirror of character table 1
 *   0x0007C000-0x0007DFFF  mirror of character table 2
 *   0x0007E000-0x0007FFFF  mirror of character table 3
 */
export const VIP_CHAR_MIRROR_BASE = 0x00078000;

export function vipCharMirrorAddress(segment: number): number {
    return VIP_CHAR_MIRROR_BASE + segment * VIP_CHAR_SEGMENT_BYTES;
}

export function vipBgMapAddress(segment: number): number {
    return VIP_BGMAP_BASE + segment * VIP_BGMAP_BYTES;
}

export function vipWorldAddress(index: number): number {
    return VIP_WORLD_BASE + index * VIP_WORLD_BYTES;
}

export function vipObjectAddress(index: number): number {
    return VIP_OAM_BASE + index * VIP_OBJECT_BYTES;
}

/**
 * Where a world's param register points, for the H-bias and Affine tables.
 *
 * The register holds the table's offset into BGMap memory in halfwords, per
 * `WORLD_PARAM` in `world.h`, which stores `(address - 0x20000) >> 1`.
 */
export function vipParamTableAddress(param: number): number {
    return VIP_BGMAP_BASE + param * 2;
}

// --- Brightness and palettes ------------------------------------------------

/**
 * The four brightness levels a palette entry can select.
 *
 * The display is monochrome, so a level is an intensity rather than a colour.
 * Level 3 is the sum of all three brightness registers, which is why the engine
 * config warns when bright red is not larger than medium plus dark.
 *
 * These are the register values, not what the screen emits: the core applies
 * its own scaling on the way to a pixel, so the swatches drawn from this show
 * the levels a palette selects rather than an exact preview of the output.
 */
export function vipBrightnessLevels(brta: number, brtb: number, brtc: number): number[] {
    return [0, brta, brtb, brta + brtb + brtc].map(level => Math.min(255, Math.max(0, level)));
}

/**
 * Resolve a palette register into one intensity per pixel value.
 *
 * Pixel value 0 would select the register's lowest two bits, but the hardware
 * hardwires those to zero and always draws value 0 as black — that is what
 * makes it the transparent value. It is forced here rather than read, so that
 * junk in those bits cannot show up as a shade that the VIP would never draw.
 */
export function vipPaletteIntensities(palette: number, levels: number[]): number[] {
    return [0, 1, 2, 3].map(value => (value === 0 ? levels[0] : levels[(palette >> (value * 2)) & 3]));
}

/** vipBrightnessLevels, reading straight out of a register block. */
export function vipBrightnessLevelsFromRegisters(registers: DataView): number[] {
    return vipBrightnessLevels(
        registers.getUint16(VipRegister.BRTA, true) & 0xff,
        registers.getUint16(VipRegister.BRTB, true) & 0xff,
        registers.getUint16(VipRegister.BRTC, true) & 0xff
    );
}

/** The shading a palette register produces, reading straight out of a register block. */
export function vipIntensitiesForRegister(registers: DataView, register: VipRegister): number[] {
    const palette = registers.getUint16(register, true) & 0xff;
    return vipPaletteIntensities(palette, vipBrightnessLevelsFromRegisters(registers));
}

/**
 * Tracks whether the registers that affect palette shading have changed.
 *
 * Shared by the Characters and BGMaps panels, which both cache a rasterised
 * bitmap and only need to redraw it when either the underlying tiles or their
 * shading actually changed.
 */
export class VipIntensityWatcher {
    protected static readonly WATCHED = [
        VipRegister.BRTA, VipRegister.BRTB, VipRegister.BRTC,
        ...VIP_BGMAP_PALETTES, ...VIP_OBJECT_PALETTES,
    ];

    protected signature?: string;

    /** True the first time, and whenever a watched register's value changes. */
    changed(registers: DataView): boolean {
        const signature = VipIntensityWatcher.WATCHED.map(offset => registers.getUint16(offset, true)).join(',');
        const changed = signature !== this.signature;
        this.signature = signature;
        return changed;
    }
}

/** Refresh rate for the panels that rasterise VRAM, which read up to 40 KB a time. */
export const VIP_GRAPHICS_POLL_HZ = 4;

/**
 * Not a hardware register: an evenly spaced black/dark/medium/bright ramp,
 * for looking at tile data on its own rather than through however the
 * currently running program happens to have set its palette registers up.
 * Shared by the Characters and BGMaps panels.
 */
export const VIP_GENERIC_PALETTE_INTENSITIES = [0, 85, 170, 255];

// --- Characters -------------------------------------------------------------

/**
 * Random access to character pixels across the four segments.
 *
 * A segment that has not been read is treated as blank rather than as an error,
 * so a view can render what it has while the rest is still in flight.
 */
export class VipCharacters {

    constructor(protected readonly segments: ReadonlyArray<Uint8Array | undefined>) { }

    /** The two-bit value of one pixel, or 0 when its segment is missing. */
    pixel(char: number, x: number, y: number): number {
        const segment = this.segments[(char >> 9) & 3];
        if (!segment) {
            return 0;
        }
        const offset = (char & (VIP_CHARS_PER_SEGMENT - 1)) * VIP_CHAR_BYTES + y * 2;
        if (offset + 1 >= segment.length) {
            return 0;
        }
        // Rows are little-endian halfwords, two bits per pixel, leftmost low.
        const row = segment[offset] | (segment[offset + 1] << 8);
        return (row >> (x * 2)) & 3;
    }
}

// --- BGMap cells ------------------------------------------------------------

export interface VipBgMapCell {
    char: number;
    palette: number;
    hFlip: boolean;
    vFlip: boolean;
}

/** Per `bgmap.h`: BGM_HFLIP is 0x2000, BGM_VFLIP 0x1000, character mask 0x7FF. */
export function decodeVipBgMapCell(cell: number): VipBgMapCell {
    return {
        char: cell & 0x07ff,
        palette: (cell >> 14) & 3,
        hFlip: (cell & 0x2000) !== 0,
        vFlip: (cell & 0x1000) !== 0,
    };
}

/**
 * Inverse of decodeVipBgMapCell, for writing an edited cell back to VRAM.
 *
 * Bit 11 is unaccounted for by either function — it belongs to neither the
 * 11-bit character index nor the flip/palette bits above it — so this always
 * writes it as zero rather than trying to preserve whatever a cell happened
 * to hold there.
 */
export function encodeVipBgMapCell(cell: VipBgMapCell): number {
    return (cell.char & 0x07ff)
        | ((cell.palette & 3) << 14)
        | (cell.hFlip ? 0x2000 : 0)
        | (cell.vFlip ? 0x1000 : 0);
}

// --- Worlds -----------------------------------------------------------------

export enum VipWorldMode {
    BGMAP = 0,
    HBIAS = 1,
    AFFINE = 2,
    OBJECT = 3,
}

export const VIP_WORLD_MODE_NAMES: Record<VipWorldMode, string> = {
    [VipWorldMode.BGMAP]: 'BGMap',
    [VipWorldMode.HBIAS]: 'HBias',
    [VipWorldMode.AFFINE]: 'Affine',
    [VipWorldMode.OBJECT]: 'Object',
};

export interface VipWorld {
    index: number;
    head: number;
    /** Shown on the left eye. */
    lon: boolean;
    /** Shown on the right eye. */
    ron: boolean;
    mode: VipWorldMode;
    /** Segments across and down, as a count rather than the exponent. */
    scx: number;
    scy: number;
    /** Draw the overplane outside the map instead of repeating it. */
    overplane: boolean;
    /** Drawing stops at this world. */
    end: boolean;
    /** Base BGMap segment. */
    bgMap: number;
    /** Destination on screen. */
    gx: number;
    gp: number;
    gy: number;
    /** Source within the BGMap. */
    mx: number;
    mp: number;
    my: number;
    /** Register values, which the hardware reads as size minus one. */
    w: number;
    h: number;
    param: number;
    overplaneCell: number;
}

function signed16(value: number): number {
    return (value << 16) >> 16;
}

/** Decode one 32-byte world attribute entry. Bit layout per `world.h`. */
export function decodeVipWorld(view: DataView, index: number, byteOffset = 0): VipWorld {
    const at = (halfword: number): number => view.getUint16(byteOffset + halfword * 2, true);
    const head = at(0);
    return {
        index,
        head,
        lon: (head & 0x8000) !== 0,
        ron: (head & 0x4000) !== 0,
        mode: ((head >> 12) & 3) as VipWorldMode,
        scx: 1 << ((head >> 10) & 3),
        scy: 1 << ((head >> 8) & 3),
        overplane: (head & 0x0080) !== 0,
        end: (head & 0x0040) !== 0,
        bgMap: head & 0x000f,
        gx: signed16(at(1)),
        gp: signed16(at(2)),
        gy: signed16(at(3)),
        mx: signed16(at(4)),
        mp: signed16(at(5)),
        my: signed16(at(6)),
        w: at(7),
        h: at(8),
        param: at(9),
        overplaneCell: at(10),
    };
}

/**
 * Which halfword of a world entry each field lives in, for writing one back.
 *
 * The order is `world.h`'s WORLD struct; everything the header packs into the
 * head halfword shares index 0 and goes through encodeVipWorldHead.
 */
export enum VipWorldField {
    HEAD = 0,
    GX = 1,
    GP = 2,
    GY = 3,
    MX = 4,
    MP = 5,
    MY = 6,
    W = 7,
    H = 8,
    PARAM = 9,
    OVERPLANE_CELL = 10,
}

/**
 * Inverse of the head bits decodeVipWorld reads, for writing an edited world
 * back to VRAM.
 *
 * Bits 5 and 4 are unaccounted for by either function — they belong to none of
 * the fields `world.h` documents — so this always writes them as zero rather
 * than trying to preserve whatever a world happened to hold there.
 */
export function encodeVipWorldHead(world: VipWorld): number {
    return (world.lon ? 0x8000 : 0)
        | (world.ron ? 0x4000 : 0)
        | ((world.mode & 3) << 12)
        | (Math.log2(world.scx) << 10)
        | (Math.log2(world.scy) << 8)
        | (world.overplane ? 0x0080 : 0)
        | (world.end ? 0x0040 : 0)
        | (world.bgMap & 0x000f);
}

/**
 * Param table entries, whose size and layout depend on the world's mode.
 *
 * Both tables hold one entry per screen row of the world, starting at
 * vipParamTableAddress. The sizes are the ones the engine allocates in
 * `ParamTableManager::calculateSpriteParamTableSize`: four bytes a row for
 * H-bias, sixteen for Affine.
 */
export const VIP_HBIAS_ENTRY_BYTES = 4;
export const VIP_AFFINE_ENTRY_BYTES = 16;

export interface VipHBiasEntry {
    /** Horizontal shift of this row's source, per eye. */
    left: number;
    right: number;
}

export function decodeVipHBias(view: DataView, row: number): VipHBiasEntry {
    const offset = row * VIP_HBIAS_ENTRY_BYTES;
    return {
        left: view.getInt16(offset, true),
        right: view.getInt16(offset + 2, true),
    };
}

/** One row's H-bias entry, or undefined when the table was not read that far. */
export function vipHBiasRow(params: DataView | undefined, row: number): VipHBiasEntry | undefined {
    return params && (row + 1) * VIP_HBIAS_ENTRY_BYTES <= params.byteLength ? decodeVipHBias(params, row) : undefined;
}

/**
 * One row of an Affine world's param table.
 *
 * `mx`/`my` are 13.3 fixed point and replace the world's own MX/MY for this
 * row; `dx`/`dy` are 7.9 fixed point and step the source position along the
 * row, which is what lets an affine world rotate and scale. Per `affine.c`,
 * whose comments spell out both formats and the 16-byte stride.
 */
export interface VipAffineEntry {
    mx: number;
    mp: number;
    my: number;
    dx: number;
    dy: number;
}

export function decodeVipAffine(view: DataView, row: number): VipAffineEntry {
    const offset = row * VIP_AFFINE_ENTRY_BYTES;
    return {
        mx: view.getInt16(offset, true),
        mp: view.getInt16(offset + 2, true),
        my: view.getInt16(offset + 4, true),
        dx: view.getInt16(offset + 6, true),
        dy: view.getInt16(offset + 8, true),
    };
}

/** The same, for an Affine row. */
export function vipAffineRow(params: DataView | undefined, row: number): VipAffineEntry | undefined {
    return params && (row + 1) * VIP_AFFINE_ENTRY_BYTES <= params.byteLength ? decodeVipAffine(params, row) : undefined;
}

/**
 * How many rows of param table a world uses: one per row of the world, capped
 * at what a screen can show. Zero for the modes that have no param table.
 */
export function vipParamRows(world: VipWorld): number {
    return world.mode === VipWorldMode.HBIAS || world.mode === VipWorldMode.AFFINE
        ? Math.min(world.h + 1, VIP_FRAME_BUFFER_HEIGHT)
        : 0;
}

/** ...and how many bytes that is, clamped to the end of BGMap memory. */
export function vipParamTableBytes(world: VipWorld): number {
    const entryBytes = world.mode === VipWorldMode.AFFINE ? VIP_AFFINE_ENTRY_BYTES : VIP_HBIAS_ENTRY_BYTES;
    const available = VIP_BGMAP_BASE + VIP_BGMAP_COUNT * VIP_BGMAP_BYTES - vipParamTableAddress(world.param);
    return Math.max(0, Math.min(vipParamRows(world) * entryBytes, available));
}

/**
 * The worlds the VIP actually draws, in the order it considers them.
 *
 * Drawing runs from world 31 downwards and stops at the first world with the
 * END flag, which is therefore not drawn either — that dummy terminator is how
 * a program tells the hardware where its sprites end. Worlds shown to neither
 * eye are dropped as well, so what is left is what reaches the screen.
 */
export function vipDrawnWorlds(worlds: ReadonlyArray<VipWorld>): VipWorld[] {
    const drawn: VipWorld[] = [];
    for (let index = VIP_WORLD_COUNT - 1; index >= 0; index--) {
        const world = worlds.find(candidate => candidate.index === index);
        if (!world || world.end) {
            break;
        }
        if (world.lon || world.ron) {
            drawn.push(world);
        }
    }
    return drawn;
}

/** What a BGMap segment is being used for, per vipBgMapSegmentUses. */
export interface VipBgMapSegmentUse {
    /** Indices of the worlds whose map spans this segment. */
    worlds: number[];
    /** Indices of the worlds whose param table overlaps it. */
    params: number[];
}

/**
 * Which worlds put what in each of the fourteen BGMap segments.
 *
 * Only the worlds the VIP draws are counted (see vipDrawnWorlds): unused world
 * entries are all zeroes, which reads as a 1x1 BGMap world on segment 0, and
 * listing two dozen of those against segment 0 would say nothing at all.
 *
 * Param tables are included because they live in BGMap memory too — an H-bias
 * or Affine world's table takes space out of the segments at the top of it,
 * which is exactly what makes "which segments are free" a question worth
 * answering.
 */
export function vipBgMapSegmentUses(worlds: ReadonlyArray<VipWorld>): VipBgMapSegmentUse[] {
    const uses: VipBgMapSegmentUse[] = Array.from({ length: VIP_BGMAP_COUNT }, () => ({ worlds: [], params: [] }));

    for (const world of vipDrawnWorlds(worlds)) {
        if (world.mode !== VipWorldMode.OBJECT) {
            const count = Math.min(world.scx * world.scy, VIP_BGMAP_COUNT);
            for (let offset = 0; offset < count; offset++) {
                // Only the low four bits of a segment number reach the
                // hardware, so a world's segments wrap rather than running on.
                uses[(world.bgMap + offset) & 0x0f]?.worlds.push(world.index);
            }
        }

        const bytes = vipParamTableBytes(world);
        if (bytes > 0) {
            const first = vipParamTableAddress(world.param);
            for (let address = first; address < first + bytes; address += VIP_BGMAP_BYTES) {
                uses[(address - VIP_BGMAP_BASE) / VIP_BGMAP_BYTES | 0]?.params.push(world.index);
            }
            // A table ending exactly on a boundary has already been counted;
            // one ending inside a later segment has not.
            const last = (first + bytes - 1 - VIP_BGMAP_BASE) / VIP_BGMAP_BYTES | 0;
            if (!uses[last]?.params.includes(world.index)) {
                uses[last]?.params.push(world.index);
            }
        }
    }
    return uses;
}

// --- Objects ----------------------------------------------------------------

export interface VipObject {
    index: number;
    /** Signed 10-bit screen position. */
    jx: number;
    /** Signed 14-bit parallax. */
    jp: number;
    /** Eight-bit screen position. */
    jy: number;
    char: number;
    palette: number;
    hFlip: boolean;
    vFlip: boolean;
    lon: boolean;
    ron: boolean;
}

/** True when an object is drawn to at least one eye. */
export function isVipObjectVisible(object: VipObject): boolean {
    return object.lon || object.ron;
}

/** Decode one 8-byte OAM entry. Bit layout per `object.h`. */
export function decodeVipObject(view: DataView, index: number, byteOffset = 0): VipObject {
    const at = (halfword: number): number => view.getUint16(byteOffset + halfword * 2, true);
    const parallax = at(1);
    const character = at(3);
    return {
        index,
        // Sign-extend from bit 9 and bit 13 respectively.
        jx: (at(0) << 22) >> 22,
        jp: ((parallax & 0x3fff) << 18) >> 18,
        jy: at(2) & 0xff,
        char: character & 0x07ff,
        palette: (character >> 14) & 3,
        hFlip: (character & 0x2000) !== 0,
        vFlip: (character & 0x1000) !== 0,
        lon: (parallax & 0x8000) !== 0,
        ron: (parallax & 0x4000) !== 0,
    };
}

/**
 * Inverse of decodeVipObject, for writing an edited object back to OAM.
 *
 * Returns the entry's four halfwords. The bits neither function accounts for —
 * the top six of JX, the top eight of JY, and bit 11 of the character halfword
 * — are written as zero rather than preserved, the same way encodeVipBgMapCell
 * treats its spare bit.
 */
export function encodeVipObject(object: VipObject): number[] {
    return [
        object.jx & 0x03ff,
        (object.jp & 0x3fff) | (object.lon ? 0x8000 : 0) | (object.ron ? 0x4000 : 0),
        object.jy & 0x00ff,
        (object.char & 0x07ff)
            | ((object.palette & 3) << 14)
            | (object.hFlip ? 0x2000 : 0)
            | (object.vFlip ? 0x1000 : 0),
    ];
}

// --- Rasterisation ----------------------------------------------------------

/**
 * Paint one character into an RGBA buffer.
 *
 * `intensities` maps a two-bit pixel value to a grey level. Pixel value 0 is
 * drawn rather than skipped, because these views show what is in memory rather
 * than compositing a scene, and a transparent hole would be indistinguishable
 * from a black one.
 */
export function drawVipChar(
    target: Uint8ClampedArray,
    targetWidth: number,
    destX: number,
    destY: number,
    characters: VipCharacters,
    char: number,
    intensities: number[],
    hFlip = false,
    vFlip = false
): void {
    for (let y = 0; y < VIP_CHAR_SIZE; y++) {
        for (let x = 0; x < VIP_CHAR_SIZE; x++) {
            const value = characters.pixel(
                char,
                hFlip ? VIP_CHAR_SIZE - 1 - x : x,
                vFlip ? VIP_CHAR_SIZE - 1 - y : y
            );
            const intensity = intensities[value];
            const offset = ((destY + y) * targetWidth + destX + x) * 4;
            // Red, because that is the colour the hardware actually emits.
            target[offset] = intensity;
            target[offset + 1] = 0;
            target[offset + 2] = 0;
            target[offset + 3] = 255;
        }
    }
}

/**
 * Random access to the pixels of the map one world draws from.
 *
 * A world's source coordinates address a virtual map scx by scy segments
 * large, laid out left to right and top to bottom starting at the world's
 * base segment. Coordinates outside it either wrap — the map repeats, which
 * is what makes a 1x1 world a tiling background — or, with the overplane flag
 * set, read the single cell the world's OVR halfword names.
 *
 * Segments are indexed by their absolute BGMap segment number rather than by
 * position within the world, so a caller only has to have read the segments
 * the world actually spans; a segment that is missing reads as blank rather
 * than as an error, the same way VipCharacters treats character memory.
 */
export class VipWorldMap {

    protected readonly width: number;
    protected readonly height: number;

    constructor(
        protected readonly world: VipWorld,
        protected readonly segments: ReadonlyArray<Uint8Array | undefined>,
        protected readonly characters: VipCharacters
    ) {
        this.width = world.scx * VIP_BGMAP_SEGMENT_PIXELS;
        this.height = world.scy * VIP_BGMAP_SEGMENT_PIXELS;
    }

    /**
     * The grey level of one source pixel, given one intensity ramp per palette.
     *
     * Returns an intensity rather than a palette index so that a caller
     * rasterising a whole world does not allocate per pixel.
     */
    intensity(x: number, y: number, palettes: number[][]): number {
        const outside = x < 0 || y < 0 || x >= this.width || y >= this.height;
        // Both dimensions are powers of two, so the masking below is the
        // wrap the hardware does — and, unlike `%`, it is also correct for
        // the negative coordinates a world scrolled past its origin produces.
        const wx = x & (this.width - 1);
        const wy = y & (this.height - 1);
        const cell = decodeVipBgMapCell(
            this.world.overplane && outside ? this.world.overplaneCell : this.cellAt(wx, wy)
        );
        const value = this.characters.pixel(
            cell.char,
            cell.hFlip ? VIP_CHAR_SIZE - 1 - (x & 7) : x & 7,
            cell.vFlip ? VIP_CHAR_SIZE - 1 - (y & 7) : y & 7
        );
        return palettes[cell.palette][value];
    }

    /** The raw cell halfword covering a wrapped source pixel, or 0 if unread. */
    protected cellAt(wx: number, wy: number): number {
        // Only the low four bits of a segment number reach the hardware, so a
        // world whose segments run off the end of BGMap memory wraps around
        // rather than reading somewhere else entirely.
        const segment = (this.world.bgMap
            + (wy / VIP_BGMAP_SEGMENT_PIXELS | 0) * this.world.scx
            + (wx / VIP_BGMAP_SEGMENT_PIXELS | 0)) & 0x0f;
        const bytes = this.segments[segment];
        if (!bytes) {
            return 0;
        }
        const offset = (((wy >> 3) & (VIP_BGMAP_CELLS - 1)) * VIP_BGMAP_CELLS
            + ((wx >> 3) & (VIP_BGMAP_CELLS - 1))) * 2;
        return offset + 1 < bytes.length ? bytes[offset] | (bytes[offset + 1] << 8) : 0;
    }
}

/**
 * Where on screen a world lands for one eye.
 *
 * The size is the register values plus one, since the hardware reads W and H
 * as size minus one, and the position is shifted by the parallax: the left eye
 * to the left of the world's own GX, the right eye to the right of it.
 */
export function vipWorldExtents(world: VipWorld, eye: VipEye): { x: number, y: number, width: number, height: number } {
    return {
        x: world.gx + (eye === 'left' ? -world.gp : world.gp),
        y: world.gy,
        width: world.w + 1,
        height: world.h + 1,
    };
}

/**
 * Paint what one world alone puts on the screen, for one eye.
 *
 * This is the world's own contribution rather than a frame: nothing here
 * composites the worlds drawn before it, and pixel value 0 is painted black
 * rather than left transparent, so what shows is exactly the area the world
 * covers.
 *
 * `params` is the world's param table, needed by the H-bias and Affine modes
 * and ignored by the others; rows it does not reach are drawn unshifted and
 * untransformed rather than skipped. An Object world draws nothing at all,
 * since what it puts on screen lives in OAM rather than in any map of its own.
 */
export function drawVipWorld(
    target: Uint8ClampedArray,
    targetWidth: number,
    targetHeight: number,
    world: VipWorld,
    map: VipWorldMap,
    palettes: number[][],
    eye: VipEye,
    params?: DataView
): void {
    if (world.mode === VipWorldMode.OBJECT) {
        return;
    }

    // The left eye is drawn parallax to the left of the world's position and
    // the right eye to the right of it, source and destination alike.
    const sign = eye === 'left' ? -1 : 1;
    const destX = vipWorldExtents(world, eye).x;

    // W and H are sizes minus one, hence the inclusive bounds; clipping them
    // to the screen up front keeps a garbage size from turning into sixty-five
    // thousand iterations that draw nothing.
    const firstRow = Math.max(0, -world.gy);
    const lastRow = Math.min(world.h, targetHeight - 1 - world.gy);
    const firstColumn = Math.max(0, -destX);
    const lastColumn = Math.min(world.w, targetWidth - 1 - destX);

    for (let row = firstRow; row <= lastRow; row++) {
        const affine = world.mode === VipWorldMode.AFFINE ? vipAffineRow(params, row) : undefined;
        const hbias = world.mode === VipWorldMode.HBIAS ? vipHBiasRow(params, row) : undefined;
        const shift = hbias ? (eye === 'left' ? hbias.left : hbias.right) : 0;
        const sourceX = world.mx + sign * world.mp + shift;
        const sourceY = world.my + row;
        const line = (world.gy + row) * targetWidth;

        for (let column = firstColumn; column <= lastColumn; column++) {
            let x = sourceX + column;
            let y = sourceY;
            if (affine) {
                // An affine row brings its own source origin, in 13.3 fixed
                // point, and steps along the row in 7.9 — so the step is
                // shifted down by six to match before the sum is shifted down
                // by three to whole pixels, the conversion affine.c documents.
                // Its parallax is treated like a BGMap world's, which is an
                // approximation of what the hardware does with that field.
                x = (affine.mx + sign * affine.mp + ((affine.dx * column) >> 6)) >> 3;
                y = (affine.my + ((affine.dy * column) >> 6)) >> 3;
            }
            const offset = (line + destX + column) * 4;
            // Red, because that is the colour the hardware actually emits.
            target[offset] = map.intensity(x, y, palettes);
            target[offset + 3] = 255;
        }
    }
}

/**
 * Paint one object where it lands on screen for one eye.
 *
 * An object is a single character at a screen position, so unlike a world
 * there is no map behind it — but it can hang off any edge of the screen, so
 * every pixel is bounds checked rather than the rectangle being clipped up
 * front: there are only 64 of them.
 */
export function drawVipObject(
    target: Uint8ClampedArray,
    targetWidth: number,
    targetHeight: number,
    object: VipObject,
    characters: VipCharacters,
    intensities: number[],
    eye: VipEye
): void {
    const destX = object.jx + (eye === 'left' ? -object.jp : object.jp);
    for (let row = 0; row < VIP_CHAR_SIZE; row++) {
        const y = object.jy + row;
        if (y < 0 || y >= targetHeight) {
            continue;
        }
        for (let column = 0; column < VIP_CHAR_SIZE; column++) {
            const x = destX + column;
            if (x < 0 || x >= targetWidth) {
                continue;
            }
            const value = characters.pixel(
                object.char,
                object.hFlip ? VIP_CHAR_SIZE - 1 - column : column,
                object.vFlip ? VIP_CHAR_SIZE - 1 - row : row
            );
            const offset = (y * targetWidth + x) * 4;
            // Red, because that is the colour the hardware actually emits.
            target[offset] = intensities[value];
            target[offset + 3] = 255;
        }
    }
}

/** Whether two buffers hold the same bytes, treating absent as different. */
export function sameVipBytes(a: Uint8Array | undefined, b: Uint8Array | undefined): boolean {
    if (!a || !b || a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
