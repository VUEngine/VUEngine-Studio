import { crc32 } from 'crc';
import { getTrackKeyframes } from '../Other/templating';
import { SoundData, SUB_NOTE_RESOLUTION, TIMER_RESOLUTIONS, TIMER_RESOLUTION_DEFAULT, TrackSettings } from '../SoundEditorTypes';

// The sound player ROM does not get built for each sound. Its specs get written to its SRAM instead, laid out the way the engine's
// structs are, see the player's PlayerInterface.h. Which the player ROM's info block describes.

const PLAYER_INFO_MAGIC = 'VESPLAYR';

// the sizes of the engine's structs this serializer writes
const SIZE_OF_SOUND_SPEC = 28;
const SIZE_OF_VSU_SOUND_TRACK_SPEC = 48;
const SIZE_OF_SOUND_TRACK_KEYFRAME = 4;
const SIZE_OF_WAVEFORM_DATA = 36;

// the order in which the player ROM's info block lists the values of these enums
const SOUND_TRACK_EVENT_NAMES = [
    'kSoundTrackEventEnd',
    'kSoundTrackEventStart',
    'kSoundTrackEventSxINT',
    'kSoundTrackEventSxLRV',
    'kSoundTrackEventSxFQ',
    'kSoundTrackEventSxEV0',
    'kSoundTrackEventSxEV1',
    'kSoundTrackEventSxRAM',
    'kSoundTrackEventSxSWP',
    'kSoundTrackEventSxMOD',
    'kSoundTrackEventSweepMod',
    'kSoundTrackEventNoise',
];
const SOUND_GROUP_NAMES = ['none', 'general', 'effects', 'music', 'other'];

export interface PlayerRomInfo {
    // where the info block is in the ROM
    offset: number
    mailboxAddress: number
    dataAddress: number
    soundAllocator: number
    vsuSoundTrackAllocator: number
    soundComponentType: number
    // by enum name
    soundTrackEvents: Record<string, number>
    // by the sound's group
    soundGroups: Record<string, number>
}

// finds the info block of the sound player ROM, undefined if it is none
export const readPlayerRomInfo = (rom: ArrayBuffer): PlayerRomInfo | undefined => {
    const bytes = new Uint8Array(rom);
    const magic = new TextEncoder().encode(PLAYER_INFO_MAGIC);
    let offset = -1;
    for (let i = 0; i <= bytes.length - magic.length && offset === -1; i += 4) {
        if (magic.every((byte, j) => bytes[i + j] === byte)) {
            offset = i;
        }
    }
    if (offset === -1) {
        return;
    }

    const view = new DataView(rom, offset + magic.length);
    return {
        offset,
        mailboxAddress: view.getUint32(0, true),
        dataAddress: view.getUint32(4, true),
        soundAllocator: view.getUint32(8, true),
        vsuSoundTrackAllocator: view.getUint32(12, true),
        soundComponentType: view.getUint16(16, true),
        soundTrackEvents: Object.fromEntries(SOUND_TRACK_EVENT_NAMES.map((name, i) => [name, view.getUint16(18 + i * 2, true)])),
        soundGroups: Object.fromEntries(SOUND_GROUP_NAMES.map((name, i) => [name, view.getUint16(42 + i * 2, true)])),
    };
};

// writes little endian values at aligned addresses, growing as needed
class SpecWriter {
    protected bytes = new Uint8Array(4096);
    protected view = new DataView(this.bytes.buffer);
    protected length = 0;

    constructor(readonly baseAddress: number) { }

    // reserves room for a value, returns its address
    alloc(size: number, alignment: number): number {
        this.length = Math.ceil(this.length / alignment) * alignment;
        const offset = this.length;
        this.length += size;
        if (this.length > this.bytes.length) {
            const grown = new Uint8Array(Math.max(this.bytes.length * 2, this.length));
            grown.set(this.bytes);
            this.bytes = grown;
            this.view = new DataView(this.bytes.buffer);
        }

        return this.baseAddress + offset;
    }

    u8(address: number, value: number): void {
        this.view.setUint8(address - this.baseAddress, value & 0xFF);
    }

    u16(address: number, value: number): void {
        this.view.setUint16(address - this.baseAddress, value & 0xFFFF, true);
    }

    u32(address: number, value: number): void {
        this.view.setUint32(address - this.baseAddress, value >>> 0, true);
    }

    u8Array(values: number[]): number {
        const address = this.alloc(values.length, 1);
        values.forEach((v, i) => this.u8(address + i, v));
        return address;
    }

    u16Array(values: number[]): number {
        const address = this.alloc(values.length * 2, 2);
        values.forEach((v, i) => this.u16(address + i * 2, v));
        return address;
    }

