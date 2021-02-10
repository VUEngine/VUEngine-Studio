import { injectable, postConstruct, inject } from "inversify";
import { Event, Emitter } from "@theia/core";
import { VesFlashCartService } from "../../../common/flash-cart-service-protocol";

@injectable()
export class VesFlashCartWatcher {
    public readonly onAttachEmitter = new Emitter<void>();
    public readonly onAttach: Event<void> = this.onAttachEmitter.event;
    public readonly onDetachEmitter = new Emitter<void>();
    public readonly onDetach: Event<void> = this.onDetachEmitter.event;

    @inject(VesFlashCartService) protected readonly server: VesFlashCartService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.server.setClient({
            onAttach: () => this.onAttachEmitter.fire(),
            onDetach: () => this.onDetachEmitter.fire(),
        });
    }
}