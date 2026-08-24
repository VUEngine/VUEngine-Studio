/**
 * Constants for the Shrooms-VB core.
 *
 * Mirrors the values in the vendored core's Constants.js, which is the
 * authority. Kept as a TypeScript module so that the worker, the audio worklet
 * and the frontend can share them without pulling in the vendored shim.
 */

/** Virtual Boy master clock, in Hz. */
export const VB_CLOCK_RATE = 20000000;

/** Sample rate the core produces audio at, in Hz. */
export const VB_SAMPLE_RATE = 41700;

/** Frames the display is driven at, in Hz. One audio buffer covers one frame. */
export const VB_FRAME_RATE = 50;

/**
 * Number of emulated clocks per audio buffer. 400000 clocks is 0.02 seconds at
 * 20 MHz, which is exactly VB_SAMPLES_PER_BUFFER samples.
 */
export const VB_CLOCKS_PER_BUFFER = VB_CLOCK_RATE / VB_FRAME_RATE;

/** Stereo frames per audio buffer. */
export const VB_SAMPLES_PER_BUFFER = VB_SAMPLE_RATE / VB_FRAME_RATE;

/**
 * Audio buffers cycled between the core worker and the audio worklet. Three
 * buffers is ~60ms of latency, matching the vendored shim.
 */
export const VB_AUDIO_BUFFER_COUNT = 3;

/** Display dimensions, per eye. */
export const VB_SCREEN_WIDTH = 384;
export const VB_SCREEN_HEIGHT = 224;

/** Name the audio worklet processor is registered under. */
export const VB_AUDIO_PROCESSOR = 'ves-vb-audio';

/** Controller button bits, as accepted by vbSetKeys. */
export enum VbKey {
    PWR = 0x0001,
    SGN = 0x0002,
    A = 0x0004,
    B = 0x0008,
    RT = 0x0010,
    LT = 0x0020,
    RU = 0x0040,
    RR = 0x0080,
    LR = 0x0100,
    LL = 0x0200,
    LD = 0x0400,
    LU = 0x0800,
    STA = 0x1000,
    SEL = 0x2000,
    RL = 0x4000,
    RD = 0x8000,
}

/** Data types for vbRead/vbWrite and vbSetSamples. */
export enum VbDataType {
    S8 = 0,
    U8 = 1,
    S16 = 2,
    U16 = 3,
    S32 = 4,
    F32 = 5,
}

/** System register indices. */
export enum VbSystemRegister {
    EIPC = 0,
    EIPSW = 1,
    FEPC = 2,
    FEPSW = 3,
    ECR = 4,
    PSW = 5,
    PIR = 6,
    TKCW = 7,
    CHCW = 24,
    ADTRE = 25,
}

/**
 * Game Pak RAM, where a cartridge keeps its save data.
 *
 * The core drops every access to this region — writes as well as reads — until
 * a simulation has been given cartridge RAM with setCartRam.
 */
export const VB_CART_RAM_BASE = 0x06000000;

/**
 * Where the engine writes terminal output.
 *
 * `Terminal::print` stores a string here one byte at a time and follows it with
 * a newline, so this is a byte-wide port rather than an address holding a
 * value. See `vuengine/core/source/Debugging/Terminal/Terminal.c`; it is
 * compiled out of shipping builds, so a released ROM writes nothing.
 */
export const VB_TERMINAL_PORT = 0x02000030;

/**
 * The link port's control register, CCR.
 *
 * A byte leaves the machine in two steps: the payload is stored to
 * VB_LINK_TRANSMIT_PORT, then this register is written with VB_LINK_START set,
 * which clocks it out. Watching the payload register alone would therefore
 * report bytes that were never sent — `Communications::reset` clears it
 * without transmitting, for one.
 */
export const VB_LINK_CONTROL_PORT = 0x02000000;

/** The link port's transmit data register, CDTR. */
export const VB_LINK_TRANSMIT_PORT = 0x02000008;

