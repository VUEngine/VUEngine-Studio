import { Disposable, Emitter, Event } from '@theia/core';
import {
    VbDisplayMode,
    VB_AUDIO_PROCESSOR,
    VB_SAMPLE_RATE,
} from '../../common/ves-vb-constants';
import {
    isVesVbEvent,
    VesVbCheatWrite,
    VesVbCommandName,
    VesVbDisassemblyLine,
    VesVbProfileResult,
    VesVbRecording,
    VesVbRegisters,
    VesVbOutbound,
    VesVbParams,
    VesVbRequest,
    VesVbResponse,
    VesVbResult,
    VesVbSimHandle,
} from '../../common/ves-vb-protocol';

export interface VesVbCoreOptions {
    /** URL of the bundled core worker. */
    workerUrl: string;
    /** URL of the bundled audio worklet. */
    audioWorkletUrl: string;
    /** URL the core's WebAssembly binary is served from. */
    wasmUrl: string;
}

/**
 * DOM-side handle on one emulation session.
 *
 * A session is one worker holding one or more simulations. Emulation is
 * core-wide: run() and suspend() apply to every simulation in the session at
 * once, which is why unrelated emulators get their own core, and why a linked
 * pair must share one (Phase 3).
 */
export class VesVbCore implements Disposable {

    protected readonly worker: Worker;
    protected readonly audioContext: AudioContext;
    protected readonly audioNode: AudioWorkletNode;

    protected readonly pending = new Map<number, {
        resolve: (result: unknown) => void,
        reject: (error: Error) => void,
    }>();
    protected nextRequestId = 1;

    protected readonly onErrorEmitter = new Emitter<string>();
    readonly onError: Event<string> = this.onErrorEmitter.event;

    protected readonly onTerminalEmitter = new Emitter<{ sim: VesVbSimHandle, text: string }>();
    /** Text a simulation wrote to the terminal port, once capture is enabled. */
    readonly onTerminal: Event<{ sim: VesVbSimHandle, text: string }> = this.onTerminalEmitter.event;

    protected readonly onLinkEmitter = new Emitter<{ sim: VesVbSimHandle, bytes: number[] }>();
    /** Bytes a simulation sent over the link port, once capture is enabled. */
    readonly onLink: Event<{ sim: VesVbSimHandle, bytes: number[] }> = this.onLinkEmitter.event;

    protected readonly onEsSoundEmitter = new Emitter<{ sim: VesVbSimHandle, commands: number[] }>();
    /** Halfwords a simulation wrote to the ESSound port, once capture is enabled. */
    readonly onEsSound: Event<{ sim: VesVbSimHandle, commands: number[] }> = this.onEsSoundEmitter.event;

    protected readonly onPointerWriteEmitter = new Emitter<{ sim: VesVbSimHandle, address: number, values: number[] }>();
    /** Values written to the address a simulation is watching, if any. */
    readonly onPointerWrite: Event<{ sim: VesVbSimHandle, address: number, values: number[] }> =
        this.onPointerWriteEmitter.event;

    protected disposed = false;

    protected constructor(worker: Worker, audioContext: AudioContext, audioNode: AudioWorkletNode) {
        this.worker = worker;
        this.audioContext = audioContext;
        this.audioNode = audioNode;
        this.worker.onmessage = event => this.onWorkerMessage(event.data);
    }

