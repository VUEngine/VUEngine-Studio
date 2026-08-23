/**
 * Emulator core worker.
 *
 * Owns the WebAssembly core and every simulation in one emulation session, and
 * runs the drive loop. Emulation is clocked by audio consumption: the audio
 * worklet returns emptied sample buffers, and each returned buffer causes
 * exactly VB_CLOCKS_PER_BUFFER clocks to be emulated and the buffer refilled.
 * Video is paced against the audio backlog so that picture and sound stay in
 * step without a separate timer.
 *
 * This module MUST NOT import anything from Theia; it is bundled as a
 * standalone worker entry point.
 */

import {
  VB_AUDIO_BUFFER_COUNT,
  VB_CLOCKS_PER_BUFFER,
  VB_DEFAULT_DISPLAY_MODE,
  VB_ES_SOUND_PORT,
  VB_EYE_PACKED_LEFT,
  VB_EYE_PACKED_RIGHT,
  VB_LINK_CONTROL_PORT,
  VB_LINK_START,
  VB_LINK_TRANSMIT_PORT,
  VB_SAMPLES_PER_BUFFER,
  VB_SCREEN_HEIGHT,
  VB_SCREEN_WIDTH,
  VB_INTERRUPT_VECTOR_BASE,
  VB_PSW_INTERRUPT_LEVEL_MASK,
  VB_PSW_INTERRUPT_LEVEL_SHIFT,
  VB_TERMINAL_PORT,
  VB_VSU_BASE,
  VB_VSU_WATCH_BYTES,
  VbBreak,
  VbDataType,
  VbDisplayMode,
  VbInterrupt,
  vbInterruptExceptionCode,
  VbPsw,
  VbSystemRegister,
} from '../common/ves-vb-constants';
import {
  VesVbBootstrap,
  VesVbCheatWrite,
  VesVbCommandName,
  VesVbEvent,
  VesVbParams,
  VesVbDisassemblyLine,
  VesVbRegisters,
  VesVbRequest,
  VesVbResponse,
  VesVbSimHandle,
} from '../common/ves-vb-protocol';
import { ES_SOUND_INIT } from '../common/ves-emulator-essound';
import { applyDelta, createRunScratch, encodeDelta } from './ves-vb-rewind';
import { VesVbRenderer } from './ves-vb-renderer';
import {
  installVesVbCallback,
  instantiateVesVbWasm,
  VesVbWasmExports,
} from './ves-vb-wasm';

// Minimal shape of the dedicated worker global, which lib.dom does not type.
interface VesVbWorkerScope {
  onmessage: ((event: MessageEvent) => void) | undefined;
  postMessage(message: unknown, transfer?: Transferable[]): void;
}

interface VesVbSimState {
  pointer: number;
  renderer?: VesVbRenderer;
  // Kept so the renderer can be rebuilt if the display mode arrives first.
  displayMode: VbDisplayMode;
  // Pointer to the core-owned sample buffer for this simulation.
  samples: number;
  // Cartridge buffers we allocated and are responsible for freeing.
  cartRom: number;
  cartRomSize: number;
  cartRam: number;
  cartRamSize: number;
}

/**
 * Rewind history, stored as reverse deltas.
 *
 * Storing whole snapshots is hopeless: the state struct is 1.85 MiB but only
 * about 0.2% of it changes per frame, so a 128 MB budget buys barely a second
 * of history. Encoding just the changed runs gets the same budget to minutes.
 *
 * Each entry converts the state at one capture back to the state at the
 * previous one, which is exactly the direction rewind walks, so stepping back
 * is a single XOR pass over the changed bytes and needs no keyframes.
 */
interface VesVbRewindStore {
  enabled: boolean;
  granularity: number;
  budgetBytes: number;
  // State at the newest capture, one per simulation. Deltas are relative to this.
  mirrors: Uint8Array[];
  // entries[n][sim] converts capture n back to capture n-1. Oldest first.
  entries: Uint8Array[][];
  // Total bytes held by entries, against which the budget is enforced.
  bytes: number;
  frames: number;
}

// Interleaved stereo, so two floats per frame.
const MIX_BUFFER_LENGTH = VB_SAMPLES_PER_BUFFER * 2;

class VesVbWorker {
  /**
   * Reads go through vbRead one byte at a time, so windows are bounded.
   *
   * The ceiling is a whole bank of WRAM, which is the largest contiguous
   * region in the address space anything here inspects, because two callers
   * want a structure whole rather than in pieces and a partial read would show
   * up as corrupt data rather than as an error: the graphics inspectors read a
   * character segment, a BGMap, the whole of OAM, or a whole frame buffer
   * (0x6000 bytes), and the Memory Pools panel reads VUEngine's pool struct,
   * which is sized per project and takes most of WRAM on a real game. Bounded
   * still: a byte at a time over 64 KiB costs nothing, but an unbounded
   * request would be a way to stall the worker.
   */
  static readonly MAX_MEMORY_WINDOW = 0x10000;
  static readonly MAX_DISASSEMBLY_LINES = 512;

  /**
   * Cap on terminal text held between flushes.
   *
   * A program in a tight loop can write to the port far faster than the panel
   * can display it, and the buffer is drained fifty times a second, so this is
   * only ever reached by output nobody could read anyway.
   */
  static readonly MAX_TERMINAL_BYTES = 1 << 16;

  /**
   * Cap on link port bytes held between flushes.
   *
   * Far smaller than the terminal's, because these are forwarded to a device
   * over a serial line that is slower than the game can fill it. A backlog
   * bigger than this is one the pack could never work through in time, and
   * rumble that lags a second behind the game is worse than rumble that
   * skipped what it could not keep up with.
   */
  static readonly MAX_LINK_BYTES = 1 << 10;

  /**
   * Cap on watched pointer values held between flushes. A pointer variable is
   * assigned when something starts, not in a loop, so this is only reached by
   * a program in trouble.
   */
  static readonly MAX_POINTER_WRITES = 64;

  /**
   * Cap on ESSound commands held between flushes. One store starts or stops a
   * track, so a game sends a handful a second at most.
   */
  static readonly MAX_ES_SOUND_COMMANDS = 256;

  protected wasm: VesVbWasmExports;
  protected audioPort: MessagePort;

  protected readonly sims = new Map<VesVbSimHandle, VesVbSimState>();

  // Sample buffers currently held by us rather than by the audio worklet.
  protected readonly audioQueue: Float32Array[] = [];

  protected emulating = false;

  // Emulation rate, where 1 is real time.
  protected speed = 1;
  // Clocks carried over between audio buffers, so slow motion can fall short of a chunk.
  protected pendingClocks = 0;

  protected readonly rewind: VesVbRewindStore = {
    enabled: false,
    granularity: 1,
    budgetBytes: 0,
    mirrors: [],
    entries: [],
    bytes: 0,
    frames: 0,
  };

