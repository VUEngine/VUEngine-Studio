/**
 * The line table a build carries, as a two-way index.
 *
 * A debugger needs both directions: a line to put a breakpoint at, and an
 * address to name in a stack frame. `.debug_line` holds both, but it is a
 * bytecode program rather than a table, so rather than interpret it this reads
 * what `v810-objdump --dwarf=decodedline` prints — a binary the toolchain
 * already ships. `v810-addr2line` is the wrong tool for this: it only goes one
 * way, and costs a process per lookup.
 *
 * Parsing `.debug_line` natively is the later upgrade, for when `is_stmt` and
 * end-of-sequence handling start to matter.
 */

/** One row: an address, and the source line that generated it. */
export interface VesLineEntry {
    /** Offset into the ROM, not an address — see `romOffsetOf`. */
    offset: number;
    file: string;
    line: number;
}

export interface VesLineTable {
    /** Every source file the table mentions, as mapped. */
    readonly files: string[];
    /** Rows, ordered by address, for resolving a program counter. */
    readonly entries: VesLineEntry[];
    /**
     * Where to put a breakpoint for a line: the lowest address generated for
     * it, or for the next line below it that generated any code at all.
     *
     * The fallback is what makes a breakpoint on a blank line, a comment or a
     * declaration land somewhere sensible instead of being rejected.
     */
    resolve(file: string, line: number): VesLineEntry | undefined;
    /** The source line an address belongs to, for naming a stack frame. */
    locate(offset: number): VesLineEntry | undefined;
}

/**
 * How far past a requested line a breakpoint may slide to find code.
 *
 * Enough to clear a comment block or a run of declarations, short enough that
 * a breakpoint never silently lands in the next function.
 */
const MAX_LINE_SLIDE = 25;

/** `CU: /path/to/file.c:` — starts a unit and sets the current file. */
const UNIT_PATTERN = /^CU:\s*(.*?):?\s*$/;
/** A bare `/path/to/file.h:`, switching files inside a unit. */
const FILE_PATTERN = /^(\/.*?|[A-Za-z]:[\\/].*?|[^\s:]+\.[ch]):\s*$/;
/** `Name.c   123   0x7000abc`, the rows themselves. */
const ROW_PATTERN = /^(\S+)\s+(\d+)\s+0x([0-9a-fA-F]+)\s*$/;

/**
 * The cartridge window, which is where a build's addresses are.
 *
 * The program counter is not: the Virtual Boy mirrors the cartridge across the
 * top of the address space and boots from 0xFFFFFFF0, so a running program
 * reports addresses like 0xFFFFFFC0 for code DWARF calls 0x070FFFC0. Comparing
 * the two literally never matches, so everything here is keyed by offset into
 * the ROM instead.
 */
const CART_WINDOW_MASK = 0x00ffffff;

/**
 * Where in the ROM an address points, whichever window it came through.
 *
 * @param romSize the ROM's size in bytes, which is what it mirrors at
 */
export function romOffsetOf(address: number, romSize: number): number {
    const withinWindow = (address >>> 0) & CART_WINDOW_MASK;
    return romSize > 0 ? withinWindow % romSize : withinWindow;
}

/**
 * Read `v810-objdump --dwarf=decodedline` output into an index.
 *
 * @param text the tool's stdout
 * @param romSize the ROM's size, for keying rows by offset
 * @param mapPath turns the path the build recorded into the one the user edits
 */
