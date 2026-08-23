import { Emitter, Event } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import {
    decodeEsSoundMessage,
    describeEsSoundMessage,
    EsSoundCommand,
    esSoundBalance,
    esSoundFileName,
    EsSoundKind,
    esSoundKindOf,
    EsSoundMessage,
    esSoundTrackOf,
    esSoundVolume,
} from '../common/ves-emulator-essound';
import { VesVbSim } from './core/ves-vb-core';

/** One audio file found beside the ROM. */
export interface EsSoundTrack {
    id: number;
    kind: EsSoundKind;
    name: string;
    uri: URI;
    /** Bytes, for the panel to show. */
    size: number;
}

/** One halfword the game sent, kept for the history list. */
export interface EsSoundHistoryEntry {
    time: number;
    message: EsSoundMessage;
    description: string;
    /** Why nothing happened, when nothing did. */
    problem?: string;
}

/**
 * ESSound's part of a save state: what is playing, where, and the levels the
 * game has set.
 *
 * Kept as plain data so it can go into the save state file as JSON beside the
 * core's own state — the audio is played on this side, so the core knows
 * nothing about it and restoring a state would otherwise leave whatever was
 * playing before running on.
 */
export interface EsSoundSnapshot {
    playing: { kind: EsSoundKind, track: number, position: number, loop: boolean }[];
    volumes: [number, number][];
    balances: [number, number][];
}

/** How many commands the history keeps. */
export const ES_SOUND_HISTORY_LENGTH = 20;

/** What browsers will actually play a track at; beyond this they mute it. */
const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 4;

/** What the hardware falls back to before SET VOLUME or SET BALANCE is used. */
const DEFAULT_VOLUME = 1;
const DEFAULT_BALANCE = 0;

/**
 * One slot of the hardware: the MP3 player or the WAV player.
 *
 * ESSound can play one of each at a time, so a second PLAY on the same slot
 * replaces what it was playing rather than joining it.
 */
interface EsSoundSlot {
    track: number;
    element: HTMLAudioElement;
    gain: GainNode;
    panner: StereoPannerNode;
}

/**
 * ESSound playback for one emulator: the files beside the ROM, the commands
 * the game sends, and the audio they produce.
 *
 * Held by the widget rather than by the ESSound panel, because a game's audio
 * has to keep playing whether or not anyone has that panel open — the panel
 * only shows what this is doing.
 *
 * Files are read through the file service and played as blob URLs rather than
 * from `file://` directly, which the renderer will not load; each is read once
 * and kept, since a game asks for the same handful of tracks over and over.
 */
export class VesEmulatorEsSoundPlayer {

    protected tracks: EsSoundTrack[] = [];
    protected history: EsSoundHistoryEntry[] = [];
    protected sim: VesVbSim | undefined;
    protected muted = false;
    protected paused = false;
    protected rewinding = false;
    protected speed = 1;
    /** Emulated seconds given up by the rewind currently in progress. */
    protected rewound = 0;
    /** Set once the ROM has been looked at, so the panel can tell "none" from "not yet". */
    protected scanned = false;

    /** Per-track volume and balance, as set before or during playback. */
    protected readonly volumes = new Map<number, number>();
    protected readonly balances = new Map<number, number>();

    protected context: AudioContext | undefined;
    protected readonly slots = new Map<EsSoundKind, EsSoundSlot>();
    protected readonly sources = new Map<number, string>();

    protected readonly onDidChangeEmitter = new Emitter<void>();
    /** Fires when the files, the history or what is playing change. */
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    constructor(protected readonly fileService: FileService) { }

    get list(): ReadonlyArray<EsSoundTrack> {
        return this.tracks;
    }

    get commands(): ReadonlyArray<EsSoundHistoryEntry> {
        return this.history;
    }

    get isScanned(): boolean {
        return this.scanned;
    }

    /** Whether anything is worth watching the port for. */
    get hasTracks(): boolean {
        return this.tracks.length > 0;
    }

    /** The track each slot is playing, for the panel to mark. */
    get playing(): number[] {
        return [...this.slots.values()].map(slot => slot.track);
    }

