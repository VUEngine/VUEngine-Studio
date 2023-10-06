import { injectable } from '@theia/core/shared/inversify';
import { WorkspaceFileService, WorkspaceFileType } from '@theia/workspace/lib/common';
import { VUENGINE_EXT } from '../browser/ves-project-types';

@injectable()
export class VesWorkspaceFileService extends WorkspaceFileService {
    getWorkspaceFileTypes(): WorkspaceFileType[] {
        return [{
            name: 'VUEngine Studio Project',
            extension: VUENGINE_EXT
        }];
    }
}
