import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { Event, Emitter } from '@theia/core';
import { VesSocketService } from '../common/ves-socket-service-protocol';

@injectable()
export class VesSocketWatcher {
    protected readonly onDidReceiveDataEmitter = new Emitter<{ data: Buffer }>();
    public readonly onDidReceiveData: Event<{ data: Buffer }> = this.onDidReceiveDataEmitter.event;
    protected readonly onDidReceiveErrorEmitter = new Emitter<{ error: string }>();
    public readonly onDidReceiveError: Event<{ error: string }> = this.onDidReceiveErrorEmitter.event;
    protected readonly onDidConnectEmitter = new Emitter<{}>();
    public readonly onDidConnect: Event<{}> = this.onDidConnectEmitter.event;
    protected readonly onDidCloseEmitter = new Emitter<{}>();
    public readonly onDidClose: Event<{}> = this.onDidCloseEmitter.event;
    protected readonly onDidTransferChunkEmitter = new Emitter<{}>();
    public readonly onDidTransferChunk: Event<{}> = this.onDidTransferChunkEmitter.event;

    @inject(VesSocketService) protected readonly server: VesSocketService;

    @postConstruct()
    protected init(): void {
        // TODO: do we have to manually dispose event handlers when the respective sockets are closed?
        this.server.setClient({
            onDidReceiveData: (data: Buffer) => this.onDidReceiveDataEmitter.fire({ data }),
            onDidReceiveError: (error: string) => this.onDidReceiveErrorEmitter.fire({ error }),
            onDidConnect: () => this.onDidConnectEmitter.fire({}),
            onDidClose: () => this.onDidCloseEmitter.fire({}),
            onDidTransferChunk: () => this.onDidTransferChunkEmitter.fire({}),
        });
    }
}
