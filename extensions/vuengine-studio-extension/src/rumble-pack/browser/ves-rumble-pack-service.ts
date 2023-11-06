import { PreferenceService } from '@theia/core/lib/browser';
import { CommandService, MessageService } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { RUMBLE_PACK_IDS, RumblePakLogLine } from './ves-rumble-pack-types';

@injectable()
export class VesRumblePackService {
  @inject(CommandService)
  protected commandService: CommandService;
  @inject(FileService)
  protected fileService: FileService;
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService: VesBuildService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(VesProjectService)
  protected readonly vesProjectsService: VesProjectService;

  // connected rumble pack
  protected _connectedRumblePack: SerialPort | undefined;
  protected readonly onDidChangeConnectedRumblePackEmitter = new Emitter<SerialPort | undefined>();
  readonly onDidChangeConnectedRumblePack = this.onDidChangeConnectedRumblePackEmitter.event;
  set connectedRumblePack(connectedRumblePack: SerialPort | undefined) {
    this._connectedRumblePack = connectedRumblePack;
    this.onDidChangeConnectedRumblePackEmitter.fire(this._connectedRumblePack);
  }
  get connectedRumblePack(): SerialPort | undefined {
    return this._connectedRumblePack;
  }

  // rumble pack log
  protected _rumblePackLog: RumblePakLogLine[] = [];
  protected readonly onDidChangeRumblePackLogEmitter = new Emitter<RumblePakLogLine[]>();
  readonly onDidChangeRumblePackLog = this.onDidChangeRumblePackLogEmitter.event;
  set rumblePackLog(rumblePackLog: RumblePakLogLine[]) {
    this._rumblePackLog = rumblePackLog;
    this.onDidChangeRumblePackLogEmitter.fire(this._rumblePackLog);
  }
  get rumblePackLog(): RumblePakLogLine[] {
    return this._rumblePackLog;
  }

  protected writer: WritableStreamDefaultWriter<Uint8Array> | undefined;

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  protected bindEvents(): void {
    window.electronVesCore.onSerialDeviceChange(async () => this.detectConnectedRumblePack());
  }

  async detectConnectedRumblePack(): Promise<void> {
    try {
      await navigator.serial.requestPort({ filters: RUMBLE_PACK_IDS });
    } catch (error) {
    }
    const ports: SerialPort[] = await navigator.serial.getPorts();
    if (ports.length) {
      const rumblePack = ports[0];
      await rumblePack.open({
        baudRate: 115200,
        dataBits: 8,
        flowControl: 'none',
        parity: 'none',
        stopBits: 1,
      });
      this.connectedRumblePack = rumblePack;
      this.writer = this.connectedRumblePack.writable!.getWriter();
      this.startReader();
    } else {
      this.connectedRumblePack = undefined;
      this.writer = undefined;
    }
  };

  async startReader(): Promise<void> {
    if (this.connectedRumblePack !== undefined) {
      const decoder = new TextDecoder();
      const reader = this.connectedRumblePack.readable!.getReader();
      try {
        while (true) {
          const { value } = await reader.read();
          const returnValueParts = decoder.decode(value).split('\n');
          if (this._rumblePackLog.length) {
            this._rumblePackLog[this._rumblePackLog.length - 1].text += returnValueParts.shift();
          }
          returnValueParts.map(returnValuePart =>
            this.rumblePackLog.push({ timestamp: Date.now(), text: returnValuePart })
          );
          // trigger event
          this.rumblePackLog = this.rumblePackLog;
        }
      } catch (error) {
      } finally {
        reader.releaseLock();
      }
    }
  }

  async sendCommand(command: string): Promise<void> {
    const preparedCommand = `<${command}>`;
    if (this.connectedRumblePack !== undefined) {
      await this.writer!.write(new TextEncoder().encode(preparedCommand));
    }
  }

  async sendCommandPrintMenu(): Promise<void> {
    return this.sendCommand('PM');
  }

  async sendCommandPrintVersion(): Promise<void> {
    return this.sendCommand('VER');
  }

  async sendCommandPrintVbCommandLineState(): Promise<void> {
    return this.sendCommand('VBC');
  }

  async sendCommandPrintVbSyncLineState(): Promise<void> {
    return this.sendCommand('VBS');
  }

  async sendCommandPlayLastEffect(): Promise<void> {
    return this.sendCommand('GO');
  }

  async sendCommandStopCurrentEffect(): Promise<void> {
    return this.sendCommand('STP');
  }

  async sendCommandPlayEffect(effect: number): Promise<void> {
    return this.sendCommand(`HAP ${(++effect).toString().padStart(3, '0')}`);
  }

  async sendCommandSetFrequency(frequency: number): Promise<void> {
    return this.sendCommand(`FRQ ${frequency.toString().padStart(3, '0')}`);
  }

  async sendCommandSetOverdrive(overdrive: number): Promise<void> {
    return this.sendCommand(`ODT ${overdrive.toString().padStart(3, '0')}`);
  }

  async sendCommandSetPositiveSustain(sustain: number): Promise<void> {
    return this.sendCommand(`SPT ${sustain.toString().padStart(3, '0')}`);
  }

  async sendCommandSetNegativeSustain(sustain: number): Promise<void> {
    return this.sendCommand(`SNT ${sustain.toString().padStart(3, '0')}`);
  }

  async sendCommandSetBreak(breakValue: number): Promise<void> {
    return this.sendCommand(`BRT ${breakValue.toString().padStart(3, '0')}`);
  }

  async sendCommandEmulateVbByte(byte: string): Promise<void> {
    return this.sendCommand(`VB ${byte}`);
  }
}