  protected readonly runScratch = createRunScratch();

  /**
   * Table slot holding the shared write callback, or 0 before anything has
   * asked to watch writes. One callback serves every simulation and every
   * watcher (terminal capture, VSU capture), since it is handed the
   * simulation pointer and the address and can route on both; a simulation
   * only ever has room for one installed callback at a time (see
   * updateWriteWatch), so watchers cannot each install their own.
   */
  protected writeWatchCallbackSlot = 0;
  // Bytes seen at the terminal port since the last flush, by simulation.
  protected readonly terminalBuffers = new Map<VesVbSimHandle, number[]>();
  /**
   * Shadow copy of VB_VSU_BASE..+VB_VSU_WATCH_BYTES, by simulation, kept in
   * sync with every write since real hardware never allows that range to be
   * read back (see VB_VSU_BASE's own comment). Present only while
   * setVsuCapture(true) is in effect for that simulation.
   */
  protected readonly vsuBuffers = new Map<VesVbSimHandle, Uint8Array>();
  /**
   * The address each simulation is following a pointer at, by simulation, and
   * the values written to it since the last flush. Present only while
   * setPointerWatch is in effect for that simulation.
   */
  protected readonly pointerWatches = new Map<VesVbSimHandle, number>();

  /**
   * Writes to repeat at every frame break, by simulation pointer — the cheats
   * that are switched on. Keyed by pointer rather than handle because the
   * drive loop, which is what applies them, walks simulation states.
   */
  protected readonly cheats = new Map<number, VesVbCheatWrite[]>();
  protected readonly pointerWrites = new Map<VesVbSimHandle, number[]>();
  // Bytes clocked out of the link port since the last flush, by simulation.
  protected readonly linkBuffers = new Map<VesVbSimHandle, number[]>();
  /**
   * Halfwords written to the ESSound port since the last flush, by
   * simulation. Present only while setEsSoundCapture(true) is in effect.
   */
  protected readonly esSoundBuffers = new Map<VesVbSimHandle, number[]>();
  /**
   * Simulations owed an expansion-port interrupt, by pointer.
   *
   * An ESSound cartridge answers the init command with a pulse on /INTCRO, and
   * that pulse is how a ROM finds out the hardware is there at all. Held until
   * the CPU is in a state to take it rather than dropped, since a ROM
   * commonly sends init with interrupts still disabled.
   */
  protected readonly gamePakInterrupts = new Set<number>();
  /**
   * What each simulation last stored in the link port's transmit register, by
   * simulation. Shadowed rather than read back at transmission time because
   * the write watcher is the only thing that sees these registers at all, and
   * a byte is only sent once the control register says so.
   */
  protected readonly linkTransmitBytes = new Map<VesVbSimHandle, number>();

  // Scratch allocations in core memory, see #allocateScratch.
  protected clocksPointer = 0;
  protected simsPointer = 0;
  protected simsCapacity = 0;
  protected mixPointer = 0;

  constructor(protected readonly workerScope: VesVbWorkerScope) {}

  async bootstrap(bootstrap: VesVbBootstrap): Promise<void> {
    this.audioPort = bootstrap.audioPort;
    this.audioPort.onmessage = event =>
      this.onAudioBuffersReturned(event.data);

    for (let i = 0; i < VB_AUDIO_BUFFER_COUNT; i++) {
      this.audioQueue.push(new Float32Array(MIX_BUFFER_LENGTH));
    }
  }

  async handle<K extends VesVbCommandName>(
    command: K,
    params: VesVbParams<K>,
  ): Promise<unknown> {
    switch (command) {
      case 'init':
        return this.init(params as VesVbParams<'init'>);
      case 'createSim':
        return this.createSim();
      case 'deleteSim':
        return this.deleteSim(params as VesVbParams<'deleteSim'>);
      case 'attachCanvas':
        return this.attachCanvas(params as VesVbParams<'attachCanvas'>);
      case 'setCartRom':
        return this.setCartRom(params as VesVbParams<'setCartRom'>);
      case 'setCartRam':
        return this.setCartRam(params as VesVbParams<'setCartRam'>);
      case 'getCartRam':
        return this.getCartRam(params as VesVbParams<'getCartRam'>);
      case 'reset':
        return this.reset(params as VesVbParams<'reset'>);
      case 'setKeys':
        return this.setKeys(params as VesVbParams<'setKeys'>);
      case 'setDisplayMode':
        return this.setDisplayMode(params as VesVbParams<'setDisplayMode'>);
      case 'capture':
        return this.capture(params as VesVbParams<'capture'>);
      case 'setVolume':
        return this.setVolume(params as VesVbParams<'setVolume'>);
      case 'setPanning':
        return this.setPanning(params as VesVbParams<'setPanning'>);
      case 'run':
        return this.run();
      case 'suspend':
        return this.suspend();
      case 'saveState':
        return this.saveState(params as VesVbParams<'saveState'>);
      case 'loadState':
        return this.loadState(params as VesVbParams<'loadState'>);
      case 'setSpeed':
        return this.setSpeed(params as VesVbParams<'setSpeed'>);
      case 'stepFrame':
        return this.stepFrame();
      case 'setRewind':
        return this.setRewind(params as VesVbParams<'setRewind'>);
      case 'rewindStep':
        return this.rewindStep(params as VesVbParams<'rewindStep'>);
      case 'setPeer':
        return this.setPeer(params as VesVbParams<'setPeer'>);
      case 'readPixels':
        return this.readPixels(params as VesVbParams<'readPixels'>);
      case 'readMemory':
        return this.readMemory(params as VesVbParams<'readMemory'>);
      case 'writeMemory':
        return this.writeMemory(params as VesVbParams<'writeMemory'>);
      case 'readRegisters':
        return this.readRegisters(params as VesVbParams<'readRegisters'>);
      case 'disassemble':
        return this.disassemble(params as VesVbParams<'disassemble'>);
      case 'setTerminalCapture':
        return this.setTerminalCapture(
          params as VesVbParams<'setTerminalCapture'>,
        );
      case 'setLinkCapture':
        return this.setLinkCapture(params as VesVbParams<'setLinkCapture'>);
      case 'setPointerWatch':
        return this.setPointerWatch(params as VesVbParams<'setPointerWatch'>);
      case 'setCheats':
        return this.setCheats(params as VesVbParams<'setCheats'>);
      case 'setEsSoundCapture':
        return this.setEsSoundCapture(params as VesVbParams<'setEsSoundCapture'>);
      case 'setVsuCapture':
        return this.setVsuCapture(params as VesVbParams<'setVsuCapture'>);
      case 'readVsu':
        return this.readVsu(params as VesVbParams<'readVsu'>);
      default:
        throw new Error(`Unknown emulator core command: ${command}`);
    }
  }

  // --- Commands -----------------------------------------------------------

