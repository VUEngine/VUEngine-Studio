import { isOSX, isWindows, nls } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';

@injectable()
export class VesCommonService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
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

  basename(path: URI | string): string {
    if (typeof path !== 'string') {
      path = path.path.fsPath();
    }

    return path.replace(/\\/g, '\/').split('/').pop() || '';
  }

  cleanSpecName(name: string): string {
    return name
      ? name
        .replace(/[-\s]/g, '') // remove some
        .replace(/[^A-Za-z0-9_]/g, '') // remove all that are not of the given characters
        .replace(/^[0-9]+/, '_') // replace leading numbers
        .replace(/[_+]/g, '_') // replace multiple underscores by one
      : ';';
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

  async unzipJson(data: any): Promise<unknown> {
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

  isValidUrl(url: string): boolean {
    const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // ipv4
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!urlPattern.test(url);
  }

  getKeybindingLabel(
    commandId: string,
    wrapInBrackets: boolean = false
  ): string {
    const keybindings = this.keybindingRegistry.getKeybindingsForCommand(commandId);
    const keybindingAccelerators: string[] = [];
    keybindings.forEach(k => {
      if (k) {
        keybindingAccelerators.push(
          this.keybindingRegistry.acceleratorFor(k, '').join(', ')
            .replace(/\s/, nls.localize('vuengine/general/space', 'Space'))
            .replace(/\+/, nls.localize('vuengine/general/plus', 'Plus'))
        );
      }
    });

    let keybindingAccelerator = keybindingAccelerators.join(` ${nls.localize('vuengine/general/or', 'or')} `);
    if (wrapInBrackets && keybindingAccelerator !== '') {
      keybindingAccelerator = ` (${keybindingAccelerator})`;
    }

    return keybindingAccelerator;
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
