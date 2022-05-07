import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { Event, Emitter } from '@theia/core';
import { VesFlashCartUsbService } from '../common/ves-flash-cart-usb-service-protocol';

@injectable()
export class VesFlashCartUsbWatcher {
    @inject(VesFlashCartUsbService)
    protected readonly server: VesFlashCartUsbService;

    public readonly onDidAttachDeviceEmitter = new Emitter<void>();
    public readonly onDidAttachDevice: Event<void> = this.onDidAttachDeviceEmitter.event;
    public readonly onDidDetachDeviceEmitter = new Emitter<void>();
    public readonly onDidDetachDevice: Event<void> = this.onDidDetachDeviceEmitter.event;

    @postConstruct()
    protected async init(): Promise<void> {
        this.server.setClient({
            onDidAttachDevice: () => this.onDidAttachDeviceEmitter.fire(),
            onDidDetachDevice: () => this.onDidDetachDeviceEmitter.fire(),
        });
    }
}
