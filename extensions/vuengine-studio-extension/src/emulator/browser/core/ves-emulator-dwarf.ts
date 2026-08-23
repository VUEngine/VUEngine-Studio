/**
 * Enough DWARF to know where a class keeps its fields.
 *
 * Reading an object out of a pool block needs the offset of every field in it,
 * and nothing in the symbol table says where they are — a struct is one opaque
 * run of bytes as far as `.symtab` is concerned. The debug sections do say,
 * and the toolchain emits them in every build mode, so this is available
 * wherever the `.elf` itself is.
 *
 * Only what a value inspector needs is read: named struct definitions, their
 * members' offsets, and enough of each member's type to decode the bytes
 * there. Everything else in the tree is walked past.
 *
 * VUEngine's class macro flattens inheritance, so `Actor_str` carries the
 * fields of `Container`, `Entity` and the rest inline, in that order — there
 * is no base-class link to follow, and a subclass' own struct describes the
 * whole object.
 */

import { VesElfImage } from './ves-emulator-elf';

/** How a member's bytes should be read. */
export enum VesTypeKind {
    SIGNED = 'signed',
    UNSIGNED = 'unsigned',
    BOOL = 'bool',
    FLOAT = 'float',
    POINTER = 'pointer',
    /** A nested struct, whose own members are spliced in by the reader. */
    STRUCT = 'struct',
    ARRAY = 'array',
    /** Anything this does not decode — shown as raw bytes. */
    OPAQUE = 'opaque',
}

export interface VesType {
    kind: VesTypeKind;
    /** The name the source gave it, for display: `int16`, `Vector3D`. */
    name: string;
    byteSize: number;
    /** For STRUCT, the definition to descend into. */
    struct?: VesStruct;
}

export interface VesStructMember {
    name: string;
    /** Bytes from the start of the struct. */
    offset: number;
    type: VesType;
    /** Width in bits for a bitfield. Absent for an ordinary member. */
    bitSize?: number;
    /**
     * Where the bitfield's low bit sits, counted in bits from the start of the
     * struct with the target's little-endian byte order already applied — so
     * the value is `(bits >> bitOffset) & mask` over the whole struct. The two
     * ways DWARF describes a bitfield are both normalised to this; see
     * `bitPosition`.
     */
    bitOffset?: number;
}

export interface VesStruct {
    name: string;
    byteSize: number;
    members: VesStructMember[];
}

// The handful of DWARF constants this needs.
const TAG_ARRAY = 0x01;
const TAG_ENUM = 0x04;
const TAG_MEMBER = 0x0d;
const TAG_POINTER = 0x0f;
const TAG_STRUCT = 0x13;
const TAG_TYPEDEF = 0x16;
const TAG_BASE = 0x24;
const TAG_CONST = 0x26;
const TAG_VOLATILE = 0x35;
const TAG_UNION = 0x17;

const AT_NAME = 0x03;
const AT_BYTE_SIZE = 0x0b;
const AT_BIT_SIZE = 0x0d;
const AT_BIT_OFFSET = 0x0c;
const AT_MEMBER_LOCATION = 0x38;
const AT_DECLARATION = 0x3c;
const AT_ENCODING = 0x3e;
const AT_TYPE = 0x49;
const AT_DATA_BIT_OFFSET = 0x6b;

// DW_ATE_*: how a base type's bytes mean a number.
const ATE_BOOLEAN = 0x02;
const ATE_FLOAT = 0x04;
const ATE_SIGNED = 0x05;
const ATE_SIGNED_CHAR = 0x06;
const ATE_UNSIGNED = 0x07;
const ATE_UNSIGNED_CHAR = 0x08;

/** How deep a chain of typedefs and qualifiers is followed before giving up. */
const MAX_TYPE_DEPTH = 16;

interface Die {
    tag: number;
    attributes: Map<number, number | string>;
    children: Die[];
}

/**
 * Every named struct a build defines, by name.
 *
 * Returns an empty map for an image with no debug sections, which is an
 * ordinary state rather than a failure: it only means field-level inspection
 * is unavailable for that ROM.
 */
export function readDwarfStructs(image: VesElfImage): Map<string, VesStruct> {
    const info = image.section('.debug_info');
    const abbreviations = image.section('.debug_abbrev');
    if (!info || !abbreviations) {
        return new Map();
    }
    const strings = image.section('.debug_str');

    const dies = new Map<number, Die>();
    const definitions = new Map<string, Die>();
    const reader = new DwarfReader(info, abbreviations, strings, dies, definitions);
    reader.readUnits();

    // Structs are resolved lazily and memoised, since members refer to other
    // structs and a type graph this size should only be walked once.
    const resolved = new Map<Die, VesStruct>();
    const structs = new Map<string, VesStruct>();
    for (const [name, die] of definitions) {
        structs.set(name, resolveStruct(name, die, dies, resolved));
    }
    return structs;
}