  protected async init(params: VesVbParams<'init'>): Promise<void> {
    this.wasm = await instantiateVesVbWasm(params.wasmUrl);
    this.allocateScratch();
  }

  protected createSim(): VesVbSimHandle {
    const pointer = this.wasm.CreateSim();
    if (pointer === 0) {
      throw new Error('Emulator core could not allocate a simulation.');
    }
    // Colour is applied by the renderer, so the core always composites
    // eye-packed and never has to be reconfigured for a display mode.
    this.wasm.SetAnaglyph(pointer, VB_EYE_PACKED_LEFT, VB_EYE_PACKED_RIGHT);
    this.sims.set(pointer, {
      pointer,
      displayMode: VB_DEFAULT_DISPLAY_MODE,
      samples: this.wasm.GetExtSamples(pointer),
      cartRom: 0,
      cartRomSize: 0,
      cartRam: 0,
      cartRamSize: 0,
    });
    this.refreshSimPointers();
    return pointer;
  }

  /**
   * Release a simulation. The vendored shim's Sim.delete() is an empty stub,
   * so every closed emulator leaked its state struct and cartridge buffers;
   * we free them properly.
   */
  protected deleteSim(params: VesVbParams<'deleteSim'>): void {
    const sim = this.requireSim(params.sim);
    sim.renderer?.dispose();
    if (sim.cartRom !== 0) {
      this.wasm.Realloc(sim.cartRom, 0);
    }
    if (sim.cartRam !== 0) {
      this.wasm.Realloc(sim.cartRam, 0);
    }
    this.wasm.Realloc(sim.pointer, 0);
    this.sims.delete(params.sim);
    this.terminalBuffers.delete(params.sim);
    this.vsuBuffers.delete(params.sim);
    this.linkBuffers.delete(params.sim);
    this.linkTransmitBytes.delete(params.sim);
    this.pointerWatches.delete(params.sim);
    this.pointerWrites.delete(params.sim);
    this.cheats.delete(sim.pointer);
    this.refreshSimPointers();
  }

  protected attachCanvas(params: VesVbParams<'attachCanvas'>): void {
    const sim = this.requireSim(params.sim);
    sim.renderer?.dispose();
    sim.renderer = new VesVbRenderer(params.canvas, sim.displayMode);
    this.present(sim);
  }

  protected setDisplayMode(params: VesVbParams<'setDisplayMode'>): void {
    const sim = this.requireSim(params.sim);
    sim.displayMode = params.mode;
    sim.renderer?.setDisplayMode(params.mode);
  }

  protected async capture(
    params: VesVbParams<'capture'>,
  ): Promise<ArrayBuffer> {
    const sim = this.requireSim(params.sim);
    if (!sim.renderer) {
      throw new Error('The emulator has nothing to capture yet.');
    }
    return sim.renderer.capture();
  }

  protected setCartRom(params: VesVbParams<'setCartRom'>): void {
    const sim = this.requireSim(params.sim);
    const previous = sim.cartRom;
    const pointer = this.copyIntoCore(params.rom);
    if (
      this.wasm.vbSetCartROM(sim.pointer, pointer, params.rom.byteLength) !== 0
    ) {
      this.wasm.Realloc(pointer, 0);
      throw new Error(
        'Emulator core rejected the ROM. Its size must be a power of two.',
      );
    }
    if (previous !== 0) {
      this.wasm.Realloc(previous, 0);
    }
    sim.cartRom = pointer;
    sim.cartRomSize = params.rom.byteLength;
    // A different cartridge invalidates any history of the previous one.
    this.clearRewind();
  }

  protected setCartRam(params: VesVbParams<'setCartRam'>): void {
    const sim = this.requireSim(params.sim);
    const previous = sim.cartRam;
    const pointer = this.copyIntoCore(params.ram);
    if (
      this.wasm.vbSetCartRAM(sim.pointer, pointer, params.ram.byteLength) !== 0
    ) {
      this.wasm.Realloc(pointer, 0);
      throw new Error(
        'Emulator core rejected the save RAM. Its size must be a power of two.',
      );
    }
    if (previous !== 0) {
      this.wasm.Realloc(previous, 0);
    }
    sim.cartRam = pointer;
    sim.cartRamSize = params.ram.byteLength;
  }

  protected getCartRam(params: VesVbParams<'getCartRam'>): ArrayBuffer {
    const sim = this.requireSim(params.sim);
    if (sim.cartRam === 0 || sim.cartRamSize === 0) {
      return new ArrayBuffer(0);
    }
    return new Uint8Array(
      this.wasm.memory.buffer,
      sim.cartRam,
      sim.cartRamSize,
    ).slice().buffer;
  }

  protected reset(params: VesVbParams<'reset'>): void {
    this.wasm.vbReset(this.requireSim(params.sim).pointer);
    this.flushAudio();
  }

  /**
   * Discard audio that has been produced but not played yet.
   *
   * The worklet holds up to VB_AUDIO_BUFFER_COUNT filled buffers, and only
   * drains them while the audio context is running — so a machine whose state
   * jumps while suspended has its last fraction of a second of sound waiting to
   * play the moment it resumes, which is heard as the old state briefly playing
   * over the new one. The flush travels the same port as the audio itself, so
   * it lands after everything stale and before anything fresh.
   */
  protected flushAudio(): void {
    this.audioPort.postMessage({ flush: true });
  }

  protected setKeys(params: VesVbParams<'setKeys'>): void {
    this.wasm.vbSetKeys(this.requireSim(params.sim).pointer, params.keys);
  }

  /**
   * Connect two simulations over the link port.
   *
   * The core walks from one simulation to its peer directly, which is why a
   * linked pair has to share a session: the pointers are only meaningful
   * inside one WebAssembly instance.
   */
  protected setPeer(params: VesVbParams<'setPeer'>): void {
    const sim = this.requireSim(params.sim);
    if (params.peer === 0) {
      const previous = this.wasm.vbGetPeer(sim.pointer);
      this.wasm.vbSetPeer(sim.pointer, 0);
      if (previous !== 0 && this.sims.has(previous)) {
        this.wasm.vbSetPeer(previous, 0);
      }
      return;
    }

    const peer = this.requireSim(params.peer);
    if (peer.pointer === sim.pointer) {
      throw new Error('A simulation cannot be linked to itself.');
    }
    this.wasm.vbSetPeer(sim.pointer, peer.pointer);
    this.wasm.vbSetPeer(peer.pointer, sim.pointer);

    // The pair now snapshots as a unit, so any history of them apart is
    // no longer restorable.
    this.clearRewind();
  }

  protected setVolume(params: VesVbParams<'setVolume'>): void {
    this.wasm.SetVolume(this.requireSim(params.sim).pointer, params.volume);
  }

  protected setPanning(params: VesVbParams<'setPanning'>): void {
    this.wasm.SetPanning(this.requireSim(params.sim).pointer, params.panning);
  }

