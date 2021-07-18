import { injectable, postConstruct, inject } from 'inversify';
import { Event, Emitter } from '@theia/core';

import { VesFlashCartUsbService } from '../common/ves-flash-cart-usb-service-protocol';

@injectable()
export class VesFlashCartUsbWatcher {
    public readonly onAttachEmitter = new Emitter<void>();
    public readonly onAttach: Event<void> = this.onAttachEmitter.event;
    public readonly onDetachEmitter = new Emitter<void>();
    public readonly onDetach: Event<void> = this.onDetachEmitter.event;

    @inject(VesFlashCartUsbService) protected readonly server: VesFlashCartUsbService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.server.setClient({
            onAttach: () => this.onAttachEmitter.fire(),
            onDetach: () => this.onDetachEmitter.fire(),
        });
    }
}
