import { inject, injectable } from "inversify";
import { IProcessExitEvent, ProcessErrorEvent, TerminalProcessFactory, TerminalProcessOptions } from '@theia/process/lib/node';
import { VesProcessService, VesProcessServiceClient } from "../../common/process-service-protocol";

@injectable()
export class VesProcessServiceImpl implements VesProcessService {
    @inject(TerminalProcessFactory) protected readonly terminalProcessFactory: TerminalProcessFactory;
    protected client: VesProcessServiceClient | undefined;

    dispose(): void {
        throw new Error("Method not implemented.");
    }

    async setClient(client: VesProcessServiceClient) {
        this.client = client;
    }

    async launchProcess(options: TerminalProcessOptions): Promise<number> {
        const terminalProcess = this.terminalProcessFactory(options);
        await new Promise((resolve, reject) => {
            terminalProcess.onStart(resolve);
            terminalProcess.onError((error: ProcessErrorEvent) => console.log(error));
        });

        terminalProcess.onClose((event: IProcessExitEvent) => {
            this.client?.onClose(terminalProcess.id, event);
        });

        terminalProcess.onExit((event: IProcessExitEvent) => {
            this.client?.onExit(terminalProcess.id, event);
        });

        terminalProcess.outputStream.on('data', (data: string) => {
            this.client?.onData(terminalProcess.id, data.toString());
        });

        return terminalProcess.id;
    }
}