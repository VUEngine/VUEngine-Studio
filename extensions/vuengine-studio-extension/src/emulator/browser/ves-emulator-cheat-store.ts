import { Emitter, Event } from '@theia/core';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import {
    enabledVesCheatCodes,
    parseVesCheatFile,
    serializeVesCheatFile,
    VesCheat,
    vesCheatCodeBytes,
} from '../common/ves-emulator-cheats';
import { VesVbSim } from './core/ves-vb-core';

/**
 * One emulator's cheats: the list, the file it lives in, and pushing the
 * enabled ones into the core.
 *
 * Held by the widget rather than by the Cheats panel, for two reasons: cheats
 * stay in effect while that panel is closed, and the file has to be loaded as
 * soon as the ROM is, whether or not anyone has opened the panel. The panel
 * edits through this and redraws on onDidChange.
 *
 * The file is `<rom>.cht` beside the ROM, the same convention save RAM
 * follows, in the format `ves-emulator-cheats.ts` documents — so cheats
 * written by RetroArch, or by hand from gamehacking.org, are picked up as they
 * are. It exists only while there are cheats to put in it: the first one
 * creates it and removing the last one deletes it, rather than leaving a file
 * saying there are none beside every ROM that was ever run.
 */
export class VesEmulatorCheatStore {

    protected cheats: VesCheat[] = [];
    protected sim: VesVbSim | undefined;
    protected uri: URI | undefined;
    /** Set once a file has been read, so a first save cannot precede a load. */
    protected loaded = false;
    /**
     * Saves run one after another rather than at once: an edit and the edit
     * undoing it are a write and a delete, and the wrong order would leave the
     * file behind.
     */
    protected persisting: Promise<void> = Promise.resolve();

    protected readonly onDidChangeEmitter = new Emitter<void>();
    /** Fires whenever the list changes, whatever changed it. */
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    constructor(protected readonly fileService: FileService) { }

    get list(): ReadonlyArray<VesCheat> {
        return this.cheats;
    }

    /** Where the cheats are stored, once a ROM is known. */
    get fileUri(): URI | undefined {
        return this.uri;
    }

    get isLoaded(): boolean {
        return this.loaded;
    }

    /** Read the file beside a ROM, replacing whatever was loaded before. */
    async load(romUri: URI): Promise<void> {
        this.uri = romUri.parent.resolve(`${romUri.path.name}.cht`);
        this.cheats = [];
        try {
            if (await this.fileService.exists(this.uri)) {
                this.cheats = parseVesCheatFile((await this.fileService.readFile(this.uri)).value.toString());
            }
            this.loaded = true;
        } catch (error) {
            // A cheat file that cannot be read is not worth failing a launch
            // over: the emulator runs, with no cheats, and says why.
            console.warn(`[emulator] could not read cheats from ${this.uri.toString()}:`, error);
            this.loaded = false;
        }
        this.changed(false);
    }

    /** The simulation the enabled cheats apply to, or undefined once it is gone. */
    setSim(sim: VesVbSim | undefined): void {
        this.sim = sim;
        this.apply();
    }

    add(description: string): number {
        this.cheats.push({ description, enabled: false, codes: [] });
        this.changed();
        return this.cheats.length - 1;
    }

    remove(index: number): void {
        if (this.cheats[index]) {
            this.cheats.splice(index, 1);
            this.changed();
        }
    }

    /** Change one cheat: its name, whether it is on, or its codes. */
    update(index: number, patch: Partial<VesCheat>): void {
        const cheat = this.cheats[index];
        if (cheat) {
            this.cheats[index] = { ...cheat, ...patch };
            this.changed();
        }
    }

    /**
     * Push the enabled writes into the core, replacing whatever was there.
     *
     * The core repeats them at every frame break for as long as they are set,
     * so this is the only call needed — there is no per-frame work on this
     * side at all.
     */
    protected apply(): void {
        this.sim?.setCheats(enabledVesCheatCodes(this.cheats).map(code => ({
            address: code.address,
            value: code.value,
            bytes: vesCheatCodeBytes(code),
        })));
    }

    /**
     * Write the file back, or take it away once the last cheat is gone.
     *
     * Saving on every edit is deliberate: a cheat is a few bytes of text, and
     * a list that quietly failed to outlive the window it was typed in would
     * be worse than a rare redundant write. A load that failed does not save,
     * so a file that could not be read is neither overwritten from an empty
     * list nor deleted.
     */
    protected async save(): Promise<void> {
        const uri = this.uri;
        if (!uri || !this.loaded) {
            return;
        }
        try {
            if (this.cheats.length === 0) {
                if (await this.fileService.exists(uri)) {
                    await this.fileService.delete(uri);
                }
                return;
            }
            await this.fileService.writeFile(uri, BinaryBuffer.fromString(serializeVesCheatFile(this.cheats)));
        } catch (error) {
            console.warn(`[emulator] could not store cheats in ${uri.toString()}:`, error);
        }
    }

    protected changed(persist = true): void {
        this.apply();
        if (persist) {
            this.persisting = this.persisting.then(() => this.save());
        }
        this.onDidChangeEmitter.fire();
    }

    dispose(): void {
        this.onDidChangeEmitter.dispose();
    }
}
