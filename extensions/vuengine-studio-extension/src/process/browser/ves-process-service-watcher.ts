import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { Event, Emitter } from '@theia/core';
import { IProcessExitEvent, ProcessErrorEvent } from '@theia/process/lib/node';
import { VesProcessService } from '../common/ves-process-service-protocol';

@injectable()
export class VesProcessWatcher {
    readonly onDidReceiveErrorStreamDataEmitter = new Emitter<{ pId: number, data: string }>();
    public readonly onDidReceiveErrorStreamData: Event<{ pId: number, data: string }> = this.onDidReceiveErrorStreamDataEmitter.event;
    readonly onDidReceiveOutputStreamDataEmitter = new Emitter<{ pId: number, data: string }>();
    public readonly onDidReceiveOutputStreamData: Event<{ pId: number, data: string }> = this.onDidReceiveOutputStreamDataEmitter.event;
    readonly onDidReceiveErrorEmitter = new Emitter<{ pId: number, event: ProcessErrorEvent }>();
    public readonly onDidReceiveError: Event<{ pId: number, event: ProcessErrorEvent }> = this.onDidReceiveErrorEmitter.event;
    readonly onDidExitProcessEmitter = new Emitter<{ pId: number, event: IProcessExitEvent }>();
    public readonly onDidExitProcess: Event<{ pId: number, event: IProcessExitEvent }> = this.onDidExitProcessEmitter.event;
    readonly onDidCloseProcessEmitter = new Emitter<{ pId: number, event: IProcessExitEvent }>();
    public readonly onDidCloseProcess: Event<{ pId: number, event: IProcessExitEvent }> = this.onDidCloseProcessEmitter.event;

    @inject(VesProcessService) protected readonly server: VesProcessService;

    @postConstruct()
    protected init(): void {
        // TODO: do we have to manually dispose event handlers when the respective processes are killed?
        this.server.setClient({
            onDidReceiveErrorStreamData: (pId: number, data: string) => this.onDidReceiveErrorStreamDataEmitter.fire({ pId, data }),
            onDidReceiveOutputStreamData: (pId: number, data: string) => this.onDidReceiveOutputStreamDataEmitter.fire({ pId, data }),
            onDidReceiveError: (pId: number, event: ProcessErrorEvent) => this.onDidReceiveErrorEmitter.fire({ pId, event }),
            onDidExitProcess: (pId: number, event: IProcessExitEvent) => this.onDidExitProcessEmitter.fire({ pId, event }),
            onDidCloseProcess: (pId: number, event: IProcessExitEvent) => this.onDidCloseProcessEmitter.fire({ pId, event }),
        });
    }
}
