/**
 * Just enough ELF32 to read what a build knows about itself.
 *
 * The `.map` a build leaves beside its ROM lists global symbols only, and much
 * of what the inspectors want is not global — `Rumble.c`'s `_rumbleEffectSpec`
 * and `MemoryPool`'s singleton are file-scope statics, which appear only in the
 * `.elf`. The same file also carries the sections behind those symbols, so
 * anything the linker laid out can be read back without the machine running:
 * a class' `getBaseClass` stub, or the DWARF describing its fields.
 *
 * Reading it here rather than shelling out to `v810-nm` or `objdump` keeps
 * this on the frontend, where the ROM is already being loaded.
 */

/** A symbol, with the address and size the linker gave it. */
export interface VesElfSymbol {
    /** As the linker recorded it, including the ABI's leading underscore. */
    name: string;
    address: number;
    size: number;
    /** Code rather than data. Both are kept: the class table needs code. */
    isFunction: boolean;
}

/** A build's image: its symbols, and the bytes the linker placed. */
export interface VesElfImage {
    symbols: VesElfSymbol[];
    /** A named section's contents, or undefined if it has none. */
    section(name: string): Uint8Array | undefined;
    /**
     * Bytes at a runtime address, from whichever section covers it. Undefined
     * for an address in no section, or in one with no contents of its own
     * (`.bss`, whose bytes only exist once the machine has zeroed them).
     */
    read(address: number, length: number): Uint8Array | undefined;
}

const ELF_MAGIC = 0x464c457f; // "\x7fELF", little-endian
const ELFCLASS32 = 1;
const ELFDATA2LSB = 1;
const SHT_SYMTAB = 2;
const SHT_NOBITS = 8;
const STT_OBJECT = 1;
const STT_FUNC = 2;
const SYMBOL_ENTRY_SIZE = 16;

interface Section {
    name: string;
    type: number;
    address: number;
    offset: number;
    size: number;
    link: number;
}

/**
 * Read an ELF32 image, or undefined if it is not one this can read — which is
 * not worth an error, since it only means the features built on it stay off.
 */
export function readElf(bytes: Uint8Array): VesElfImage | undefined {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.byteLength < 52
        || view.getUint32(0, true) !== ELF_MAGIC
        || bytes[4] !== ELFCLASS32
        || bytes[5] !== ELFDATA2LSB) {
        return undefined;
    }

    const sectionHeaderOffset = view.getUint32(32, true);
    const sectionHeaderSize = view.getUint16(46, true);
    const sectionCount = view.getUint16(48, true);
    const sectionNameIndex = view.getUint16(50, true);
    if (sectionHeaderOffset === 0 || sectionCount === 0) {
        return undefined;
    }

    const at = (index: number): number => sectionHeaderOffset + index * sectionHeaderSize;
    if (at(sectionCount) > bytes.byteLength || sectionNameIndex >= sectionCount) {
        return undefined;
    }
    const sectionNames = view.getUint32(at(sectionNameIndex) + 16, true);

    const sections: Section[] = [];
    for (let index = 0; index < sectionCount; index++) {
        const header = at(index);
        const offset = view.getUint32(header + 16, true);
        const size = view.getUint32(header + 20, true);
        const type = view.getUint32(header + 4, true);
        if (type !== SHT_NOBITS && offset + size > bytes.byteLength) {
            continue;
        }
        sections.push({
            name: readString(bytes, sectionNames, bytes.byteLength - sectionNames, view.getUint32(header, true)),
            type,
            address: view.getUint32(header + 12, true) >>> 0,
            offset,
            size,
            link: view.getUint32(header + 24, true),
        });
    }

    return {
        symbols: readSymbols(bytes, view, sections, at, sectionHeaderSize),
        section: name => {
            const section = sections.find(candidate => candidate.name === name);
            return section && section.type !== SHT_NOBITS
                ? bytes.subarray(section.offset, section.offset + section.size)
                : undefined;
        },
        read: (address, length) => {
            const target = address >>> 0;
            for (const section of sections) {
                // A section at address zero was not loaded anywhere: the debug
                // sections are all like that, and would otherwise swallow
                // every low address asked for.
                if (section.type === SHT_NOBITS || section.address === 0
                    || target < section.address || target + length > section.address + section.size) {
                    continue;
                }
                const from = section.offset + (target - section.address);
                return bytes.subarray(from, from + length);
            }
            return undefined;
        },
    };
}

