import { JsonRpcServer } from "@theia/core";
import {
  IProcessExitEvent,
  ProcessErrorEvent,
  ProcessOptions,
} from "@theia/process/lib/node";

export const VES_PROCESS_SERVICE_PATH = "/ves/services/process";
export const VesProcessService = Symbol("VesProcessService");

export interface VesProcessServiceClient {
  onData(pId: number, data: string): void;
  onError(pId: number, event: ProcessErrorEvent): void;
  onExit(pId: number, event: IProcessExitEvent): void;
  onClose(pId: number, event: IProcessExitEvent): void;
}

export interface VesProcessService
  extends JsonRpcServer<VesProcessServiceClient> {
  launchProcess(options: ProcessOptions): Promise<{
    processManagerId: number;
    processId: number;
  }>;
  killProcess(processManagerId: number): boolean;
}
