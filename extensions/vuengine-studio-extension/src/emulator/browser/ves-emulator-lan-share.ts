import { Endpoint } from '@theia/core/lib/browser';
import { LanShareServerInfo, LanShareShell } from 'vueport-core/lib/browser/emulator-lan-share';

function route(name: string): string {
  return new Endpoint({ path: `/emulator/lan-share/${name}` }).getRestUrl().toString();
}

async function call(name: string, init: RequestInit): Promise<Response> {
  const response = await fetch(route(name), init);
  if (!response.ok) {
    throw new Error(await response.text().catch(() => '') || `${name} answered ${response.status}`);
  }
  return response;
}

export const vesLanShareShell: LanShareShell = {
  async start(name: string, rom: Uint8Array, web: string): Promise<LanShareServerInfo> {
    const response = await call('start', {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'x-vueport-name': encodeURIComponent(name),
        'x-vueport-web': encodeURIComponent(web),
      },
      body: rom as BodyInit,
    });
    return response.json();
  },
  async attach(kind: 'state' | 'thumbnail', bytes: Uint8Array | undefined): Promise<void> {
    await call('attach', {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream', 'x-vueport-kind': kind },
      body: (bytes ?? new Uint8Array(0)) as BodyInit,
    });
  },
  async info(): Promise<LanShareServerInfo | undefined> {
    const response = await call('info', { method: 'GET' });
    return await response.json() ?? undefined;
  },
  async stop(): Promise<void> {
    await call('stop', { method: 'POST' });
  },
};
