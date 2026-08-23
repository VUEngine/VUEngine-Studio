/**
 * Message protocol between the DOM thread and the emulator core worker.
 *
 * Every command is a request/response pair correlated by id, so callers get a
 * promise per call instead of relying on strict message ordering.
 */

import { VbDisplayMode } from './ves-vb-constants';

/** Opaque handle to a simulation living inside the worker. */
export type VesVbSimHandle = number;

/**
 * A session, small enough to keep and exact enough to replay.
 *
 * The drive loop emulates fixed-size chunks and input only ever changes
 * between them, so the whole of a session's input is the mask in effect at
 * each chunk — and since most chunks change nothing, only the changes are
 * kept.
 */
export interface VesVbRecording {
    /** The machine when recording began. */
    state: ArrayBuffer;
    /** Chunks recorded, which is how long the replay runs for. */
    chunks: number;
    /** `[chunk, mask]` pairs, at the chunks where the mask changed. */
    keys: [number, number][];
}

/** One node of a replayed call tree, flattened for the message channel. */
export interface VesVbProfileNode {
    parent: number;
    address: number;
    selfSamples: number;
    totalSamples: number;
}

export interface VesVbProfileResult {
    nodes: VesVbProfileNode[];
    /** Instructions executed, which is what the samples add up to. */
    instructions: number;
    /** Calls dropped for depth, which should be zero on anything sane. */
    overflows: number;
    /**
     * How many times the machine restarted while recording. A profile spanning
     * several reboots describes several runs, and the reader should be told.
     */
    resets: number;
    /** How long the replay took, for reporting against the time recorded. */
    elapsedMs: number;
}

export interface VesVbCommands {
    /** Instantiate the WebAssembly core. Must be sent first. */
    init: { params: { wasmUrl: string }; result: void };
    /** Create a simulation and return its handle. */
    createSim: { params: Record<string, never>; result: VesVbSimHandle };
    /** Destroy a simulation and release its resources. */
    deleteSim: { params: { sim: VesVbSimHandle }; result: void };
    /** Hand a transferred OffscreenCanvas to a simulation for presentation. */
    attachCanvas: { params: { sim: VesVbSimHandle; canvas: OffscreenCanvas }; result: void };
    /** Load cartridge ROM. The buffer is transferred. */
    setCartRom: { params: { sim: VesVbSimHandle; rom: ArrayBuffer }; result: void };
    /** Load cartridge save RAM. The buffer is transferred. */
    setCartRam: { params: { sim: VesVbSimHandle; ram: ArrayBuffer }; result: void };
    /** Read back cartridge save RAM. */
    getCartRam: { params: { sim: VesVbSimHandle }; result: ArrayBuffer };
    /** Reset a simulation to its power-on state. */
    reset: { params: { sim: VesVbSimHandle }; result: void };
    /** Set the pressed-button bitmask (see VbKey). */
    setKeys: { params: { sim: VesVbSimHandle; keys: number }; result: void };
    /** Select the display mode, which also resizes the presentation surface. */
    setDisplayMode: { params: { sim: VesVbSimHandle; mode: VbDisplayMode }; result: void };
    /** Encode the currently presented frame as a PNG. */
    capture: { params: { sim: VesVbSimHandle }; result: ArrayBuffer };
    /** Set output volume, 0 to 10. */
    setVolume: { params: { sim: VesVbSimHandle; volume: number }; result: void };
    /** Set stereo panning, -1 to +1. */
    setPanning: { params: { sim: VesVbSimHandle; panning: number }; result: void };
    /** Begin audio-clocked emulation of every attached simulation. */
    run: { params: Record<string, never>; result: void };
    /** Halt emulation. */
    suspend: { params: Record<string, never>; result: void };
    /** Snapshot a simulation's entire state. */
    saveState: { params: { sim: VesVbSimHandle }; result: ArrayBuffer };
    /** Restore a snapshot taken by saveState. */
    loadState: { params: { sim: VesVbSimHandle; state: ArrayBuffer }; result: void };
    /**
     * Begin recording what a simulation is told to do, so the session can be
     * replayed later and profiled exhaustively. Emulation is deterministic, so
     * the machine's state now plus the input from here on reproduces it
     * exactly. Recording costs a snapshot and a few bytes per chunk.
     */
    startProfileRecording: { params: { sim: VesVbSimHandle }; result: void };
    /** Stop recording and hand back what was recorded. */
    stopProfileRecording: { params: { sim: VesVbSimHandle }; result: VesVbRecording };
    /**
     * Replay a recording on a scratch simulation, following every instruction,
     * and return the call tree it produced.
     *
     * Runs to completion before replying — a minute of play takes some seconds
     * (§6.3) — and never touches the simulation the recording came from.
     */
    replayProfile: {
        params: { sim: VesVbSimHandle; recording: VesVbRecording };
        result: VesVbProfileResult;
    };
    /**
     * Emulation rate, where 1 is real time. Above 1 fast forwards, below 1
     * runs in slow motion. Applies to the whole session.
     */
    setSpeed: { params: { speed: number }; result: void };
    /** Advance every simulation by exactly one frame, then stop. */
    stepFrame: { params: Record<string, never>; result: void };
    /** Configure the rewind ring buffer. Disabling it releases the memory. */
    setRewind: {
        params: { enabled: boolean; granularity: number; budgetBytes: number };
        result: void
    };
    /**
     * Step back up to `count` rewind entries, defaulting to one, and present
     * the state that lands. Returns how many entries were actually applied;
     * fewer than asked for means the buffer ran out.
     */
    rewindStep: { params: { count?: number }; result: number };
    /**
     * Wire two simulations together over the link port, or pass a peer of 0 to
     * disconnect. Both must belong to this session.
     */
    setPeer: { params: { sim: VesVbSimHandle; peer: VesVbSimHandle }; result: void };

