import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { Event, Emitter } from '@theia/core';
import { VesRumblePackUsbService } from '../common/ves-rumble-pack-usb-service-protocol';

@injectable()
export class VesRumblePackUsbWatcher {
    @inject(VesRumblePackUsbService)
    protected readonly server: VesRumblePackUsbService;

    public readonly onDidAttachDeviceEmitter = new Emitter<void>();
    public readonly onDidAttachDevice: Event<void> = this.onDidAttachDeviceEmitter.event;
    public readonly onDidDetachDeviceEmitter = new Emitter<void>();
    public readonly onDidDetachDevice: Event<void> = this.onDidDetachDeviceEmitter.event;
    public readonly onDidReceiveDataEmitter = new Emitter<string>();
    public readonly onDidReceiveData: Event<string> = this.onDidReceiveDataEmitter.event;

    @postConstruct()
    protected init(): void {
        this.server.setClient({
            onDidAttachDevice: () => this.onDidAttachDeviceEmitter.fire(),
            onDidDetachDevice: () => this.onDidDetachDeviceEmitter.fire(),
            onDidReceiveData: (data: string) => this.onDidReceiveDataEmitter.fire(data),
        });
    }
}
