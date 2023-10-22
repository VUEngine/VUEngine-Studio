import * as path from 'path';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as express from 'express';
import { ApplicationPackage } from '@theia/core/shared/@theia/application-package';

@injectable()
export class EmulatorBackendContribution implements BackendApplicationContribution {

  @inject(ApplicationPackage)
  protected readonly applicationPackage: ApplicationPackage;
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;

  async configure(app: express.Application): Promise<void> {
    app.use('/emulator', express.static(path.join(this.applicationPackage.projectPath, 'binaries', 'vuengine-studio-tools', 'web', 'retroarch'), { dotfiles: 'allow' }));
  }
}