/** Every named data and code symbol the image declares. */
function readSymbols(
    bytes: Uint8Array,
    view: DataView,
    sections: Section[],
    at: (index: number) => number,
    sectionHeaderSize: number
): VesElfSymbol[] {
    const symbols: VesElfSymbol[] = [];
    for (const section of sections) {
        if (section.type !== SHT_SYMTAB) {
            continue;
        }
        // sh_link on a symbol table is the string table its names live in.
        const stringHeader = at(section.link);
        if (stringHeader + sectionHeaderSize > bytes.byteLength) {
            continue;
        }
        const stringOffset = view.getUint32(stringHeader + 16, true);
        const stringSize = view.getUint32(stringHeader + 20, true);
        if (stringOffset + stringSize > bytes.byteLength) {
            continue;
        }

        const end = section.offset + section.size;
        for (let entry = section.offset; entry + SYMBOL_ENTRY_SIZE <= end; entry += SYMBOL_ENTRY_SIZE) {
            // st_info's low nibble is the symbol's type; sections and file
            // names are of no interest, only variables and functions.
            const type = view.getUint8(entry + 12) & 0xf;
            if (type !== STT_OBJECT && type !== STT_FUNC) {
                continue;
            }
            const name = readString(bytes, stringOffset, stringSize, view.getUint32(entry, true));
            if (name !== '') {
                symbols.push({
                    name,
                    address: view.getUint32(entry + 4, true) >>> 0,
                    size: view.getUint32(entry + 8, true),
                    isFunction: type === STT_FUNC,
                });
            }
        }
    }
    return symbols;
}

/** One NUL-terminated name out of a string table. */
function readString(bytes: Uint8Array, tableOffset: number, tableSize: number, at: number): string {
    if (at >= tableSize) {
        return '';
    }
    let end = tableOffset + at;
    const limit = Math.min(tableOffset + tableSize, bytes.byteLength);
    while (end < limit && bytes[end] !== 0) {
        end++;
    }
    // Symbol names are C identifiers, so this never has to decode anything
    // wider than a byte.
    return String.fromCharCode(...bytes.subarray(tableOffset + at, end));
}

/**
 * The `.elf` a build's `.map` file says it produced.
 *
 * A map sits beside the ROM it belongs to and names its own image on a line
 * like `OUTPUT(build/working/output-beta.elf elf32-v810)`, which is what makes
 * it possible to find the symbols for `build/output.vb` — a copy whose own
 * name says nothing about which build mode produced it. The path is relative
 * to the directory the build ran in, which is the project root.
 */
export function readElfPathFromMap(map: string): string | undefined {
    return /^OUTPUT\(([^\s)]+)/m.exec(map)?.[1];
}

/**
 * Which build mode produced a `.map`, from the image it says it made.
 *
 * The mode is a set of `-D` flags rather than anything recorded in the output
 * — DWARF's producer string carries the compiler's switches but not its
 * defines, so two modes are identical there — but the build gives each mode an
 * image of its own, `output-beta.elf` beside `output-release.elf`. That name
 * is the one durable trace of which one ran.
 *
 * Returns the mode as the build names it, lower case; the caller decides
 * whether it is one it knows.
 */
export function readBuildModeFromMap(map: string): string | undefined {
    const output = readElfPathFromMap(map);
    return output === undefined
        ? undefined
        : /(?:^|\/)output-([A-Za-z]+)\.elf$/.exec(output)?.[1].toLowerCase();
}