/**
 * The address an ESSound cartridge listens on.
 *
 * ESSound is an expansion that plays MP3 and WAV files from the cartridge
 * folder, driven entirely by halfword writes to this one address — the
 * hardware selects on `/ES`, so the whole `0x04......` range reaches it and a
 * single address is all the protocol needs. See `ves-emulator-essound.ts` for
 * what the halfwords mean.
 */
export const VB_ES_SOUND_PORT = 0x04000000;

/**
 * The CCR bit that starts a transfer, `__COM_START`.
 *
 * See `Communications::startTransmissions` and
 * `Communications::startClockSignal` in
 * `applications/electron/vb/vuengine/platforms/VirtualBoy/source/Hardware/Communications.c`,
 * and `libgccvb/source/hw.h` for the register map itself.
 */
export const VB_LINK_START = 0x04;

/**
 * The VSU's waveform tables, MODDATA and the six channel register blocks
 * (`applications/electron/vb/libgccvb/source/audio.h`), up to but not
 * including SSTOP.
 *
 * Real hardware never lets these be read back, and this core matches that:
 * confirmed directly against it (see `scripts/vsu-capture-probe.mjs`) that
 * vbRead on any address in this range always comes back 0, whether the value
 * arrived through an actual CPU store instruction or the debug vbWrite
 * primitive. So unlike every other inspector panel, the VSU panel cannot poll
 * memory for this range — it has to watch writes as they happen and keep its
 * own shadow copy, the same way terminal capture already does for
 * VB_TERMINAL_PORT. See setVsuCapture.
 */
export const VB_VSU_BASE = 0x01000000;
export const VB_VSU_WATCH_BYTES = 0x580;

/**
 * The CPU's interrupt levels, in the order the hardware vectors them.
 *
 * Confirmed by the engine's own vector table (`vuengine/core/source/Runtime/
 * crt0.s`, section `.vbvectors`), which labels them KEY, TIM, CRO, COM and
 * VPU at sixteen-byte intervals. CRO is the expansion port's, which is what an
 * ESSound cartridge pulses to say it is there.
 */
export enum VbInterrupt {
    KEY = 0,
    TIM = 1,
    CRO = 2,
    COM = 3,
    VPU = 4,
}

/**
 * Where the CPU jumps for interrupt level n: this plus `n * 0x10`.
 *
 * The addresses the ROM links its table at (`0x07FFFE00`) are the same memory
 * seen through the cartridge mirror.
 */
export const VB_INTERRUPT_VECTOR_BASE = 0xfffffe00;

/** The exception code an interrupt of level n writes to ECR's low halfword. */
export function vbInterruptExceptionCode(level: VbInterrupt): number {
    return 0xfe00 | (level << 4);
}

/**
 * PSW bits, per the V810's program status word.
 *
 * The interrupt level mask occupies bits 16 to 19, which the engine's
 * `set_intlevel` in `libgccvb/source/asm.c` reads and writes the same way.
 */
export enum VbPsw {
    /** Interrupts are disabled. */
    ID = 0x1000,
    /** Address trap enable. */
    AE = 0x2000,
    /** An exception is being handled. */
    EP = 0x4000,
    /** A non-maskable interrupt is being handled. */
    NP = 0x8000,
}
export const VB_PSW_INTERRUPT_LEVEL_SHIFT = 16;
export const VB_PSW_INTERRUPT_LEVEL_MASK = 0x000f0000;

/** Core option keys for vbSetOption/vbGetOption. */
export enum VbOption {
    PSEUDO_HALT = 0,
}

/** Break condition bits returned by GetBreaks. */
export enum VbBreak {
    FRAME = 1,
    POINT = 2,
}

/**
 * Anaglyph configuration that packs the left eye's brightness into the red
 * channel and the right eye's into the green channel, both unscaled.
 *
 * The core's mixer assigns RGB channels to eyes independently, so this yields a
 * single RGBA framebuffer carrying both eyes at full 8-bit precision. Every
 * display mode is then derived in a shader from one texture, without per-eye
 * passes or decoding VIP framebuffers. The core is always configured this way;
 * colour is applied entirely by the renderer.
 */
