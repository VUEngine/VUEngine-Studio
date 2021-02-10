import { injectable, postConstruct, inject } from "inversify";
import { Event, Emitter } from "@theia/core";
import { VesProcessService } from "../../../common/process-service-protocol";
import { IProcessExitEvent } from "@theia/process/lib/node";

@injectable()
export class VesProcessWatcher {
    public readonly onDataEmitter = new Emitter<{ pId: number, data: string }>();
    public readonly onData: Event<{ pId: number, data: string }> = this.onDataEmitter.event;
    public readonly onExitEmitter = new Emitter<{ pId: number, event: IProcessExitEvent }>();
    public readonly onExit: Event<{ pId: number, event: IProcessExitEvent }> = this.onExitEmitter.event;
    public readonly onCloseEmitter = new Emitter<{ pId: number, event: IProcessExitEvent }>();
    public readonly onClose: Event<{ pId: number, event: IProcessExitEvent }> = this.onCloseEmitter.event;

    @inject(VesProcessService) protected readonly server: VesProcessService;

    @postConstruct()
    protected async init(): Promise<void> {
        // TODO: do we have to manually dispose event handlers when the respective processes are killed?
        this.server.setClient({
            onData: (pId: number, data: string) => this.onDataEmitter.fire({ pId, data }),
            onExit: (pId: number, event: IProcessExitEvent) => this.onExitEmitter.fire({ pId, event }),
            onClose: (pId: number, event: IProcessExitEvent) => this.onCloseEmitter.fire({ pId, event }),
        });
    }
}