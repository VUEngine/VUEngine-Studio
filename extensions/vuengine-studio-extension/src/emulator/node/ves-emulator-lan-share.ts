/*
 * Sharing the running game with a headset in the same network, as VUEPort Desktop does.
 *
 *   GET /<token>/                  what is shared, as JSON
 *   GET /<token>/rom/<name>        the ROM; the name only makes the address end in it
 *   GET /<token>/state             the save state, 404 without one
 *   GET /<token>/thumbnail.png     the thumbnail, 404 without one
 *   GET /                          a redirect to VUEPort Web with ?rom=[&state=] for this share, so typing
 *                                  "<address>:<port>" into a headset's browser is enough
 */

import { execFileSync } from 'child_process';
import { randomBytes } from 'crypto';
import * as http from 'http';
import { AddressInfo } from 'net';
import * as os from 'os';

const PREFERRED_PORT = 47913;
const DEFAULT_WEB = 'https://play.vueport.net/';

export interface LanShareInfo {
  token: string;
  port: number;
  // host:port, one per private IPv4 address
  addresses: string[];
  device: string;
}

interface Shared {
  token: string;
  name: string;
  web: string;
  rom: Buffer;
  state?: Buffer;
  thumbnail?: Buffer;
}

function isPrivate(address: string): boolean {
  const [a, b] = address.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

// this computer's private IPv4 addresses, home networks first; a VPN's are among them and simply do not answer
function privateAddresses(): string[] {
  const found = new Set<string>();
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal && isPrivate(entry.address)) {
        found.add(entry.address);
      }
    }
  }
  return [...found].sort((one, other) => Number(!one.startsWith('192.')) - Number(!other.startsWith('192.')));
}

// what the list in the headset calls this computer
function deviceName(): string {
  let name = '';
  if (process.platform === 'darwin') {
    try {
      name = execFileSync('scutil', ['--get', 'ComputerName'], { encoding: 'utf8', timeout: 2000 });
    } catch {
      // the host name below
    }
  }
  name ||= os.hostname().replace(/\.local$/, '');
  // eslint-disable-next-line no-control-regex
  name = Array.from(name.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 60).join('');
  return name || 'VUEngine Studio';
}

export class LanShareServer {

  protected shared: Shared | undefined;
  protected server: http.Server | undefined;
  protected port = 0;

  // a new token each time, so a headset still holding the last share's address does not get this one's game; any
  // state of the last share is dropped. Starts listening on first use
  async start(name: string, rom: Buffer, web: string | undefined): Promise<LanShareInfo> {
    if (rom.length === 0) {
      throw new Error('There is no ROM to share.');
    }
    const target = web && /^https?:\/\//.test(web) ? web : DEFAULT_WEB;
    this.shared = { token: randomBytes(12).toString('hex'), name, web: target, rom };
    if (!this.server) {
      await this.listen();
    }
    return this.info()!;
  }

  // a save state or its thumbnail for the running share
  attach(kind: string, bytes: Buffer): void {
    if (!this.shared) {
      throw new Error('Nothing is being shared.');
    }
    const value = bytes.length > 0 ? bytes : undefined;
    if (kind === 'state') {
      this.shared.state = value;
    } else if (kind === 'thumbnail') {
      this.shared.thumbnail = value;
    } else {
      throw new Error(`${kind} is nothing a share can hold`);
    }
  }

  // the addresses read again, as the computer may have changed networks since
  info(): LanShareInfo | undefined {
    if (!this.server || !this.shared) {
      return undefined;
    }
    return {
      token: this.shared.token,
      port: this.port,
      addresses: privateAddresses().map(address => `${address}:${this.port}`),
      device: deviceName(),
    };
  }

  stop(): void {
    this.shared = undefined;
    const server = this.server;
    this.server = undefined;
    server?.close();
    server?.closeAllConnections?.();
  }

  // on every interface, as the headset is elsewhere in the network; the preferred port where free, any otherwise
  protected async listen(): Promise<void> {
    const server = http.createServer((request, response) => this.serve(request, response));
    const bind = (port: number): Promise<void> => new Promise((resolve, reject) => {
      const failed = (error: Error): void => reject(error);
      server.once('error', failed);
      server.listen(port, '0.0.0.0', () => {
        server.off('error', failed);
        resolve();
      });
    });
    try {
      await bind(PREFERRED_PORT);
    } catch {
      await bind(0);
    }
    this.port = (server.address() as AddressInfo).port;
    this.server = server;
  }

  protected serve(request: http.IncomingMessage, response: http.ServerResponse): void {
    const origin = request.headers.origin;
    // any page may read a share, as only who has the token can name one; the private-network header answers the
    // preflight of Chrome's older Private Network Access
    const cors: Record<string, string> = {
      'Access-Control-Allow-Origin': typeof origin === 'string' ? origin : '*',
      'Vary': 'Origin',
      'Access-Control-Allow-Private-Network': 'true',
      'Cache-Control': 'no-store',
      'Connection': 'close',
    };
    const reply = (status: number, headers: Record<string, string>, body: Buffer = Buffer.alloc(0)): void => {
      response.writeHead(status, { ...cors, ...headers, 'Content-Length': String(body.length) });
      response.end(request.method === 'HEAD' ? undefined : body);
    };

    if (request.method === 'OPTIONS') {
      reply(204, {
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '600',
      });
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      reply(405, {});
      return;
    }
    const share = this.shared;
    if (!share) {
      reply(404, { 'Content-Type': 'text/plain' }, Buffer.from('Nothing is being shared.'));
      return;
    }

    const path = (request.url ?? '/').split('?')[0];
    if (path === '/') {
      const host = request.headers.host;
      if (!host || /[\r\n/@]/.test(host)) {
        reply(404, {});
        return;
      }
      const base = `http://${host}/${share.token}`;
      let target = `${share.web}?rom=${encodeURIComponent(`${base}/rom/${encodeURIComponent(share.name)}`)}`;
      if (share.state) {
        target += `&state=${encodeURIComponent(`${base}/state`)}`;
      }
      reply(302, { Location: target });
      return;
    }

    const [token, what = ''] = path.replace(/^\//, '').split('/');
    if (token !== share.token) {
      reply(404, {});
      return;
    }
    switch (what) {
      case '':
        reply(200, { 'Content-Type': 'application/json' }, Buffer.from(JSON.stringify({
          name: share.name,
          size: share.rom.length,
          state: share.state !== undefined,
          thumbnail: share.thumbnail !== undefined,
        })));
        return;
      case 'rom':
        reply(200, { 'Content-Type': 'application/octet-stream' }, share.rom);
        return;
      case 'state':
        if (share.state) {
          reply(200, { 'Content-Type': 'application/octet-stream' }, share.state);
          return;
        }
        break;
      case 'thumbnail.png':
        if (share.thumbnail) {
          reply(200, { 'Content-Type': 'image/png' }, share.thumbnail);
          return;
        }
        break;
    }
    reply(404, {});
  }
}
