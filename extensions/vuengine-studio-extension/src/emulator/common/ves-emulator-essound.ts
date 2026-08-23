/**
 * ESSound: the MP3/WAV expansion, and the halfwords that drive it.
 *
 * A game plays audio by storing one 16-bit value to VB_ES_SOUND_PORT. The
 * hardware reads it as three fields — a track, a command, and a value the
 * command interprets — with two whole-word values reserved for starting the
 * expansion and stopping everything:
 *
 *     bits 15..8  track id
 *     bits  7..4  command value
 *     bits  3..0  command
 *
 * Tracks are files beside the ROM, named by id: `1.mp3` to `100.mp3` and
 * `101.wav` to `254.wav`. The hardware plays at most one MP3 and one WAV at a
 * time, so those two are separate slots rather than a pool.
 *
 * Everything here is pure, and transcribed from the ESSound documentation
 * (ESSound_01.pdf) rather than from any implementation.
 */

/** The low nibble: what to do. */
export enum EsSoundCommand {
    STOP = 0x0,
    PLAY = 0x1,
    PLAY_LOOP = 0x2,
    SET_VOLUME = 0x3,
    SET_BALANCE = 0x4,
}

/**
 * The two halfwords that are commands in their own right rather than a
 * track/command/value triple.
 */
export const ES_SOUND_INIT = 0xffff;
export const ES_SOUND_STOP_ALL = 0x0000;

export const ES_SOUND_FIRST_MP3 = 1;
export const ES_SOUND_LAST_MP3 = 100;
export const ES_SOUND_FIRST_WAV = 101;
export const ES_SOUND_LAST_WAV = 254;

/** How many command values the volume and balance nibbles hold. */
export const ES_SOUND_LEVELS = 16;

export type EsSoundKind = 'mp3' | 'wav';

export type EsSoundMessage =
    /** `0xFFFF`: start the expansion, and reset volume and balance to default. */
    | { kind: 'init', raw: number }
    /** `0x0000`: stop everything, leaving the stored volume and balance alone. */
    | { kind: 'stopAll', raw: number }
    | { kind: 'command', raw: number, track: number, command: EsSoundCommand, value: number };

export function decodeEsSoundMessage(raw: number): EsSoundMessage {
    const word = raw & 0xffff;
    if (word === ES_SOUND_INIT) {
        return { kind: 'init', raw: word };
    }
    if (word === ES_SOUND_STOP_ALL) {
        return { kind: 'stopAll', raw: word };
    }
    return {
        kind: 'command',
        raw: word,
        track: (word >> 8) & 0xff,
        command: (word & 0x0f) as EsSoundCommand,
        value: (word >> 4) & 0x0f,
    };
}

/** Which kind of file a track id names, or undefined for one that names none. */
export function esSoundKindOf(track: number): EsSoundKind | undefined {
    if (track >= ES_SOUND_FIRST_MP3 && track <= ES_SOUND_LAST_MP3) {
        return 'mp3';
    }
    if (track >= ES_SOUND_FIRST_WAV && track <= ES_SOUND_LAST_WAV) {
        return 'wav';
    }
    return undefined;
}

/** The file a track id names, beside the ROM, or undefined for a bad id. */
export function esSoundFileName(track: number): string | undefined {
    const kind = esSoundKindOf(track);
    return kind ? `${track}.${kind}` : undefined;
}

/**
 * The track id a file name is for, or undefined when it is not one of ours.
 *
 * No leading zeroes: the hardware builds the name from the id, so `1.mp3` is
 * track 1 and `001.mp3` is a file it never looks for — reading it as track 1
 * as well would give one id two files.
 */
export function esSoundTrackOf(fileName: string): number | undefined {
    const match = /^([1-9]\d{0,2})\.(mp3|wav)$/i.exec(fileName);
    if (!match) {
        return undefined;
    }
    const track = parseInt(match[1], 10);
    return esSoundKindOf(track) === match[2].toLowerCase() ? track : undefined;
}

/** A command value as a gain, `0x0` silent through `0xF` full. */
export function esSoundVolume(value: number): number {
    return Math.min(ES_SOUND_LEVELS - 1, Math.max(0, value)) / (ES_SOUND_LEVELS - 1);
}

/**
 * A command value as a stereo position, -1 left through +1 right.
 *
 * The nibble runs the other way to the axis every audio API uses: `0x0` is
 * 100% right, `0x7` is centre, `0xF` is 100% left.
 */
export function esSoundBalance(value: number): number {
    const level = Math.min(ES_SOUND_LEVELS - 1, Math.max(0, value));
    return 1 - (level / (ES_SOUND_LEVELS - 1)) * 2;
}

export const ES_SOUND_COMMAND_NAMES: Record<number, string> = {
    [EsSoundCommand.STOP]: 'Stop',
    [EsSoundCommand.PLAY]: 'Play',
    [EsSoundCommand.PLAY_LOOP]: 'Play Loop',
    [EsSoundCommand.SET_VOLUME]: 'Set Volume',
    [EsSoundCommand.SET_BALANCE]: 'Set Balance',
};

/** One line of the history list: what the halfword asked for. */
export function describeEsSoundMessage(message: EsSoundMessage): string {
    if (message.kind === 'init') {
        return 'Init';
    }
    if (message.kind === 'stopAll') {
        return 'Stop All';
    }
    const name = ES_SOUND_COMMAND_NAMES[message.command] ?? `Command ${message.command}`;
    const file = esSoundFileName(message.track) ?? `track ${message.track}`;
    switch (message.command) {
        case EsSoundCommand.SET_VOLUME:
            return `${name} ${Math.round(esSoundVolume(message.value) * 100)}% — ${file}`;
        case EsSoundCommand.SET_BALANCE:
            return `${name} ${describeEsSoundBalance(message.value)} — ${file}`;
        default:
            return `${name} — ${file}`;
    }
}

export function describeEsSoundBalance(value: number): string {
    const balance = esSoundBalance(value);
    if (balance === 0) {
        return 'centre';
    }
    return `${Math.round(Math.abs(balance) * 100)}% ${balance < 0 ? 'L' : 'R'}`;
}
