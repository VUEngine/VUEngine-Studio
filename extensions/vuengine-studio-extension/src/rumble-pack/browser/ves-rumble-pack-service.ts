import { ApplicationShell, PreferenceService } from '@theia/core/lib/browser';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { CommandService, MessageService } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';
import { HapticBuiltInEffect, HapticFrequency, RumblePakLogLine } from '../common/ves-rumble-pack-types';
import { VesRumblePackUsbService } from '../common/ves-rumble-pack-usb-service-protocol';
import { VesRumblePackUsbWatcher } from './ves-rumble-pack-usb-watcher';

@injectable()
export class VesRumblePackService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(CommandService)
  protected commandService: CommandService;
  @inject(FileService)
  protected fileService: FileService;
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService: VesBuildService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesRumblePackUsbService)
  protected readonly vesRumblePackUsbService: VesRumblePackUsbService;
  @inject(VesRumblePackUsbWatcher)
  protected readonly vesRumblePackUsbWatcher: VesRumblePackUsbWatcher;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(VesProjectsService)
  protected readonly vesProjectsService: VesProjectsService;

  // connected rumble pack
  protected _rumblePackIsConnected: boolean = false;
  protected readonly onDidChangeRumblePackIsConnectedEmitter = new Emitter<boolean>();
  readonly onDidChangeRumblePackIsConnected = this.onDidChangeRumblePackIsConnectedEmitter.event;
  set rumblePackIsConnected(rumblePackIsConnected: boolean) {
    this._rumblePackIsConnected = rumblePackIsConnected;
    this.onDidChangeRumblePackIsConnectedEmitter.fire(this._rumblePackIsConnected);
  }
  get rumblePackIsConnected(): boolean {
    return this._rumblePackIsConnected;
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

  @postConstruct()
  protected async init(): Promise<void> {
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.frontendApplicationStateService.onStateChanged(
      async (state: FrontendApplicationState) => {
        if (state === 'attached_shell') {
          this.detectRumblePackIsConnected();
        }
      }
    );

    // watch for rumble pack events
    this.vesRumblePackUsbWatcher.onDidAttachDevice(async () => this.detectRumblePackIsConnected());
    this.vesRumblePackUsbWatcher.onDidDetachDevice(async () => this.detectRumblePackIsConnected());
    this.vesRumblePackUsbWatcher.onDidReceiveData(data => {
      this.rumblePackLog.push({ timestamp: Date.now(), text: data });
      // trigger event
      this.rumblePackLog = this.rumblePackLog;
    });
  }

  async detectRumblePackIsConnected(): Promise<void> {
    this.rumblePackIsConnected = await this.vesRumblePackUsbService.detectRumblePack();
  };

  sendCommandPrintMenu(): boolean {
    return this.vesRumblePackUsbService.sendCommandPrintMenu();
  };

  sendCommandPrintVbCommandLineState(): boolean {
    return this.vesRumblePackUsbService.sendCommandPrintVbCommandLineState();
  }

  sendCommandPrintVbSyncLineState(): boolean {
    return this.vesRumblePackUsbService.sendCommandPrintVbSyncLineState();
  }

  sendCommandPlayLastEffect(): boolean {
    return this.vesRumblePackUsbService.sendCommandPlayLastEffect();
  }

  sendCommandStopCurrentEffect(): boolean {
    return this.vesRumblePackUsbService.sendCommandStopCurrentEffect();
  }

  sendCommandPlayEffect(effect: HapticBuiltInEffect): boolean {
    return this.vesRumblePackUsbService.sendCommandPlayEffect(effect);
  };

  sendCommandSetFrequency(frequency: HapticFrequency): boolean {
    return this.vesRumblePackUsbService.sendCommandSetFrequency(frequency);
  }

  sendCommandSetOverdrive(overdrive: number): boolean {
    return this.vesRumblePackUsbService.sendCommandSetOverdrive(overdrive);
  }

  sendCommandSetPositiveSustain(sustain: number): boolean {
    return this.vesRumblePackUsbService.sendCommandSetPositiveSustain(sustain);
  }

  sendCommandSetNegativeSustain(sustain: number): boolean {
    return this.vesRumblePackUsbService.sendCommandSetNegativeSustain(sustain);
  }

  sendCommandSetBreak(breakValue: number): boolean {
    return this.vesRumblePackUsbService.sendCommandSetBreak(breakValue);
  }
}