/** Walks `.debug_info`, keeping only what struct layouts are made of. */
class DwarfReader {

    constructor(
        protected readonly info: Uint8Array,
        protected readonly abbreviations: Uint8Array,
        protected readonly strings: Uint8Array | undefined,
        protected readonly dies: Map<number, Die>,
        protected readonly definitions: Map<string, Die>
    ) { }

    protected readonly view = new DataView(this.info.buffer, this.info.byteOffset, this.info.byteLength);

    readUnits(): void {
        let at = 0;
        // Each compilation unit carries its own header and abbreviation table,
        // and there is one per translation unit in the build.
        while (at + 11 <= this.info.byteLength) {
            const unitLength = this.view.getUint32(at, true);
            const end = at + 4 + unitLength;
            // A length that runs past the section is a section this cannot
            // read; stopping keeps whatever was read before it.
            if (unitLength === 0 || end > this.info.byteLength) {
                return;
            }
            const version = this.view.getUint16(at + 4, true);
            const abbreviationOffset = this.view.getUint32(at + 6, true);
            const addressSize = this.info[at + 10];
            // 2 through 4 all lay the header out this way. 5 moved things
            // around, and is left alone rather than misread.
            if (version >= 2 && version <= 4) {
                this.readUnit(at + 11, end, at, addressSize, this.readAbbreviations(abbreviationOffset));
            }
            at = end;
        }
    }

    /** One unit's abbreviation table: the shape of every DIE it contains. */
    protected readAbbreviations(offset: number): Map<number, { tag: number, hasChildren: boolean, attributes: [number, number][] }> {
        const table = new Map<number, { tag: number, hasChildren: boolean, attributes: [number, number][] }>();
        let at = offset;
        while (at < this.abbreviations.byteLength) {
            const [code, afterCode] = uleb(this.abbreviations, at);
            at = afterCode;
            if (code === 0) {
                break;
            }
            const [tag, afterTag] = uleb(this.abbreviations, at);
            at = afterTag;
            const hasChildren = this.abbreviations[at++] !== 0;
            const attributes: [number, number][] = [];
            for (;;) {
                const [attribute, afterAttribute] = uleb(this.abbreviations, at);
                const [form, afterForm] = uleb(this.abbreviations, afterAttribute);
                at = afterForm;
                if (attribute === 0 && form === 0) {
                    break;
                }
                attributes.push([attribute, form]);
            }
            table.set(code, { tag, hasChildren, attributes });
        }
        return table;
    }

    protected readUnit(
        start: number,
        end: number,
        unitOffset: number,
        addressSize: number,
        table: Map<number, { tag: number, hasChildren: boolean, attributes: [number, number][] }>
    ): void {
        let at = start;
        const stack: Die[] = [];

        while (at < end) {
            const dieOffset = at;
            const [code, afterCode] = uleb(this.info, at);
            at = afterCode;
            if (code === 0) {
                // The null entry that closes a run of siblings.
                stack.pop();
                continue;
            }
            const abbreviation = table.get(code);
            if (!abbreviation) {
                // Without the abbreviation there is no way to know how long
                // this entry is, so the rest of the unit is unreadable.
                return;
            }

            const attributes = new Map<number, number | string>();
            for (const [attribute, form] of abbreviation.attributes) {
                const [value, next] = this.readValue(at, form, addressSize, unitOffset);
                if (value !== undefined) {
                    attributes.set(attribute, value);
                }
                at = next;
            }

            const die: Die = { tag: abbreviation.tag, attributes, children: [] };
            this.dies.set(dieOffset, die);

            const parent = stack[stack.length - 1];
            // Only members are kept as children: nothing else in a struct's
            // subtree contributes to its layout.
            if (parent && abbreviation.tag === TAG_MEMBER) {
                parent.children.push(die);
            }

            const name = attributes.get(AT_NAME);
            // A declaration is the forward reference a header leaves behind;
            // the definition is the one that says how big it is.
            if (abbreviation.tag === TAG_STRUCT && typeof name === 'string'
                && !attributes.has(AT_DECLARATION) && attributes.has(AT_BYTE_SIZE)) {
                this.definitions.set(name, die);
            }

            if (abbreviation.hasChildren) {
                stack.push(die);
            }
        }
    }

