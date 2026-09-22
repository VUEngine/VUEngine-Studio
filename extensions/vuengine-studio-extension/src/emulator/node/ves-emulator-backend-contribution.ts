import { BackendApplicationContribution } from '@theia/core/lib/node';
import { injectable } from '@theia/core/shared/inversify';
import * as express from 'express';
import * as path from 'path';
import { RETROACHIEVEMENTS_CLIENT } from 'vueport-core/lib/common/vb-constants';

const RA_ALLOWED_HOST = 'retroachievements.org';
const RA_MAX_BODY_BYTES = 1024 * 1024;

function isAllowedRaHost(host: string): boolean {
  const lowered = host.toLowerCase();
  return lowered === RA_ALLOWED_HOST || lowered.endsWith(`.${RA_ALLOWED_HOST}`);
}

@injectable()
export class EmulatorBackendContribution implements BackendApplicationContribution {

  async configure(app: express.Application): Promise<void> {
    app.use(
      '/emulator',
      express.static(
        path.join(__dirname, 'emulator'),
        { dotfiles: 'allow' }
      )
    );

    app.post(
      '/emulator/retroachievements',
      express.json({ limit: RA_MAX_BODY_BYTES }),
      (request, response) => this.relayToRetroAchievements(request, response)
    );
  }

  protected async relayToRetroAchievements(
    request: express.Request,
    response: express.Response
  ): Promise<void> {
    const { method, url, body, contentType } = request.body ?? {};
    if ((method !== 'GET' && method !== 'POST') || typeof url !== 'string') {
      response.status(400).type('text/plain').send('Expected a method and a url.');
      return;
    }

    let target: URL;
    try {
      target = new URL(url);
    } catch {
      response.status(400).type('text/plain').send('Not a url.');
      return;
    }
    if (target.protocol !== 'https:' || !isAllowedRaHost(target.hostname)) {
      response.status(403).type('text/plain').send('That host is not allowed.');
      return;
    }

    try {
      const relayed = await fetch(target, {
        method,
        headers: {
          'user-agent': RETROACHIEVEMENTS_CLIENT,
          ...(contentType ? { 'content-type': String(contentType) } : {}),
        },
        body: method === 'POST' && typeof body === 'string' ? body : undefined,
      });
      response.json({ status: relayed.status, body: await relayed.text() });
    } catch (error) {
      response.status(502).type('text/plain').send(
        `Could not reach RetroAchievements: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