    /**
     * Find the audio files beside a ROM.
     *
     * Which files exist is the whole configuration for now: a track id names a
     * file, and a file that is not there is a command that does nothing. A
     * later iteration will take the list from the project instead, and ignore
     * whatever happens to sit next to the ROM.
     */
    async scan(romUri: URI): Promise<void> {
        this.stopAll();
        this.releaseSources();
        this.tracks = [];
        try {
            const folder = await this.fileService.resolve(romUri.parent);
            for (const child of folder.children ?? []) {
                const id = child.isFile ? esSoundTrackOf(child.name) : undefined;
                const kind = id === undefined ? undefined : esSoundKindOf(id);
                if (id !== undefined && kind !== undefined) {
                    this.tracks.push({ id, kind, name: child.name, uri: child.resource, size: child.size ?? 0 });
                }
            }
            this.tracks.sort((one, other) => one.id - other.id);
            this.scanned = true;
        } catch (error) {
            console.warn(`[emulator] could not look for ESSound files beside ${romUri.toString()}:`, error);
            this.scanned = false;
        }
        this.onDidChangeEmitter.fire();
    }

    /**
     * The simulation to listen to, or undefined once it is gone.
     *
     * Watching the port costs the core a callback on every CPU write, so it is
     * only asked for when the ROM has files ESSound could play.
     */
    async setSim(sim: VesVbSim | undefined): Promise<void> {
        this.sim = sim;
        this.stopAll();
        await sim?.setEsSoundCapture(this.hasTracks);
    }

    /** Follows the emulator's own mute, since this plays alongside it. */
    setMuted(muted: boolean): void {
        this.muted = muted;
        this.slots.forEach(slot => this.applyLevels(slot));
    }

