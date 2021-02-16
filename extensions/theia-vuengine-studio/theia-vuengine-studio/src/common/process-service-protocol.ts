import { JsonRpcServer } from "@theia/core";
import { IProcessExitEvent, TerminalProcessOptions } from "@theia/process/lib/node";

export const VES_PROCESS_SERVICE_PATH = '/ves/services/process';
export const VesProcessService = Symbol('VesProcessService');

export interface VesProcessServiceClient {
    onData(pId: number, data: string): void;
    onExit(pId: number, event: IProcessExitEvent): void;
    onClose(pId: number, event: IProcessExitEvent): void;
}

export interface VesProcessService extends JsonRpcServer<VesProcessServiceClient> {
    launchProcess(options: TerminalProcessOptions): Promise<{ terminalProcessId: number, processManagerId: number }>;
    killProcess(processManagerId: number): boolean;
}