    static async create(options: VesVbCoreOptions): Promise<VesVbCore> {
        // The core produces samples at a fixed rate, so the graph runs at that
        // rate too and no resampling is needed.
        const audioContext = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: VB_SAMPLE_RATE,
        });
        await audioContext.suspend();
        await audioContext.audioWorklet.addModule(options.audioWorkletUrl);

        const audioNode = new AudioWorkletNode(audioContext, VB_AUDIO_PROCESSOR, {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2],
        });
        audioNode.connect(audioContext.destination);

        // Sample buffers cycle directly between worker and worklet, never
        // passing through the DOM thread.
        const channel = new MessageChannel();
        await new Promise<void>(resolve => {
            audioNode.port.onmessage = () => resolve();
            audioNode.port.postMessage({ core: channel.port1 }, [channel.port1]);
        });
        audioNode.port.onmessage = null;

        const worker = new Worker(options.workerUrl);
        const core = new VesVbCore(worker, audioContext, audioNode);

        await new Promise<void>((resolve, reject) => {
            core.pending.set(0, { resolve: () => resolve(), reject });
            worker.postMessage({ audioPort: channel.port2 }, [channel.port2]);
        });

        await core.request('init', { wasmUrl: options.wasmUrl });
        return core;
    }

    async createSim(): Promise<VesVbSim> {
        const handle = await this.request('createSim', {});
        return new VesVbSim(this, handle);
    }

    /**
     * Start emulating every simulation in this session.
     *
     * Resuming the audio context needs a user gesture in the general case; in
     * practice the emulator is always started from one.
     */
    async run(): Promise<void> {
        await this.audioContext.resume();
        await this.request('run', {});
    }

    async suspend(): Promise<void> {
        await this.request('suspend', {});
        await this.audioContext.suspend();
    }

    /**
     * Set the emulation rate, where 1 is real time. Above 1 fast forwards,
     * below 1 runs in slow motion.
     */
    async setSpeed(speed: number): Promise<void> {
        await this.request('setSpeed', { speed });
    }

    /** Advance every simulation by one frame. Only useful while suspended. */
    async stepFrame(): Promise<void> {
        await this.request('stepFrame', {});
    }

    /**
     * Configure the rewind history.
     *
     * Snapshots are stored uncompressed, so the budget divided by the state
     * size is how many are kept, and granularity trades resolution for
     * duration.
     */
    async setRewind(enabled: boolean, granularity: number, budgetBytes: number): Promise<void> {
        await this.request('setRewind', { enabled, granularity, budgetBytes });
    }

    /**
     * Step back up to `count` entries of history at once.
     *
     * Returns how many were applied, so a caller pacing playback can tell that
     * the history is exhausted. Stepping several entries in one call keeps the
     * intermediate states off the screen and costs a single round trip.
     */
    async rewindStep(count = 1): Promise<number> {
        return this.request('rewindStep', { count });
    }

    async request<K extends VesVbCommandName>(
        command: K,
        params: VesVbParams<K>,
        transfer: Transferable[] = []
    ): Promise<VesVbResult<K>> {
        if (this.disposed) {
            throw new Error('The emulator core has been disposed.');
        }
        const id = this.nextRequestId++;
        return new Promise<VesVbResult<K>>((resolve, reject) => {
            this.pending.set(id, { resolve: result => resolve(result as VesVbResult<K>), reject });
            const request: VesVbRequest<K> = { id, command, params };
            this.worker.postMessage(request, transfer);
        });
    }

    protected onWorkerMessage(message: VesVbOutbound): void {
        if (isVesVbEvent(message)) {
            if (message.event === 'error') {
                this.onErrorEmitter.fire(message.payload.message);
            } else if (message.event === 'terminal') {
                this.onTerminalEmitter.fire(message.payload);
            } else if (message.event === 'link') {
                this.onLinkEmitter.fire(message.payload);
            } else if (message.event === 'esSound') {
                this.onEsSoundEmitter.fire(message.payload);
            } else if (message.event === 'pointerWrite') {
                this.onPointerWriteEmitter.fire(message.payload);
            }
            return;
        }

        const response = message as VesVbResponse;
        const pending = this.pending.get(response.id);
        if (!pending) {
            return;
        }
        this.pending.delete(response.id);
        if (response.error !== undefined) {
            pending.reject(new Error(response.error));
        } else {
            pending.resolve(response.result);
        }
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        for (const pending of this.pending.values()) {
            pending.reject(new Error('The emulator core has been disposed.'));
        }
        this.pending.clear();
        this.audioNode.disconnect();
        this.worker.terminate();
        this.audioContext.close();
        this.onErrorEmitter.dispose();
        this.onTerminalEmitter.dispose();
        this.onLinkEmitter.dispose();
        this.onPointerWriteEmitter.dispose();
    }
}

/** One emulated Virtual Boy, belonging to a {@link VesVbCore} session. */
export class VesVbSim implements Disposable {

    protected disposed = false;

    constructor(
        protected readonly core: VesVbCore,
        readonly handle: VesVbSimHandle
    ) { }