    /**
     * One attribute value, by form. Forms this does not decode into something
     * useful return undefined, having still advanced past their bytes — which
     * is the part that matters, since the next attribute follows immediately.
     */
    protected readValue(at: number, form: number, addressSize: number, unitOffset: number): [number | string | undefined, number] {
        switch (form) {
            case 0x01: return [this.view.getUint32(at, true), at + addressSize]; // addr
            case 0x03: return [undefined, at + 2 + this.view.getUint16(at, true)]; // block2
            case 0x04: return [undefined, at + 4 + this.view.getUint32(at, true)]; // block4
            case 0x05: return [this.view.getUint16(at, true), at + 2]; // data2
            case 0x06: return [this.view.getUint32(at, true), at + 4]; // data4
            case 0x07: return [undefined, at + 8]; // data8
            case 0x08: { // string
                const [text, next] = readCString(this.info, at);
                return [text, next];
            }
            case 0x09: { // block
                const [length, next] = uleb(this.info, at);
                return [undefined, next + length];
            }
            case 0x0a: return [undefined, at + 1 + this.info[at]]; // block1
            case 0x0b: return [this.info[at], at + 1]; // data1
            case 0x0c: return [this.info[at], at + 1]; // flag
            case 0x0d: return sleb(this.info, at); // sdata
            case 0x0e: { // strp
                const offset = this.view.getUint32(at, true);
                return [this.strings ? readCString(this.strings, offset)[0] : undefined, at + 4];
            }
            case 0x0f: return uleb(this.info, at); // udata
            case 0x10: return [this.view.getUint32(at, true), at + 4]; // ref_addr
            case 0x11: return [unitOffset + this.info[at], at + 1]; // ref1
            case 0x12: return [unitOffset + this.view.getUint16(at, true), at + 2]; // ref2
            case 0x13: return [unitOffset + this.view.getUint32(at, true), at + 4]; // ref4
            case 0x14: return [undefined, at + 8]; // ref8
            case 0x15: { // ref_udata
                const [value, next] = uleb(this.info, at);
                return [unitOffset + value, next];
            }
            case 0x16: { // indirect: the real form is in the data
                const [actual, next] = uleb(this.info, at);
                return this.readValue(next, actual, addressSize, unitOffset);
            }
            case 0x17: return [this.view.getUint32(at, true), at + 4]; // sec_offset
            case 0x18: { // exprloc
                const [length, next] = uleb(this.info, at);
                return [undefined, next + length];
            }
            case 0x19: return [1, at]; // flag_present, which occupies nothing
            case 0x20: return [undefined, at + 8]; // ref_sig8
            default:
                // An unknown form has an unknown length, so the caller cannot
                // keep going. Returning the end stops this unit cleanly.
                return [undefined, this.info.byteLength];
        }
    }
}

/** Turn a struct DIE and its members into a layout, following type links. */
function resolveStruct(
    name: string, die: Die, dies: Map<number, Die>, resolved: Map<Die, VesStruct>
): VesStruct {
    const existing = resolved.get(die);
    if (existing) {
        return existing;
    }
    const struct: VesStruct = { name, byteSize: numberAttribute(die, AT_BYTE_SIZE) ?? 0, members: [] };
    // Registered before its members are walked, so a struct that contains a
    // pointer back to its own kind terminates instead of recursing forever.
    resolved.set(die, struct);

    for (const member of die.children) {
        const memberName = member.attributes.get(AT_NAME);
        if (typeof memberName !== 'string') {
            continue;
        }
        const bitSize = numberAttribute(member, AT_BIT_SIZE);
        const offset = numberAttribute(member, AT_MEMBER_LOCATION) ?? 0;
        struct.members.push({
            name: memberName,
            offset,
            type: resolveType(member.attributes.get(AT_TYPE), dies, resolved),
            ...(bitSize !== undefined ? { bitSize, bitOffset: bitPosition(member, offset, bitSize) } : {}),
        });
    }
    return struct;
}

