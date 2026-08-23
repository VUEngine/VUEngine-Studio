/**
 * Reading VUEngine's heap out of a running machine.
 *
 * `MemoryPool` is the engine's whole dynamic allocator: a fixed set of pools,
 * each a flat array of equally sized blocks, all of them living inside one
 * singleton struct in WRAM. How many pools there are and how they are carved
 * up is a per-project decision (`__MEMORY_POOLS` and `__MEMORY_POOL_ARRAYS` in
 * the project's `Config.h`), so nothing here may assume either — instead the
 * struct is read whole and made to describe itself, which is possible because
 * its bookkeeping arrays are the pools' own addresses. See
 * `parseMemoryPoolLayout`.
 */

/**
 * A build's `MemoryPool` singleton, laid out by `__SINGLETON`:
 *
 * ```
 * +0     objectMemoryFootprint  uint32
 * +4     vTable                 uint32     <- the instance starts here
 * +8     the pools themselves   uint8[]    <- __MEMORY_POOL_ARRAYS
 *        poolLocation           uint8*[N]
 *        poolSizes              uint16[N][2]
 *        poolLastFreeBlock      uint8*[N]
 *        poolOverflows          uint8[N]
 * ```
 */
const POOLS_OFFSET = 8;

/**
 * The smallest block that could hold an allocation: the four-byte header
 * `MemoryPool::allocate` writes, and a vTable pointer behind it.
 */
const MIN_BLOCK_BYTES = 8;

/**
 * Bytes of block header, behind which the object itself begins. `__NEW` asks
 * for `sizeof(ClassName_str) + __DYNAMIC_STRUCT_PAD`, so this is also how much
 * less than its block an object has to fit in.
 */
export const BLOCK_HEADER_BYTES = 4;

/** Offset of the instance's own vTable pointer within the wrapper. */
const INSTANCE_VTABLE_OFFSET = 4;

/** What the engine calls the class whose singleton this is. */
const MEMORY_POOL_CLASS = 'MemoryPool';

/** One pool: a run of equally sized blocks, and how the engine sees it. */
export interface VesMemoryPool {
    /** Address of the pool's first block. */
    address: number;
    blockSize: number;
    /** Total bytes, always a whole number of blocks. */
    poolSize: number;
    blocks: number;
    /**
     * How often the engine failed to find a free block here and had to fall
     * back to a larger pool. A `uint8` that the engine never clears, so a busy
     * run can wrap it — read a high value as "overflowing", not as a count.
     */
    overflows: number;
}

export interface VesMemoryPoolLayout {
    /** Address of the singleton wrapper the pools live in. */
    base: number;
    pools: VesMemoryPool[];
    /** Bytes given over to blocks, across every pool. */
    totalBytes: number;
    /**
     * The singleton's own vTable pointer, as the running machine has it. This
     * is what a build's symbols are checked against — see
     * `symbolsMatchRunningBuild`.
     */
    instanceVTable: number;
}

/** What is sitting in one pool right now. */
export interface VesMemoryPoolUsage {
    usedBlocks: number;
    usedBytes: number;
    /** Occupants by class, most numerous first. */
    classes: VesMemoryPoolOccupant[];
    /**
     * Used blocks whose first word matches no known vTable. Plain structs
     * allocated with `__NEW_BASIC` have no vTable and always land here.
     */
    unidentified: number;
}

export interface VesMemoryPoolOccupant {
    name: string;
    count: number;
}

/**
 * Work out how a build carved up its heap, from the struct's own contents.
 *
 * The project's pool table is a compile-time decision this cannot see, so the
 * layout is recovered instead of assumed. `poolLocation[0]` is what makes that
 * possible: `MemoryPool::reset` points it at the first block, which is the
 * word right after the struct header, so the position of the bookkeeping
 * arrays can be found by looking for an address the caller already knows. From
 * there the pool count follows from how many bytes are left — the four arrays
 * take `12N` bytes plus `N` padded to a word — and the whole reading then has
 * to agree with itself: consecutive pools must be adjacent, every pool must be
 * a whole number of blocks, and together they must fill the space ahead of the
 * arrays. A candidate that fails any of that is a coincidence in block data
 * rather than the array, and the scan moves on to the next one.
 *
 * Returns undefined for a struct that describes nothing yet, which is the
 * ordinary state of a machine that has not reached `MemoryPool::reset` — the
 * caller should read that as "not up yet" rather than as an error.
 *
 * @param base address the region was read from, i.e. of the singleton wrapper
 * @param region the whole wrapper, as long as the linker said it is
 */