    u32Array(values: number[]): number {
        const address = this.alloc(values.length * 4, 4);
        values.forEach((v, i) => this.u32(address + i * 4, v));
        return address;
    }

    string(value: string): number {
        return this.u8Array([...new TextEncoder().encode(value), 0]);
    }

    result(): Uint8Array {
        return this.bytes.slice(0, this.length);
    }
}

export interface SoundSpecOptions {
    // muted tracks and all but a solo track get left out
    trackSettings?: TrackSettings[]
    // a play range loops between its start and end, in columns
    playRangeStart?: number
    playRangeEnd?: number
}

export interface SerializedSoundSpec {
    data: Uint8Array
    // where the SoundSpec itself is
    soundSpecAddress: number
}

// the sound's specs, as the SoundSpec template renders them, laid out for the given address
export const serializeSoundSpec = (
    soundData: SoundData,
    player: PlayerRomInfo,
    address: number,
    options: SoundSpecOptions = {}
): SerializedSoundSpec => {
    const writer = new SpecWriter(address);
    const { trackSettings, playRangeStart = -1, playRangeEnd = -1 } = options;

    let totalSize = soundData.size * SUB_NOTE_RESOLUTION;
    let loopPoint = soundData.loopPoint;
    let playInLoop = soundData.loop;
    if (playRangeStart > -1) {
        loopPoint = playRangeStart;
        playInLoop = true;
        if (playRangeEnd > playRangeStart) {
            totalSize = playRangeEnd * SUB_NOTE_RESOLUTION;
        }
    }

    const soloTrack = trackSettings?.findIndex(ts => ts.solo) ?? -1;
    const includedTracks = soundData.tracks
        .map((track, trackId) => ({ track, trackId }))
        .filter(({ track, trackId }) =>
            Object.keys(track.sequence).length > 0 &&
            track.instrument !== '' &&
            !trackSettings?.[trackId]?.muted &&
            (soloTrack === -1 || soloTrack === trackId)
        );

    const usedInstruments = new Set<string>();
    includedTracks.forEach(({ track }) => {
        usedInstruments.add(track.instrument);
        Object.values(track.sequence).forEach(patternId => {
            Object.values(soundData.patterns[patternId]?.events ?? {}).forEach(step => {
                if (step.instrument !== undefined) {
                    usedInstruments.add(step.instrument);
                }
            });
        });
    });

    // waveforms and modulation data get shared by all instruments with the same ones
    const waveformRegistry: Record<string, number> = {};
    const waveformAddresses: Record<number, number> = {};
    const modulationDataRegistry: Record<string, number> = {};
    const modulationDataAddresses: Record<number, number> = {};
    Object.keys(soundData.instruments).forEach(instrumentId => {
        const instrument = soundData.instruments[instrumentId];
        const checksum = crc32(JSON.stringify(instrument.waveform));
        if (!usedInstruments.has(instrumentId) || waveformRegistry[checksum] !== undefined) {
            return;
        }
        const key = Object.keys(waveformRegistry).length + 1;
        waveformRegistry[checksum] = key;
        const waveformAddress = writer.alloc(SIZE_OF_WAVEFORM_DATA, 4);
        instrument.waveform.forEach((value, i) => writer.u8(waveformAddress + i, value));
        writer.u32(waveformAddress + 32, checksum);
        waveformAddresses[key] = waveformAddress;
    });
    Object.keys(soundData.instruments).forEach(instrumentId => {
        const instrument = soundData.instruments[instrumentId];
        const checksum = crc32(JSON.stringify(instrument.modulationData));
        if (!usedInstruments.has(instrumentId) || modulationDataRegistry[checksum] !== undefined) {
            return;
        }
        const key = Object.keys(modulationDataRegistry).length + 1;
        modulationDataRegistry[checksum] = key;
        modulationDataAddresses[key] = writer.u8Array(instrument.modulationData);
    });

    // the keyframes refer to waveforms and modulation data by the names the template gives them
    const SPEC_NAME = 'Spec';
    const referenceAddress = (reference: string, prefix: string, addresses: Record<number, number>): number => {
        if (reference === 'NULL') {
            return 0;
        }
        const key = parseInt(reference.replace(`${SPEC_NAME}${prefix}`, '').replace('&', ''));
        return addresses[key] ?? 0;
    };
    const values = (list: string[], whenEmpty: number[] = [0]): number[] => list.length
        ? list.map(v => Number(v))
        : whenEmpty;

    const trackAddresses = includedTracks.map(({ track }) => {
        const trackKeyframes = getTrackKeyframes(
            track,
            SPEC_NAME,
            totalSize,
            loopPoint,
            waveformRegistry as never,
            modulationDataRegistry as never,
            soundData
        );
        const v = trackKeyframes.values;

        const sxINT = writer.u8Array(values(v.SxINT));
        const sxLRV = writer.u8Array(values(v.SxLRV));
        const sxFQ = writer.u16Array(values(v.SxFQ));
        const sxEV0 = writer.u8Array(values(v.SxEV0));
        const sxEV1 = writer.u8Array(values(v.SxEV1));
        const sxRAM = writer.u32Array(v.SxRAM.length
            ? v.SxRAM.map(r => referenceAddress(r, 'Waveform', waveformAddresses))
            : [0]);
        const sxSWP = writer.u8Array(values(v.SxSWP));
        const sxMOD = writer.u32Array(v.SxMOD.length
            ? v.SxMOD.map(r => referenceAddress(r, 'ModulationData', modulationDataAddresses))
            : [0]);

        const keyframes = writer.alloc((trackKeyframes.keyframes.length + 1) * SIZE_OF_SOUND_TRACK_KEYFRAME, 2);
        trackKeyframes.keyframes.forEach((keyframe, i) => {
            writer.u16(keyframes + i * 4, keyframe.duration);
            writer.u16(keyframes + i * 4 + 2, keyframe.flags.reduce((flags, flag) => flags | (player.soundTrackEvents[flag] ?? 0), 0));
        });
        const endKeyframe = keyframes + trackKeyframes.keyframes.length * 4;
        writer.u16(endKeyframe, 0);
        writer.u16(endKeyframe + 2, player.soundTrackEvents.kSoundTrackEventEnd);

        const trackSpec = writer.alloc(SIZE_OF_VSU_SOUND_TRACK_SPEC, 4);
        writer.u32(trackSpec, player.vsuSoundTrackAllocator);
        writer.u8(trackSpec + 4, track.priority ?? 0);
        writer.u8(trackSpec + 5, Number(track.skippable ?? true));
        writer.u32(trackSpec + 8, trackKeyframes.loopKeyframe ?? 0);
        writer.u32(trackSpec + 12, keyframes);
        [sxINT, sxLRV, sxFQ, sxEV0, sxEV1, sxRAM, sxSWP, sxMOD].forEach((pointer, i) => writer.u32(trackSpec + 16 + i * 4, pointer));

        return trackSpec;
    });

    const tracks = writer.u32Array([...trackAddresses, 0]);
    const name = writer.string(soundData.name);
    const author = writer.string(soundData.author);

    const soundSpecAddress = writer.alloc(SIZE_OF_SOUND_SPEC, 4);
    writer.u32(soundSpecAddress, player.soundAllocator);
    writer.u16(soundSpecAddress + 4, player.soundComponentType);
    writer.u32(soundSpecAddress + 8, name);
    writer.u32(soundSpecAddress + 12, author);
    writer.u8(soundSpecAddress + 16, Number(playInLoop));
    writer.u16(soundSpecAddress + 18,
        (TIMER_RESOLUTIONS.includes(soundData.timerResolution) ? soundData.timerResolution : TIMER_RESOLUTION_DEFAULT) * 1000);
    writer.u32(soundSpecAddress + 20, tracks);
    writer.u32(soundSpecAddress + 24, player.soundGroups[soundData.group] ?? 0);

    return {
        data: writer.result(),
        soundSpecAddress,
    };
};

