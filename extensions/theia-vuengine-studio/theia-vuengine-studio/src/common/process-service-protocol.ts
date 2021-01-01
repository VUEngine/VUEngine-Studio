export const workspacePath = '/services/ves/process';

export const VesProcessService = Symbol('VesProcessService');
export interface VesProcessService {
    launchProcess(): Promise<void>;
}
