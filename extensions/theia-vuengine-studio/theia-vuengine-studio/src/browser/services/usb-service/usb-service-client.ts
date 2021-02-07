import { injectable, postConstruct, inject } from "inversify";
import { Event, Emitter } from "@theia/core";
import { VesUsbService } from "../../../common/usb-service-protocol";
import { ConnectedFlashCart } from "../../flash-carts/commands/flash";

@injectable()
export class VesUsbServiceClient {
    public readonly onAttachEmitter = new Emitter<ConnectedFlashCart | undefined>();
    public readonly onAttach: Event<ConnectedFlashCart | undefined> = this.onAttachEmitter.event;
    public readonly onDetachEmitter = new Emitter<ConnectedFlashCart | undefined>();
    public readonly onDetach: Event<ConnectedFlashCart | undefined> = this.onDetachEmitter.event;

    @inject(VesUsbService) protected readonly server: VesUsbService | any; // TODO: nopes any

    @postConstruct()
    protected async init(): Promise<void> {
        this.server.setClient({
            onAttach: (connectedFlashCart: ConnectedFlashCart | undefined) => this.onAttachEmitter.fire(connectedFlashCart),
            onDetach: (connectedFlashCart: ConnectedFlashCart | undefined) => this.onDetachEmitter.fire(connectedFlashCart),
        });
    }
}