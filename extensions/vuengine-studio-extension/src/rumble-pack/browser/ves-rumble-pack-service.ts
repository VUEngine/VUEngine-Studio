import { CommandService, MessageService, PreferenceService } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { EmulatedRumbleSpec, RumbleCommand, RumbleState, RumbleStreamDecoder } from './ves-rumble-pack-protocol';
import { isRumblePack, RUMBLE_PACK_FILTERS, RumblePakLogLine } from './ves-rumble-pack-types';

@injectable()
export class VesRumblePackService {
  @inject(CommandService)
  protected commandService!: CommandService;
  @inject(FileService)
  protected fileService!: FileService;
  @inject(MessageService)
  protected readonly messageService!: MessageService;
  @inject(PreferenceService)
  protected readonly preferenceService!: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService!: VesBuildService;
  @inject(VesCommonService)
  protected readonly vesCommonService!: VesCommonService;
  @inject(VesProcessService)
  protected readonly vesProcessService!: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher!: VesProcessWatcher;
  @inject(VesProjectService)
  protected readonly vesProjectsService!: VesProjectService;

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

  // link port traffic being forwarded from a running emulator
  protected _emulatorForwarding = false;
  protected readonly onDidChangeEmulatorForwardingEmitter = new Emitter<boolean>();
  readonly onDidChangeEmulatorForwarding = this.onDidChangeEmulatorForwardingEmitter.event;

  set emulatorForwarding(emulatorForwarding: boolean) {
    this._emulatorForwarding = emulatorForwarding;
    this.onDidChangeEmulatorForwardingEmitter.fire(this._emulatorForwarding);
  }
  get emulatorForwarding(): boolean {
    return this._emulatorForwarding;
  }

  protected _emulatedSpec: EmulatedRumbleSpec | undefined;
  set emulatedSpec(emulatedSpec: EmulatedRumbleSpec | undefined) {
    this._emulatedSpec = emulatedSpec;
  }
  get emulatedSpec(): EmulatedRumbleSpec | undefined {
    return this._emulatedSpec;
  }

  static readonly EMULATED_COMMAND_HISTORY_LENGTH = 16;
  protected _emulatedByteCount = 0;
  protected _emulatedCommands: RumbleCommand[] = [];

  protected readonly emulatedDecoder = new RumbleStreamDecoder();

  get emulatedByteCount(): number {
    return this._emulatedByteCount;
  }
  get emulatedCommands(): RumbleCommand[] {
    return this._emulatedCommands;
  }

  get emulatedRumbleState(): RumbleState {
    return this.emulatedDecoder.state;
  }

  clearEmulatedTraffic(): void {
    this._emulatedByteCount = 0;
    this._emulatedCommands = [];
    this._emulatedSpec = undefined;
    this.emulatedDecoder.reset();
  }

  // How long a candidate port gets to answer before it is ruled out
  protected static readonly HANDSHAKE_TIMEOUT_MS = 500;
  // How often a candidate is asked to identify itself before giving up on it
  protected static readonly HANDSHAKE_ATTEMPTS = 2;

  protected writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
  protected reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  protected bindEvents(): void {
    window.electronVesCore.onSerialDeviceChange(async () => this.detectConnectedRumblePack());
  }

  async detectConnectedRumblePack(): Promise<void> {
    try {
      await navigator.serial.requestPort({ filters: RUMBLE_PACK_FILTERS });
    } catch (error) {
    }

    // get all ports to look for a Rumble Pack (including bluetooth)
    const ports: SerialPort[] = await navigator.serial.getPorts();
    const candidates = ports.filter(isRumblePack);

    // nothing to do while the pack already being talked to is still there
    if (this._connectedRumblePack && candidates.includes(this._connectedRumblePack)) {
      return;
    }

    await this.disconnect();
    for (const candidate of candidates) {
      if (await this.connectIfRumblePack(candidate)) {
        return;
      }
    }
  };

  protected async connectIfRumblePack(port: SerialPort): Promise<boolean> {
    try {
      await port.open({
        baudRate: 115200,
        dataBits: 8,
        flowControl: 'none',
        parity: 'none',
        stopBits: 1,
      });
    } catch (error) {
      return false;
    }

    const writer = port.writable!.getWriter();
    const identified = await this.identify(port, writer).catch(() => false);
    if (!identified) {
      try {
        writer.releaseLock();
      } catch (error) {
        // device vanished mid-handshake
      }
      await port.close().catch(() => { });
      return false;
    }

    this.writer = writer;
    this.connectedRumblePack = port;
    this.startReader();
    return true;
  }