export const VB_EYE_PACKED_LEFT = 0xff0000;
export const VB_EYE_PACKED_RIGHT = 0x00ff00;

/**
 * Tints the built-in anaglyph pairs are made of.
 *
 * Green and magenta are the core's own constants (see Constants.js); the rest
 * are full-saturation equivalents, which is what a filter passes best. Nothing
 * here affects emulation.
 */
export const VB_COLORS = {
    RED: 0xff0000,
    BLUE: 0x0000ff,
    CYAN: 0x00ffff,
    GREEN: 0x00b400,
    MAGENTA: 0xc800ff,
    YELLOW: 0xffff00,
};

/**
 * Where the display's four brightness levels land in the framebuffer's 0..1
 * range, with the brightness registers a VUEngine game configures by default
 * (BRTA 32, BRTB 64, BRTC 32 — see __BRIGHTNESS_DARK/MEDIUM/BRIGHT_RED).
 *
 * The core resolves a pixel's brightness before the renderer sees it, and does
 * so on a gamma-like curve rather than proportionally:
 * `scripts/brightness-probe.mjs` measures level 1 at 105, level 2 at 162 and
 * level 3 at 250 out of 255. The renderer interpolates the palette between
 * these stops, so a display at the standard brightness shows the four palette
 * colours exactly, while a game dimming the brightness registers — a fade —
 * slides smoothly down through them instead of banding.
 */
export const VB_LEVEL_STOPS = [0, 105 / 255, 162 / 255, 250 / 255];

/** Brightness levels the display shows a pixel at, unlit included. */
export const VB_LEVELS = 4;

/**
 * What a physically monochrome display looks like at each of its four
 * brightness levels, from unlit to fully lit.
 */
export type VbPalette = [number, number, number, number];

/**
 * The two tints an anaglyph assigns to the eyes. Not a VbPalette because an
 * anaglyph is additive: each eye contributes its tint over black, scaled by
 * brightness, so that a tint only ever reaches the eye whose filter passes it.
 */
export interface VbAnaglyphPalette {
    left: number;
    right: number;
}

/**
 * Palettes shipped with the emulator, keyed as the preference stores them.
 * Both step evenly from black to the fully lit colour; anything else is a
 * matter of taste, and so a custom palette.
 */
export const VB_PALETTES: Record<string, VbPalette> = {
    'default': [0x000000, 0x78010d, 0xa80016, 0xff0024],
    'red': [0x000000, 0x550000, 0xaa0000, 0xff0000],
    'grey': [0x000000, 0x555555, 0xaaaaaa, 0xffffff],
    'green': [0x000000, 0x005500, 0x00aa00, 0x00ff00],
    'blue': [0x000000, 0x000055, 0x0000aa, 0x0000ff],
    'cyan': [0x000000, 0x005555, 0x00aaaa, 0x00ffff],
    'magenta': [0x000000, 0x550055, 0xaa00aa, 0xff00ff],
    'yellow': [0x000000, 0x555500, 0xaaaa00, 0xffff00],
    'game-boy': [0x0F380F, 0x306230, 0x9BBC0F, 0x8BAC0F],
    'game-boy-pocket': [0x1F211A, 0x4C533C, 0x8B966C, 0xC4CFA1],
    'super-game-boy': [0x000000, 0x943A3A, 0xFF9494, 0xFFFF73],
};

export const VB_DEFAULT_PALETTE_ID = Object.keys(VB_PALETTES)[0];

export const VB_ANAGLYPH_PALETTES: Record<string, VbAnaglyphPalette> = {
    'red-cyan': { left: VB_COLORS.RED, right: VB_COLORS.CYAN },
    'red-blue': { left: VB_COLORS.RED, right: VB_COLORS.BLUE },
    'red-green': { left: VB_COLORS.RED, right: VB_COLORS.GREEN },
    'green-magenta': { left: VB_COLORS.GREEN, right: VB_COLORS.MAGENTA },
    'yellow-blue': { left: VB_COLORS.YELLOW, right: VB_COLORS.BLUE },
};

export const VB_DEFAULT_ANAGLYPH_PALETTE_ID = 'red-cyan';

