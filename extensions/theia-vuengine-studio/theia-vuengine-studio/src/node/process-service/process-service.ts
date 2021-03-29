import { inject, injectable } from "inversify";
import { IProcessExitEvent, ProcessErrorEvent, ProcessManager, TerminalProcessFactory, TerminalProcessOptions } from '@theia/process/lib/node';
import { VesProcessService, VesProcessServiceClient } from "../../common/process-service-protocol";

@injectable()
export class VesProcessServiceImpl implements VesProcessService {
    @inject(TerminalProcessFactory) protected readonly terminalProcessFactory: TerminalProcessFactory;
    @inject(ProcessManager) protected readonly processManager: ProcessManager;
    protected client: VesProcessServiceClient | undefined;

    dispose(): void {
        throw new Error("Method not implemented.");
    }

    async setClient(client: VesProcessServiceClient) {
        this.client = client;
    }

    async launchProcess(options: TerminalProcessOptions): Promise<{
        terminalProcessId: number,
        processManagerId: number,
        processId: number,
    }> {
        const terminalProcess = this.terminalProcessFactory(options);
        await new Promise((resolve, reject) => {
            terminalProcess.onStart(resolve);
            terminalProcess.onError((error: ProcessErrorEvent) => console.log(error));
        });

        const processManagerId = this.processManager.register(terminalProcess);

        terminalProcess.onClose((event: IProcessExitEvent) => {
            this.client?.onClose(processManagerId, event);
        });

        terminalProcess.onError((event: ProcessErrorEvent) => {
            this.client?.onError(processManagerId, event);
        });

        terminalProcess.onExit((event: IProcessExitEvent) => {
            this.client?.onExit(processManagerId, event);
        });

        terminalProcess.outputStream.on('data', (data: string) => {
            this.client?.onData(processManagerId, data.toString());
        });

        const process = this.processManager.get(processManagerId);

        return {
            terminalProcessId: terminalProcess.id,
            processManagerId: processManagerId,
            processId: process?.pid || -1,
        };
    }

    killProcess(processManagerId: number): boolean {
        const process = this.processManager.get(processManagerId);
        if (!process) {
            return false;
        }

        process.kill("SIGKILL");
        return true;
    }
}