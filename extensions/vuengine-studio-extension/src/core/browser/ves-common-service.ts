import { isOSX, isWindows } from '@theia/core';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { customAlphabet } from 'nanoid';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';

@injectable()
export class VesCommonService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;

  @postConstruct()
  protected init(): void {
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    await this.determineIsWslInstalled();
  }

  isWslInstalled: boolean = false;

  getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  nanoid(): string {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);
    return nanoid();
  }

  getByKey(o: any, s: string): any {
    // convert indexes to properties
    s = s.replace(/\[(\w+)\]/g, '.$1');
    // strip leading dot
    s = s.replace(/^\./, '');
    const a = s.split('.');
    for (let i = 0, n = a.length; i < n; ++i) {
      const k = a[i];
      if (k in o) {
        o = o[k];
      } else {
        return '';
      }
    }
    return o;
  }

  async getResourcesUri(): Promise<URI> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value
      ? isWindows
        ? `/${envVar.value}`
        : envVar.value
      : '';

    return new URI(applicationPath).withScheme('file');
  }

  basename(path: string): string {
    return path.replace(/\\/g, '\/').split('/').pop() || '';
  }

  cleanSpecName(name: string): string {
    return name.replace(/[^A-Za-z0-9_]/g, '');
  }

  base64ToBytes(base64: string): Uint8Array {
    const binString = atob(base64);
    return Uint8Array.from(binString, m => m.codePointAt(0) ?? 0);
  }
  bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  async compressJson(data: any): Promise<string> {
    const stream = new Blob([JSON.stringify(data)], {
      type: 'application/json',
    }).stream();
    const compressedReadableStream = stream.pipeThrough(
      new CompressionStream('gzip')
    );
    const compressedResponse = new Response(compressedReadableStream);
    const blob = await compressedResponse.blob();
    const buffer = await blob.arrayBuffer();

    return this.bytesToBase64(new Uint8Array(buffer));
  }

  async uncompressJson(data: any): Promise<unknown> {
    if (typeof data !== 'string') {
      return data;
    }

    const compressed = this.base64ToBytes(data);
    const stream = new Blob([compressed], {
      type: 'application/json',
    }).stream();
    const compressedReadableStream = stream.pipeThrough(
      new DecompressionStream('gzip')
    );
    const resp = new Response(compressedReadableStream);
    const blob = await resp.blob();

    return JSON.parse(await blob.text());
  }

  protected async determineIsWslInstalled(): Promise<void> {
    if (!isWindows) {
      this.isWslInstalled = false;
      return;
    }

    const checkProcess = await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command: 'wsl.exe',
      args: ['--list', '--verbose']
    });

    await new Promise<void>((resolve, reject) => {
      this.vesProcessWatcher.onDidReceiveOutputStreamData(({ pId, data }) => {
        if (checkProcess.processManagerId === pId) {
          data = data.replace(/\0/g, ''); // clean of NUL characters
          this.isWslInstalled = data.includes('NAME') && data.includes('STATE') && data.includes('VERSION');
          resolve();
        }
      });
      this.vesProcessWatcher.onDidExitProcess(({ pId }) => {
        if (checkProcess.processManagerId === pId) {
          resolve();
        }
      });
    });
  }
}
