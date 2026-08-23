/**
 * VUEngine's class hierarchy, recovered from a build.
 *
 * The engine identifies a class by the address of its `getBaseClass` function
 * rather than by a name — `typeofclass(X)` is `&X_getBaseClass`, and a cast
 * walks upwards by calling it. That makes the hierarchy something the image
 * already contains, but only as code: `X_getBaseClass` is a stub that returns
 * `&Base_getBaseClass` and nothing else.
 *
 * On the V810 a function returning a constant address is three instructions —
 * load the high half, add the low half, return — which is regular enough to
 * read back without disassembling anything. Doing so turns 200 stubs into the
 * inheritance chain, which is what lets a pool block holding some project's
 * own class be recognised as an Actor.
 */

import { VesElfImage } from './ves-emulator-elf';

const BASE_CLASS_SUFFIX = '_getBaseClass';

/** `movhi imm16, reg1, reg2`, which loads the constant's high half. */
const OPCODE_MOVHI = 0b101111;
/** `movea imm16, reg1, reg2`, which adds its sign-extended low half. */
const OPCODE_MOVEA = 0b101000;

/** The two instructions that carry the constant, four bytes each. */
const STUB_BYTES = 8;

/**
 * Every class in a build, mapped to the class it inherits from.
 *
 * `Object` is its own base, which is how the engine marks the top of the
 * chain, and this keeps that: a walk upwards has to stop somewhere, and a
 * self-reference is the same terminator the engine uses.
 */
export function readClassHierarchy(image: VesElfImage): Map<string, string> {
    const names = new Map<number, string>();
    const stubs: { name: string, address: number }[] = [];
    for (const symbol of image.symbols) {
        if (!symbol.isFunction || !symbol.name.endsWith(BASE_CLASS_SUFFIX)) {
            continue;
        }
        const name = symbol.name.replace(/^_/, '').slice(0, -BASE_CLASS_SUFFIX.length);
        names.set(symbol.address, name);
        stubs.push({ name, address: symbol.address });
    }

    const hierarchy = new Map<string, string>();
    for (const stub of stubs) {
        const base = names.get(readReturnedAddress(image, stub.address) ?? -1);
        if (base !== undefined) {
            hierarchy.set(stub.name, base);
        }
    }
    return hierarchy;
}

/**
 * The constant a `getBaseClass` stub returns, or undefined if it is not shaped
 * the way the compiler shapes them — in which case that one class simply goes
 * unplaced rather than the whole hierarchy being wrong.
 */
function readReturnedAddress(image: VesElfImage, address: number): number | undefined {
    const code = image.read(address, STUB_BYTES);
    if (!code || code.byteLength < STUB_BYTES) {
        return undefined;
    }
    const view = new DataView(code.buffer, code.byteOffset, code.byteLength);

    // Both are format V: the opcode is the top six bits of the first halfword,
    // and the 16-bit immediate follows it.
    if (view.getUint16(0, true) >>> 10 !== OPCODE_MOVHI
        || view.getUint16(4, true) >>> 10 !== OPCODE_MOVEA) {
        return undefined;
    }
    const high = view.getUint16(2, true);
    // movea sign-extends, so a low half above 0x7fff borrows from the high one.
    const low = view.getInt16(6, true);
    return ((high << 16) + low) >>> 0;
}

/**
 * Whether a class is the named one or descends from it.
 *
 * The walk is bounded by the number of classes rather than by reaching
 * `Object`, so a hierarchy that somehow forms a cycle cannot hang the caller.
 */
export function isSubclassOf(hierarchy: Map<string, string>, name: string, ancestor: string): boolean {
    let current: string | undefined = name;
    for (let step = 0; current !== undefined && step <= hierarchy.size; step++) {
        if (current === ancestor) {
            return true;
        }
        const base: string | undefined = hierarchy.get(current);
        // Object is its own base, so this is the top of the chain.
        current = base === current ? undefined : base;
    }
    return false;
}

/** A class and everything above it, nearest first, for showing what it is. */
export function ancestryOf(hierarchy: Map<string, string>, name: string): string[] {
    const chain: string[] = [];
    let current: string | undefined = name;
    for (let step = 0; current !== undefined && step <= hierarchy.size; step++) {
        chain.push(current);
        const base: string | undefined = hierarchy.get(current);
        current = base === current ? undefined : base;
    }
    return chain;
}