    // --- Inspection ---------------------------------------------------------

    /**
     * Read a rectangle of the composited framebuffer as RGBA bytes.
     *
     * The core always composites eye-packed, so the red channel carries the
     * left eye's brightness and the green channel the right eye's. Reads are
     * from the core's own framebuffer rather than from any canvas, so this works
     * whether or not the simulation is being presented anywhere.
     */
    readPixels: {
        params: { sim: VesVbSimHandle; x: number; y: number; width: number; height: number };
        result: ArrayBuffer
    };
    /** Read a window of the address space as the CPU would see it. */
    readMemory: {
        params: { sim: VesVbSimHandle; address: number; length: number };
        result: ArrayBuffer
    };
    /** Write bytes into the address space. The buffer is transferred. */
    writeMemory: {
        params: { sim: VesVbSimHandle; address: number; data: ArrayBuffer };
        result: void
    };
    /** Program counter, the 32 program registers, and the system registers. */
    readRegisters: { params: { sim: VesVbSimHandle }; result: VesVbRegisters };
    /** Disassemble instructions starting at an address. */
    disassemble: {
        params: { sim: VesVbSimHandle; address: number; count: number };
        result: VesVbDisassemblyLine[]
    };
    /**
     * Watch the terminal port for output.
     *
     * Off by default, because capturing means a callback on every CPU write and
     * a game performs a great many of those.
     */
    setTerminalCapture: { params: { sim: VesVbSimHandle; enabled: boolean }; result: void };
    /**
     * Watch the link port for bytes clocked out of it, so that a peripheral
     * on the other end of a real cable — a rumble pack — can be driven by an
     * emulated game.
     *
     * Off by default, and for a stronger reason than the panels' captures: it
     * costs the same callback on every CPU write, and nothing is listening
     * unless a physical device is actually plugged in.
     */
    setLinkCapture: { params: { sim: VesVbSimHandle; enabled: boolean }; result: void };
    /**
     * Report 32-bit writes to one address, so that a pointer variable can be
     * followed as the program assigns it.
     *
     * One address per simulation, and zero to stop watching. Narrower writes
     * to it are ignored: a pointer is stored whole, and half of one is not a
     * value worth reporting.
     */
    setPointerWatch: { params: { sim: VesVbSimHandle; address: number }; result: void };
    /**
     * Repeat a set of writes at every frame break, which is what a cheat is:
     * a value the game keeps changing and the cheat keeps putting back.
     *
     * Applied here rather than by the caller writing on a timer, because a
     * cheat has to land every frame — one message a frame per code would be a
     * great deal of traffic for something the drive loop can do in place. An
     * empty list turns them off.
     */
    setCheats: { params: { sim: VesVbSimHandle; codes: VesVbCheatWrite[] }; result: void };
    /**
     * Watch the address an ESSound cartridge listens on, so the halfwords a
     * game writes there can be played as audio on this side.
     *
     * Same cost and the same opt-in as the captures above: on only while
     * there is something to play, which means only while the ROM has ESSound
     * files beside it.
     */
    setEsSoundCapture: { params: { sim: VesVbSimHandle; enabled: boolean }; result: void };
    /**
     * Watch the VSU's registers and waveform tables (VB_VSU_BASE,
     * VB_VSU_WATCH_BYTES bytes) for writes, the same way setTerminalCapture
     * watches the terminal port — because, per VB_VSU_BASE's own comment,
     * reading that range back is not otherwise possible at all.
     *
     * Off by default, for the same reason terminal capture is: it costs a
     * callback on every CPU write.
     */
    setVsuCapture: { params: { sim: VesVbSimHandle; enabled: boolean }; result: void };
    /**
     * The shadow copy setVsuCapture has observed so far, VB_VSU_WATCH_BYTES
     * bytes starting at VB_VSU_BASE. All zero wherever nothing has been
     * written yet, including throughout if capture was never enabled.
     */
    readVsu: { params: { sim: VesVbSimHandle }; result: ArrayBuffer };
}

