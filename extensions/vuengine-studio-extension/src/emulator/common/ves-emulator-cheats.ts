/**
 * Cheats, and the `.cht` files they live in.
 *
 * A cheat is a set of RAM writes the emulator repeats every frame, which is
 * what makes a value stay put however hard the game tries to change it — the
 * "RAM Write" codes gamehacking.org publishes for the Virtual Boy. A code is
 * written `ADDRESS:VALUE`, both hexadecimal, e.g. `50091A4:0001` for "write 1
 * to 0x050091A4 every frame". The number of digits in the value is how wide
 * the write is: two for a byte, four for a halfword, eight for a word.
 *
 * The file format is RetroArch's: a `cheats` count followed by `cheatN_desc`,
 * `cheatN_code` and `cheatN_enable` for each, with several codes in one cheat
 * separated by `+`. Reading is deliberately lenient — unknown keys, missing
 * quotes, a wrong or absent count, blank lines and `;` comments are all
 * tolerated — because these files are written by hand and by other tools as
 * often as by this one. Writing produces the canonical form.
 *
 * Everything here is pure, so it can be reasoned about, and tested, without a
 * running emulator or a file system.
 */

/** One `ADDRESS:VALUE` write. */
export interface VesCheatCode {
    /** Where to write, in the CPU's address space. */
    address: number;
    value: number;
    /** The value's width in hexadecimal digits: 2, 4 or 8. */
    digits: number;
}

export interface VesCheat {
    description: string;
    enabled: boolean;
    codes: VesCheatCode[];
}

/** The widths a code's value may be written at, and what they mean in bytes. */
export const VES_CHEAT_DIGITS = [2, 4, 8];
export const VES_CHEAT_DEFAULT_DIGITS = 4;

export function vesCheatCodeBytes(code: VesCheatCode): number {
    return Math.max(1, Math.min(4, code.digits / 2));
}

/** The largest value a code of this width can hold. */
export function vesCheatMaxValue(digits: number): number {
    return digits >= 8 ? 0xffffffff : (1 << (digits * 4)) - 1;
}

/**
 * Read one `ADDRESS:VALUE` code, or undefined if it is not one.
 *
 * The address is masked to 32 bits rather than rejected when it is longer,
 * since published codes routinely leave off leading zeroes and occasionally
 * carry a stray one.
 */
export function parseVesCheatCode(text: string): VesCheatCode | undefined {
    const match = /^\s*([0-9a-f]{1,8})\s*:\s*([0-9a-f]{1,8})\s*$/i.exec(text);
    if (!match) {
        return undefined;
    }
    const digits = match[2].length <= 2 ? 2 : match[2].length <= 4 ? 4 : 8;
    return {
        address: parseInt(match[1], 16) >>> 0,
        value: parseInt(match[2], 16) >>> 0,
        digits,
    };
}

export function formatVesCheatCode(code: VesCheatCode): string {
    const address = (code.address >>> 0).toString(16).toUpperCase();
    const value = (code.value >>> 0).toString(16).toUpperCase().padStart(code.digits, '0');
    return `${address}:${value}`;
}

/** All of a cheat's codes, in the `+`-separated form the file holds. */
export function formatVesCheatCodes(cheat: VesCheat): string {
    return cheat.codes.map(formatVesCheatCode).join('+');
}

/** Parse the `.cht` file next to a ROM. */
export function parseVesCheatFile(text: string): VesCheat[] {
    const values = new Map<string, string>();
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.length === 0 || trimmed.startsWith(';') || trimmed.startsWith('#')) {
            continue;
        }
        const separator = trimmed.indexOf('=');
        if (separator === -1) {
            continue;
        }
        const key = trimmed.slice(0, separator).trim().toLowerCase();
        const value = trimmed.slice(separator + 1).trim().replace(/^"(.*)"$/, '$1');
        values.set(key, value);
    }

    // The declared count is a hint rather than the authority: a file whose
    // count is stale or missing still has its entries read, and one that
    // overstates it does not produce empty cheats at the end.
    const declared = parseInt(values.get('cheats') ?? '', 10);
    const cheats: VesCheat[] = [];
    for (let index = 0; index < Math.max(Number.isNaN(declared) ? 0 : declared, values.size); index++) {
        const description = values.get(`cheat${index}_desc`);
        const code = values.get(`cheat${index}_code`);
        if (description === undefined && code === undefined) {
            continue;
        }
        cheats.push({
            description: description ?? '',
            enabled: (values.get(`cheat${index}_enable`) ?? 'false').toLowerCase() === 'true',
            codes: (code ?? '').split('+')
                .map(parseVesCheatCode)
                .filter((parsed): parsed is VesCheatCode => parsed !== undefined),
        });
    }
    return cheats;
}

export function serializeVesCheatFile(cheats: VesCheat[]): string {
    const lines = [`cheats = ${cheats.length}`];
    cheats.forEach((cheat, index) => {
        lines.push(
            '',
            `cheat${index}_desc = "${cheat.description.replace(/"/g, '')}"`,
            `cheat${index}_code = "${formatVesCheatCodes(cheat)}"`,
            `cheat${index}_enable = ${cheat.enabled}`
        );
    });
    return `${lines.join('\n')}\n`;
}

/** The writes the enabled cheats add up to, in the order they are listed. */
export function enabledVesCheatCodes(cheats: ReadonlyArray<VesCheat>): VesCheatCode[] {
    return cheats.filter(cheat => cheat.enabled).flatMap(cheat => cheat.codes);
}