/** What a type reference finally denotes, past typedefs and qualifiers. */
function resolveType(
    reference: number | string | undefined, dies: Map<string | number, Die> | Map<number, Die>, resolved: Map<Die, VesStruct>
): VesType {
    const unknown: VesType = { kind: VesTypeKind.OPAQUE, name: '?', byteSize: 0 };
    let current = typeof reference === 'number' ? (dies as Map<number, Die>).get(reference) : undefined;
    let label = '';

    for (let depth = 0; current && depth < MAX_TYPE_DEPTH; depth++) {
        const name = current.attributes.get(AT_NAME);
        const byteSize = numberAttribute(current, AT_BYTE_SIZE) ?? 0;

        switch (current.tag) {
            case TAG_TYPEDEF:
                // Keep the first name seen: `int16` reads better than the
                // `short int` it is a typedef for.
                label = label || (typeof name === 'string' ? name : '');
                current = (dies as Map<number, Die>).get(numberAttribute(current, AT_TYPE) ?? -1);
                continue;
            case TAG_CONST:
            case TAG_VOLATILE:
                current = (dies as Map<number, Die>).get(numberAttribute(current, AT_TYPE) ?? -1);
                continue;
            case TAG_POINTER:
                return { kind: VesTypeKind.POINTER, name: label || 'pointer', byteSize: byteSize || 4 };
            case TAG_BASE: {
                const encoding = numberAttribute(current, AT_ENCODING);
                const display = label || (typeof name === 'string' ? name : 'base');
                return { kind: baseKind(encoding), name: display, byteSize };
            }
            case TAG_STRUCT: {
                const structName = typeof name === 'string' ? name : (label || 'struct');
                return {
                    kind: VesTypeKind.STRUCT,
                    name: structName,
                    byteSize,
                    struct: resolveStruct(structName, current, dies as Map<number, Die>, resolved),
                };
            }
            case TAG_ENUM:
                return { kind: VesTypeKind.UNSIGNED, name: label || (typeof name === 'string' ? name : 'enum'), byteSize };
            case TAG_ARRAY:
                return { kind: VesTypeKind.ARRAY, name: label || 'array', byteSize };
            case TAG_UNION:
                return { kind: VesTypeKind.OPAQUE, name: label || 'union', byteSize };
            default:
                return { ...unknown, name: label || unknown.name, byteSize };
        }
    }
    return unknown;
}

/**
 * Where a bitfield's low bit is, in bits from the start of the struct.
 *
 * DWARF describes a bitfield in one of two ways, and GCC picks by version
 * rather than by target. Version 4 added `DW_AT_data_bit_offset`, which is
 * already what is wanted: bits from the start of the struct, counted the way
 * the target orders them. Before that it used `DW_AT_bit_offset`, which counts
 * from the *most* significant bit of the storage unit the field sits in — so
 * on a little-endian target it has to be turned around, and the storage unit's
 * own size is what it is turned around within.
 */
function bitPosition(member: Die, offset: number, bitSize: number): number | undefined {
    const dataBitOffset = numberAttribute(member, AT_DATA_BIT_OFFSET);
    if (dataBitOffset !== undefined) {
        return dataBitOffset;
    }
    const fromTop = numberAttribute(member, AT_BIT_OFFSET);
    const storageBytes = numberAttribute(member, AT_BYTE_SIZE);
    if (fromTop === undefined || storageBytes === undefined) {
        return undefined;
    }
    return offset * 8 + (storageBytes * 8 - fromTop - bitSize);
}

function baseKind(encoding: number | undefined): VesTypeKind {
    switch (encoding) {
        case ATE_BOOLEAN: return VesTypeKind.BOOL;
        case ATE_FLOAT: return VesTypeKind.FLOAT;
        case ATE_SIGNED:
        case ATE_SIGNED_CHAR: return VesTypeKind.SIGNED;
        case ATE_UNSIGNED:
        case ATE_UNSIGNED_CHAR: return VesTypeKind.UNSIGNED;
        default: return VesTypeKind.OPAQUE;
    }
}

function numberAttribute(die: Die, attribute: number): number | undefined {
    const value = die.attributes.get(attribute);
    return typeof value === 'number' ? value : undefined;
}

/** An unsigned LEB128 and the offset past it. */
function uleb(bytes: Uint8Array, at: number): [number, number] {
    let result = 0;
    let shift = 0;
    for (let offset = at; offset < bytes.byteLength; offset++) {
        const byte = bytes[offset];
        // Beyond 28 bits the shift would overflow a 32-bit intermediate; the
        // values here — offsets and sizes — never come near it.
        result += (byte & 0x7f) * Math.pow(2, shift);
        shift += 7;
        if ((byte & 0x80) === 0) {
            return [result, offset + 1];
        }
    }
    return [result, bytes.byteLength];
}

/** A signed LEB128 and the offset past it. */
function sleb(bytes: Uint8Array, at: number): [number, number] {
    let result = 0;
    let shift = 0;
    for (let offset = at; offset < bytes.byteLength; offset++) {
        const byte = bytes[offset];
        result += (byte & 0x7f) * Math.pow(2, shift);
        shift += 7;
        if ((byte & 0x80) === 0) {
            if ((byte & 0x40) !== 0) {
                result -= Math.pow(2, shift);
            }
            return [result, offset + 1];
        }
    }
    return [result, bytes.byteLength];
}

