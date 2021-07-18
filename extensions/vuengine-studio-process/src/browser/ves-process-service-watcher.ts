import { injectable, postConstruct, inject } from 'inversify';
import { Event, Emitter } from '@theia/core';
import { IProcessExitEvent, ProcessErrorEvent } from '@theia/process/lib/node';

import { VesProcessService } from '../common/ves-process-service-protocol';

@injectable()
export class VesProcessWatcher {
    public readonly onErrorStreamDataEmitter = new Emitter<{ pId: number, data: string }>();
    public readonly onErrorStreamData: Event<{ pId: number, data: string }> = this.onErrorStreamDataEmitter.event;
    public readonly onOutputStreamDataEmitter = new Emitter<{ pId: number, data: string }>();
    public readonly onOutputStreamData: Event<{ pId: number, data: string }> = this.onOutputStreamDataEmitter.event;
    public readonly onErrorEmitter = new Emitter<{ pId: number, event: ProcessErrorEvent }>();
    public readonly onError: Event<{ pId: number, event: ProcessErrorEvent }> = this.onErrorEmitter.event;
    public readonly onExitEmitter = new Emitter<{ pId: number, event: IProcessExitEvent }>();
    public readonly onExit: Event<{ pId: number, event: IProcessExitEvent }> = this.onExitEmitter.event;
    public readonly onCloseEmitter = new Emitter<{ pId: number, event: IProcessExitEvent }>();
    public readonly onClose: Event<{ pId: number, event: IProcessExitEvent }> = this.onCloseEmitter.event;

    @inject(VesProcessService) protected readonly server: VesProcessService;

    @postConstruct()
    protected async init(): Promise<void> {
        // TODO: do we have to manually dispose event handlers when the respective processes are killed?
        this.server.setClient({
            onErrorStreamData: (pId: number, data: string) => this.onErrorStreamDataEmitter.fire({ pId, data }),
            onOutputStreamData: (pId: number, data: string) => this.onOutputStreamDataEmitter.fire({ pId, data }),
            onError: (pId: number, event: ProcessErrorEvent) => this.onErrorEmitter.fire({ pId, event }),
            onExit: (pId: number, event: IProcessExitEvent) => this.onExitEmitter.fire({ pId, event }),
            onClose: (pId: number, event: IProcessExitEvent) => this.onCloseEmitter.fire({ pId, event }),
        });
    }
}