    /**
     * Hand presentation of a canvas to the worker.
     *
     * Control is transferred, so the element must not be drawn to afterwards
     * and cannot be attached a second time. A re-rendered canvas element needs
     * a fresh attach.
     */
    async attachCanvas(canvas: HTMLCanvasElement): Promise<void> {
        const offscreen = canvas.transferControlToOffscreen();
        await this.core.request('attachCanvas', { sim: this.handle, canvas: offscreen }, [offscreen]);
    }

    async setCartRom(rom: ArrayBuffer): Promise<void> {
        await this.core.request('setCartRom', { sim: this.handle, rom }, [rom]);
    }

    async setCartRam(ram: ArrayBuffer): Promise<void> {
        await this.core.request('setCartRam', { sim: this.handle, ram }, [ram]);
    }

    async getCartRam(): Promise<ArrayBuffer> {
        return this.core.request('getCartRam', { sim: this.handle });
    }

    async reset(): Promise<void> {
        await this.core.request('reset', { sim: this.handle });
    }

    /** Set the currently pressed buttons as a VbKey bitmask. */
    async setKeys(keys: number): Promise<void> {
        await this.core.request('setKeys', { sim: this.handle, keys });
    }

    /**
     * Select the display mode. This also resizes the presentation surface,
     * since the stereo layouts present at different geometries.
     */
    async setDisplayMode(mode: VbDisplayMode): Promise<void> {
        await this.core.request('setDisplayMode', { sim: this.handle, mode });
    }

    /** Encode the currently presented frame as a PNG. */
    async capture(): Promise<ArrayBuffer> {
        return this.core.request('capture', { sim: this.handle });
    }

    /** Snapshot the entire machine. */
    async saveState(): Promise<ArrayBuffer> {
        return this.core.request('saveState', { sim: this.handle });
    }

    /** Restore a snapshot. The buffer is transferred. */
    async loadState(state: ArrayBuffer): Promise<void> {
        await this.core.request('loadState', { sim: this.handle, state }, [state]);
    }

    /**
     * Start recording this session so it can be profiled afterwards.
     *
     * Costs a snapshot now and a few bytes per frame after — the input, not
     * the execution. What makes that enough is that emulation is
     * deterministic: replaying the same input from the same state reproduces
     * the run exactly, so the profile can be collected later and exhaustively
     * rather than sampled while the game is trying to run.
     */
    async startProfileRecording(): Promise<void> {
        await this.core.request('startProfileRecording', { sim: this.handle });
    }

    /** Stop recording and take what was recorded. */
    async stopProfileRecording(): Promise<VesVbRecording> {
        return this.core.request('stopProfileRecording', { sim: this.handle });
    }

    /**
     * Replay a recording and collect a call tree from every instruction in it.
     *
     * Runs on a simulation of its own, so this one carries on undisturbed, but
     * it occupies the worker until it finishes — roughly a sixth of the time
     * that was recorded.
     */
    async replayProfile(recording: VesVbRecording): Promise<VesVbProfileResult> {
        return this.core.request('replayProfile', { sim: this.handle, recording });
    }

    /**
     * Wire this simulation to another over the link port, or pass null to
     * disconnect. The peer must belong to the same session.
     */
    async setPeer(peer: VesVbSim | undefined): Promise<void> {
        await this.core.request('setPeer', { sim: this.handle, peer: peer?.handle ?? 0 });
    }

    /** Read a window of the address space as the CPU sees it. */
    /**
     * Read a rectangle of the composited framebuffer as RGBA bytes.
     *
     * The core composites eye-packed, so the red channel is the left eye's
     * brightness and the green channel the right eye's.
     */
    async readPixels(x: number, y: number, width: number, height: number): Promise<ArrayBuffer> {
        return this.core.request('readPixels', { sim: this.handle, x, y, width, height });
    }

    async readMemory(address: number, length: number): Promise<ArrayBuffer> {
        return this.core.request('readMemory', { sim: this.handle, address, length });
    }

    /** Write bytes into the address space. The buffer is transferred. */
    async writeMemory(address: number, data: ArrayBuffer): Promise<void> {
        await this.core.request('writeMemory', { sim: this.handle, address, data }, [data]);
    }

