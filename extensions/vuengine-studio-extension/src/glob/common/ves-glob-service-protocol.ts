export const VesGlobService = Symbol('VesGlobService');
export const VES_GLOB_SERVICE_PATH = '/ves/services/glob';

export interface VesGlobService {
    find(base: string, pattern: string): Promise<Array<string>>
}
