import { RpcServer } from '@theia/core';
import {
  IProcessExitEvent,
  ProcessErrorEvent,
  ProcessOptions,
} from '@theia/process/lib/node';

export const VES_PROCESS_SERVICE_PATH = '/ves/services/process';
export const VesProcessService = Symbol('VesProcessService');

export enum VesProcessType {
  Raw = 'raw',
  Terminal = 'terminal',
}

export interface VesProcessServiceClient {
  onDidReceiveErrorStreamData(pId: number, data: string): void;
  onDidReceiveOutputStreamData(pId: number, data: string): void;
  onDidReceiveError(pId: number, event: ProcessErrorEvent): void;
  onDidExitProcess(pId: number, event: IProcessExitEvent): void;
  onDidCloseProcess(pId: number, event: IProcessExitEvent): void;
}

export interface VesProcessService extends RpcServer<VesProcessServiceClient> {
  launchProcess(type: VesProcessType, options: ProcessOptions): Promise<{
    processManagerId: number;
    processId: number;
  }>;
  killProcess(processManagerId: number): boolean;
}
