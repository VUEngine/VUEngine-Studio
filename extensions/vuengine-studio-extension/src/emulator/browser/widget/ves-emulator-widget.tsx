import { basename, dirname, join as joinPath } from 'path';
import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandService, isWindows } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import {
  Endpoint,
  KeybindingRegistry,
  LocalStorageService,
  Message,
  PreferenceScope,
  PreferenceService,
  ScopedKeybinding,
} from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import {
  EmulationMode,
  EmulatorGamePadKeyCode,
  EmulatorFunctionKeyCode,
  EmulatorScale,
  StereoMode,
} from '../ves-emulator-types';
import { VesEmulatorCommands } from '../ves-emulator-commands';
import { VesEmulatorPreferenceIds } from '../ves-emulator-preferences';
import { VesEmulatorService } from '../ves-emulator-service';
import { VesEmulatorControls } from './ves-emulator-controls-component';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';

const datauri = require('datauri');

export const VesEmulatorWidgetOptions = Symbol('VesEmulatorWidgetOptions');
export interface VesEmulatorWidgetOptions {
  uri: string;
}

export interface vesEmulatorWidgetState {
  paused: boolean
  lowPower: boolean
  muted: boolean
  saveSlot: number
  slowmotion: boolean
  fastForward: boolean
  frameAdvance: boolean
  showControls: boolean
  input: any /* eslint-disable-line */
};

