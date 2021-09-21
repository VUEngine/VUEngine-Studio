import { basename } from 'path';
import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandService } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  Endpoint,
  KeybindingRegistry,
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

const datauri = require('datauri');

export const VesEmulatorWidgetOptions = Symbol('VesEmulatorWidgetOptions');
export interface VesEmulatorWidgetOptions {
  uri: string;
}

export interface vesEmulatorWidgetState {
  status: string
  showControls: boolean
  input: any /* eslint-disable-line */
};

@injectable()
export class VesEmulatorWidget extends ReactWidget {
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
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

  protected state: vesEmulatorWidgetState = {
    status: 'running',
    showControls: false,
    input: {},
  };

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

    this.update();

    // TODO: this shrinks down emulator viewport. Theia bug?
    this.keybindingRegistry.onKeybindingsChanged(() => {
      this.keybindingToState();
      this.update();
    });

    this.frontendApplicationStateService.onStateChanged(async (state: FrontendApplicationState) => {
      if (state === 'ready') {
        this.keybindingToState();
        this.bindKeys();
        this.update();
      }
    });
  }

  protected keybindingToState(): void {
    this.state.input = {
      lUp: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_UP.id),
      lRight: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_RIGHT.id),
      lDown: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_DOWN.id),
      lLeft: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_LEFT.id),
      start: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_START.id),
      select: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_SELECT.id),
      lTrigger: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_L_TRIGGER.id),
      rUp: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_UP.id),
      rRight: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_RIGHT.id),
      rDown: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_DOWN.id),
      rLeft: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_LEFT.id),
      b: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_B.id),
      a: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_A.id),
      rTrigger: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_R_TRIGGER.id),
      pauseToggle: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_PAUSE_TOGGLE.id),
      reset: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_RESET.id),
      audioMute: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_AUDIO_MUTE.id),
      saveState: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_SAVE_STATE.id),
      loadState: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_LOAD_STATE.id),
      stateSlotDecrease: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.id),
      stateSlotIncrease: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.id),
      frameAdvance: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_FRAME_ADVANCE.id),
      rewind: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_REWIND.id),
      toggleFastForward: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id),
      toggleSlowmotion: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id),
      toggleLowPower: this.keybindingRegistry.getKeybindingsForCommand(VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.id),
    };
  }

  protected bindKeys(): void {
    this.node.addEventListener('keydown', event => {
      this.processKeyEvent('keydown', event);
    });
    this.node.addEventListener('keyup', event => {
      this.processKeyEvent('keyup', event);
    });
  }

  protected processKeyEvent(type: 'keydown' | 'keyup', event: KeyboardEvent): void {
    if (event.repeat || this.state.status === 'paused') { return; };

    if (this.matchKey(this.state.input.lUp, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.LUp); };
    if (this.matchKey(this.state.input.lRight, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.LRight); };
    if (this.matchKey(this.state.input.lDown, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.LDown); };
    if (this.matchKey(this.state.input.lLeft, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.LLeft); };
    if (this.matchKey(this.state.input.start, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.Start); };
    if (this.matchKey(this.state.input.select, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.Select); };
    if (this.matchKey(this.state.input.lTrigger, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.LT); };
    if (this.matchKey(this.state.input.rUp, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.RUp); };
    if (this.matchKey(this.state.input.rRight, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.RRight); };
    if (this.matchKey(this.state.input.rDown, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.RDown); };
    if (this.matchKey(this.state.input.rLeft, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.RLeft); };
    if (this.matchKey(this.state.input.b, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.B); };
    if (this.matchKey(this.state.input.a, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.A); };
    if (this.matchKey(this.state.input.rTrigger, event.code)) { this.sendCommand(type, EmulatorGamePadKeyCode.RT); };
    if (this.matchKey(this.state.input.pauseToggle, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.PauseToggle); };
    if (this.matchKey(this.state.input.reset, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.Reset); };
    if (this.matchKey(this.state.input.audioMute, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.AudioMute); };
    if (this.matchKey(this.state.input.saveState, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.SaveState); };
    if (this.matchKey(this.state.input.loadState, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.LoadState); };
    if (this.matchKey(this.state.input.stateSlotDecrease, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.StateSlotDecrease); };
    if (this.matchKey(this.state.input.stateSlotIncrease, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.StateSlotIncrease); };
    if (this.matchKey(this.state.input.frameAdvance, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.FrameAdvance); };
    if (this.matchKey(this.state.input.rewind, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.Rewind); };
    if (this.matchKey(this.state.input.toggleFastForward, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.ToggleFastForward); };
    if (this.matchKey(this.state.input.toggleSlowmotion, event.code)) { this.sendCommand(type, EmulatorFunctionKeyCode.ToggleSlowmotion); };
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

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  public sendKeypress(
    keyCode: EmulatorGamePadKeyCode | EmulatorFunctionKeyCode
  ): void {
    if (!this.state.showControls) {
      this.sendCommand('keyPress', keyCode);
    }
  }

  protected render(): React.ReactNode {
    const canvasDimensions = this.getCanvasDimensions();
    return (
      <>
        <div id='vesEmulatorUi'>
          <div>
            <button
              className='theia-button secondary'
              title={this.state.status === 'paused' ? 'Resume' : 'Pause'}
              onClick={() => this.togglePause()}
              disabled={this.state.showControls}
            >
              <i
                className={
                  this.state.status === 'paused' ? 'fa fa-play' : 'fa fa-pause'
                }
              ></i>
            </button>
            <button
              className='theia-button secondary'
              title='Reset'
              onClick={() => this.reset()}
              disabled={this.state.showControls}
            >
              <i className='fa fa-refresh'></i>
            </button>
            <button
              className='theia-button secondary'
              title='Mute'
              onClick={() => {
                this.sendCommand('keyPress', EmulatorFunctionKeyCode.AudioMute);
                this.update();
              }}
              disabled={this.state.showControls}
            >
              <i className='fa fa-volume-up'></i>
            </button>
            <button
              className='theia-button secondary'
              title='Toggle Low Power Signal'
              onClick={() => this.toggleLowPower()}
              disabled={this.state.showControls}
            >
              <i className='fa fa-battery-quarter'></i>
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
              title='Rewind'
              onClick={() =>
                this.sendCommand('keyPress', EmulatorFunctionKeyCode.Rewind)
              }
              disabled={this.state.showControls}
            >
              <i className='fa fa-backward'></i>
            </button>
            <button
              className='theia-button secondary'
              title='Toggle Slow Motion'
              onClick={() =>
                this.sendCommand('keyPress', EmulatorFunctionKeyCode.ToggleSlowmotion)
              }
              disabled={this.state.showControls}
            >
              <i className='fa fa-eject fa-rotate-90'></i>
            </button>
            <button
              className='theia-button secondary'
              title='Frame Advance'
              onClick={() => {
                this.state.status = 'paused';
                this.sendCommand(
                  'keyPress',
                  EmulatorFunctionKeyCode.FrameAdvance
                );
                this.update();
              }}
              disabled={this.state.showControls}
            >
              <i className='fa fa-step-forward'></i>
            </button>

            <button
              className='theia-button secondary'
              title='Toggle Fast Forward'
              onClick={() =>
                this.sendCommand(
                  'keyPress',
                  EmulatorFunctionKeyCode.ToggleFastForward
                )
              }
              disabled={this.state.showControls}
            >
              <i className='fa fa-forward'></i>
            </button>
          </div>
          {this.wrapperRef.current &&
            this.wrapperRef.current?.offsetWidth > 900 && (
              <div>
                <button
                  className='theia-button secondary'
                  title='Save State'
                  onClick={() =>
                    this.sendCommand(
                      'keyPress',
                      EmulatorFunctionKeyCode.SaveState
                    )
                  }
                  disabled={this.state.showControls}
                >
                  <i className='fa fa-level-down'></i>{' '}
                  <i className='fa fa-bookmark-o'></i>
                </button>
                <button
                  className='theia-button secondary'
                  title='Load State'
                  onClick={() =>
                    this.sendCommand(
                      'keyPress',
                      EmulatorFunctionKeyCode.LoadState
                    )
                  }
                  disabled={this.state.showControls}
                >
                  <i className='fa fa-bookmark-o'></i>{' '}
                  <i className='fa fa-level-up'></i>
                </button>
                <button
                  className='theia-button secondary'
                  title='Increase Save State Slot'
                  onClick={() =>
                    this.sendCommand(
                      'keyPress',
                      EmulatorFunctionKeyCode.StateSlotIncrease
                    )
                  }
                  disabled={this.state.showControls}
                >
                  <i className='fa fa-chevron-up'></i>
                </button>
                <button
                  className='theia-button secondary'
                  title='Decrease Save State Slot'
                  onClick={() =>
                    this.sendCommand(
                      'keyPress',
                      EmulatorFunctionKeyCode.StateSlotDecrease
                    )
                  }
                  disabled={this.state.showControls}
                >
                  <i className='fa fa-chevron-down'></i>
                </button>
              </div>
            )}
          {this.wrapperRef.current &&
            this.wrapperRef.current?.offsetWidth > 750 && (
              <div>
                <select
                  className='theia-select'
                  title='Scale'
                  value={this.preferenceService.get(
                    VesEmulatorPreferenceIds.EMULATOR_SCALE
                  )}
                  onChange={value => this.setScale(value)}
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
                  onChange={value => this.setStereoMode(value)}
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
                  onChange={value => this.setEmulationMode(value)}
                  disabled={this.state.showControls}
                >
                  {Object.keys(EmulationMode).map((value, index) => (
                    <option value={value}>
                      {Object.values(EmulationMode)[index]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          <div>
            <button
              className='theia-button secondary'
              title='Fullscreen'
              onClick={() => this.enterFullscreen()}
              disabled={this.state.showControls}
            >
              <i className='fa fa-arrows-alt'></i>
            </button>
          </div>
          {/* /}
          <div>
            <button
              className='theia-button secondary'
              title='Save screenshot'
              onClick={() => this.saveScreenshot()}
              disabled={this.state.showControls}
            >
              <i className='fa fa-camera'></i>
            </button>
          </div>
          {/**/}
          <div>
            <button
              className={
                this.state.showControls
                  ? 'theia-button'
                  : 'theia-button secondary'
              }
              title='Configure Input'
              onClick={() => this.toggleControlsOverlay()}
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
    // remove focus from button
    this.node.focus();
  }

  protected saveScreenshot(): void {
    // TODO: this does not work
    const canvas = this.iframeRef.current?.contentDocument?.getElementById(
      'canvas'
    ) as HTMLCanvasElement;
    const lnk = document.createElement('a');
    lnk.download = 'filename.png';
    lnk.href = canvas?.toDataURL('image/png;base64');
    lnk.click();
  }

  protected async toggleLowPower(): Promise<void> {
    await this.sendCommand('keyPress', EmulatorFunctionKeyCode.ToggleLowPower);
    this.update();
  }

  protected reload(): void {
    if (this.iframeRef.current) { this.iframeRef.current.src += ''; }
    this.update();
  }

  protected async reset(): Promise<void> {
    await this.sendCommand('keyPress', EmulatorFunctionKeyCode.Reset);
    this.update();
  }

  protected async togglePause(): Promise<void> {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
    } else if (this.state.status === 'running') {
      this.state.status = 'paused';
    }
    await this.sendCommand('keyPress', EmulatorFunctionKeyCode.PauseToggle);
    this.update();
  }

  protected async setEmulationMode(e: React.ChangeEvent<HTMLSelectElement>): Promise<void> {
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_EMULATION_MODE,
      e.target.value,
      PreferenceScope.User
    );
    this.sendCoreOptions();
    this.reload();
  }

  protected async setStereoMode(e: React.ChangeEvent<HTMLSelectElement>): Promise<void> {
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_STEREO_MODE,
      e.target.value,
      PreferenceScope.User
    );
    this.sendCoreOptions();
    this.reload();
  }

  protected async setScale(e: React.ChangeEvent<HTMLSelectElement>): Promise<void> {
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
        vb_3dmode = '${stereoMode}'
        vb_anaglyph_preset = '${anaglyphPreset}'
        vb_color_mode = '${colorMode}'
        vb_right_analog_to_digital = 'disabled'
        vb_cpu_emulation = '${emulationMode}'
      `
    );
  }

  protected sendRetroArchConfig(): void {
    this.sendCommand(
      'setRetroArchConfig',
      `
        menu_driver = 'xmb'
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
        input_player1_x_btn = ${this.toButton(EmulatorFunctionKeyCode.ToggleLowPower)}
        input_player1_turbo = nul

        input_toggle_fullscreen = ${this.toButton(EmulatorFunctionKeyCode.ToggleFullscreen)}
        input_save_state = ${this.toButton(EmulatorFunctionKeyCode.SaveState)}
        input_load_state = ${this.toButton(EmulatorFunctionKeyCode.LoadState)}
        input_state_slot_decrease = ${this.toButton(EmulatorFunctionKeyCode.StateSlotDecrease)}
        input_state_slot_increase = ${this.toButton(EmulatorFunctionKeyCode.StateSlotIncrease)}
        input_toggle_fast_forward = ${this.toButton(EmulatorFunctionKeyCode.ToggleFastForward)}
        input_toggle_slowmotion = ${this.toButton(EmulatorFunctionKeyCode.ToggleSlowmotion)}
        input_pause_toggle = ${this.toButton(EmulatorFunctionKeyCode.PauseToggle)}
        input_rewind = ${this.toButton(EmulatorFunctionKeyCode.Rewind)}
        input_frame_advance = ${this.toButton(EmulatorFunctionKeyCode.FrameAdvance)}
        input_reset = ${this.toButton(EmulatorFunctionKeyCode.Reset)}
        input_audio_mute = ${this.toButton(EmulatorFunctionKeyCode.AudioMute)}

        input_hold_fast_forward = nul
        input_hold_slowmotion = nul
        input_exit_emulator = nul
        input_shader_next = nul
        input_shader_prev = nul
        input_movie_record_toggle = nul
        input_screenshot = nul
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
    this.iframeRef.current?.focus();
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
}
