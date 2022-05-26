import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { MaybePromise } from '@theia/core';
import { CommonWorkspaceUtils } from '@theia/workspace/lib/common';

export const VUENGINE_EXT = 'vuengine';

@injectable()
export class VesCommonWorkspaceUtils extends CommonWorkspaceUtils {
    isWorkspaceFile(candidate: FileStat | URI): boolean {
        const uri = FileStat.is(candidate) ? candidate.resource : candidate;
        return uri.path.ext === `.${VUENGINE_EXT}`;
    }

    async getUntitledWorkspaceUri(configDirUri: URI, isAcceptable: (candidate: URI) => MaybePromise<boolean>, warnOnHits?: () => unknown): Promise<URI> {
        const parentDir = configDirUri.resolve('workspaces');
        let uri;
        let attempts = 0;
        do {
            attempts++;
            uri = parentDir.resolve(`Untitled-${Math.round(Math.random() * 1000)}.${VUENGINE_EXT}`);
            if (attempts === 10) {
                warnOnHits?.();
            }
            if (attempts === 50) {
                throw new Error('Workspace Service: too many attempts to find unused filename.');
            }
        } while (!(await isAcceptable(uri)));
        return uri;
    }
}