const VB_ROM_BASE = 0x07000000;
// the end of a ROM holds its header and the interrupt vectors
const ROM_END_RESERVED = 4096;
const INFO_AUTOPLAY_SOUND_SPEC = 60;
const INFO_AUTOPLAY_FLAGS = 64;

// a ROM that plays the sound at boot, for real hardware, too. The player ROM gets mirrored into one at least twice as large, as the
// emulators and flash carts do it anyway, and the sound gets placed after the first copy, without touching the end of the last one.
export const exportSoundRom = (playerRom: ArrayBuffer, soundData: SoundData): ArrayBuffer | undefined => {
    const player = readPlayerRomInfo(playerRom);
    if (!player) {
        return;
    }

    const address = VB_ROM_BASE + playerRom.byteLength;
    const spec = serializeSoundSpec(soundData, player, address);
    let size = playerRom.byteLength * 2;
    while (size - playerRom.byteLength - ROM_END_RESERVED < spec.data.length) {
        size *= 2;
    }

    const rom = new Uint8Array(size);
    for (let offset = 0; offset < size; offset += playerRom.byteLength) {
        rom.set(new Uint8Array(playerRom), offset);
    }
    rom.set(spec.data, playerRom.byteLength);
    const view = new DataView(rom.buffer);
    view.setUint32(player.offset + INFO_AUTOPLAY_SOUND_SPEC, spec.soundSpecAddress, true);
    view.setUint32(player.offset + INFO_AUTOPLAY_FLAGS, 0, true);

    return rom.buffer;
};