export function parseDecodedLineTable(
    text: string,
    romSize: number,
    mapPath: (recorded: string) => string = path => path
): VesLineTable {
    const entries: VesLineEntry[] = [];
    const files = new Set<string>();
    const mapped = new Map<string, string>();
    let current = '';

    for (const raw of text.split('\n')) {
        const line = raw.trimEnd();
        if (line === '') {
            continue;
        }

        const unit = UNIT_PATTERN.exec(line);
        const file = unit ? undefined : FILE_PATTERN.exec(line);
        if (unit || file) {
            const recorded = (unit?.[1] ?? file?.[1]) as string;
            let resolved = mapped.get(recorded);
            if (resolved === undefined) {
                resolved = mapPath(recorded);
                mapped.set(recorded, resolved);
            }
            current = resolved;
            files.add(current);
            continue;
        }

        const row = ROW_PATTERN.exec(line);
        // A row before any path line has nothing to attach to; the tool always
        // prints the unit first, so this only skips the column header.
        if (!row || current === '') {
            continue;
        }
        entries.push({
            offset: romOffsetOf(parseInt(row[3], 16), romSize),
            file: current,
            line: parseInt(row[2], 10),
        });
    }

    entries.sort((a, b) => a.offset - b.offset);

    // Lowest address per (file, line), which is where a breakpoint goes. A
    // line generates code in several places — a loop header, an inlined body —
    // and the first is the one that reads as "the line ran".
    const byLine = new Map<string, VesLineEntry>();
    for (const entry of entries) {
        const key = `${entry.file} ${entry.line}`;
        const existing = byLine.get(key);
        if (existing === undefined || entry.offset < existing.offset) {
            byLine.set(key, entry);
        }
    }

    return {
        files: [...files].sort(),
        entries,
        resolve(file: string, line: number): VesLineEntry | undefined {
            for (let at = line; at <= line + MAX_LINE_SLIDE; at++) {
                const found = byLine.get(`${file} ${at}`);
                if (found) {
                    return found;
                }
            }
            return undefined;
        },
        locate(offset: number): VesLineEntry | undefined {
            // The last row at or before the address: rows mark where a line's
            // code starts, so an address belongs to the row it follows.
            let low = 0;
            let high = entries.length - 1;
            let found: VesLineEntry | undefined;
            while (low <= high) {
                const middle = (low + high) >> 1;
                if (entries[middle].offset <= offset) {
                    found = entries[middle];
                    low = middle + 1;
                } else {
                    high = middle - 1;
                }
            }
            return found;
        },
    };
}

/** A part of a build — the game, the engine, or a plugin — and its sources. */
export interface VesSourceRoot {
    /** As the build names it, which is what appears in the generated path. */
    name: string;
    /** Absolute path the component's own `source/` sits under. */
    root: string;
}

/**
 * Turn the path a build recorded into the file someone can actually open.
 *
 * DWARF names the *generated* file — the Virtual C preprocessor's output under
 * `build/working` — rather than the source it came from. The same rewrite the
 * build already applies to compiler diagnostics (`processGCCOutput.sh`) undoes
 * it: everything up to and including `build/working/objects/<mode>/<component>`
 * or `build/working/headers/<component>` is replaced by that component's root.
 *
 * A build whose preprocessor emits `#line` directives records the original path
 * already, and those fall through this untouched — nothing matches.
 */
export function makeSourcePathMapper(roots: VesSourceRoot[]): (recorded: string) => string {
    // Longest name first, so a component whose name is a prefix of another's
    // cannot claim its paths.
    const ordered = [...roots].sort((a, b) => b.name.length - a.name.length);

    return recorded => {
        // Backslashes to slashes, and repeated slashes collapsed: the build
        // composes these paths by concatenation and leaves `//` behind in
        // places (`config.make` lists plugins as `vuengine//actors/...`), which
        // would otherwise be carried into a path nothing can open.
        const normalised = recorded.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
        for (const { name, root } of ordered) {
            const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(
                `^.*build/working/(?:objects/[a-z]+|headers)/${escaped}/(.*)$`
            );
            const match = pattern.exec(normalised);
            if (match) {
                return `${root.replace(/\/+$/, '')}/${match[1]}`.replace(/\/{2,}/g, '/');
            }
        }
        return recorded;
    };
}

/** Whether a build's paths still need mapping, or already name their sources. */
export function needsSourcePathMapping(text: string): boolean {
    return /build\/working\/(?:objects|headers)\//.test(text);
}