export function parseMemoryPoolLayout(base: number, region: Uint8Array): VesMemoryPoolLayout | undefined {
    if (region.byteLength < POOLS_OFFSET + MIN_BLOCK_BYTES) {
        return undefined;
    }
    const view = new DataView(region.buffer, region.byteOffset, region.byteLength);
    const firstBlock = (base + POOLS_OFFSET) >>> 0;

    for (let at = POOLS_OFFSET; at + 4 <= region.byteLength; at += 4) {
        if (view.getUint32(at, true) !== firstBlock) {
            continue;
        }
        const layout = readLayoutAt(base, view, at);
        if (layout) {
            return layout;
        }
    }
    return undefined;
}

/** Read the bookkeeping arrays as though they began at `at`, or fail. */
function readLayoutAt(base: number, view: DataView, at: number): VesMemoryPoolLayout | undefined {
    const count = countPools(view.byteLength - at);
    if (count === undefined) {
        return undefined;
    }

    const locations = at;
    const sizes = locations + 4 * count;
    const lastFreeBlocks = sizes + 4 * count;
    const overflows = lastFreeBlocks + 4 * count;
    if (overflows + count > view.byteLength) {
        return undefined;
    }

    const pools: VesMemoryPool[] = [];
    let expected = (base + POOLS_OFFSET) >>> 0;
    let totalBytes = 0;

    for (let pool = 0; pool < count; pool++) {
        // Pools are laid out back to back in declaration order, so each one
        // has to start exactly where the last one ended.
        const address = view.getUint32(locations + 4 * pool, true) >>> 0;
        if (address !== expected) {
            return undefined;
        }

        // `enum MemoryPoolSizes`: ePoolSize first, then eBlockSize.
        const poolSize = view.getUint16(sizes + 4 * pool, true);
        const blockSize = view.getUint16(sizes + 4 * pool + 2, true);
        if (blockSize < MIN_BLOCK_BYTES || poolSize < blockSize || poolSize % blockSize !== 0) {
            return undefined;
        }

        // Where the last allocation happened, which the engine searches from
        // next. It is only a hint, but it always points into its own pool.
        const lastFreeBlock = view.getUint32(lastFreeBlocks + 4 * pool, true) >>> 0;
        if (lastFreeBlock < address || lastFreeBlock >= address + poolSize) {
            return undefined;
        }

        pools.push({
            address,
            blockSize,
            poolSize,
            blocks: poolSize / blockSize,
            overflows: view.getUint8(overflows + pool),
        });
        expected = (address + poolSize) >>> 0;
        totalBytes += poolSize;
    }

    // The pools have to account for everything between the header and the
    // arrays, give or take whatever padding the compiler needed to put
    // `poolLocation` on a word boundary.
    const span = at - POOLS_OFFSET;
    if (totalBytes > span || span - totalBytes >= 4) {
        return undefined;
    }

    return {
        base,
        pools,
        totalBytes,
        instanceVTable: view.getUint32(INSTANCE_VTABLE_OFFSET, true) >>> 0,
    };
}

/**
 * Whether a build's symbols describe the machine they were read against.
 *
 * Symbols come from the `.elf` a `.map` beside the ROM points at, and nothing
 * guarantees that file is still the one the running ROM was built from — a
 * rebuild that was not reloaded, or a ROM copied over an older build's output,
 * leaves a table whose addresses have quietly moved. Where the pools
 * themselves are concerned that is harmless, because reading them at a wrong
 * address makes `parseMemoryPoolLayout` fail rather than return something
 * plausible. Occupant names have no such protection: a vTable that moved
 * still lands on *some* class, so stale symbols name the wrong one with no
 * outward sign.
 *
 * The singleton being read is a `MemoryPool`, and its vTable pointer says so.
 * If the symbols agree about that one address they were built alongside this
 * ROM; if they do not, every other name they would give is suspect too.
 */
export function symbolsMatchRunningBuild(
    layout: VesMemoryPoolLayout, vTables: Map<number, string>
): boolean {
    return vTables.get(layout.instanceVTable) === MEMORY_POOL_CLASS;
}

/**
 * Whether what was read really is the `MemoryPool` singleton.
 *
 * The same check as `symbolsMatchRunningBuild`, but on the bytes alone, so it
 * can be asked when the parse has *failed* — which is the case that most
 * needs telling apart. A struct that has not been initialised yet and one read
 * from the wrong address both fail to parse, and they mean opposite things:
 * the first clears on its own once the game boots, the second never does.
 * The singleton's vTable pointer separates them, because a wrong address
 * lands on something that is not a `MemoryPool` at all.
 */
