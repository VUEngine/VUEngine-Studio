import { isOSX, isWindows } from '@theia/core';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { customAlphabet } from 'nanoid';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { FileContent } from '@theia/filesystem/lib/common/files';
import { ImageData } from './ves-common-types';

@injectable()
export class VesCommonService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;

  @postConstruct()
  protected async init(): Promise<void> {
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

  async getResourcesUri(): Promise<URI> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value
      ? isWindows
        ? `/${envVar.value}`
        : envVar.value
      : '';

    return new URI(applicationPath).withScheme('file');
  }

  formatPath(path: string): string {
    return isWindows
      ? path.replace(/\//g, '\\') // replace slashes with backslashes
        .replace(/^\/|\/$/g, '') // remove leading and trailing slashes
        .replace(/^\\|\\$/g, '') // remove leading and trailing backslashes
        .replace(/^[a-z]:\\/, x => x.toUpperCase()) // uppercase drive number
      : path;
  }

  basename(path: string): string {
    return path.replace(/\\/g, '\/').split('/').pop() || '';
  }

  cleanSpecName(name: string): string {
    return name.replace(/[^A-Za-z0-9_]/g, '');
  }

  async parsePng(fileContent: FileContent): Promise<ImageData | false> {
    const PNG = require('@camoto/pngjs').PNG;
    let imageData: ImageData | false = false;

    await new Promise<void>((resolve, reject) => {
      new PNG().parse(fileContent.value.buffer, (error: unknown, data: unknown): void => {
        console.error(error, data);
        resolve();
      }).on('parsed', function (): void {
          // @ts-ignore: suppress implicit any errors
          const png = this;

          const height = png.height;
          const width = png.width;
          const colorType = png._parser._parser._colorType;
          const pixelDataBuffer = [...png._parser._inflate._outBuffer];

          const pixelData: number[][] = [];
          [...Array(height)].map((h, y) => {
              const line: number[] = [];
              [...Array(width)].map((w, x) => {
                // both +1 due to lines being prepended with an extra 0
                line.push(pixelDataBuffer[y * (width + 1) + x + 1]);
              });
              pixelData.push(line);
          });

          imageData = { height, width, colorType, pixelData };

          resolve();
      });
    });

    return imageData;
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