    /**
     * Follows the emulator's speed, pitch and all.
     *
     * Fast forward and slow motion change how fast the machine runs, so its
     * own audio comes out higher or lower; a track played at the same rate
     * does the same thing, which is why the pitch is deliberately not
     * preserved. Rates outside what browsers will play are clamped rather
     * than left to silence the track.
     */
    setSpeed(speed: number): void {
        this.speed = Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, speed));
        this.slots.forEach(slot => this.applySpeed(slot));
    }

    /**
     * Follows the emulator's rewind.
     *
     * Audio cannot be played backwards, so the tracks hold while the machine
     * walks back through its history and are then wound back by as much
     * emulated time as it gave up — one seek at the end rather than one per
     * step, since nothing is audible in between and seeking an MP3 sixty
     * times a second is not free.
     */
    setRewinding(rewinding: boolean): void {
        if (this.rewinding === rewinding) {
            return;
        }
        this.rewinding = rewinding;
        if (rewinding) {
            this.rewound = 0;
        } else {
            this.slots.forEach(slot => this.applyPosition(slot, this.rewound));
            this.rewound = 0;
        }
        this.slots.forEach(slot => this.applyPlayState(slot));
        this.onDidChangeEmitter.fire();
    }

    /** Emulated seconds the core has just walked back through. */
    rewind(seconds: number): void {
        this.rewound += seconds;
    }

    /**
     * Follows the emulator's own pause, for the same reason.
     *
     * Paused rather than stopped: the track keeps its position, so resuming
     * carries on where the game left off — and a track a paused emulator asks
     * for is made ready but not started, since nothing else about the machine
     * is running either.
     */
    setPaused(paused: boolean): void {
        if (this.paused === paused) {
            return;
        }
        this.paused = paused;
        this.slots.forEach(slot => this.applyPlayState(slot));
        this.onDidChangeEmitter.fire();
    }

    /** Whether a track should be running: only when the machine is. */
    protected get running(): boolean {
        return !this.paused && !this.rewinding;
    }

    /** What is playing and at what levels, for a save state to hold. */
    snapshot(): EsSoundSnapshot {
        return {
            playing: [...this.slots.entries()].map(([kind, slot]) => ({
                kind,
                track: slot.track,
                position: slot.element.currentTime,
                loop: slot.element.loop,
            })),
            volumes: [...this.volumes.entries()],
            balances: [...this.balances.entries()],
        };
    }

    /**
     * Put playback back as a snapshot found it.
     *
     * Restoring a state the game made before a track started is what stops the
     * previous track: everything currently playing goes first, whether or not
     * the snapshot has anything to put in its place.
     */
    restore(snapshot: EsSoundSnapshot): void {
        this.stopAll();
        this.volumes.clear();
        this.balances.clear();
        snapshot.volumes.forEach(([track, volume]) => this.volumes.set(track, volume));
        snapshot.balances.forEach(([track, balance]) => this.balances.set(track, balance));

        snapshot.playing.forEach(entry => {
            if (this.play(entry.track, entry.kind, entry.loop) === undefined) {
                this.seekWhenReady(entry.kind, entry.position);
            }
        });
        this.onDidChangeEmitter.fire();
    }

    /**
     * Put a restored track back where it was.
     *
     * The element has no source until its file has been read, and seeking one
     * that has nothing loaded throws, so this waits for the metadata.
     */
    protected seekWhenReady(kind: EsSoundKind, position: number): void {
        const slot = this.slots.get(kind);
        if (!slot || position <= 0) {
            return;
        }
        const element = slot.element;
        const seek = () => {
            if (this.slots.get(kind) === slot) {
                element.currentTime = position;
            }
        };
        if (element.readyState >= HTMLMediaElement.HAVE_METADATA) {
            seek();
        } else {
            element.addEventListener('loadedmetadata', seek, { once: true });
        }
    }

    /** Take one halfword the game wrote to the port. */
    handle(raw: number): void {
        const message = decodeEsSoundMessage(raw);
        const problem = this.apply(message);
        this.history.unshift({ time: Date.now(), message, description: describeEsSoundMessage(message), problem });
        this.history = this.history.slice(0, ES_SOUND_HISTORY_LENGTH);
        this.onDidChangeEmitter.fire();
    }

    /** Act on one message, and say why if it could not be acted on. */
    protected apply(message: EsSoundMessage): string | undefined {
        if (message.kind === 'init') {
            // Init resets the levels; the click a real cartridge makes here is
            // hardware behaviour rather than something worth reproducing.
            this.stopAll();
            this.volumes.clear();
            this.balances.clear();
            return undefined;
        }
        if (message.kind === 'stopAll') {
            this.stopAll();
            return undefined;
        }

        const kind = esSoundKindOf(message.track);
        if (!kind) {
            return `Track ${message.track} is outside both id ranges`;
        }

        switch (message.command) {
            case EsSoundCommand.PLAY:
            case EsSoundCommand.PLAY_LOOP:
                return this.play(message.track, kind, message.command === EsSoundCommand.PLAY_LOOP);
            case EsSoundCommand.STOP:
                this.stop(kind, message.track);
                return undefined;
            case EsSoundCommand.SET_VOLUME:
                this.volumes.set(message.track, esSoundVolume(message.value));
                this.refresh(message.track);
                return undefined;
            case EsSoundCommand.SET_BALANCE:
                this.balances.set(message.track, esSoundBalance(message.value));
                this.refresh(message.track);
                return undefined;
            default:
                return `Command ${message.command} is not one ESSound defines`;
        }
    }

    protected play(track: number, kind: EsSoundKind, loop: boolean): string | undefined {
        const found = this.tracks.find(candidate => candidate.id === track);
        if (!found) {
            return `${esSoundFileName(track)} is not beside the ROM`;
        }

        this.stop(kind);
        const context = this.audioContext();
        const element = new Audio();
        element.loop = loop;
        element.crossOrigin = 'anonymous';

        const slot: EsSoundSlot = {
            track,
            element,
            gain: context.createGain(),
            panner: context.createStereoPanner(),
        };
        context.createMediaElementSource(element).connect(slot.gain).connect(slot.panner).connect(context.destination);
        this.slots.set(kind, slot);
        this.applyLevels(slot);
        this.applySpeed(slot);

        // Reading the file is asynchronous, and the slot may have been taken
        // over by another track by the time it lands.
        this.sourceFor(found).then(source => {
            if (this.slots.get(kind) !== slot) {
                return;
            }
            element.src = source;
            // After the source, since loading one resets the rate.
            this.applySpeed(slot);
            this.applyPlayState(slot);
            this.onDidChangeEmitter.fire();
        }).catch(error => console.warn(`[emulator] ESSound could not read ${found.name}:`, error));

        return undefined;
    }

    /** Stop a slot, optionally only when it is playing one particular track. */
    protected stop(kind: EsSoundKind, track?: number): void {
        const slot = this.slots.get(kind);
        if (!slot || (track !== undefined && slot.track !== track)) {
            return;
        }
        slot.element.pause();
        slot.element.src = '';
        this.slots.delete(kind);
    }

    protected stopAll(): void {
        [...this.slots.keys()].forEach(kind => this.stop(kind));
        this.onDidChangeEmitter.fire();
    }

    /**
     * Start or hold a slot, according to whether the emulator is running.
     *
     * Autoplay is allowed here: the user started the emulator, and a failure
     * is worth reporting rather than swallowing.
     */
    protected applyPlayState(slot: EsSoundSlot): void {
        if (!this.running) {
            slot.element.pause();
        } else if (slot.element.src) {
            slot.element.play().catch(error =>
                console.warn('[emulator] ESSound could not play the current track:', error)
            );
        }
    }

    protected applySpeed(slot: EsSoundSlot): void {
        // Both, and not just the current rate: giving an element a source runs
        // the media load algorithm, which puts playbackRate back to
        // defaultPlaybackRate — so a track that starts while the emulator is
        // already fast forwarding would otherwise come out at normal speed.
        slot.element.defaultPlaybackRate = this.speed;
        slot.element.playbackRate = this.speed;
        // Not in every browser's typings, and off by default in some of them.
        (slot.element as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
    }

    /**
     * Wind one track back, wrapping round rather than sticking at the start
     * when it is looping — a rewind through a loop point should land where the
     * loop actually was.
     */
    protected applyPosition(slot: EsSoundSlot, seconds: number): void {
        if (seconds <= 0) {
            return;
        }
        const element = slot.element;
        const duration = element.duration;
        let position = element.currentTime - seconds;
        if (element.loop && Number.isFinite(duration) && duration > 0) {
            position = ((position % duration) + duration) % duration;
        }
        try {
            element.currentTime = Math.max(0, position);
        } catch (error) {
            // Seeking before the metadata has loaded throws; the track is
            // near its start anyway, which is where it would land.
            console.warn('[emulator] ESSound could not wind the track back:', error);
        }
    }

    /** Push a track's levels to it, if it happens to be the one playing. */
    protected refresh(track: number): void {
        this.slots.forEach(slot => {
            if (slot.track === track) {
                this.applyLevels(slot);
            }
        });
    }

    protected applyLevels(slot: EsSoundSlot): void {
        slot.gain.gain.value = this.muted ? 0 : this.volumes.get(slot.track) ?? DEFAULT_VOLUME;
        slot.panner.pan.value = this.balances.get(slot.track) ?? DEFAULT_BALANCE;
    }

    protected audioContext(): AudioContext {
        if (!this.context) {
            this.context = new AudioContext();
        }
        // A context created before the first gesture starts suspended.
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        return this.context;
    }

    /** The blob URL for a track's bytes, read once and kept. */
    protected async sourceFor(track: EsSoundTrack): Promise<string> {
        const existing = this.sources.get(track.id);
        if (existing) {
            return existing;
        }
        const content = await this.fileService.readFile(track.uri);
        // Copied into an ArrayBuffer of its own: the buffer behind the read
        // may be shared, which a Blob will not take.
        const bytes = new Uint8Array(content.value.buffer);
        const source = URL.createObjectURL(new Blob([bytes.slice().buffer], {
            type: track.kind === 'mp3' ? 'audio/mpeg' : 'audio/wav',
        }));
        this.sources.set(track.id, source);
        return source;
    }

    protected releaseSources(): void {
        this.sources.forEach(source => URL.revokeObjectURL(source));
        this.sources.clear();
    }

    dispose(): void {
        this.stopAll();
        this.releaseSources();
        this.context?.close();
        this.onDidChangeEmitter.dispose();
    }
}