/** A NUL-terminated string, and the offset past its terminator. */
function readCString(bytes: Uint8Array, at: number): [string, number] {
    let end = at;
    while (end < bytes.byteLength && bytes[end] !== 0) {
        end++;
    }
    return [String.fromCharCode(...bytes.subarray(at, end)), end + 1];
}

/** One field of a struct, decoded from an object's bytes. */
export interface VesFieldValue {
    /** The member's name, as the source calls it. */
    name: string;
    /** Qualified by its parents for a nested member: `transformation.position.x`. */
    path: string;
    /** How far in it is nested, for indenting a listing. */
    depth: number;
    /** Bytes from the start of the object. */
    offset: number;
    type: VesType;
    /** The decoded number, where the type decodes to one. */
    value?: number;
    /** What to show, always set. */
    text: string;
}

/** How far into nested structs the reader descends before it stops. */
const MAX_NESTING = 4;

/**
 * Decode an object, field by field, flattening nested structs into the list.
 *
 * A struct member is spliced in rather than summarised, so a `Transformation`
 * becomes `transformation.position.x` and so on: those leaves are the part
 * anyone reading an actor is actually after, and a line saying `position` is a
 * `Vector3D` says nothing they did not already know.
 *
 * @param bytes a window containing the object
 * @param at where the object starts within it
 */
export function readStructFields(
    struct: VesStruct, bytes: Uint8Array, at: number, depth = 0, prefix = ''
): VesFieldValue[] {
    const fields: VesFieldValue[] = [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    for (const member of struct.members) {
        const offset = at + member.offset;
        const path = prefix === '' ? member.name : `${prefix}.${member.name}`;

        if (member.type.kind === VesTypeKind.STRUCT && member.type.struct && depth < MAX_NESTING) {
            fields.push(...readStructFields(member.type.struct, bytes, offset, depth + 1, path));
            continue;
        }

        const value = readMemberValue(member, view, at, offset);
        fields.push({
            name: member.name,
            path,
            depth,
            offset: member.offset,
            type: member.type,
            value,
            text: formatValue(member, value),
        });
    }
    return fields;
}

/** The number at a member's position, or undefined if it is not a number. */
function readMemberValue(
    member: VesStructMember, view: DataView, structAt: number, offset: number
): number | undefined {
    if (member.bitSize !== undefined && member.bitOffset !== undefined) {
        return readBits(view, structAt, member.bitOffset, member.bitSize);
    }
    if (offset < 0 || offset + member.type.byteSize > view.byteLength) {
        return undefined;
    }

    const signed = member.type.kind === VesTypeKind.SIGNED;
    switch (member.type.kind) {
        case VesTypeKind.SIGNED:
        case VesTypeKind.UNSIGNED:
        case VesTypeKind.BOOL:
        case VesTypeKind.POINTER:
            switch (member.type.byteSize) {
                case 1: return signed ? view.getInt8(offset) : view.getUint8(offset);
                case 2: return signed ? view.getInt16(offset, true) : view.getUint16(offset, true);
                case 4: return signed ? view.getInt32(offset, true) : view.getUint32(offset, true) >>> 0;
                default: return undefined;
            }
        case VesTypeKind.FLOAT:
            return member.type.byteSize === 4 ? view.getFloat32(offset, true) : undefined;
        default:
            return undefined;
    }
}

/**
 * A run of bits out of the object.
 *
 * Read a byte at a time from the containing byte upwards, which keeps this
 * correct for a field that straddles a byte boundary without ever building a
 * number wider than the 32 bits a shift can hold.
 */
function readBits(view: DataView, structAt: number, bitOffset: number, bitSize: number): number | undefined {
    let result = 0;
    for (let bit = 0; bit < bitSize; bit++) {
        const absolute = bitOffset + bit;
        const at = structAt + (absolute >> 3);
        if (at < 0 || at >= view.byteLength) {
            return undefined;
        }
        if ((view.getUint8(at) >> (absolute & 7)) & 1) {
            result += Math.pow(2, bit);
        }
    }
    return result;
}

/** What a decoded field should read as. */
function formatValue(member: VesStructMember, value: number | undefined): string {
    if (value === undefined) {
        return '—';
    }
    if (member.bitSize === 1 || member.type.kind === VesTypeKind.BOOL) {
        return value !== 0 ? 'true' : 'false';
    }
    if (member.type.kind === VesTypeKind.POINTER) {
        // NULL is worth saying outright: it is a state, not an address.
        return value === 0 ? 'NULL' : `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
    }
    if (member.type.kind === VesTypeKind.FLOAT) {
        return String(Math.round(value * 1000) / 1000);
    }
    return String(value);
}