  protected run(): void {
    if (this.emulating) {
      return;
    }
    this.emulating = true;
    this.drive();
  }

  protected suspend(): void {
    this.emulating = false;
  }

  // --- State snapshots ----------------------------------------------------

  /**
   * The whole simulation is one flat struct, so a snapshot is a copy of it.
   * Verified byte-exact on replay, see scripts/savestate-probe.mjs.
   */
  protected snapshot(sim: VesVbSimState): ArrayBuffer {
    return new Uint8Array(
      this.wasm.memory.buffer,
      sim.pointer,
      this.wasm.vbSizeOf(),
    ).slice().buffer;
  }

  /**
   * Restore a snapshot, then repair the pointers it embeds.
   *
   * The struct holds three absolute pointers into core memory — cart RAM,
   * cart ROM and the audio sample buffer — which belong to whichever
   * simulation and session produced the snapshot. The setters are pure
   * assignments (the vendored shim, not the core, owns freeing), so
   * re-applying our own is safe. The sample pointer needs no repair here
   * because the drive loop re-arms it before every chunk.
   */
  protected restore(sim: VesVbSimState, state: ArrayBuffer): void {
    const size = this.wasm.vbSizeOf();
    if (state.byteLength !== size) {
      throw new Error(
        `This save state is ${state.byteLength} bytes but this emulator core uses ${size}. ` +
          'It was probably made with a different version.',
      );
    }
    this.restoreFrom(sim, new Uint8Array(state));
  }

  protected restoreFrom(sim: VesVbSimState, state: Uint8Array): void {
    const size = this.wasm.vbSizeOf();
    new Uint8Array(this.wasm.memory.buffer, sim.pointer, size).set(state);

    if (sim.cartRom !== 0) {
      this.wasm.vbSetCartROM(sim.pointer, sim.cartRom, sim.cartRomSize);
    }
    if (sim.cartRam !== 0) {
      this.wasm.vbSetCartRAM(sim.pointer, sim.cartRam, sim.cartRamSize);
    }
    this.wasm.vbSetSamples(
      sim.pointer,
      sim.samples,
      VbDataType.F32,
      VB_SAMPLES_PER_BUFFER,
    );
  }

  protected saveState(params: VesVbParams<'saveState'>): ArrayBuffer {
    return this.snapshot(this.requireSim(params.sim));
  }

  protected loadState(params: VesVbParams<'loadState'>): void {
    const sim = this.requireSim(params.sim);
    this.restore(sim, params.state);
    // Loading lands somewhere unrelated to the rewind history.
    this.clearRewind();
    this.flushAudio();
    this.presentRestored(sim);
  }

  // --- Speed and stepping -------------------------------------------------

  protected setSpeed(params: VesVbParams<'setSpeed'>): void {
    if (!(params.speed > 0)) {
      throw new Error(
        `Emulation speed must be greater than zero, got ${params.speed}.`,
      );
    }
    this.speed = params.speed;
    this.pendingClocks = 0;
  }

  // Advance one frame while suspended, for frame-by-frame inspection.
  protected stepFrame(): void {
    const sims = [...this.sims.values()];
    if (sims.length === 0) {
      return;
    }

    this.captureRewindEntry(sims);

    // A frame is ~400000 clocks; allow a generous margin before giving up
    // so a simulation that never raises the flag cannot spin forever.
    let remaining = VB_CLOCKS_PER_BUFFER * 4;
    let framed = false;
    while (!framed && remaining > 0) {
      const budget = Math.min(remaining, VB_CLOCKS_PER_BUFFER);
      remaining -= budget;
      this.u32(this.clocksPointer)[0] = budget;
      while (this.u32(this.clocksPointer)[0] !== 0) {
        this.wasm.Emulate(this.simsPointer, sims.length, this.clocksPointer);
        if (this.gamePakInterrupts.size > 0) {
          this.serviceGamePakInterrupts();
        }
        for (const sim of sims) {
          if (this.wasm.GetBreaks(sim.pointer) & VbBreak.FRAME) {
            this.applyCheats(sim.pointer);
            this.wasm.GetPixels(sim.pointer);
            framed = true;
          }
        }
      }
    }

    this.presentAll();
  }

  // --- Rewind -------------------------------------------------------------

  protected setRewind(params: VesVbParams<'setRewind'>): void {
    this.rewind.enabled = params.enabled;
    this.rewind.granularity = Math.max(1, Math.floor(params.granularity));
    this.rewind.budgetBytes = Math.max(0, params.budgetBytes);
    this.rewind.frames = 0;
    this.clearRewind();
  }

  // Drop the history. The next capture re-seeds the mirrors.
  protected clearRewind(): void {
    this.rewind.entries = [];
    this.rewind.mirrors = [];
    this.rewind.bytes = 0;
  }

  protected liveState(sim: VesVbSimState): Uint8Array {
    return new Uint8Array(
      this.wasm.memory.buffer,
      sim.pointer,
      this.wasm.vbSizeOf(),
    );
  }

  protected captureRewindEntry(sims: VesVbSimState[]): void {
    if (
      !this.rewind.enabled ||
      this.rewind.budgetBytes === 0 ||
      sims.length === 0
    ) {
      return;
    }

    // The first capture, or one after the session changed shape, has
    // nothing to diff against and only seeds the mirrors.
    if (this.rewind.mirrors.length !== sims.length) {
      this.rewind.entries = [];
      this.rewind.bytes = 0;
      this.rewind.mirrors = sims.map(sim => this.liveState(sim).slice());
      return;
    }

    const entry: Uint8Array[] = [];
    let added = 0;
    for (let i = 0; i < sims.length; i++) {
      const live = this.liveState(sims[i]);
      const delta = encodeDelta(this.rewind.mirrors[i], live, this.runScratch);
      entry.push(delta);
      added += delta.length;
      this.rewind.mirrors[i].set(live);
    }

    this.rewind.entries.push(entry);
    this.rewind.bytes += added;

    while (
      this.rewind.bytes > this.rewind.budgetBytes &&
      this.rewind.entries.length > 0
    ) {
      const dropped = this.rewind.entries.shift()!;
      for (const delta of dropped) {
        this.rewind.bytes -= delta.length;
      }
    }
  }

  /**
   * Walk the history back by up to `count` entries.
   *
   * Only the state that is landed on reaches the simulations and the screen:
   * the deltas in between are pure XOR passes over the mirrors, so a caller
   * asking for several entries at once pays for one restore and one present
   * rather than that many.
   */
  protected rewindStep(params: VesVbParams<'rewindStep'>): number {
    const sims = [...this.sims.values()];
    if (this.rewind.mirrors.length !== sims.length) {
      return 0;
    }

    const requested = Math.max(1, Math.floor(params.count ?? 1));
    let applied = 0;
    while (applied < requested && this.rewind.entries.length > 0) {
      const entry = this.rewind.entries.pop()!;
      for (let i = 0; i < sims.length; i++) {
        this.rewind.bytes -= entry[i].length;
        applyDelta(this.rewind.mirrors[i], entry[i]);
      }
      applied++;
    }

    if (applied === 0) {
      return 0;
    }

    for (let i = 0; i < sims.length; i++) {
      this.restoreFrom(sims[i], this.rewind.mirrors[i]);
      this.presentRestored(sims[i]);
    }
    return applied;
  }

