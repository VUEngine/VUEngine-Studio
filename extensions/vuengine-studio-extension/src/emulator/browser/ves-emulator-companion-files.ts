import { CompanionRom, EmulatorCompanionFiles } from 'vueport-core/lib/browser/emulator-companion-files';
import { EmulatorCompanionLocation } from 'vueport-core/lib/common/emulator-sram';
import { VueportStorage } from 'vueport-core/lib/common/emulator-host';

export class VesEmulatorCompanionFiles extends EmulatorCompanionFiles {

    constructor(
        storage: VueportStorage,
        location: () => EmulatorCompanionLocation,
        protected readonly configRoot: () => string | undefined,
    ) {
        super(storage, location);
    }

    override directory(rom: CompanionRom): string {
        if (this.besideRom(rom)) {
            return super.directory(rom);
        }
        const root = this.configRoot();
        if (root === undefined) {
            return rom.location === undefined
                ? '' : this.storage.parent(rom.location);
        }
        return this.storage.join(
            this.storage.join(root, 'roms'), this.storage.stem(rom.name));
    }

    override globalMacros(): string {
        const root = this.configRoot();
        return root === undefined
            ? super.globalMacros()
            : this.storage.join(root, 'macros.vueport-macros.json');
    }

    override saveStateId(rom: CompanionRom, fileName: string): string | undefined {
        const id = super.saveStateId(rom, fileName);
        if (id !== undefined || this.besideRom(rom) || !fileName.endsWith('.state')) {
            return id;
        }
        const body = fileName.slice(0, -'.state'.length);
        const prefix = `${this.storage.stem(rom.name)}.`;
        return body.length > prefix.length && body.startsWith(prefix)
            ? body.slice(prefix.length)
            : undefined;
    }
}
