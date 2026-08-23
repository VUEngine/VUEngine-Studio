/**
 * Reverse delta codec for the rewind history.
 *
 * The simulation state struct is 1.85 MiB but only about 0.2% of it changes
 * per frame, so storing whole snapshots wastes almost all of the memory budget.
 * Encoding just the changed runs measures at roughly 112x smaller on a real
 * game (see scripts/rewind-cost-probe.mjs), which turns a 128 MB budget from
 * barely a second of history into minutes of it.
 *
 * A delta converts the newer state back to the older one, which is the
 * direction rewind walks, so stepping back is one XOR pass over the changed
 * bytes and needs no keyframes.
 *
 * Encoding is a series of runs: [uint32 offset][uint32 length][length bytes].
 */

/**
 * Changed words closer together than this stay in one run rather than paying
 * another 8 byte header. Measured as the sweet spot on a real game.
 */
export const REWIND_RUN_GAP_WORDS = 4;

/** Scratch run boundaries, so encoding allocates only its result. */
export interface VesVbRunScratch {
    starts: Int32Array;
    ends: Int32Array;
}

export function createRunScratch(capacity = 1 << 16): VesVbRunScratch {
    return { starts: new Int32Array(capacity), ends: new Int32Array(capacity) };
}

/**
 * Encode how `current` differs from `previous`.
 *
 * Applying the result to `current` yields `previous`. Both must be the same
 * length and a multiple of four bytes; comparison runs a word at a time, which
 * is both faster and how the state is actually laid out.
 */
export function encodeDelta(
    previous: Uint8Array,
    current: Uint8Array,
    scratch: VesVbRunScratch
): Uint8Array {
    const words = previous.length >> 2;
    const previousWords = new Uint32Array(previous.buffer, previous.byteOffset, words);
    const currentWords = new Uint32Array(current.buffer, current.byteOffset, words);
    const capacity = scratch.starts.length;

    let runs = 0;
    let start = -1;
    let last = -1;

    for (let i = 0; i < words; i++) {
        if (previousWords[i] === currentWords[i]) {
            continue;
        }
        if (start < 0) {
            start = i;
        } else if (i - last > REWIND_RUN_GAP_WORDS) {
            if (runs < capacity) {
                scratch.starts[runs] = start;
                scratch.ends[runs] = last;
                runs++;
                start = i;
            }
            // Out of run slots: fall through so the open run keeps extending.
            // That stores some unchanged bytes, which is wasteful but correct;
            // dropping the change instead would corrupt the history.
        }
        last = i;
    }

    if (start >= 0) {
        if (runs < capacity) {
            scratch.starts[runs] = start;
            scratch.ends[runs] = last;
            runs++;
        } else {
            scratch.ends[runs - 1] = last;
        }
    }

    let size = 0;
    for (let r = 0; r < runs; r++) {
        size += 8 + (scratch.ends[r] - scratch.starts[r] + 1) * 4;
    }

    const delta = new Uint8Array(size);
    const view = new DataView(delta.buffer);
    let offset = 0;
    for (let r = 0; r < runs; r++) {
        const from = scratch.starts[r] * 4;
        const length = (scratch.ends[r] - scratch.starts[r] + 1) * 4;
        view.setUint32(offset, from, true);
        view.setUint32(offset + 4, length, true);
        offset += 8;
        for (let i = 0; i < length; i++) {
            delta[offset + i] = previous[from + i] ^ current[from + i];
        }
        offset += length;
    }

    return delta;
}

/** Apply a delta in place, walking the target back one capture. */
export function applyDelta(target: Uint8Array, delta: Uint8Array): void {
    const view = new DataView(delta.buffer, delta.byteOffset, delta.byteLength);
    let offset = 0;
    while (offset < delta.byteLength) {
        const from = view.getUint32(offset, true);
        const length = view.getUint32(offset + 4, true);
        offset += 8;
        for (let i = 0; i < length; i++) {
            target[from + i] ^= delta[offset + i];
        }
        offset += length;
    }
}
