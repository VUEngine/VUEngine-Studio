import * as express from 'express';
import { inject, injectable } from 'inversify';
import { join as joinPath } from 'path';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';

@injectable()
export class EmulatorBackendContribution implements BackendApplicationContribution {

    @inject(EnvVariablesServer)
    protected readonly envVariablesServer: EnvVariablesServer;

    async configure(app: express.Application): Promise<void> {
        app.use('/emulator', express.static(await this.getEmulatorPath(), { dotfiles: 'allow' }));
    }

    protected async getEmulatorPath(): Promise<string> {
        return joinPath(
            await this.getResourcesPath(),
            'binaries',
            'vuengine-studio-tools',
            'web',
            'retroarch'
        );
    }

    protected async getResourcesPath(): Promise<string> {
        const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
        const applicationPath = envVar && envVar.value ? envVar.value : '';
        return applicationPath;
    }
}
