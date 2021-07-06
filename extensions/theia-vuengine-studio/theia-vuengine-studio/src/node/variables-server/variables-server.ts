import { homedir } from 'os';
import { join as joinPath } from 'path';
import { injectable } from 'inversify';
import { FileUri } from '@theia/core/lib/node/file-uri'
import { EnvVariablesServerImpl } from '@theia/core/lib/node/env-variables';

@injectable()
export class VesEnvVariablesServer extends EnvVariablesServerImpl {
    protected async createConfigDirUri(): Promise<string> {
        return FileUri.create(process.env.THEIA_CONFIG_DIR || joinPath(homedir(), '.vuengine-studio')).toString();
    }
}