    async readRegisters(): Promise<VesVbRegisters> {
        return this.core.request('readRegisters', { sim: this.handle });
    }

    async disassemble(address: number, count: number): Promise<VesVbDisassemblyLine[]> {
        return this.core.request('disassemble', { sim: this.handle, address, count });
    }

    /**
     * Start or stop watching the terminal port for this simulation.
     *
     * Capturing costs a callback on every CPU write, so it should only be on
     * while something is displaying the output.
     */
    async setTerminalCapture(enabled: boolean): Promise<void> {
        await this.core.request('setTerminalCapture', { sim: this.handle, enabled });
    }

    /** Terminal output from this simulation, ignoring any others in the session. */
    onTerminal(listener: (text: string) => void): Disposable {
        return this.core.onTerminal(event => {
            if (event.sim === this.handle) {
                listener(event.text);
            }
        });
    }

    /**
     * Start or stop watching the link port for bytes sent over it.
     *
     * Costs a callback on every CPU write while it is on, so it belongs on
     * only while something is on the other end of the cable to receive them.
     */
    async setLinkCapture(enabled: boolean): Promise<void> {
        await this.core.request('setLinkCapture', { sim: this.handle, enabled });
    }

    /** Link port traffic from this simulation, ignoring any others in the session. */
    onLink(listener: (bytes: number[]) => void): Disposable {
        return this.core.onLink(event => {
            if (event.sim === this.handle) {
                listener(event.bytes);
            }
        });
    }

    /**
     * Watch the ESSound port, or stop watching it. Costs the same callback on
     * every CPU write the captures above do, so it is left off unless the ROM
     * has audio files for it to play.
     */
    async setEsSoundCapture(enabled: boolean): Promise<void> {
        await this.core.request('setEsSoundCapture', { sim: this.handle, enabled });
    }

    /** Halfwords this simulation wrote to the ESSound port, once watched. */
    onEsSound(listener: (commands: number[]) => void): Disposable {
        return this.core.onEsSound(event => {
            if (event.sim === this.handle) {
                listener(event.commands);
            }
        });
    }

    /**
     * Follow a pointer variable, reporting each 32-bit value stored to it, or
     * pass 0 to stop. One address at a time, and it costs the same callback on
     * every CPU write that the captures above do.
     */
    /**
     * Repeat these writes at every frame break, or none to stop.
     *
     * The core applies them itself rather than the caller writing on a timer;
     * see the protocol's setCheats.
     */
    async setCheats(codes: VesVbCheatWrite[]): Promise<void> {
        await this.core.request('setCheats', { sim: this.handle, codes });
    }

    async setPointerWatch(address: number): Promise<void> {
        await this.core.request('setPointerWatch', { sim: this.handle, address });
    }

    /** Values stored to the watched address by this simulation. */
    onPointerWrite(listener: (values: number[]) => void): Disposable {
        return this.core.onPointerWrite(event => {
            if (event.sim === this.handle) {
                listener(event.values);
            }
        });
    }

    /**
     * Start or stop watching the VSU's registers and waveform tables.
     *
     * Real hardware never allows that range to be read back, so unlike every
     * other inspector this is not an optimisation to skip when the panel is
     * closed — it is the only way readVsu has anything to report at all.
     */
    async setVsuCapture(enabled: boolean): Promise<void> {
        await this.core.request('setVsuCapture', { sim: this.handle, enabled });
    }

    /** The VSU shadow copy observed so far (VB_VSU_BASE, VB_VSU_WATCH_BYTES bytes). All zero until setVsuCapture(true). */
    async readVsu(): Promise<ArrayBuffer> {
        return this.core.request('readVsu', { sim: this.handle });
    }

    /** Output volume, 0 to 10. */
    async setVolume(volume: number): Promise<void> {
        await this.core.request('setVolume', { sim: this.handle, volume });
    }

    /** Stereo panning, -1 to +1. */
    async setPanning(panning: number): Promise<void> {
        await this.core.request('setPanning', { sim: this.handle, panning });
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.core.request('deleteSim', { sim: this.handle }).catch(() => {
            // The core may already be gone; nothing to release in that case.
        });
    }
}
