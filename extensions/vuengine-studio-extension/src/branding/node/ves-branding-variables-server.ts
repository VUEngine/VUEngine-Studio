import { EnvVariablesServerImpl } from '@theia/core/lib/node/env-variables';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { injectable } from '@theia/core/shared/inversify';
import { homedir } from 'os';
import { join } from 'path';
import { VES_PREFERENCE_DIR } from '../browser/ves-branding-preference-configurations';

@injectable()
export class VesEnvVariablesServer extends EnvVariablesServerImpl {
    // change global settings directory
    protected async createConfigDirUri(): Promise<string> {
        return FileUri.create(process.env.THEIA_CONFIG_DIR || join(homedir(), VES_PREFERENCE_DIR)).toString();
    }
}