  // --- Inspection ---------------------------------------------------------

  /**
   * Read through the CPU's view of memory rather than poking at the state
   * struct, so mirroring, mapped hardware registers and unmapped holes all
   * behave the way the running program sees them.
   */
  /**
   * Copy a rectangle out of the core's composited framebuffer.
   *
   * GetPixels refreshes it from the current VIP state first, so the result is
   * what the simulation would be showing right now rather than whatever was
   * last presented. Requests are clipped to the screen so a caller cannot read
   * past the end of the buffer.
   */
  protected readPixels(params: VesVbParams<'readPixels'>): ArrayBuffer {
    const sim = this.requireSim(params.sim);

    const left = Math.max(0, Math.min(params.x, VB_SCREEN_WIDTH));
    const top = Math.max(0, Math.min(params.y, VB_SCREEN_HEIGHT));
    const width = Math.max(0, Math.min(params.width, VB_SCREEN_WIDTH - left));
    const height = Math.max(0, Math.min(params.height, VB_SCREEN_HEIGHT - top));

    const out = new Uint8Array(width * height * 4);
    if (width === 0 || height === 0) {
      return out.buffer;
    }

    this.wasm.GetPixels(sim.pointer);
    const source = new Uint8Array(
      this.wasm.memory.buffer,
      this.wasm.GetExtPixels(sim.pointer),
      VB_SCREEN_WIDTH * VB_SCREEN_HEIGHT * 4,
    );

    for (let row = 0; row < height; row++) {
      const from = ((top + row) * VB_SCREEN_WIDTH + left) * 4;
      out.set(source.subarray(from, from + width * 4), row * width * 4);
    }
    return out.buffer;
  }

