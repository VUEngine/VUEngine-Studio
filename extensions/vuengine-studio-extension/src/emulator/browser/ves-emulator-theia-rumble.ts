import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import { getRumblePackName } from '../../rumble-pack/browser/ves-rumble-pack-types';
import { Event } from 'vueport-core/lib/common/emulator-events';
import {
    EmulatedRumbleSpec,
    RumbleCommand,
    RumbleState,
    VueportRumblePack,
} from 'vueport-core/lib/common/emulator-rumble';

/**
 * The studio's rumble pack, as {@link VueportRumblePack}.
 *
 * A view onto `VesRumblePackService` rather than a copy of it: the service goes
 * on owning the serial port, the firmware flashing and the log, and this
 * exposes only the part the emulator drives. The protocol shapes either side
 * speaks are structurally identical, so nothing is converted crossing over.
 */
export class VesEmulatorTheiaRumblePack implements VueportRumblePack {

    constructor(protected readonly service: VesRumblePackService) { }

    get connected(): boolean {
        return this.service.connectedRumblePack !== undefined;
    }

    get deviceName(): string | undefined {
        const info = this.service.connectedRumblePack?.getInfo();
        return info && getRumblePackName(info);
    }

    get deviceIds(): { vendor?: number, product?: number } | undefined {
        const info = this.service.connectedRumblePack?.getInfo();
        return info && { vendor: info.usbVendorId, product: info.usbProductId };
    }

    get onDidChangeConnected(): Event<void> {
        return listener => this.service.onDidChangeConnectedRumblePack(() => listener(undefined));
    }

    async detect(): Promise<void> {
        await this.service.detectConnectedRumblePack();
    }

    get forwarding(): boolean {
        return this.service.emulatorForwarding;
    }

    set forwarding(forwarding: boolean) {
        this.service.emulatorForwarding = forwarding;
    }

    get emulatedSpec(): EmulatedRumbleSpec | undefined {
        return this.service.emulatedSpec;
    }

    set emulatedSpec(spec: EmulatedRumbleSpec | undefined) {
        this.service.emulatedSpec = spec;
    }

    get emulatedCommands(): RumbleCommand[] {
        return this.service.emulatedCommands;
    }

    get emulatedRumbleState(): RumbleState {
        return this.service.emulatedRumbleState;
    }

    get emulatedByteCount(): number {
        return this.service.emulatedByteCount;
    }

    get lastReply(): string | undefined {
        return [...this.service.rumblePackLog]
            .reverse()
            .find(line => line.text.trim() !== '')
            ?.text.trim();
    }

    clearEmulatedTraffic(): void {
        this.service.clearEmulatedTraffic();
    }

    async sendByte(byte: number): Promise<void> {
        await this.service.sendCommandEmulateVbByte(byte);
    }
}
