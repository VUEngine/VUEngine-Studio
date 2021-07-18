import { inject, injectable } from 'inversify';
import {
  IProcessExitEvent,
  ProcessErrorEvent,
  ProcessManager,
  ProcessOptions,
  RawProcessFactory,
} from '@theia/process/lib/node';
import { VesProcessService, VesProcessServiceClient } from '../common/ves-process-service-protocol';

@injectable()
export class VesProcessServiceImpl implements VesProcessService {
  @inject(RawProcessFactory)
  protected readonly rawProcessFactory: RawProcessFactory;
  @inject(ProcessManager) protected readonly processManager: ProcessManager;
  protected client: VesProcessServiceClient | undefined;

  dispose(): void {
    throw new Error('Method not implemented.');
  }

  async setClient(client: VesProcessServiceClient): Promise<void> {
    this.client = client;
  }

  async launchProcess(options: ProcessOptions): Promise<{
    processManagerId: number;
    processId: number;
  }> {
    const rawProcess = this.rawProcessFactory(options);
    await new Promise((resolve, reject) => {
      rawProcess.onStart(resolve);
      rawProcess.onError((error: ProcessErrorEvent) => console.log(error));
    });

    const processManagerId = this.processManager.register(rawProcess);

    rawProcess.onClose((event: IProcessExitEvent) => {
      this.client?.onClose(processManagerId, event);
    });

    rawProcess.onError((event: ProcessErrorEvent) => {
      this.client?.onError(processManagerId, event);
    });

    rawProcess.onExit((event: IProcessExitEvent) => {
      this.client?.onExit(processManagerId, event);
    });

    rawProcess.outputStream.on('data', (chunk: any) => { /* eslint-disable-line */
      this.client?.onOutputStreamData(processManagerId, chunk.toString());
    });

    rawProcess.errorStream.on('data', (chunk: any) => { /* eslint-disable-line */
      this.client?.onErrorStreamData(processManagerId, chunk.toString());
    });

    const process = this.processManager.get(processManagerId);

    return {
      processManagerId: processManagerId,
      processId: process?.pid || -1,
    };
  }

  killProcess(processManagerId: number): boolean {
    const process = this.processManager.get(processManagerId);
    if (!process) {
      return false;
    }

    process.kill('SIGKILL');
    return true;
  }
}