export enum VbStereoLayout {
    OVERLAY,
    SIDE_BY_SIDE,
    CYBERSCOPE,
    HLI,
    VLI,
}

export enum VbEyes {
    LEFT = 0,
    RIGHT = 1,
    BOTH = 2,
}

export enum VbRenderingMode {
    LEFT = 'left',
    RIGHT = 'right',
    ANAGLYPH = 'anaglyph',
    SIDE_BY_SIDE = 'side-by-side',
    CYBERSCOPE = 'cyberscope',
    HLI = 'hli',
    VLI = 'vli',
}

interface VbRenderingGeometry {
    layout: VbStereoLayout;
    eyes: VbEyes;
    width: number;
    height: number;
}

const VB_RENDERING_GEOMETRIES: Record<VbRenderingMode, VbRenderingGeometry> = {
    [VbRenderingMode.LEFT]: {
        layout: VbStereoLayout.OVERLAY,
        eyes: VbEyes.LEFT,
        width: VB_SCREEN_WIDTH,
        height: VB_SCREEN_HEIGHT,
    },
    [VbRenderingMode.RIGHT]: {
        layout: VbStereoLayout.OVERLAY,
        eyes: VbEyes.RIGHT,
        width: VB_SCREEN_WIDTH,
        height: VB_SCREEN_HEIGHT,
    },
    [VbRenderingMode.ANAGLYPH]: {
        layout: VbStereoLayout.OVERLAY,
        eyes: VbEyes.BOTH,
        width: VB_SCREEN_WIDTH,
        height: VB_SCREEN_HEIGHT,
    },
    [VbRenderingMode.SIDE_BY_SIDE]: {
        layout: VbStereoLayout.SIDE_BY_SIDE,
        eyes: VbEyes.BOTH,
        width: VB_SCREEN_WIDTH * 2,
        height: VB_SCREEN_HEIGHT,
    },
    [VbRenderingMode.CYBERSCOPE]: {
        layout: VbStereoLayout.CYBERSCOPE,
        eyes: VbEyes.BOTH,
        // Each eye is squeezed to 256 columns, which the accessory's prisms expand.
        width: 512,
        height: VB_SCREEN_HEIGHT,
    },
    [VbRenderingMode.HLI]: {
        layout: VbStereoLayout.HLI,
        eyes: VbEyes.BOTH,
        width: VB_SCREEN_WIDTH,
        height: VB_SCREEN_HEIGHT * 2,
    },
    [VbRenderingMode.VLI]: {
        layout: VbStereoLayout.VLI,
        eyes: VbEyes.BOTH,
        width: VB_SCREEN_WIDTH * 2,
        height: VB_SCREEN_HEIGHT,
    },
};

/**
 * Everything the renderer needs to present a frame: the geometry the rendering
 * mode dictates, plus the colours chosen for it. The palette applies wherever
 * an eye is shown on its own — which is every mode but Anaglyph, including the
 * split ones, where each half is monochrome.
 */
export interface VbDisplayMode extends VbRenderingGeometry {
    palette: VbPalette;
    anaglyph: VbAnaglyphPalette;
}

export function isVbRenderingMode(mode: string): mode is VbRenderingMode {
    return mode in VB_RENDERING_GEOMETRIES;
}

export const VB_DEFAULT_RENDERING_MODE = VbRenderingMode.LEFT;

export function buildVbDisplayMode(
    mode: string,
    palette: VbPalette,
    anaglyph: VbAnaglyphPalette
): VbDisplayMode {
    const geometry = VB_RENDERING_GEOMETRIES[
        isVbRenderingMode(mode) ? mode : VB_DEFAULT_RENDERING_MODE
    ];
    return { ...geometry, palette, anaglyph };
}

export const VB_DEFAULT_DISPLAY_MODE = buildVbDisplayMode(
    VB_DEFAULT_RENDERING_MODE,
    VB_PALETTES[VB_DEFAULT_PALETTE_ID],
    VB_ANAGLYPH_PALETTES[VB_DEFAULT_ANAGLYPH_PALETTE_ID]
);
