import { injectable } from '@theia/core/shared/inversify';
import { glob } from 'glob';
import { VesGlobService } from '../common/ves-glob-service-protocol';

@injectable()
export class VesGlobServiceImpl implements VesGlobService {
    find(base: string, pattern: string): Promise<Array<string>> {
        const results: Array<string> = [];
        const foundFiles = glob.sync(`${base}/${pattern}`);
        for (const foundFile of foundFiles) {
            results.push(foundFile);
        };

        return new Promise<Array<string>>(resolve => resolve(results));
    }
}
