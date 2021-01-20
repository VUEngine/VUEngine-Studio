import { TerminalProcessOptions } from "@theia/process/lib/node";

export const workspacePath = '/services/ves/process';

export const VesProcessService = Symbol('VesProcessService');
export interface VesProcessService {
    launchProcess(options: TerminalProcessOptions): Promise<number>;
}