  // ask a port to identify itself, and report whether anything answered
  protected async identify(port: SerialPort, writer: WritableStreamDefaultWriter<Uint8Array>): Promise<boolean> {
    const reader = port.readable!.getReader();
    const response = reader.read();

    try {
      for (let attempt = 0; attempt < VesRumblePackService.HANDSHAKE_ATTEMPTS; attempt++) {
        await writer.write(new TextEncoder().encode('<VER>'));

        let timer: number | undefined;
        const chunk = await Promise.race([
          response,
          new Promise<undefined>(resolve => {
            timer = window.setTimeout(() => resolve(undefined), VesRumblePackService.HANDSHAKE_TIMEOUT_MS);
          }),
        ]);
        window.clearTimeout(timer);

        if (chunk === undefined) {
          continue;
        }
        if (chunk.done || !chunk.value?.length) {
          break;
        }

        this.appendToLog(new TextDecoder().decode(chunk.value));
        reader.releaseLock();
        return true;
      }
    } catch (error) {
      // device went away mid-handshake
    }

    // cancel a still outstanding read to get the lock back
    await reader.cancel().catch(() => { });
    reader.releaseLock();
    return false;
  }

  protected async disconnect(): Promise<void> {
    const port = this._connectedRumblePack;
    const reader = this.reader;
    const writer = this.writer;
    this.reader = undefined;
    this.writer = undefined;
    if (!port) {
      return;
    }
    this.connectedRumblePack = undefined;

    await reader?.cancel().catch(() => { });
    reader?.releaseLock();
    try {
      writer?.releaseLock();
    } catch (error) {
    }
    await port.close().catch(() => { });
  }

  async startReader(): Promise<void> {
    if (this.connectedRumblePack === undefined) {
      return;
    }
    const decoder = new TextDecoder();
    const reader = this.connectedRumblePack.readable!.getReader();
    this.reader = reader;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        this.appendToLog(decoder.decode(value));
      }
    } catch (error) {
    } finally {
      reader.releaseLock();
      if (this.reader === reader) {
        this.reader = undefined;
      }
    }
  }

  protected appendToLog(text: string): void {
    const parts = text.split('\n');
    if (this._rumblePackLog.length) {
      this._rumblePackLog[this._rumblePackLog.length - 1].text += parts.shift();
    }
    parts.map(part => {
      this._rumblePackLog.push({ timestamp: Date.now(), text: part });
    });
    // trigger event
    this.rumblePackLog = this._rumblePackLog;
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

  async sendCommandPlayLastEffect(): Promise<void> {
    return this.sendCommand('GO');
  }

  async sendCommandStopCurrentEffect(): Promise<void> {
    return this.sendCommand('STP');
  }

  async sendCommandPlayEffect(effect: number): Promise<void> {
    return this.sendCommand(`TEF ${(++effect).toString().padStart(3, '0')}`);
  }

  async sendCommandSetFrequency(frequency: number): Promise<void> {
    return this.sendCommand(`FRQ ${frequency.toString().padStart(3, '0')}`);
  }

  async sendCommandSetOverdrive(overdrive: number): Promise<void> {
    return this.sendCommand(`SCO ODC ${overdrive.toString().padStart(3, '0')}`);
  }

  async sendCommandSetPositiveSustain(sustain: number): Promise<void> {
    return this.sendCommand(`SCO SPT ${sustain.toString().padStart(3, '0')}`);
  }

  async sendCommandSetNegativeSustain(sustain: number): Promise<void> {
    return this.sendCommand(`SCO SNT ${sustain.toString().padStart(3, '0')}`);
  }

  async sendCommandSetBreak(breakValue: number): Promise<void> {
    return this.sendCommand(`SCO BRT ${breakValue.toString().padStart(3, '0')}`);
  }

  async sendCommandEmulateVbByte(byte: number): Promise<void> {
    this._emulatedByteCount++;
    const command = this.emulatedDecoder.push(byte);
    if (command) {
      this._emulatedCommands.push(command);
      if (this._emulatedCommands.length > VesRumblePackService.EMULATED_COMMAND_HISTORY_LENGTH) {
        this._emulatedCommands.shift();
      }
    }

    return this.sendCommand(`VB ${byte.toString().padStart(3, '0')}`);
  }
}
