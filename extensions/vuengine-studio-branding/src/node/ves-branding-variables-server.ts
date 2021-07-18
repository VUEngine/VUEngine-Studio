import { injectable } from 'inversify';
import { homedir } from 'os';
import { join as joinPath } from 'path';
import { EnvVariablesServerImpl } from '@theia/core/lib/node/env-variables';
import { FileUri } from '@theia/core/lib/node/file-uri';

@injectable()
export class VesEnvVariablesServer extends EnvVariablesServerImpl {
    // change global settings directory
    protected async createConfigDirUri(): Promise<string> {
        return FileUri.create(process.env.THEIA_CONFIG_DIR || joinPath(homedir(), '.vuengine-studio')).toString();
    }
}
