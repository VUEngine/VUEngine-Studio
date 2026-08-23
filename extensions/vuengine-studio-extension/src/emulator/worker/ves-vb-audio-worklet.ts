/**
 * Emulator audio output processor.
 *
 * Drains interleaved stereo buffers produced by the core worker into the audio
 * graph, and returns each emptied buffer to the worker. That return is what
 * clocks emulation, so this processor is the session's timing source: buffers
 * are cycled rather than allocated, and never copied.
 *
 * Bundled as a standalone AudioWorklet entry point, so it must not import
 * anything from Theia.
 */

import { VB_AUDIO_PROCESSOR } from '../common/ves-vb-constants';

/** AudioWorklet globals, which lib.dom does not declare. */
declare abstract class AudioWorkletProcessor {
    readonly port: MessagePort;
}
declare function registerProcessor(name: string, processor: typeof VesVbAudioProcessor): void;

class VesVbAudioProcessor extends AudioWorkletProcessor {

    /** Filled buffers waiting to be played, oldest first. */
    protected readonly buffers: Float32Array[] = [];

    /** Read position within the oldest buffer, in floats. */
    protected offset = 0;

    protected core: MessagePort | undefined;

    constructor() {
        super();
        this.port.onmessage = event => {
            this.core = event.data.core as MessagePort;
            this.core.onmessage = message => this.receive(message.data);
            this.port.postMessage(0);
        };
    }

    /**
     * Take either a filled buffer or an instruction from the worker.
     *
     * Both travel the same port so that they stay in order: a flush has to land
     * between the audio that came before it and the audio that comes after.
     */
    protected receive(data: ArrayBuffer | { flush: true }): void {
        if (data instanceof ArrayBuffer) {
            this.buffers.push(new Float32Array(data));
            return;
        }
        if (data.flush) {
            this.flush();
        }
    }

    /**
     * Drop everything queued and hand the buffers straight back.
     *
     * Queued audio was produced by a machine state that no longer exists — one
     * that has since been reset or had a state loaded into it — so playing it
     * out would be playing the past, audibly, before the new state is heard.
     */
    protected flush(): void {
        this.offset = 0;
        if (this.buffers.length === 0) {
            return;
        }
        const emptied = this.buffers.splice(0).map(buffer => buffer.buffer as ArrayBuffer);
        this.core?.postMessage(emptied, emptied);
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const output = outputs[0];
        const length = output[0].length;
        let emptied: ArrayBuffer[] | undefined;

        for (let x = 0; x < length;) {

            // Underrun. Emit silence for the rest of this quantum rather than
            // stuttering; the worker notices and presents its staged frame.
            if (this.buffers.length === 0) {
                for (; x < length; x++) {
                    output[0][x] = output[1][x] = 0;
                }
                break;
            }

            const buffer = this.buffers[0];
            let y = this.offset;
            for (; x < length && y < buffer.length; x++, y += 2) {
                output[0][x] = buffer[y];
                output[1][x] = buffer[y + 1];
            }

            if (y === buffer.length) {
                emptied ??= [];
                emptied.push(this.buffers.shift()!.buffer as ArrayBuffer);
                this.offset = 0;
            } else {
                this.offset = y;
            }
        }

        if (emptied) {
            this.core?.postMessage(emptied, emptied);
        }

        return true;
    }
}

registerProcessor(VB_AUDIO_PROCESSOR, VesVbAudioProcessor);