/** One write a cheat repeats: `bytes` wide, little-endian, like the CPU's. */
export interface VesVbCheatWrite {
    address: number;
    value: number;
    bytes: number;
}

export interface VesVbRegisters {
    pc: number;
    /** r0 to r31. */
    program: number[];
    /** Keyed by the names in VbSystemRegister. */
    system: Record<string, number>;
}

export interface VesVbDisassemblyLine {
    address: number;
    /** Instruction bytes, as 16-bit halfwords. */
    code: number[];
    /** Whether the program counter is currently here. */
    isPC: boolean;
    mnemonic: string;
    operands: string[];
}

export type VesVbCommandName = keyof VesVbCommands;
export type VesVbParams<K extends VesVbCommandName> = VesVbCommands[K]['params'];
export type VesVbResult<K extends VesVbCommandName> = VesVbCommands[K]['result'];

export interface VesVbRequest<K extends VesVbCommandName = VesVbCommandName> {
    id: number;
    command: K;
    params: VesVbParams<K>;
}

export interface VesVbResponse {
    id: number;
    result?: unknown;
    error?: string;
}

/** Unsolicited worker to DOM notifications. */
export interface VesVbEvents {
    /** The worker hit an error outside of a command, e.g. in the drive loop. */
    error: { message: string };
    /**
     * Text a simulation wrote to the terminal port, batched rather than sent a
     * byte at a time. Newlines are left in, so a consumer splits on them.
     */
    terminal: { sim: VesVbSimHandle; text: string };
    /**
     * Bytes a simulation clocked out of the link port, in the order they were
     * sent and batched the same way terminal output is.
     */
    link: { sim: VesVbSimHandle; bytes: number[] };
    /** Values written to the address setPointerWatch is following. */
    pointerWrite: { sim: VesVbSimHandle; address: number; values: number[] };
    /**
     * Halfwords a simulation wrote to the ESSound port, in the order it wrote
     * them and batched the same way link bytes are.
     */
    esSound: { sim: VesVbSimHandle; commands: number[] };
}

/**
 * One event and its payload.
 *
 * Written as a distributed union rather than a generic interface so that
 * checking `event` narrows `payload` to the matching type.
 */
export type VesVbEvent = {
    [K in keyof VesVbEvents]: { event: K; payload: VesVbEvents[K] }
}[keyof VesVbEvents];

export type VesVbOutbound = VesVbResponse | VesVbEvent;

export function isVesVbEvent(message: VesVbOutbound): message is VesVbEvent {
    return 'event' in message;
}

/** The first message the worker receives, carrying the audio worklet's port. */
export interface VesVbBootstrap {
    audioPort: MessagePort;
}