  protected readMemory(params: VesVbParams<'readMemory'>): ArrayBuffer {
    const sim = this.requireSim(params.sim);
    if (params.length > VesVbWorker.MAX_MEMORY_WINDOW) {
      // Refused rather than truncated: a short buffer would be read as
      // data by the caller and misinterpreted as corrupt memory.
      throw new Error(
        `Memory read of ${params.length} bytes exceeds the ${VesVbWorker.MAX_MEMORY_WINDOW} byte limit.`,
      );
    }
    const length = Math.max(0, params.length);
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      out[i] =
        this.wasm.vbRead(
          sim.pointer,
          (params.address + i) >>> 0,
          VbDataType.U8,
        ) & 0xff;
    }
    return out.buffer;
  }

  protected writeMemory(params: VesVbParams<'writeMemory'>): void {
    const sim = this.requireSim(params.sim);
    const data = new Uint8Array(params.data);
    for (let i = 0; i < data.length; i++) {
      this.wasm.vbWrite(
        sim.pointer,
        (params.address + i) >>> 0,
        VbDataType.U8,
        data[i],
      );
    }
  }

  protected readRegisters(
    params: VesVbParams<'readRegisters'>,
  ): VesVbRegisters {
    const sim = this.requireSim(params.sim);
    const program: number[] = [];
    for (let i = 0; i < 32; i++) {
      program.push(this.wasm.vbGetProgramRegister(sim.pointer, i) >>> 0);
    }

    const system: Record<string, number> = {};
    for (const [name, index] of Object.entries(VbSystemRegister)) {
      if (typeof index === 'number') {
        system[name] = this.wasm.vbGetSystemRegister(sim.pointer, index) >>> 0;
      }
    }

    return {
      pc: this.wasm.vbGetProgramCounter(sim.pointer) >>> 0,
      program,
      system,
    };
  }

  /**
   * Start or stop watching the terminal port.
   *
   * The core has no way to trap a single address, so capturing means a
   * callback on every CPU write — of which a game performs a great many. That
   * is why this is opt-in and driven by whether anything is actually
   * listening, rather than left on.
   */
  protected setTerminalCapture(
    params: VesVbParams<'setTerminalCapture'>,
  ): void {
    const sim = this.requireSim(params.sim);
    if (params.enabled) {
      this.terminalBuffers.set(sim.pointer, []);
    } else {
      this.terminalBuffers.delete(sim.pointer);
    }
    this.updateWriteWatch(sim.pointer);
  }

  /**
   * Start or stop watching the link port.
   *
   * Same cost as terminal capture, and driven the same way: on only while
   * something is listening, which here means only while a rumble pack is
   * plugged in.
   */
  protected setLinkCapture(params: VesVbParams<'setLinkCapture'>): void {
    const sim = this.requireSim(params.sim);
    if (params.enabled) {
      this.linkBuffers.set(sim.pointer, []);
    } else {
      this.linkBuffers.delete(sim.pointer);
      this.linkTransmitBytes.delete(sim.pointer);
    }
    this.updateWriteWatch(sim.pointer);
  }

  /**
   * Start or stop watching the address an ESSound cartridge listens on.
   *
   * Same cost and the same opt-in as the captures above: on only while there
   * is something to play, which the DOM side decides by looking for the audio
   * files beside the ROM.
   */
  protected setEsSoundCapture(params: VesVbParams<'setEsSoundCapture'>): void {
    const sim = this.requireSim(params.sim);
    if (params.enabled) {
      this.esSoundBuffers.set(sim.pointer, []);
    } else {
      this.esSoundBuffers.delete(sim.pointer);
    this.gamePakInterrupts.delete(sim.pointer);
    }
    this.updateWriteWatch(sim.pointer);
  }

  /**
   * Follow a pointer variable, or stop following one.
   *
   * Rides on the same write watching as the captures above, and is just as
   * opt-in for the same reason.
   */
  protected setPointerWatch(params: VesVbParams<'setPointerWatch'>): void {
    const sim = this.requireSim(params.sim);
    const address = params.address >>> 0;
    if (address !== 0) {
      this.pointerWatches.set(sim.pointer, address);
      this.pointerWrites.set(sim.pointer, []);
    } else {
      this.pointerWatches.delete(sim.pointer);
      this.pointerWrites.delete(sim.pointer);
    }
    this.updateWriteWatch(sim.pointer);
  }

  /**
   * Set the writes to repeat every frame, or stop repeating any.
   *
   * Unlike the captures above this needs no write watching: nothing is being
   * observed, the writes are simply made again after each frame.
   */
  protected setCheats(params: VesVbParams<'setCheats'>): void {
    const sim = this.requireSim(params.sim);
    if (params.codes.length > 0) {
      this.cheats.set(sim.pointer, params.codes);
    } else {
      this.cheats.delete(sim.pointer);
    }
  }

  /**
   * Repeat one simulation's cheat writes.
   *
   * A byte at a time, little-endian like the CPU, which is also how
   * writeMemory reaches memory — the core's own vbWrite handles the mirroring
   * and the read-only regions, so a code pointed somewhere unwritable is
   * simply ignored rather than needing checking here.
   */
  protected applyCheats(simPointer: number): void {
    const codes = this.cheats.get(simPointer);
    if (!codes) {
      return;
    }
    for (const code of codes) {
      for (let byte = 0; byte < code.bytes; byte++) {
        this.wasm.vbWrite(
          simPointer,
          (code.address + byte) >>> 0,
          VbDataType.U8,
          (code.value >>> (byte * 8)) & 0xff,
        );
      }
    }
  }

  /**
   * Start or stop shadowing the VSU's registers and waveform tables.
   *
   * Unlike setTerminalCapture, this is not optional for the VSU panel to
   * show anything at all: VB_VSU_BASE's own comment covers why the range
   * cannot be read any other way.
   */
  protected setVsuCapture(params: VesVbParams<'setVsuCapture'>): void {
    const sim = this.requireSim(params.sim);
    if (params.enabled) {
      this.vsuBuffers.set(sim.pointer, new Uint8Array(VB_VSU_WATCH_BYTES));
    } else {
      this.vsuBuffers.delete(sim.pointer);
    }
    this.updateWriteWatch(sim.pointer);
  }

  // The shadow copy setVsuCapture has been keeping, or all zero if it is not enabled.
  protected readVsu(params: VesVbParams<'readVsu'>): ArrayBuffer {
    const sim = this.requireSim(params.sim);
    const shadow = this.vsuBuffers.get(sim.pointer);
    // Copied rather than handed out directly: the result crosses to the DOM
    // thread by transfer, which would detach the live shadow buffer's memory.
    return (shadow ?? new Uint8Array(VB_VSU_WATCH_BYTES)).slice().buffer;
  }

  /**
   * Install the shared write-watching callback on first use, and (re)point a
   * simulation's single callback slot at it for as long as either
   * terminalBuffers or vsuBuffers still wants writes for that simulation.
   *
   * The callback returns 0 so the write still happens: this observes rather
   * than stands in for whatever it is watching.
   */
  protected updateWriteWatch(simPointer: number): void {
    const active =
      this.terminalBuffers.has(simPointer) ||
      this.vsuBuffers.has(simPointer) ||
      this.linkBuffers.has(simPointer) ||
      this.esSoundBuffers.has(simPointer) ||
      this.pointerWatches.has(simPointer);
    if (!active) {
      this.wasm.vbSetWriteCallback(simPointer, 0);
      return;
    }

    if (this.writeWatchCallbackSlot === 0) {
      this.writeWatchCallbackSlot = installVesVbCallback(
        this.wasm,
        (watchedSimPointer, address, type, valuePointer) => {
          const at = address >>> 0;
          // The value is behind a pointer; every write the captures below
          // care about is byte-wide on real hardware, so only the low
          // byte is meaningful regardless of the store's own width. The
          // pointer watch is the exception, and reads all four.
          const byte = new Uint8Array(
            this.wasm.memory.buffer,
            valuePointer,
            1,
          )[0];

          if (at === this.pointerWatches.get(watchedSimPointer)) {
            // Narrower stores are not pointer assignments, and reading four
            // bytes of one would report whatever happens to sit beside it.
            if (type === VbDataType.S32) {
              const values = this.pointerWrites.get(watchedSimPointer);
              if (values && values.length < VesVbWorker.MAX_POINTER_WRITES) {
                values.push(
                  new DataView(this.wasm.memory.buffer).getUint32(valuePointer, true),
                );
              }
            }
          } else if (at === VB_TERMINAL_PORT) {
            const bytes = this.terminalBuffers.get(watchedSimPointer);
            if (bytes && bytes.length < VesVbWorker.MAX_TERMINAL_BYTES) {
              bytes.push(byte);
            }
          } else if (at === VB_LINK_TRANSMIT_PORT) {
            // Stored, not sent: this only says what the next transfer will
            // carry. Tracked unconditionally, so that the byte is already
            // known by the time a start arrives.
            this.linkTransmitBytes.set(watchedSimPointer, byte);
          } else if (
            at === VB_LINK_CONTROL_PORT &&
            (byte & VB_LINK_START) !== 0
          ) {
            const bytes = this.linkBuffers.get(watchedSimPointer);
            if (bytes && bytes.length < VesVbWorker.MAX_LINK_BYTES) {
              bytes.push(this.linkTransmitBytes.get(watchedSimPointer) ?? 0);
            }
          } else if (at === VB_ES_SOUND_PORT) {
            // The whole halfword is the command, so unlike the byte-wide
            // ports above this one reads the value itself. A narrower store
            // is not an ESSound command and would report whatever sits beside
            // it, so those are left alone.
            const commands = this.esSoundBuffers.get(watchedSimPointer);
            if (
              commands &&
              commands.length < VesVbWorker.MAX_ES_SOUND_COMMANDS &&
              (type === VbDataType.S16 || type === VbDataType.U16)
            ) {
              const command = new DataView(this.wasm.memory.buffer).getUint16(valuePointer, true);
              commands.push(command);
              if (command === ES_SOUND_INIT) {
                // The cartridge's answer to init. Not raised here: this is the
                // middle of a store instruction, and an interrupt is only
                // taken between them.
                this.gamePakInterrupts.add(watchedSimPointer);
              }
            }
          } else if (
            at >= VB_VSU_BASE &&
            at < VB_VSU_BASE + VB_VSU_WATCH_BYTES
          ) {
            const shadow = this.vsuBuffers.get(watchedSimPointer);
            if (shadow) {
              shadow[at - VB_VSU_BASE] = byte;
            }
          }
          return 0;
        },
      );
    }
    this.wasm.vbSetWriteCallback(simPointer, this.writeWatchCallbackSlot);
  }

  // Hand over whatever the terminal port has produced since the last call.
  protected flushTerminals(): void {
    for (const [handle, bytes] of this.terminalBuffers) {
      if (bytes.length === 0) {
        continue;
      }
      // Chunked so a long burst cannot overflow the argument list.
      let text = '';
      for (let at = 0; at < bytes.length; at += 4096) {
        text += String.fromCharCode(...bytes.slice(at, at + 4096));
      }
      bytes.length = 0;
      this.emit({ event: 'terminal', payload: { sim: handle, text } });
    }
  }

  // Hand over whatever the watched pointer has been assigned since the last call.
  protected flushPointerWrites(): void {
    for (const [handle, values] of this.pointerWrites) {
      if (values.length === 0) {
        continue;
      }
      const address = this.pointerWatches.get(handle) ?? 0;
      this.emit({ event: 'pointerWrite', payload: { sim: handle, address, values: [...values] } });
      values.length = 0;
    }
  }

  /**
   * Take any expansion-port interrupt that is owed and can be taken now.
   *
   * The core has no way to raise one, so this is the V810's own interrupt
   * entry, performed by hand between instructions: save the return state,
   * write the exception code, mask the level and below, and jump to the
   * vector. The conditions for accepting one are the hardware's — not already
   * handling an exception or an NMI, interrupts not disabled, and the level
   * not masked — and a request that cannot be taken yet stays pending rather
   * than being lost, because a ROM often sends ESSound's init before it
   * enables interrupts.
   */
  protected serviceGamePakInterrupts(): void {
    for (const simPointer of this.gamePakInterrupts) {
      const level = VbInterrupt.CRO;
      const psw = this.wasm.vbGetSystemRegister(simPointer, VbSystemRegister.PSW) >>> 0;
      const blocked = (psw & (VbPsw.NP | VbPsw.EP | VbPsw.ID)) !== 0;
      const masked = level < ((psw & VB_PSW_INTERRUPT_LEVEL_MASK) >>> VB_PSW_INTERRUPT_LEVEL_SHIFT);
      if (blocked || masked) {
        continue;
      }

      const ecr = this.wasm.vbGetSystemRegister(simPointer, VbSystemRegister.ECR) >>> 0;
      this.wasm.vbSetSystemRegister(
        simPointer, VbSystemRegister.EIPC, this.wasm.vbGetProgramCounter(simPointer) >>> 0,
      );
      this.wasm.vbSetSystemRegister(simPointer, VbSystemRegister.EIPSW, psw);
      this.wasm.vbSetSystemRegister(
        simPointer, VbSystemRegister.ECR, (ecr & 0xffff0000) | vbInterruptExceptionCode(level),
      );
      // Entry raises the mask to one above this level, which is what the
      // engine's own handler reads back to find the vector it came from.
      const entered = ((psw & ~(VbPsw.AE | VB_PSW_INTERRUPT_LEVEL_MASK))
        | VbPsw.EP | VbPsw.ID | ((level + 1) << VB_PSW_INTERRUPT_LEVEL_SHIFT)) >>> 0;
      this.wasm.vbSetSystemRegister(simPointer, VbSystemRegister.PSW, entered);
      this.wasm.vbSetProgramCounter(simPointer, (VB_INTERRUPT_VECTOR_BASE + (level << 4)) >>> 0);
      this.gamePakInterrupts.delete(simPointer);
    }
  }

  // Hand over whatever the ESSound port has been told since the last call.
  protected flushEsSound(): void {
    for (const [handle, commands] of this.esSoundBuffers) {
      if (commands.length === 0) {
        continue;
      }
      this.emit({ event: 'esSound', payload: { sim: handle, commands: [...commands] } });
      commands.length = 0;
    }
  }

  // Hand over whatever the link port has sent since the last call.
  protected flushLinks(): void {
    for (const [handle, bytes] of this.linkBuffers) {
      if (bytes.length === 0) {
        continue;
      }
      this.emit({ event: 'link', payload: { sim: handle, bytes: [...bytes] } });
      bytes.length = 0;
    }
  }

  /**
   * Disassemble using the core's own disassembler.
   *
   * It returns a block of C strings plus a table of 17 words per line
   * describing where each one is, which has to be walked in exactly this
   * order. Both allocations are ours to free.
   */
  protected disassemble(
    params: VesVbParams<'disassemble'>,
  ): VesVbDisassemblyLine[] {
    const sim = this.requireSim(params.sim);
    const count = Math.max(
      0,
      Math.min(params.count, VesVbWorker.MAX_DISASSEMBLY_LINES),
    );
    if (count === 0) {
      return [];
    }

    const dasm = this.wasm.vbuDisassemble(
      sim.pointer,
      params.address >>> 0,
      0,
      count,
      0,
    );
    if (dasm === 0) {
      throw new Error(
        `Cannot disassemble at 0x${(params.address >>> 0).toString(16)}.`,
      );
    }

    const table = this.wasm.Realloc(0, count * 17 * 4);
    this.wasm.GetDasm(table, dasm, count);

    const lines: VesVbDisassemblyLine[] = [];
    try {
      const words = this.u32(table, count * 17);
      let at = 0;
      for (let line = 0; line < count; line++) {
        const address = words[at++];
        const codeLength = words[at++];
        const code: number[] = [];
        for (let i = 0; i < codeLength; i++) {
          code.push(words[at++]);
        }
        at += 4 - codeLength;

        const isPC = words[at++] !== 0;
        at++; // address text, which we format ourselves
        at += 4; // per-halfword text, likewise
        const mnemonic = this.readCString(dasm + words[at++]);
        const operandCount = words[at++];
        const operands: string[] = [];
        for (let i = 0; i < operandCount; i++) {
          operands.push(this.readCString(dasm + words[at++]));
        }
        at += 3 - operandCount;

        lines.push({ address, code, isPC, mnemonic, operands });
      }
    } finally {
      this.wasm.Realloc(table, 0);
      this.wasm.Realloc(dasm, 0);
    }

    return lines;
  }

  // Read a NUL-terminated string out of core memory.
  protected readCString(pointer: number): string {
    if (pointer === 0) {
      return '';
    }
    const bytes = new Uint8Array(this.wasm.memory.buffer);
    let end = pointer;
    while (bytes[end] !== 0) {
      end++;
    }
    return new TextDecoder().decode(bytes.subarray(pointer, end));
  }

  // --- Drive loop ---------------------------------------------------------

  protected onAudioBuffersReturned(buffers: ArrayBuffer[]): void {
    // The queue running dry means we could not keep up, so whatever frame
    // is staged is the freshest one we have. Show it rather than hold it.
    if (this.emulating && this.audioQueue.length === 0) {
      this.presentAll();
    }

    for (const buffer of buffers) {
      this.audioQueue.push(new Float32Array(buffer));
    }

    this.drive();
  }

  protected drive(): void {
    if (!this.emulating || this.sims.size === 0) {
      return;
    }

    try {
      while (this.audioQueue.length !== 0) {
        this.emulateOneBuffer();
      }
    } catch (error) {
      this.emulating = false;
      this.emit({
        event: 'error',
        payload: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      // Also on the error path, because what a program printed on its way
      // into trouble is usually the interesting part.
      this.flushTerminals();
      // Before the link bytes, and deliberately: `Rumble::startEffect` stores
      // the spec it was handed before broadcasting anything about it, so
      // flushing in that order is what lets the DOM side attribute a burst to
      // the spec it came from. Two effects started within one tick still
      // arrive as two runs of each, which is as fine-grained as batching gets.
      this.flushPointerWrites();
      // A pack left buzzing by a crashed program would keep buzzing, so what
      // was already sent goes out on that path too.
      this.flushLinks();
      // Likewise a track a crashed program had asked for: the stop it never
      // got round to sending is the one command worth not losing.
      this.flushEsSound();
    }
  }

  /**
   * Fill one audio buffer, emulating however much time the current speed
   * calls for.
   *
   * Time is only ever emulated in whole chunks, so the core always fills a
   * complete sample buffer and never leaves a stale tail. Fast forward runs
   * several chunks and keeps the last one's audio, which is the usual
   * "one chunk in N" fast-forward sound. Slow motion falls short of a chunk
   * on some buffers and outputs silence for those.
   */
  protected emulateOneBuffer(): void {
    const sims = [...this.sims.values()];
    this.pendingClocks += VB_CLOCKS_PER_BUFFER * this.speed;

    let emulated = false;
    while (this.pendingClocks >= VB_CLOCKS_PER_BUFFER) {
      this.pendingClocks -= VB_CLOCKS_PER_BUFFER;
      this.emulateChunk(sims);
      emulated = true;
    }

    const buffer = this.audioQueue.shift()!;
    if (emulated) {
      this.wasm.Mix(this.mixPointer, this.simsPointer, sims.length);
      buffer.set(this.f32(this.mixPointer, MIX_BUFFER_LENGTH));
    } else {
      buffer.fill(0);
    }
    this.audioPort.postMessage(buffer.buffer, [buffer.buffer]);

    // Present once the backlog is down to a single buffer, which is where
    // the staged frame lines up with what is about to be heard.
    if (this.audioQueue.length === 1) {
      this.presentAll();
    }
  }

  // Emulate one chunk: VB_CLOCKS_PER_BUFFER clocks, one full sample buffer.
  protected emulateChunk(sims: VesVbSimState[]): void {
    // Rewind each simulation's sample write position for this chunk.
    for (const sim of sims) {
      this.wasm.vbSetSamples(
        sim.pointer,
        sim.samples,
        VbDataType.F32,
        VB_SAMPLES_PER_BUFFER,
      );
    }

    this.u32(this.clocksPointer)[0] = VB_CLOCKS_PER_BUFFER;
    while (this.u32(this.clocksPointer)[0] !== 0) {
      this.wasm.Emulate(this.simsPointer, sims.length, this.clocksPointer);
      if (this.gamePakInterrupts.size > 0) {
        this.serviceGamePakInterrupts();
      }

      let framed = false;
      for (const sim of sims) {
        if (this.wasm.GetBreaks(sim.pointer) & VbBreak.FRAME) {
          framed = true;
          this.applyCheats(sim.pointer);
          // With a healthy backlog there is no point staging a frame
          // we would only overwrite before it is ever shown.
          if (this.audioQueue.length <= 2) {
            this.wasm.GetPixels(sim.pointer);
          }
        }
      }

      if (framed && this.rewind.enabled) {
        if (this.rewind.frames % this.rewind.granularity === 0) {
          this.captureRewindEntry(sims);
        }
        this.rewind.frames++;
      }
    }
  }

  protected presentAll(): void {
    for (const sim of this.sims.values()) {
      this.present(sim);
    }
  }

  /**
   * Recomposite the framebuffer from the VIP's current state, then present it.
   *
   * present() shows whatever the core composited last, which the drive loop
   * refreshes at every frame break. A state that was restored rather than
   * emulated has never been through a frame break, so without this the screen
   * keeps showing the frame from before the restore until emulation resumes.
   */
  protected presentRestored(sim: VesVbSimState): void {
    this.wasm.GetPixels(sim.pointer);
    this.present(sim);
  }

  protected present(sim: VesVbSimState): void {
    if (!sim.renderer) {
      return;
    }
    sim.renderer.present(
      new Uint8Array(
        this.wasm.memory.buffer,
        this.wasm.GetExtPixels(sim.pointer),
        VB_SCREEN_WIDTH * VB_SCREEN_HEIGHT * 4,
      ),
    );
  }

  // --- Core memory helpers ------------------------------------------------

  /**
   * Views are created on demand rather than cached, because the core grows
   * its own memory and a growth detaches every existing view.
   */
  protected u32(pointer: number, length = 1): Uint32Array {
    return new Uint32Array(this.wasm.memory.buffer, pointer, length);
  }

  protected f32(pointer: number, length: number): Float32Array {
    return new Float32Array(this.wasm.memory.buffer, pointer, length);
  }

  protected allocateScratch(): void {
    this.clocksPointer = this.wasm.Realloc(0, Uint32Array.BYTES_PER_ELEMENT);
    this.mixPointer = this.wasm.Realloc(
      0,
      MIX_BUFFER_LENGTH * Float32Array.BYTES_PER_ELEMENT,
    );
  }

  protected copyIntoCore(data: ArrayBuffer): number {
    const pointer = this.wasm.Realloc(0, data.byteLength);
    if (pointer === 0 && data.byteLength !== 0) {
      throw new Error('Emulator core ran out of memory.');
    }
    new Uint8Array(this.wasm.memory.buffer, pointer, data.byteLength).set(
      new Uint8Array(data),
    );
    return pointer;
  }

  // Keep the core-side pointer array that Emulate() walks in sync.
  protected refreshSimPointers(): void {
    if (this.sims.size > this.simsCapacity) {
      this.simsPointer = this.wasm.Realloc(
        this.simsPointer,
        this.sims.size * Uint32Array.BYTES_PER_ELEMENT,
      );
      this.simsCapacity = this.sims.size;
    }
    if (this.simsCapacity === 0) {
      return;
    }
    const pointers = this.u32(this.simsPointer, this.simsCapacity);
    let index = 0;
    for (const sim of this.sims.values()) {
      pointers[index++] = sim.pointer;
    }
  }

  protected requireSim(handle: VesVbSimHandle): VesVbSimState {
    const sim = this.sims.get(handle);
    if (!sim) {
      throw new Error(`No such simulation: ${handle}`);
    }
    return sim;
  }

  protected emit(event: VesVbEvent): void {
    this.workerScope.postMessage(event);
  }
}

// --- Entry point ------------------------------------------------------------

const scope = globalThis as unknown as VesVbWorkerScope;
const worker = new VesVbWorker(scope);

scope.onmessage = async event => {
  // The very first message carries the port to the audio worklet.
  if ('audioPort' in event.data) {
    await worker.bootstrap(event.data as VesVbBootstrap);
    scope.postMessage({ id: 0 } as VesVbResponse);
    return;
  }

  const request = event.data as VesVbRequest;
  try {
    const result = await worker.handle(request.command, request.params);
    const response: VesVbResponse = { id: request.id, result };
    // Save RAM read-back is the one result worth moving rather than copying.
    scope.postMessage(response, result instanceof ArrayBuffer ? [result] : []);
  } catch (error) {
    scope.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    } as VesVbResponse);
  }
};