@injectable()
export class VesEmulatorWidget extends ReactWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
  @inject(LocalStorageService)
  protected readonly localStorageService: LocalStorageService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesEmulatorService)
  protected readonly vesEmulatorService: VesEmulatorService;
  @inject(VesEmulatorWidgetOptions)
  protected readonly options: VesEmulatorWidgetOptions;

  static readonly ID = 'vesEmulatorWidget';
  static readonly LABEL = 'Emulator';

  static readonly RESOLUTIONX = 384;
  static readonly RESOLUTIONY = 224;

  protected wrapperRef = React.createRef<HTMLDivElement>();
  protected iframeRef = React.createRef<HTMLIFrameElement>();

  protected resource = '';

  protected state: vesEmulatorWidgetState;

  @postConstruct()
  protected async init(): Promise<void> {
    const label = this.options
      ? basename(this.options.uri)
      : VesEmulatorWidget.LABEL;
    const caption = this.options ? this.options.uri : VesEmulatorWidget.LABEL;

    this.id = VesEmulatorWidget.ID;
    this.title.label = label;
    this.title.caption = caption;
    this.title.iconClass = 'fa fa-play';
    this.title.closable = true;

    this.resource = await this.getResource();

    window.indexedDB.deleteDatabase('RetroArch');

    await this.initState();
    this.bindKeys();

    // TODO: find out why the emulator is only x1 size initially, without setTimeout
    setTimeout(() => {
      this.update();
    }, 50);

    this.keybindingRegistry.onKeybindingsChanged(() => {
      this.keybindingToState();
      this.update();
    });
    this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
      if ([
        VesEmulatorPreferenceIds.EMULATOR_EMULATION_MODE,
        VesEmulatorPreferenceIds.EMULATOR_SCALE,
        VesEmulatorPreferenceIds.EMULATOR_STEREO_MODE,
      ].includes(preferenceName)) {
        this.update();
      }
    });
  }

  protected async initState(): Promise<void> {
    this.state = {
      paused: false,
      lowPower: false,
      muted: (await this.localStorageService.getData('ves-emulator-state-muted')) || false,
      saveSlot: (await this.localStorageService.getData('ves-emulator-state-save-slot')) || 0,
      slowmotion: false,
      fastForward: false,
      frameAdvance: false,
      showControls: false,
      input: {},
    };
    this.keybindingToState();
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.unbindKeys();
  }

  protected keybindingToState(): void {
    this.state.input = {
      lUp: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_UP.id),
        command: EmulatorGamePadKeyCode.LUp,
      },
      lRight: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_RIGHT.id),
        command: EmulatorGamePadKeyCode.LRight,
      },
      lDown: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_DOWN.id),
        command: EmulatorGamePadKeyCode.LDown,
      },
      lLeft: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_LEFT.id),
        command: EmulatorGamePadKeyCode.LLeft,
      },
      start: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_START.id),
        command: EmulatorGamePadKeyCode.Start,
      },
      select: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_SELECT.id),
        command: EmulatorGamePadKeyCode.Select,
      },
      rUp: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_UP.id),
        command: EmulatorGamePadKeyCode.RUp,
      },
      rRight: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_RIGHT.id),
        command: EmulatorGamePadKeyCode.RRight,
      },
      rDown: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_DOWN.id),
        command: EmulatorGamePadKeyCode.RDown,
      },
      rLeft: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_LEFT.id),
        command: EmulatorGamePadKeyCode.RLeft,
      },
      b: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_B.id),
        command: EmulatorGamePadKeyCode.B,
      },
      a: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_A.id),
        command: EmulatorGamePadKeyCode.A,
      },
      lTrigger: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_TRIGGER.id),
        command: EmulatorGamePadKeyCode.LT,
      },
      rTrigger: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_TRIGGER.id),
        command: EmulatorGamePadKeyCode.RT,
      },
      pauseToggle: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_PAUSE_TOGGLE.id),
        command: EmulatorFunctionKeyCode.PauseToggle,
      },
      reset: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_RESET.id),
        command: EmulatorFunctionKeyCode.Reset,
      },
      audioMute: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_AUDIO_MUTE.id),
        command: EmulatorFunctionKeyCode.AudioMute,
      },
      saveState: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_SAVE_STATE.id),
        command: EmulatorFunctionKeyCode.SaveState,
      },
      loadState: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_LOAD_STATE.id),
        command: EmulatorFunctionKeyCode.LoadState,
      },
      stateSlotDecrease: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.id),
        command: EmulatorFunctionKeyCode.StateSlotDecrease,
      },
      stateSlotIncrease: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.id),
        command: EmulatorFunctionKeyCode.StateSlotIncrease,
      },
      frameAdvance: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_FRAME_ADVANCE.id),
        command: EmulatorFunctionKeyCode.FrameAdvance,
      },
      rewind: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_REWIND.id),
        command: EmulatorFunctionKeyCode.Rewind,
      },
      toggleFastForward: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id),
        command: EmulatorFunctionKeyCode.ToggleFastForward,
      },
      toggleSlowmotion: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id),
        command: EmulatorFunctionKeyCode.ToggleSlowmotion,
      },
      toggleLowPower: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.id),
        command: EmulatorFunctionKeyCode.ToggleLowPower,
      },
      fullscreen: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_FULLSCREEN.id),
        command: EmulatorFunctionKeyCode.Fullscreen,
      },
      toggleControlsOverlay: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id),
        command: EmulatorFunctionKeyCode.ToggleControlsOverlay,
      },
      screenshot: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_SCREENSHOT.id),
        command: EmulatorFunctionKeyCode.Screenshot,
      },
    };
  }

  // TODO: do not allow any user input before the emulator has started.
  // Otherwise, there could be inconsistencies between UI state and emulator.

  protected keyEventListerner = (e: KeyboardEvent) => this.processKeyEvent(e);
  protected messageEventListerner = (e: MessageEvent) => this.processIframeMessage(e);

  protected bindKeys(): void {
    document.addEventListener('keydown', this.keyEventListerner);
    document.addEventListener('keyup', this.keyEventListerner);
    window.addEventListener('message', this.messageEventListerner);
  }

  protected unbindKeys(): void {
    document.removeEventListener('keydown', this.keyEventListerner);
    document.removeEventListener('keyup', this.keyEventListerner);
    window.removeEventListener('message', this.messageEventListerner);
  }

  protected processKeyEvent(e: KeyboardEvent): void {
    // TODO: only process if widget is currently active (e.g. not being typed in search widget)
    if (e.repeat || !this.isVisible) {
      return;
    };

    for (const key in this.state.input) {
      if (this.state.input.hasOwnProperty(key)) {
        if ((!this.state.paused && !this.state.showControls) ||
          this.state.input[key].command === EmulatorFunctionKeyCode.ToggleControlsOverlay ||
          (!this.state.showControls && this.state.input[key].command === EmulatorFunctionKeyCode.PauseToggle) ||
          (!this.state.showControls && this.state.input[key].command === EmulatorFunctionKeyCode.Fullscreen) ||
          (!this.state.showControls && this.state.input[key].command === EmulatorFunctionKeyCode.AudioMute) ||
          (!this.state.showControls && this.state.input[key].command === EmulatorFunctionKeyCode.Reset) ||
          (!this.state.showControls && this.state.input[key].command === EmulatorFunctionKeyCode.Screenshot) ||
          (this.state.frameAdvance && this.state.input[key].command === EmulatorFunctionKeyCode.FrameAdvance)) {
          if (this.matchKey(this.state.input[key].keys, e.code)) {
            this.sendCommand(e.type, this.state.input[key].command);
          }
        }
      }
    }
  }

  protected processIframeMessage(e: MessageEvent): void {
    switch (e.data.type) {
      case 'screenshot':
        this.processScreenshot(e.data.data, e.data.filename);
        break;
    }
  }

  protected matchKey(scopedKeybindings: ScopedKeybinding[], keyCode: string): boolean {
    for (const keyBinding of scopedKeybindings) {
      // @ts-ignore
      for (const resolvedKeyBinding of keyBinding.resolved) {
        if (keyCode === resolvedKeyBinding.key.code) {
          return true;
        }
      }
    }
    return false;
  }

  // TODO: backport EmulatorLoaded event from PVB's emulator? (required modifications to emulator)
  protected startEmulator(self: any): void { /* eslint-disable-line */
    const romPath = this.options ? this.options.uri : this.vesEmulatorService.getRomPath();

    datauri(romPath, (err: any) => { /* eslint-disable-line */
      if (err) { throw err; };
    }).then((content: string) => {
      self.sendRetroArchConfig();
      self.sendCoreOptions();
      self.sendCommand('start', content);
    });
  }

  protected onResize(): void {
    this.update();
  }

  public sendKeypress(keyCode: EmulatorGamePadKeyCode | EmulatorFunctionKeyCode, e?: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    if (!this.state.showControls || keyCode === EmulatorFunctionKeyCode.ToggleControlsOverlay) {
      this.sendCommand('keyPress', keyCode);
    }
    if (e) {
      e.currentTarget.blur();
    }
  }

  protected render(): React.ReactNode {
    const canvasDimensions = this.getCanvasDimensions();
    return (
      <>
        <div id='vesEmulatorUi'>
          <div>
            <button
              className={this.state.paused
                ? 'theia-button'
                : 'theia-button secondary'}
              title={`${this.state.paused ? 'Resume' : 'Pause'}${this.getKeybindingLabel(VesEmulatorCommands.INPUT_PAUSE_TOGGLE.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.PauseToggle, e)}
              disabled={this.state.showControls}
            >
              <i className='fa fa-pause'></i>
            </button>
            <button
              className='theia-button secondary'
              title={`Reset${this.getKeybindingLabel(VesEmulatorCommands.INPUT_RESET.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.Reset, e)}
              disabled={this.state.showControls}
            >
              <i className='fa fa-refresh'></i>
            </button>
            <button
              className='theia-button secondary'
              title={`${this.state.muted ? 'Unmute' : 'Mute'}${this.getKeybindingLabel(VesEmulatorCommands.INPUT_AUDIO_MUTE.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.AudioMute, e)}
              disabled={this.state.showControls}
            >
              <i className={this.state.muted
                ? 'fa fa-volume-off'
                : 'fa fa-volume-up'}></i>
            </button>
            <button
              className={this.state.lowPower
                ? 'theia-button'
                : 'theia-button secondary'}
              title={`Toggle Low Power Signal${this.getKeybindingLabel(VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.ToggleLowPower, e)}
              disabled={this.state.showControls || this.state.paused}
            >
              <i className={this.state.lowPower
                ? 'fa fa-battery-quarter'
                : 'fa fa-battery-full'}></i>
            </button>
            {/* /}
              <button
                className='theia-button secondary'
                title='Clean'
                onClick={() => this.sendCommand('clean')}
                disabled={this.state.showControls}
              >
                <i className='fa fa-trash'></i>
              </button>
            {/**/}
          </div>
          <div>
            {/* TODO: find way to _toggle_ rewind */}
            <button
              className='theia-button secondary'
              title={`Rewind${this.getKeybindingLabel(VesEmulatorCommands.INPUT_REWIND.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.Rewind, e)}
              disabled={this.state.showControls || this.state.paused}
            >
              <i className='fa fa-backward'></i>
            </button>
            <button
              className={this.state.slowmotion
                ? 'theia-button'
                : 'theia-button secondary'}
              title={`Toggle Slow Motion${this.getKeybindingLabel(VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.ToggleSlowmotion, e)}
              disabled={this.state.showControls || this.state.paused}
            >
              <i className='fa fa-eject fa-rotate-90'></i>
            </button>
            <button
              className={this.state.frameAdvance
                ? 'theia-button'
                : 'theia-button secondary'}
              title={`Frame Advance${this.getKeybindingLabel(VesEmulatorCommands.INPUT_FRAME_ADVANCE.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.FrameAdvance, e)}
              disabled={this.state.showControls || (this.state.paused && !this.state.frameAdvance)}
            >
              <i className='fa fa-step-forward'></i>
            </button>

            <button
              className={this.state.fastForward
                ? 'theia-button'
                : 'theia-button secondary'}
              title={`Toggle Fast Forward${this.getKeybindingLabel(VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.ToggleFastForward, e)}
              disabled={this.state.showControls || this.state.paused}
            >
              <i className='fa fa-forward'></i>
            </button>
          </div>
          <div>
            <button
              className='theia-button secondary'
              title={`Save State${this.getKeybindingLabel(VesEmulatorCommands.INPUT_SAVE_STATE.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.SaveState, e)}
              disabled={this.state.showControls || this.state.paused}
            >
              <i className='fa fa-level-down'></i>{' '}
              <i className='fa fa-bookmark-o'></i>
            </button>
            <button
              className='theia-button secondary'
              title={`Load State${this.getKeybindingLabel(VesEmulatorCommands.INPUT_LOAD_STATE.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.LoadState, e)}
              disabled={this.state.showControls || this.state.paused}
            >
              <i className='fa fa-bookmark-o'></i>{' '}
              <i className='fa fa-level-up'></i>
            </button>
            <button
              className='theia-button secondary'
              title='Current Save State'
              disabled={this.state.showControls || this.state.paused}
            >
              <i className='fa fa-bookmark-o'></i> {this.state.saveSlot}
            </button>
            <button
              className='theia-button secondary'
              title={`Decrease Save State Slot${this.getKeybindingLabel(VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.StateSlotDecrease, e)}
              disabled={this.state.showControls || this.state.paused || this.state.saveSlot <= 0}
            >
              <i className='fa fa-chevron-down'></i>
            </button>
            <button
              className='theia-button secondary'
              title={`Increase Save State Slot${this.getKeybindingLabel(VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.StateSlotIncrease, e)}
              disabled={this.state.showControls || this.state.paused}
            >
              <i className='fa fa-chevron-up'></i>
            </button>
          </div>
          <div>
            <select
              className='theia-select'
              title='Scale'
              value={this.preferenceService.get(
                VesEmulatorPreferenceIds.EMULATOR_SCALE
              )}
              onChange={e => this.setScale(e)}
              disabled={this.state.showControls}
            >
              {Object.keys(EmulatorScale).map((value, index) => (
                <option value={value}>
                  {Object.values(EmulatorScale)[index]}
                </option>
              ))}
            </select>
            <select
              className='theia-select'
              title='Stereo Mode'
              value={this.preferenceService.get(
                VesEmulatorPreferenceIds.EMULATOR_STEREO_MODE
              )}
              onChange={e => this.setStereoMode(e)}
              disabled={this.state.showControls}
            >
              {Object.keys(StereoMode).map((value, index) => (
                <option value={value}>
                  {Object.values(StereoMode)[index]}
                </option>
              ))}
            </select>
            <select
              className='theia-select'
              title='Emulation Mode'
              value={this.preferenceService.get(
                VesEmulatorPreferenceIds.EMULATOR_EMULATION_MODE
              )}
              onChange={e => this.setEmulationMode(e)}
              disabled={this.state.showControls}
            >
              {Object.keys(EmulationMode).map((value, index) => (
                <option value={value}>
                  {Object.values(EmulationMode)[index]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              className='theia-button secondary'
              title={`Fullscreen${this.getKeybindingLabel(VesEmulatorCommands.INPUT_FULLSCREEN.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.Fullscreen, e)}
              disabled={this.state.showControls}
            >
              <i className='fa fa-arrows-alt'></i>
            </button>
            <button
              className='theia-button secondary'
              title={`Take screenshot${this.getKeybindingLabel(VesEmulatorCommands.INPUT_SCREENSHOT.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.Screenshot, e)}
              disabled={this.state.showControls}
            >
              <i className='fa fa-camera'></i>
            </button>
            <button
              className={
                this.state.showControls
                  ? 'theia-button'
                  : 'theia-button secondary'
              }
              title={`Configure Input${this.getKeybindingLabel(VesEmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id, true)}`}
              onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.ToggleControlsOverlay, e)}
            >
              <i className='fa fa-keyboard-o'></i>
            </button>
          </div>
        </div>
        <div id='vesEmulatorWrapper' ref={this.wrapperRef}>
          <iframe
            id='vesEmulatorFrame'
            ref={this.iframeRef}
            src={this.resource}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            onLoad={() => this.startEmulator(this)}
            tabIndex={0}
          ></iframe>
        </div>
        {this.state.showControls && (
          <div className='controlsOverlay'>
            <VesEmulatorControls
              commandService={this.commandService}
              keybindingRegistry={this.keybindingRegistry}
            />
          </div>
        )}
      </>
    );
  }

  protected async getResource(): Promise<string> {
    return new Endpoint({ path: '/emulator/index.html' }).getRestUrl().toString();
  }

  protected async sendCommand(command: string, data?: any): Promise<void> { /* eslint-disable-line */
    this.iframeRef.current?.contentWindow?.postMessage({ command, data }, this.resource);

    if (command === 'keyPress' || command === 'keyup') {
      switch (data) {
        case EmulatorFunctionKeyCode.AudioMute:
          this.state.muted = !this.state.muted;
          await this.localStorageService.setData('ves-emulator-state-muted', this.state.muted);
          this.update();
          break;
        case EmulatorFunctionKeyCode.PauseToggle:
          this.state.paused = !this.state.paused;
          this.state.frameAdvance = false;
          this.update();
          break;
        case EmulatorFunctionKeyCode.ToggleLowPower:
          this.state.lowPower = !this.state.lowPower;
          this.update();
          break;
        case EmulatorFunctionKeyCode.ToggleSlowmotion:
          this.state.slowmotion = !this.state.slowmotion;
          this.update();
          break;
        case EmulatorFunctionKeyCode.ToggleFastForward:
          this.state.fastForward = !this.state.fastForward;
          this.update();
          break;
        case EmulatorFunctionKeyCode.FrameAdvance:
          this.state.paused = true;
          this.state.frameAdvance = true;
          this.update();
          break;
        case EmulatorFunctionKeyCode.Fullscreen:
          this.enterFullscreen();
          break;
        case EmulatorFunctionKeyCode.ToggleControlsOverlay:
          this.toggleControlsOverlay();
          break;
        case EmulatorFunctionKeyCode.Reset:
          await this.reload();
          break;
        case EmulatorFunctionKeyCode.StateSlotDecrease:
          if (this.state.saveSlot > 0) {
            this.state.saveSlot--;
            this.update();
            await this.localStorageService.setData('ves-emulator-state-save-slot', this.state.saveSlot);
          }
          break;
        case EmulatorFunctionKeyCode.StateSlotIncrease:
          this.state.saveSlot++;
          this.update();
          await this.localStorageService.setData('ves-emulator-state-save-slot', this.state.saveSlot);
          break;
        case EmulatorFunctionKeyCode.Screenshot:
          this.sendCommand('sendScreenshot');
          break;
      }
    }
  }

  protected processScreenshot(data: string, filename: string): void {
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const fileUri = new URI(joinPath(this.getWorkspaceRoot(), 'screenshots', filename));
    this.fileService.writeFile(fileUri, BinaryBuffer.wrap(ia));
  }

  protected async reload(): Promise<void> {
    if (this.iframeRef.current) {
      this.sendCoreOptions();
      this.iframeRef.current.src += '';
      await this.initState();
      this.update();
    }
  }

  protected async setEmulationMode(e: React.ChangeEvent<HTMLSelectElement>): Promise<void> {
    e.target.blur();
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_EMULATION_MODE,
      e.target.value,
      PreferenceScope.User
    );
    await this.reload();
  }

  protected async setStereoMode(e: React.ChangeEvent<HTMLSelectElement>): Promise<void> {
    e.target.blur();
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_STEREO_MODE,
      e.target.value,
      PreferenceScope.User
    );
    await this.reload();
  }

  protected async setScale(e: React.ChangeEvent<HTMLSelectElement>): Promise<void> {
    e.target.blur();
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_SCALE,
      e.target.value,
      PreferenceScope.User
    );
    this.update();
  }

  protected sendCoreOptions(): void {
    const emulationMode = this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_EMULATION_MODE
    ) as string;
    let stereoMode = this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_STEREO_MODE
    ) as string;
    let anaglyphPreset = 'disabled';
    let colorMode = 'black & red';

    if (stereoMode.startsWith('2d')) {
      colorMode = stereoMode
        .substr(3)
        .replace('-', ' & ')
        .replace('-', ' ');
      anaglyphPreset = 'disabled';
      stereoMode = 'anaglyph';
    } else if (stereoMode.startsWith('anaglyph')) {
      anaglyphPreset = stereoMode
        .substr(9)
        .replace('-', ' & ')
        .replace('-', ' ');
      stereoMode = 'anaglyph';
    }

    this.sendCommand(
      'setCoreOptions',
      `
        vb_3dmode = "${stereoMode}"
        vb_anaglyph_preset = "${anaglyphPreset}"
        vb_color_mode = "${colorMode}"
        vb_right_analog_to_digital = "disabled"
        vb_cpu_emulation = "${emulationMode}"
      `
    );
  }

  protected sendRetroArchConfig(): void {
    this.sendCommand(
      'setRetroArchConfig',
      `
        menu_driver = "default"
        history_list_enable = false
        perfcnt_enable = false
        config_save_on_exit = false
        suspend_screensaver_enable  = true
        fps_show = false
        framecount_show = false
        memory_show = false
        video_windowed_fullscreen = false
        video_vsync = true
        video_font_enable = true
        cheevos_enable = false
        cheevos_hardcore_mode_enable = false
        quit_press_twice = false
        rewind_enable = true
        pause_nonactive = true
        
        audio_mute_enable = ${this.state.muted}
        state_slot = ${this.state.saveSlot}

        input_player1_select = ${this.toButton(EmulatorGamePadKeyCode.Select)}
        input_player1_start = ${this.toButton(EmulatorGamePadKeyCode.Start)}
        input_player1_l = ${this.toButton(EmulatorGamePadKeyCode.LT)}
        input_player1_r = ${this.toButton(EmulatorGamePadKeyCode.RT)}
        input_player1_a = ${this.toButton(EmulatorGamePadKeyCode.A)}
        input_player1_b = ${this.toButton(EmulatorGamePadKeyCode.B)}
        input_player1_up = ${this.toButton(EmulatorGamePadKeyCode.LUp)}
        input_player1_left = ${this.toButton(EmulatorGamePadKeyCode.LLeft)}
        input_player1_down = ${this.toButton(EmulatorGamePadKeyCode.LDown)}
        input_player1_right = ${this.toButton(EmulatorGamePadKeyCode.LRight)}
        input_player1_l2 = ${this.toButton(EmulatorGamePadKeyCode.RUp)}
        input_player1_r2 = ${this.toButton(EmulatorGamePadKeyCode.RLeft)}
        input_player1_l3 = ${this.toButton(EmulatorGamePadKeyCode.RDown)}
        input_player1_r3 = ${this.toButton(EmulatorGamePadKeyCode.RRight)}
        input_player1_l_x_minus = ${this.toButton(EmulatorGamePadKeyCode.LLeft)}
        input_player1_l_x_plus = ${this.toButton(EmulatorGamePadKeyCode.LRight)}
        input_player1_l_y_minus = ${this.toButton(EmulatorGamePadKeyCode.LDown)}
        input_player1_l_y_plus = ${this.toButton(EmulatorGamePadKeyCode.LUp)}
        input_player1_r_x_minus = ${this.toButton(EmulatorGamePadKeyCode.RLeft)}
        input_player1_r_x_plus = ${this.toButton(EmulatorGamePadKeyCode.RRight)}
        input_player1_r_y_minus = ${this.toButton(EmulatorGamePadKeyCode.RDown)}
        input_player1_r_y_plus = ${this.toButton(EmulatorGamePadKeyCode.RUp)}
        input_player1_turbo = nul

        input_save_state = ${this.toButton(EmulatorFunctionKeyCode.SaveState)}
        input_load_state = ${this.toButton(EmulatorFunctionKeyCode.LoadState)}
        input_state_slot_decrease = ${this.toButton(EmulatorFunctionKeyCode.StateSlotDecrease)}
        input_state_slot_increase = ${this.toButton(EmulatorFunctionKeyCode.StateSlotIncrease)}
        input_toggle_fast_forward = ${this.toButton(EmulatorFunctionKeyCode.ToggleFastForward)}
        input_toggle_slowmotion = ${this.toButton(EmulatorFunctionKeyCode.ToggleSlowmotion)}
        input_pause_toggle = ${this.toButton(EmulatorFunctionKeyCode.PauseToggle)}
        input_rewind = ${this.toButton(EmulatorFunctionKeyCode.Rewind)}
        input_frame_advance = ${this.toButton(EmulatorFunctionKeyCode.FrameAdvance)}
        input_audio_mute = ${this.toButton(EmulatorFunctionKeyCode.AudioMute)}
        input_screenshot = ${this.toButton(EmulatorFunctionKeyCode.Screenshot)}

        auto_screenshot_filename = "true"
        screenshot_directory = "/home/web_user/retroarch/userdata"

        input_reset = nul
        input_toggle_fullscreen = nul
        input_hold_fast_forward = nul
        input_hold_slowmotion = nul
        input_exit_emulator = nul
        input_shader_next = nul
        input_shader_prev = nul
        input_movie_record_toggle = nul
        input_slowmotion = nul
        input_enable_hotkey_btn = nul
        input_hotkey_block_delay = nul
        input_volume_up = nul
        input_volume_down = nul
        input_menu_toggle = nul
      `
    );
  }

  protected getCanvasDimensions(): { height: number; width: number } {
    const canvasScale = this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_SCALE
    ) as string;
    const screenResolution = this.getScreenResolution();
    const wrapperHeight =
      this.wrapperRef.current?.offsetHeight || screenResolution.height;
    const wrapperWidth =
      this.wrapperRef.current?.offsetWidth || screenResolution.width;

    if (canvasScale === 'full') {
      const fullSizeCanvasScale = Math.min.apply(Math, [
        wrapperHeight / screenResolution.height,
        wrapperWidth / screenResolution.width,
      ]);
      return {
        height: fullSizeCanvasScale * screenResolution.height,
        width: fullSizeCanvasScale * screenResolution.width,
      };
    } else if (canvasScale === 'auto') {
      const maxScale = this.determineMaxCanvasScaleFactor();
      return {
        height: maxScale * screenResolution.height,
        width: maxScale * screenResolution.width,
      };
    } else {
      const preferredScale = parseInt(canvasScale.substr(1));
      const maxScale = this.determineMaxCanvasScaleFactor();
      const actualScale = Math.min.apply(Math, [maxScale, preferredScale]);
      return {
        height: actualScale * screenResolution.height,
        width: actualScale * screenResolution.width,
      };
    }
  }

  protected determineMaxCanvasScaleFactor(): number {
    const screenResolution = this.getScreenResolution();
    const wrapperHeight =
      this.wrapperRef.current?.offsetHeight || screenResolution.height;
    const wrapperWidth =
      this.wrapperRef.current?.offsetWidth || screenResolution.width;

    return Math.min.apply(Math, [
      Math.floor(wrapperHeight / screenResolution.height),
      Math.floor(wrapperWidth / screenResolution.width),
    ]);
  }

  protected getScreenResolution(): { height: number; width: number } {
    const stereoMode = this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_STEREO_MODE
    ) as string;
    let x = VesEmulatorWidget.RESOLUTIONX;
    let y = VesEmulatorWidget.RESOLUTIONY;

    if (stereoMode === 'side-by-side') {
      x = VesEmulatorWidget.RESOLUTIONX * 2;
    } else if (stereoMode === 'cyberscope') {
      x = 512;
      y = VesEmulatorWidget.RESOLUTIONX;
    } else if (stereoMode === 'hli') {
      y = VesEmulatorWidget.RESOLUTIONY * 2;
    } else if (stereoMode === 'vli') {
      x = VesEmulatorWidget.RESOLUTIONX * 2;
    }

    return { height: y, width: x };
  }

  protected enterFullscreen(): void {
    this.wrapperRef.current?.requestFullscreen();
  }

  protected toggleControlsOverlay(): void {
    this.state.showControls = !this.state.showControls;
    this.update();
  }

  protected toButton(
    keyCode: EmulatorGamePadKeyCode | EmulatorFunctionKeyCode
  ): string {
    let button: string = keyCode;
    if (keyCode.startsWith('Key')) {
      button = keyCode.substr(3);
    } else if (keyCode.startsWith('Arrow')) {
      button = keyCode.substr(5);
    }
    return button.toLowerCase();
  }

  protected async getResourcesPath(): Promise<string> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return applicationPath;
  }

  protected getKeybindingLabel(commandId: string, wrapInBrackets: boolean = false): string {
    const keybinding = this.keybindingRegistry.getKeybindingsForCommand(commandId)[0];
    let keybindingAccelerator = keybinding
      ? this.keybindingRegistry.acceleratorFor(keybinding, '+').join(', ')
      : '';

    keybindingAccelerator = keybindingAccelerator
      .replace(' ', 'Space');

    if (wrapInBrackets && keybindingAccelerator !== '') {
      keybindingAccelerator = ` (${keybindingAccelerator})`;
    }

    return keybindingAccelerator;
  }

  protected getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }
}
