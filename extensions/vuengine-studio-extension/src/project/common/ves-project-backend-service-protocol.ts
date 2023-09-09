export const VesProjectBackendService = Symbol('VesProjectBackendService');
export const VES_PROJECT_SERVICE_PATH = '/ves/services/project';

export interface VesProjectBackendService {
    replaceInFiles(files: string, from: string, to: string): Promise<Array<string>>
}
