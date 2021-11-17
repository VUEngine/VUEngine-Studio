import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { BackendApplicationContribution, FileUri } from '@theia/core/lib/node';
import * as express from 'express';
import { inject, injectable } from 'inversify';
import { join } from 'path';

@injectable()
export class EmulatorBackendContribution implements BackendApplicationContribution {

    @inject(EnvVariablesServer)
    protected readonly envVariablesServer: EnvVariablesServer;

    async configure(app: express.Application): Promise<void> {
        const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
        const applicationUri = new URI(envVar && envVar.value ? envVar.value : '');
        const emulatorUri = applicationUri.resolve(join(
            'binaries',
            'vuengine-studio-tools',
            'web',
            'retroarch'
        ));

        app.use('/emulator', express.static(FileUri.fsPath(emulatorUri), { dotfiles: 'allow' }));
    }
}