export function describesMemoryPool(region: Uint8Array, vTables: Map<number, string>): boolean {
    if (region.byteLength < INSTANCE_VTABLE_OFFSET + 4) {
        return false;
    }
    const view = new DataView(region.buffer, region.byteOffset, region.byteLength);
    return vTables.get(view.getUint32(INSTANCE_VTABLE_OFFSET, true) >>> 0) === MEMORY_POOL_CLASS;
}

/**
 * How many pools leave exactly `bytes` behind them.
 *
 * The four arrays come to `12N` bytes plus `poolOverflows`' `N`, which the
 * compiler pads out to the struct's word alignment. That total only ever grows
 * with N, so at most one count can fit.
 */
function countPools(bytes: number): number | undefined {
    for (let count = 1; 13 * count <= bytes; count++) {
        if (12 * count + ((count + 3) & ~3) === bytes) {
            return count;
        }
    }
    return undefined;
}

/**
 * Who is holding each block, pool by pool.
 *
 * `MemoryPool::allocate` stamps a block's first halfword with
 * `__MEMORY_USED_BLOCK_FLAG` and the next with the pool it came from, and
 * `MemoryPool::free` puts the whole word back to `__MEMORY_FREE_BLOCK_FLAG`,
 * which is zero — so a non-zero header means occupied, the same test the
 * engine's own `MemoryPool::printDetailedUsage` makes.
 *
 * The object begins right behind that header (`__NEW` hands out
 * `block + __DYNAMIC_STRUCT_PAD`) and every engine class starts with its
 * vTable pointer, so the word there names the class — which is the part the
 * engine's own printout cannot tell you. Only an exact match against a vTable
 * the build declared counts, since blocks holding `__NEW_BASIC` structs have
 * ordinary data in that position.
 *
 * @param region the wrapper, read from `layout.base`
 * @param vTables class names by vTable address, from the ROM's symbols
 */
export function readMemoryPoolUsage(
    layout: VesMemoryPoolLayout,
    region: Uint8Array,
    vTables: Map<number, string>
): VesMemoryPoolUsage[] {
    const view = new DataView(region.buffer, region.byteOffset, region.byteLength);

    return layout.pools.map(pool => {
        const counts = new Map<string, number>();
        let usedBlocks = 0;
        let unidentified = 0;
        const start = pool.address - layout.base;

        for (let block = 0; block < pool.blocks; block++) {
            const at = start + block * pool.blockSize;
            if (at < 0 || at + BLOCK_HEADER_BYTES + 4 > view.byteLength) {
                break;
            }
            if (view.getUint32(at, true) === 0) {
                continue;
            }
            usedBlocks++;

            const name = vTables.get(view.getUint32(at + BLOCK_HEADER_BYTES, true) >>> 0);
            if (name === undefined) {
                unidentified++;
            } else {
                counts.set(name, (counts.get(name) ?? 0) + 1);
            }
        }

        return {
            usedBlocks,
            usedBytes: usedBlocks * pool.blockSize,
            unidentified,
            classes: [...counts]
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
        };
    });
}

/** An occupied block, and where the object inside it begins. */
export interface VesMemoryPoolBlock {
    /** The block itself, header included. */
    address: number;
    /** The object in it, which is where its fields start. */
    objectAddress: number;
    /** That object's position within the region the layout was read from. */
    objectOffset: number;
    /** Its vTable pointer, which is what names its class. */
    vTable: number;
    /** The size of the pool it came out of, which is what it costs. */
    blockSize: number;
}

/**
 * Every occupied block, in pool order.
 *
 * `readMemoryPoolUsage` answers how full the pools are; this answers what is
 * in them, for a caller that wants to go and read the objects themselves.
 */
export function readMemoryPoolBlocks(layout: VesMemoryPoolLayout, region: Uint8Array): VesMemoryPoolBlock[] {
    const view = new DataView(region.buffer, region.byteOffset, region.byteLength);
    const blocks: VesMemoryPoolBlock[] = [];

    for (const pool of layout.pools) {
        const start = pool.address - layout.base;
        for (let block = 0; block < pool.blocks; block++) {
            const at = start + block * pool.blockSize;
            if (at < 0 || at + BLOCK_HEADER_BYTES + 4 > view.byteLength) {
                break;
            }
            if (view.getUint32(at, true) === 0) {
                continue;
            }
            blocks.push({
                address: (pool.address + block * pool.blockSize) >>> 0,
                objectAddress: (pool.address + block * pool.blockSize + BLOCK_HEADER_BYTES) >>> 0,
                objectOffset: at + BLOCK_HEADER_BYTES,
                vTable: view.getUint32(at + BLOCK_HEADER_BYTES, true) >>> 0,
                blockSize: pool.blockSize,
            });
        }
    }
    return blocks;
}
