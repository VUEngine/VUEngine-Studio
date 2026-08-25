import { BackendApplicationContribution } from '@theia/core/lib/node';
import { injectable } from '@theia/core/shared/inversify';
import * as express from 'express';
import * as path from 'path';

@injectable()
export class EmulatorBackendContribution implements BackendApplicationContribution {

  async configure(app: express.Application): Promise<void> {
    // The emulator core wasm is copied next to the bundled backend at build
    // time (see applications/electron/esbuild.mjs). Resolving it through the
    // vueport-core package instead would break once packaged, because packaged
    // builds exclude node_modules.
    app.use(
      '/emulator',
      express.static(
        path.join(__dirname, 'emulator'),
        { dotfiles: 'allow' }
      )
    );
  }
}
