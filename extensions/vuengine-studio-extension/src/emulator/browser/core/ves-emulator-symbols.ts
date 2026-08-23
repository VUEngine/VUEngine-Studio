/**
 * What the emulator's inspectors want out of a build's symbol table.
 *
 * Reading the table means pulling a whole `.elf` — tens of megabytes on a
 * real project — so it happens once per ROM and everything that needs a
 * symbol takes it from here rather than reading again. The index keeps only
 * the handful of things panels actually look up, so the symbol list itself
 * can be dropped as soon as this has been built from it.
 */

import { readClassHierarchy } from './ves-emulator-classes';
import { readDwarfStructs, VesStruct } from './ves-emulator-dwarf';
import { VesElfImage, VesElfSymbol } from './ves-emulator-elf';

/** A symbol's address and the size the linker gave it. */
export interface VesSymbolExtent {
    address: number;
    size: number;
}

export interface VesEmulatorSymbolIndex {
    /**
     * MemoryPool's singleton, which is the whole of the engine's heap: the
     * pools themselves and the bookkeeping that describes them, in one struct.
     */
    memoryPool?: VesSymbolExtent;
    /**
     * Every class' virtual table, by address, named as the project names the
     * class. This is what turns an allocated block back into the kind of
     * object sitting in it — see `readMemoryPoolUsage`.
     */
    vTables: Map<number, string>;
    /** Address of `Rumble.c`'s `_rumbleEffectSpec`. */
    rumbleSpecPointer?: number;
    /** Every RumbleEffectSpec in the ROM, by the address the linker gave it. */
    rumbleSpecNames: Map<number, string>;
    /**
     * Every class mapped to the one it inherits from, which is what lets an
     * object of some project's own class be recognised as, say, an Actor.
     * `Object` is its own base and ends the chain.
     */
    classes: Map<string, string>;
    /**
     * Field layouts, by the name the engine's class macro gives the struct —
     * `Actor_str` for class `Actor`. Empty for a build with no debug sections,
     * which costs field-level inspection but nothing else.
     */
    structs: Map<string, VesStruct>;
    /**
     * Every data symbol, ordered by address, so a pointer read out of the
     * running machine can be named — see `findSymbolAt`. This is what turns an
     * actor's `actorSpec` back into the spec the project wrote.
     */
    dataSymbols: VesElfSymbol[];
}

/**
 * The symbol a pointer falls in, and how far into it.
 *
 * A spec is usually pointed at by its start, but not always: one embedded in a
 * larger structure — an array of them, or a subclass' spec whose first member
 * is the base one — is pointed at from within the symbol that contains it. So
 * the search is for the symbol whose extent covers the address rather than for
 * one that begins at it, and the offset comes back for the caller to show.
 *
 * A symbol the linker gave no size to can only be matched exactly, since there
 * is nothing to say where it ends.
 */
export function findSymbolAt(
    index: VesEmulatorSymbolIndex, address: number
): { symbol: VesElfSymbol, offset: number } | undefined {
    const symbols = index.dataSymbols;
    const target = address >>> 0;

    // The last symbol starting at or before the address; anything covering it
    // has to start no later than it does.
    let low = 0;
    let high = symbols.length - 1;
    let found = -1;
    while (low <= high) {
        const middle = (low + high) >> 1;
        if (symbols[middle].address <= target) {
            found = middle;
            low = middle + 1;
        } else {
            high = middle - 1;
        }
    }

    // Several symbols can share an address, and a smaller one can be nested in
    // a larger, so walk back over the run that starts here for the best fit.
    for (let at = found; at >= 0; at--) {
        const symbol = symbols[at];
        const end = symbol.address + Math.max(symbol.size, 1);
        if (target >= symbol.address && target < end) {
            return { symbol, offset: target - symbol.address };
        }
        // Once the candidates start before the widest one seen could reach,
        // there is nothing further back that could cover the address either.
        if (symbol.address + symbol.size < target && symbol.address !== symbols[found]?.address) {
            break;
        }
    }
    return undefined;
}

/** The struct a class' instances are laid out by. */
export function structNameOf(className: string): string {
    return `${className}_str`;
}

/**
 * `MemoryPool`'s singleton instance.
 *
 * `__SINGLETON` declares it as a file-scope static wrapping the instance in a
 * struct that prefixes it with an object footprint, so the name carries the
 * macro's own leading underscore as well as the ABI's, and the symbol is
 * local — which the ELF reader does not mind, but `nm` on the `.map` would,
 * since a map lists globals only.
 */
const MEMORY_POOL_SYMBOL = '__singletonWrapperMemoryPool';
const VTABLE_SUFFIX = '_vTable';
const RUMBLE_SPEC_POINTER_SYMBOL = '__rumbleEffectSpec';
const RUMBLE_SPEC_SUFFIX = 'RumbleEffectSpec';

/** Reduce a build's image to what the inspectors can use. */
export function indexElfSymbols(image: VesElfImage): VesEmulatorSymbolIndex {
    const index: VesEmulatorSymbolIndex = {
        vTables: new Map(),
        rumbleSpecNames: new Map(),
        classes: readClassHierarchy(image),
        structs: readDwarfStructs(image),
        dataSymbols: image.symbols
            .filter(symbol => !symbol.isFunction)
            .sort((a, b) => a.address - b.address),
    };

    for (const symbol of image.symbols) {
        // Only data symbols name anything here; the code ones are what the
        // class hierarchy was read from, and are of no further use.
        if (symbol.isFunction) {
            continue;
        }
        if (symbol.name === MEMORY_POOL_SYMBOL) {
            index.memoryPool = { address: symbol.address, size: symbol.size };
        } else if (symbol.name === RUMBLE_SPEC_POINTER_SYMBOL) {
            index.rumbleSpecPointer = symbol.address;
        } else if (symbol.name.endsWith(VTABLE_SUFFIX)) {
            index.vTables.set(symbol.address, trim(symbol.name, VTABLE_SUFFIX));
        } else if (symbol.name.endsWith(RUMBLE_SPEC_SUFFIX)) {
            index.rumbleSpecNames.set(symbol.address, trim(symbol.name, RUMBLE_SPEC_SUFFIX));
        }
    }

    return index;
}

/**
 * What the project calls the thing a generated symbol belongs to: the ABI's
 * leading underscore and the generated suffix are on every one of them.
 */
function trim(name: string, suffix: string): string {
    return name.replace(/^_/, '').slice(0, -suffix.length);
}
