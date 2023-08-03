import { JsonSchemaRegisterContext } from '@theia/core/lib/browser/json-schema-store';
import { injectable } from '@theia/core/shared/inversify';
import { WorkspaceSchemaUpdater } from '@theia/workspace/lib/browser/workspace-schema-updater';
import { VUENGINE_EXT } from '../ves-project-types';

@injectable()
export class VesWorkspaceSchemaUpdater extends WorkspaceSchemaUpdater {
    registerSchemas(context: JsonSchemaRegisterContext): void {
        context.registerSchema({
            fileMatch: [`*.${VUENGINE_EXT}`],
            url: this.uri.toString()
        });
    }
}
