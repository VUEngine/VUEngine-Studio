import { inject, injectable } from '@theia/core/shared/inversify';
import {
  IProcessExitEvent,
  ProcessErrorEvent,
  ProcessManager,
  ProcessOptions,
  RawProcessFactory,
  TerminalProcessFactory,
  TerminalProcessOptions
} from '@theia/process/lib/node';
import { VesProcessService, VesProcessServiceClient, VesProcessType } from '../common/ves-process-service-protocol';

@injectable()
export class VesProcessServiceImpl implements VesProcessService {
  @inject(RawProcessFactory)
  protected readonly rawProcessFactory: RawProcessFactory;
  @inject(TerminalProcessFactory)
  protected readonly terminalProcessFactory: TerminalProcessFactory;
  @inject(ProcessManager) protected readonly processManager: ProcessManager;
  protected client: VesProcessServiceClient | undefined;

  dispose(): void {
    throw new Error('Method not implemented.');
  }

  async setClient(client: VesProcessServiceClient): Promise<void> {
    this.client = client;
  }

  async launchProcess(type: VesProcessType, options: ProcessOptions | TerminalProcessOptions): Promise<{
    processManagerId: number;
    processId: number;
  }> {
    const newProcess = type === VesProcessType.Terminal
      ? this.terminalProcessFactory(options)
      : this.rawProcessFactory(options);
    await new Promise((resolve, reject) => {
      newProcess.onStart(resolve);
      newProcess.onError(resolve);
      newProcess.onClose(resolve);
    });

    const processManagerId = this.processManager.register(newProcess);

    newProcess.onClose((event: IProcessExitEvent) => {
      this.client?.onDidCloseProcess(processManagerId, event);
    });

    newProcess.onError((event: ProcessErrorEvent) => {
      this.client?.onDidReceiveError(processManagerId, event);
    });

    newProcess.onExit((event: IProcessExitEvent) => {
      this.client?.onDidExitProcess(processManagerId, event);
    });

    newProcess.outputStream.on('data', (chunk: any) => {
      this.client?.onDidReceiveOutputStreamData(processManagerId, chunk.toString());
    });

    newProcess.errorStream.on('data', (chunk: any) => {
      this.client?.onDidReceiveErrorStreamData(processManagerId, chunk.toString());
    });

    const process = this.processManager.get(processManagerId);

    return {
      processManagerId: processManagerId,
      processId: process?.id || -1,
    };
  }

  killProcess(processManagerId: number): boolean {
    const process = this.processManager.get(processManagerId);
    if (!process) {
      return false;
    }

    process.kill();
    return true;
  }
}
