import { FileX } from '@phosphor-icons/react';
import { CommandService, isWindows, nls, PreferenceScope, PreferenceService } from '@theia/core';
import {
  Endpoint,
  ExtractableWidget,
  KeybindingRegistry,
  LocalStorageService,
  Message,
  NavigatableWidget,
  ScopedKeybinding
} from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent, FileChangeType } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import * as iconv from 'iconv-lite';
import styled from 'styled-components';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import EmptyContainer from '../../editors/browser/components/Common/EmptyContainer';
import { EmulatorControlsOverlay } from './components/EmulatorControlsOverlay';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';
import {
  EMULATION_MODES,
  EMULATION_SCALES,
  EMULATION_STEREO_MODES,
  EmulatorFunctionKeyCode,
  EmulatorGamePadKeyCode,
  ROM_HEADER_MAKERS,
  RomHeader,
} from './ves-emulator-types';

enum EmulatorRomStatus {
  CHECKING = 'checking',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
}

const EmulatorControls = styled.div`
  min-width: 384px;
  padding-bottom: calc(var(--theia-ui-padding) * 2);
  text-align: center;

  &>div {
    display: inline-block;
    margin: var(--theia-ui-padding);
  }

  & button.theia-button {
    height: 26px;
    margin: 0 2px;
    min-width: 32px;
  vertical-align: middle;
}

  & select.theia-select {
    margin: 0 2px;
    vertical-align: middle;
  }
`;

const EmulatorWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  min-height: 224px;
  min-width: 384px;
  overflow: hidden;
`;

const EmulatorHeader = styled.div`
  display: flex;
  gap: var(--theia-ui-padding);
  justify-content: center;
  min-width: 384px;
  opacity: .5;
  padding-bottom: calc(var(--theia-ui-padding) * 2);
  white-space: nowrap;

  @container emulator (max-width: 560px) {
    display: none;
  }

  &>div {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  &>div:last-child {
    padding-left: 32px;
  }

  & span {
    background: #000;
    border-radius: 3px;
    color: #fff;
    padding: 2px 4px;
  }
`;

const EmulatorIframeWrapper = styled.div`
  align-items: center;
  background: rgba(0,0,0,.3);
  border-radius: 2px;
  display: flex;
  justify-content: center;
  overflow: hidden;
  position: relative;

  iframe {
    border: none;
    position: relative;
    z-index: 2;
  }

  .focusBlocker {
    height: 100%;
    position: absolute;
    width: 100%;
    z-index: 3;
  }

  .loading {
    opacity: .3;
    position: absolute;
    z-index: 1;
  }
`;

export const VesEmulatorWidgetOptions = Symbol('VesEmulatorWidgetOptions');
export interface VesEmulatorWidgetOptions {
  uri: string;
}

export interface vesEmulatorWidgetState {
  loaded: boolean;
  paused: boolean;
  lowPower: boolean;
  muted: boolean;
  saveSlot: number;
  slowmotion: boolean;
  fastForward: boolean;
  frameAdvance: boolean;
  showControls: boolean;
  romHeader: RomHeader;
  romSize: number;
  input: any /* eslint-disable-line */;
}

@injectable()
export class VesEmulatorWidget extends ReactWidget implements NavigatableWidget, ExtractableWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
  @inject(LocalStorageService)
  protected readonly localStorageService: LocalStorageService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService: VesBuildService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesEmulatorService)
  protected readonly vesEmulatorService: VesEmulatorService;
  @inject(VesEmulatorWidgetOptions)
  protected readonly options: VesEmulatorWidgetOptions;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  static readonly ID = 'vesEmulatorWidget';
  static readonly LABEL = nls.localize(
    'vuengine/emulator/emulator',
    'Emulator'
  );

  protected status: EmulatorRomStatus = EmulatorRomStatus.CHECKING;

  static readonly RESOLUTIONX = 384;
  static readonly RESOLUTIONY = 224;

  protected wrapperRef = React.createRef<HTMLDivElement>();
  protected iframeRef = React.createRef<HTMLIFrameElement>();

  protected resource = '';

  protected state: vesEmulatorWidgetState;

  isExtractable: boolean = true;
  secondaryWindow: Window | undefined;

  @postConstruct()
  protected init(): void {
    this.doInit();
    this.bindEvents();

    const label = this.options
      ? this.vesCommonService.basename(this.options.uri)
      : VesEmulatorWidget.LABEL;
    const caption = this.options
      ? this.options.uri.replace('file://', '')
      : VesEmulatorWidget.LABEL;

    this.id = VesEmulatorWidget.ID;
    this.title.label = label;
    this.title.caption = caption;
    this.title.iconClass = 'codicon codicon-play';
    this.title.closable = true;

    this.keybindingRegistry.onKeybindingsChanged(() => {
      this.keybindingToState();
      this.update();
    });
    this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
      if ([VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE].includes(preferenceName)) {
        this.update();
      } else if (
        [
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_EMULATION_MODE,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_STEREO_MODE,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_FAST_FORWARD_RATIO,
        ].includes(preferenceName)
      ) {
        this.update();
        this.reload();
      }
    });
  }

  protected async checkRomExists(): Promise<void> {
    const resourceUri = this.getResourceUri();
    if (resourceUri && await this.fileService.exists(resourceUri)) {
      this.status = EmulatorRomStatus.EXISTS;
    } else {
      this.status = EmulatorRomStatus.NOT_EXISTS;
    }
  }

  protected async doInit(): Promise<void> {
    await this.initState();
    this.resource = await this.getResource();
    await this.checkRomExists();

    // TODO: find out why the emulator is only x1 size initially, without setTimeout
    setTimeout(() => {
      this.update();
    }, 50);
  }

  protected onCloseRequest(msg: Message): void {
    this.sendCommand('saveSram');
    setTimeout(() => {
      super.onCloseRequest(msg);
    }, 250);
  }

  getResourceUri(): URI | undefined {
    return new URI(this.options.uri);
  }

  createMoveToUri(resourceUri: URI): URI | undefined {
    return resourceUri;
  }

  isLoaded(): boolean {
    return this.state.loaded;
  }

  async reload(deleteSram = false): Promise<void> {
    if (deleteSram) {
      this.sendCommand('deleteSram');
    } else {
      this.sendCommand('saveSram');
    }

    if (this.iframeRef.current) {
      const currentIframeRef = this.iframeRef.current;
      setTimeout(async () => {
        this.sendCoreOptions();
        currentIframeRef.src += '';
        await this.initState();
        this.update();
      }, 250);
    }
  }

  protected async initState(): Promise<void> {
    this.state = {
      loaded: false,
      paused: false,
      lowPower: false,
      muted:
        (await this.localStorageService.getData('ves-emulator-state-muted')) ||
        false,
      saveSlot:
        (await this.localStorageService.getData(
          'ves-emulator-state-save-slot'
        )) || 0,
      slowmotion: false,
      fastForward: false,
      frameAdvance: false,
      showControls: false,
      romHeader: {
        name: '',
        maker: '',
        code: '',
        version: 0,
      },
      romSize: 0,
      input: {},
    };
    this.keybindingToState();
  }

  protected bindEvents(): void {
    const resourceUri = this.getResourceUri();
    this.toDispose.pushAll([
      this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
        fileChangesEvent.changes.map(change => {
          if (change.type !== FileChangeType.DELETED && resourceUri && change.resource.isEqual(resourceUri)) {
            this.doInit();
          }
        });
      })
    ]);
  }

  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.bindListeners();
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.unbindListeners();
  }

  protected keybindingToState(): void {
    this.state.input = {
      lUp: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_L_UP.id
        ),
        command: EmulatorGamePadKeyCode.LUp,
      },
      lRight: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_L_RIGHT.id
        ),
        command: EmulatorGamePadKeyCode.LRight,
      },
      lDown: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_L_DOWN.id
        ),
        command: EmulatorGamePadKeyCode.LDown,
      },
      lLeft: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_L_LEFT.id
        ),
        command: EmulatorGamePadKeyCode.LLeft,
      },
      start: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_START.id
        ),
        command: EmulatorGamePadKeyCode.Start,
      },
      select: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_SELECT.id
        ),
        command: EmulatorGamePadKeyCode.Select,
      },
      rUp: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_R_UP.id
        ),
        command: EmulatorGamePadKeyCode.RUp,
      },
      rRight: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_R_RIGHT.id
        ),
        command: EmulatorGamePadKeyCode.RRight,
      },
      rDown: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_R_DOWN.id
        ),
        command: EmulatorGamePadKeyCode.RDown,
      },
      rLeft: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_R_LEFT.id
        ),
        command: EmulatorGamePadKeyCode.RLeft,
      },
      b: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_B.id
        ),
        command: EmulatorGamePadKeyCode.B,
      },
      a: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_A.id
        ),
        command: EmulatorGamePadKeyCode.A,
      },
      lTrigger: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_L_TRIGGER.id
        ),
        command: EmulatorGamePadKeyCode.LT,
      },
      rTrigger: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_R_TRIGGER.id
        ),
        command: EmulatorGamePadKeyCode.RT,
      },
      pauseToggle: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_PAUSE_TOGGLE.id
        ),
        command: EmulatorFunctionKeyCode.PauseToggle,
      },
      reset: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_RESET.id
        ),
        command: EmulatorFunctionKeyCode.Reset,
      },
      audioMute: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_AUDIO_MUTE.id
        ),
        command: EmulatorFunctionKeyCode.AudioMute,
      },
      saveState: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_SAVE_STATE.id
        ),
        command: EmulatorFunctionKeyCode.SaveState,
      },
      loadState: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_LOAD_STATE.id
        ),
        command: EmulatorFunctionKeyCode.LoadState,
      },
      stateSlotDecrease: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.id
        ),
        command: EmulatorFunctionKeyCode.StateSlotDecrease,
      },
      stateSlotIncrease: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.id
        ),
        command: EmulatorFunctionKeyCode.StateSlotIncrease,
      },
      frameAdvance: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_FRAME_ADVANCE.id
        ),
        command: EmulatorFunctionKeyCode.FrameAdvance,
      },
      rewind: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_REWIND.id
        ),
        command: EmulatorFunctionKeyCode.Rewind,
      },
      toggleFastForward: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id
        ),
        command: EmulatorFunctionKeyCode.ToggleFastForward,
      },
      toggleSlowmotion: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id
        ),
        command: EmulatorFunctionKeyCode.ToggleSlowmotion,
      },
      toggleLowPower: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.id
        ),
        command: EmulatorFunctionKeyCode.ToggleLowPower,
      },
      fullscreen: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_FULLSCREEN.id
        ),
        command: EmulatorFunctionKeyCode.Fullscreen,
      },
      toggleControlsOverlay: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id
        ),
        command: EmulatorFunctionKeyCode.ToggleControlsOverlay,
      },
      screenshot: {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          VesEmulatorCommands.INPUT_SCREENSHOT.id
        ),
        command: EmulatorFunctionKeyCode.Screenshot,
      },
    };
  }

  protected keyEventListerner = (e: KeyboardEvent) => this.processKeyEvent(e);
  protected messageEventListerner = async (e: MessageEvent) =>
    this.processIframeMessage(e);

  protected bindListeners(): void {
    this.node.addEventListener('keydown', this.keyEventListerner);
    this.node.addEventListener('keyup', this.keyEventListerner);
    window.addEventListener('message', this.messageEventListerner);
  }

  protected unbindListeners(): void {
    this.node.removeEventListener('keydown', this.keyEventListerner);
    this.node.removeEventListener('keyup', this.keyEventListerner);
    window.removeEventListener('message', this.messageEventListerner);
  }

  protected processKeyEvent(e: KeyboardEvent): void {
    // do not process key input...
    if (
      e.repeat || // ... on repeated event firing
      !this.isVisible || // ... if emulator is not visible
      !this.state.loaded // ... if emulator has not loaded yet
    ) {
      return;
    }

    for (const key in this.state.input) {
      if (this.state.input.hasOwnProperty(key)) {
        if (
          (!this.state.paused && !this.state.showControls) ||
          this.state.input[key].command ===
          EmulatorFunctionKeyCode.ToggleControlsOverlay ||
          (!this.state.showControls &&
            this.state.input[key].command ===
            EmulatorFunctionKeyCode.PauseToggle) ||
          (!this.state.showControls &&
            this.state.input[key].command ===
            EmulatorFunctionKeyCode.Fullscreen) ||
          (!this.state.showControls &&
            this.state.input[key].command ===
            EmulatorFunctionKeyCode.AudioMute) ||
          (!this.state.showControls &&
            this.state.input[key].command === EmulatorFunctionKeyCode.Reset) ||
          (!this.state.showControls &&
            this.state.input[key].command ===
            EmulatorFunctionKeyCode.Screenshot) ||
          (this.state.frameAdvance &&
            this.state.input[key].command ===
            EmulatorFunctionKeyCode.FrameAdvance)
        ) {
          if (this.matchKey(this.state.input[key].keys, e.code)) {
            this.sendCommand(e.type, this.state.input[key].command);
          }
        }
      }
    }
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.tabIndex = 0;
    this.node.focus();
  }

  protected async processIframeMessage(e: MessageEvent): Promise<void> {
    switch (e.data.type) {
      case 'loaded':
        setTimeout(() => {
          this.state.loaded = true;
          this.update();
        }, 200);
        break;
      case 'sram':
        await this.processSram(e.data.data);
        break;
      case 'screenshot':
        await this.processScreenshot(e.data.data, e.data.filename);
        break;
    }
  }

  protected matchKey(
    scopedKeybindings: ScopedKeybinding[],
    keyCode: string
  ): boolean {
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

  protected getRomPath = async () => {
    const defaultRomUri = await this.vesBuildService.getDefaultRomUri();
    let romPath = this.options ? this.options.uri : defaultRomUri;
    if (typeof romPath !== 'string') {
      romPath = await this.fileService.fsPath(romPath);
    }
    if (isWindows && !romPath.startsWith('/')) {
      romPath = `/${romPath}`;
    }

    return romPath;
  };

  protected startEmulator = async () => {
    const defaultRomUri = await this.vesBuildService.getDefaultRomUri();
    const romUri = this.options ? new URI(this.options.uri) : defaultRomUri;
    const romContent = await this.fileService.readFile(romUri);
    const romContentBuffer = romContent.value.buffer;
    const romContentHeaderBuffer = romContentBuffer.slice(-544).slice(0, 32);
    const romHeaderName = iconv.decode(
      Buffer.from(romContentHeaderBuffer.slice(0, 20)),
      'Shift_JIS'
    );
    const romHeaderMaker = romContentHeaderBuffer.slice(25, 27).toString();
    const romHeaderCode = romContentHeaderBuffer.slice(27, 31).toString();
    const romHeaderVersion = romContentHeaderBuffer.slice(31, 32)[0];
    this.state.romHeader = {
      name: romHeaderName.padEnd(20, ' '),
      maker: romHeaderMaker,
      code: romHeaderCode,
      version: romHeaderVersion,
    };
    this.state.romSize = romContentBuffer.length / 131072;

    const romBase64 = this.vesCommonService.bytesToBase64(romContentBuffer);
    this.sendRetroArchConfig();
    this.sendCoreOptions();
    this.sendCommand('start', {
      namespace: await this.getRomPath(),
      rom: `data:application/octet-stream;base64,${romBase64}`,
    });
  };

  protected onResize(): void {
    this.update();
  }

  public sendKeypress = (
    keyCode: EmulatorGamePadKeyCode | EmulatorFunctionKeyCode
  ): void => {
    if (
      this.state.loaded &&
      (!this.state.showControls ||
        keyCode === EmulatorFunctionKeyCode.ToggleControlsOverlay)
    ) {
      this.sendCommand('keyPress', keyCode);
    }
    this.node.focus();
  };

  protected render(): React.ReactNode {
    const canvasDimensions = this.getCanvasDimensions();
    return this.status === EmulatorRomStatus.NOT_EXISTS
      ? <EmptyContainer
        title={nls.localize('vuengine/emulator/romNotFound', 'ROM not found')}
        icon={<FileX size={32} />}
      />
      : (
        <>
          <EmulatorControls>
            <div>
              <button
                className={
                  this.state.paused ? 'theia-button' : 'theia-button secondary'
                }
                title={`${this.state.paused
                  ? nls.localize('vuengine/emulator/resume', 'Resume')
                  : nls.localize('vuengine/emulator/pause', 'Pause')
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_PAUSE_TOGGLE.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.PauseToggle)
                }
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i className="fa fa-pause"></i>
              </button>
              <button
                className="theia-button secondary"
                title={`${VesEmulatorCommands.INPUT_RESET.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_RESET.id,
                    true
                  )}`}
                onClick={e => this.sendKeypress(EmulatorFunctionKeyCode.Reset)}
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i className="fa fa-refresh"></i>
              </button>
              <button
                className="theia-button secondary"
                title={`${this.state.muted
                  ? nls.localize('vuengine/emulator/unmute', 'Unmute')
                  : nls.localize('vuengine/emulator/mute', 'Mute')
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_AUDIO_MUTE.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.AudioMute)
                }
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i
                  className={
                    this.state.muted ? 'fa fa-volume-off' : 'fa fa-volume-up'
                  }
                ></i>
              </button>
              <button
                className={
                  this.state.lowPower ? 'theia-button' : 'theia-button secondary'
                }
                title={`${VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.ToggleLowPower)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i
                  className={
                    this.state.lowPower
                      ? 'fa fa-battery-quarter'
                      : 'fa fa-battery-full'
                  }
                ></i>
              </button>
            </div>
            <div>
              {(this.preferenceService.get(
                VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE
              ) as boolean) && (
                  <button
                    className="theia-button secondary"
                    title={`${VesEmulatorCommands.INPUT_REWIND.label
                      }${this.vesCommonService.getKeybindingLabel(
                        VesEmulatorCommands.INPUT_REWIND.id,
                        true
                      )}`}
                    onClick={e =>
                      this.sendKeypress(EmulatorFunctionKeyCode.Rewind)
                    }
                    disabled={
                      !this.state.loaded ||
                      this.state.showControls ||
                      this.state.paused
                    }
                  >
                    <i className="fa fa-backward"></i>
                  </button>
                )}
              <button
                className={
                  this.state.slowmotion
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={`${VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.ToggleSlowmotion)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i className="fa fa-eject fa-rotate-90"></i>
              </button>
              <button
                className={
                  this.state.frameAdvance
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={`${VesEmulatorCommands.INPUT_FRAME_ADVANCE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_FRAME_ADVANCE.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.FrameAdvance)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  (this.state.paused && !this.state.frameAdvance)
                }
              >
                <i className="fa fa-step-forward"></i>
              </button>

              <button
                className={
                  this.state.fastForward
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={`${VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.ToggleFastForward)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i className="fa fa-forward"></i>
              </button>
            </div>
            <div>
              <button
                className="theia-button secondary"
                title={`${VesEmulatorCommands.INPUT_SAVE_STATE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_SAVE_STATE.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.SaveState)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i className="fa fa-level-down"></i>{' '}
                <i className="fa fa-bookmark-o"></i>
              </button>
              <button
                className="theia-button secondary"
                title={`${VesEmulatorCommands.INPUT_LOAD_STATE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_LOAD_STATE.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.LoadState)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i className="fa fa-bookmark-o"></i>{' '}
                <i className="fa fa-level-up"></i>
              </button>
              <button
                className="theia-button secondary"
                title={nls.localize(
                  'vuengine/emulator/currentSaveState',
                  'Current Save State'
                )}
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i className="fa fa-bookmark-o"></i> {this.state.saveSlot}
              </button>
              <button
                className="theia-button secondary"
                title={`${VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.StateSlotDecrease)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused ||
                  this.state.saveSlot <= 0
                }
              >
                <i className="fa fa-chevron-down"></i>
              </button>
              <button
                className="theia-button secondary"
                title={`${VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.StateSlotIncrease)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i className="fa fa-chevron-up"></i>
              </button>
            </div>
            <div>
              <button
                className="theia-button secondary"
                title={`${VesEmulatorCommands.INPUT_DUMP_SRAM.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_DUMP_SRAM.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.DumpSram)
                }
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i className="fa fa-microchip"></i>
              </button>
              <button
                className="theia-button secondary"
                title="Delete SRAM and restart"
                onClick={this.deleteSramAndRestart}
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i className="fa fa-trash-o"></i>
              </button>
            </div>
            <div>
              <select
                className="theia-select"
                title={nls.localize('vuengine/emulator/scale', 'Scale')}
                value={this.preferenceService.get(
                  VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE
                )}
                onChange={this.setScale}
                disabled={!this.state.loaded || this.state.showControls}
              >
                {Object.keys(EMULATION_SCALES).map((value, index) => (
                  <option key={index} value={value}>
                    {Object.values(EMULATION_SCALES)[index]}
                  </option>
                ))}
              </select>
              <select
                className="theia-select"
                title={nls.localize(
                  'vuengine/emulator/stereoMode',
                  'Stereo Mode'
                )}
                value={this.preferenceService.get(
                  VesEmulatorPreferenceIds.EMULATOR_BUILTIN_STEREO_MODE
                )}
                onChange={this.setStereoMode}
                disabled={!this.state.loaded || this.state.showControls}
              >
                {Object.keys(EMULATION_STEREO_MODES).map((value, index) => (
                  <option key={index} value={value}>
                    {Object.values(EMULATION_STEREO_MODES)[index]}
                  </option>
                ))}
              </select>
              <select
                className="theia-select"
                title={nls.localize(
                  'vuengine/emulator/emulationMode',
                  'Emulation Mode'
                )}
                value={this.preferenceService.get(
                  VesEmulatorPreferenceIds.EMULATOR_BUILTIN_EMULATION_MODE
                )}
                onChange={this.setEmulationMode}
                disabled={!this.state.loaded || this.state.showControls}
              >
                {Object.keys(EMULATION_MODES).map((value, index) => (
                  <option key={index} value={value}>
                    {Object.values(EMULATION_MODES)[index]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                className="theia-button secondary"
                title={`${VesEmulatorCommands.INPUT_FULLSCREEN.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_FULLSCREEN.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.Fullscreen)
                }
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i className="fa fa-arrows-alt"></i>
              </button>
              <button
                className="theia-button secondary"
                title={`${VesEmulatorCommands.INPUT_SCREENSHOT.label
                  }${this.vesCommonService.getKeybindingLabel(
                    VesEmulatorCommands.INPUT_SCREENSHOT.id,
                    true
                  )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.Screenshot)
                }
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i className="fa fa-camera"></i>
              </button>
              <button
                className={
                  this.state.showControls
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={`${nls.localize(
                  'vuengine/emulator/configureInput',
                  'Configure Input'
                )}${this.vesCommonService.getKeybindingLabel(
                  VesEmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id,
                  true
                )}`}
                onClick={e =>
                  this.sendKeypress(EmulatorFunctionKeyCode.ToggleControlsOverlay)
                }
                disabled={!this.state.loaded}
              >
                <i className="fa fa-keyboard-o"></i>
              </button>
            </div>
          </EmulatorControls>
          <EmulatorWrapper ref={this.wrapperRef}>
            {this.state.loaded && (
              <EmulatorHeader>
                <div>
                  <div>Name:</div>
                  <div>
                    <span>{this.state.romHeader.name}</span>
                  </div>
                </div>
                <div>
                  <div>Code:</div>
                  <div>
                    <span>{this.state.romHeader.code}</span>
                  </div>
                </div>
                <div>
                  <div>Maker:</div>
                  <div>
                    <span>
                      {this.state.romHeader.maker}
                      {ROM_HEADER_MAKERS[this.state.romHeader.maker] && (
                        <> ({ROM_HEADER_MAKERS[this.state.romHeader.maker]})</>
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <div>Version:</div>
                  <div>
                    1.<span>{this.state.romHeader.version}</span>
                  </div>
                </div>
                <div>
                  <div>Size:</div>
                  <div>
                    <span>{this.state.romSize} MBit</span>
                  </div>
                </div>
              </EmulatorHeader>
            )}
            <EmulatorIframeWrapper>
              <div className='focusBlocker' />
              <iframe
                ref={this.iframeRef}
                src={this.resource}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                onLoad={this.startEmulator}
                tabIndex={0}
                allow="gamepad"
              ></iframe>
              <div className='loading'>
                {nls.localize('vuengine/emulator/startingUpEmulator', 'Starting up emulator...')}
              </div>
            </EmulatorIframeWrapper>
          </EmulatorWrapper>
          {this.state.showControls && (
            <EmulatorControlsOverlay
              commandService={this.commandService}
              keybindingRegistry={this.keybindingRegistry}
              vesCommonService={this.vesCommonService}
            />
          )}
        </>
      );
  }

  protected async getResource(): Promise<string> {
    return new Endpoint({ path: '/emulator/index.html' })
      .getRestUrl()
      .toString();
  }

  protected async sendCommand(command: string, data?: any): Promise<void> {
    /* eslint-disable-line */
    this.iframeRef.current?.contentWindow?.postMessage(
      { command, data },
      this.resource
    );

    if (command === 'keyPress' || command === 'keyup') {
      switch (data) {
        case EmulatorFunctionKeyCode.AudioMute:
          this.state.muted = !this.state.muted;
          await this.localStorageService.setData(
            'ves-emulator-state-muted',
            this.state.muted
          );
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
            await this.localStorageService.setData(
              'ves-emulator-state-save-slot',
              this.state.saveSlot
            );
          }
          break;
        case EmulatorFunctionKeyCode.StateSlotIncrease:
          this.state.saveSlot++;
          this.update();
          await this.localStorageService.setData(
            'ves-emulator-state-save-slot',
            this.state.saveSlot
          );
          break;
        case EmulatorFunctionKeyCode.Screenshot:
          this.sendCommand('sendScreenshot');
          break;
        case EmulatorFunctionKeyCode.DumpSram:
          this.sendCommand('sendSram');
          break;
      }
    }
  }

  protected async processScreenshot(
    data: string,
    filename: string
  ): Promise<void> {
    // eslint-disable-next-line deprecation/deprecation
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (workspaceRootUri) {
      const fileUri = workspaceRootUri.resolve('screenshots').resolve(filename);
      this.fileService.writeFile(fileUri, BinaryBuffer.wrap(ia));
    }
  }

  protected async processSram(data: string): Promise<void> {
    // eslint-disable-next-line deprecation/deprecation
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const romPath = await this.getRomPath();
    const sramPath = romPath.replace(new RegExp('.vb$'), '.srm');

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (workspaceRootUri) {
      this.fileService.writeFile(new URI(sramPath), BinaryBuffer.wrap(ia));
    }
  }

  protected setEmulationMode = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ): Promise<void> => {
    e.target.blur();
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_EMULATION_MODE,
      e.target.value,
      PreferenceScope.User
    );
    await this.reload();
  };

  protected setStereoMode = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ): Promise<void> => {
    e.target.blur();
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_STEREO_MODE,
      e.target.value,
      PreferenceScope.User
    );
    await this.reload();
  };

  protected setScale = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ): Promise<void> => {
    e.target.blur();
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE,
      e.target.value,
      PreferenceScope.User
    );
    this.update();
  };

  protected sendCoreOptions(): void {
    const emulationMode = this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_EMULATION_MODE
    ) as string;
    let stereoMode = this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_STEREO_MODE
    ) as string;
    let anaglyphPreset = 'disabled';
    let colorMode = 'black & red';

    if (stereoMode.startsWith('2d')) {
      colorMode = stereoMode.substring(3).replace('-', ' & ').replace('-', ' ');
      anaglyphPreset = 'disabled';
      stereoMode = 'anaglyph';
    } else if (stereoMode.startsWith('anaglyph')) {
      anaglyphPreset = stereoMode
        .substring(9)
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
        menu_driver = "glui"
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
        rewind_enable = ${this.preferenceService.get(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE
      ) as boolean
      }
        rewind_granularity = ${this.preferenceService.get(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY
      ) as number
      }
        rewind_buffer_size = 50
        pause_nonactive = true
        
        audio_mute_enable = ${this.state.muted}
        state_slot = ${this.state.saveSlot}

      ${/* keyboard input */ ''}
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

        ${/* vb usb adapter input */ ''}
        input_player1_up_btn = "0"
        input_player1_down_btn = "1"
        input_player1_left_btn = "2"
        input_player1_right_btn = "3"
        input_player1_a_btn = "4"
        input_player1_b_btn = "5"
        input_player1_select_btn = "7"
        input_player1_start_btn = "6"
        input_player1_l_btn = "9"
        input_player1_r_btn = "8"
        input_player1_l2_btn = "10"
        input_player1_r3_btn = "11"
        input_player1_l3_btn = "12"
        input_player1_r2_btn = "13"

        input_save_state = ${this.toButton(EmulatorFunctionKeyCode.SaveState)}
        input_load_state = ${this.toButton(EmulatorFunctionKeyCode.LoadState)}
        input_state_slot_decrease = ${this.toButton(
        EmulatorFunctionKeyCode.StateSlotDecrease
      )}
        input_state_slot_increase = ${this.toButton(
        EmulatorFunctionKeyCode.StateSlotIncrease
      )}
        input_toggle_fast_forward = ${this.toButton(
        EmulatorFunctionKeyCode.ToggleFastForward
      )}
        input_toggle_slowmotion = ${this.toButton(
        EmulatorFunctionKeyCode.ToggleSlowmotion
      )}
        input_pause_toggle = ${this.toButton(
        EmulatorFunctionKeyCode.PauseToggle
      )}
        input_rewind = ${this.toButton(EmulatorFunctionKeyCode.Rewind)}
        input_frame_advance = ${this.toButton(
        EmulatorFunctionKeyCode.FrameAdvance
      )}
        input_audio_mute = ${this.toButton(EmulatorFunctionKeyCode.AudioMute)}
        input_screenshot = ${this.toButton(EmulatorFunctionKeyCode.Screenshot)}

        auto_screenshot_filename = "true"
        screenshot_directory = "/home/web_user/retroarch/userdata"

        slowmotion_ratio = ${this.preferenceService.get(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO
      ) as number
      }
        fastforward_ratio = ${this.preferenceService.get(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_FAST_FORWARD_RATIO
      ) as number
      }

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
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE
    ) as string;
    const screenResolution = this.getScreenResolution();
    const wrapperHeight =
      this.wrapperRef.current?.offsetHeight || screenResolution.height;
    const wrapperWidth =
      this.wrapperRef.current?.offsetWidth || screenResolution.width;

    if (canvasScale === 'full') {
      const fullSizeCanvasScale = Math.min(
        wrapperHeight / screenResolution.height,
        wrapperWidth / screenResolution.width,
      );
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
      const preferredScale = parseInt(canvasScale.substring(1));
      const maxScale = this.determineMaxCanvasScaleFactor();
      const actualScale = Math.min(maxScale, preferredScale);
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

    return Math.min(
      Math.floor(wrapperHeight / screenResolution.height),
      Math.floor(wrapperWidth / screenResolution.width),
    );
  }

  protected getScreenResolution(): { height: number; width: number } {
    const stereoMode = this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_STEREO_MODE
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
      button = keyCode.substring(3);
    } else if (keyCode.startsWith('Arrow')) {
      button = keyCode.substring(5);
    }
    return button.toLowerCase();
  }

  protected deleteSramAndRestart = async () => {
    this.reload(true);
  };

  // TODO: Investigate why the clean command does not work
  protected cleanStorage = async () => {
    const romPath = await this.getRomPath();
    const dbName = `RetroArch ${romPath}`;
    console.info(`Attempting to delete Indexed DB "${dbName}"`);
    localStorage.clear();
    const req = indexedDB.deleteDatabase(dbName);
    req.onsuccess = () => {
      console.info('Deleted database successfully');
    };
    req.onerror = () => {
      console.info("Couldn't delete database");
    };
    req.onblocked = () => {
      console.info(
        "Couldn't delete database due to the operation being blocked"
      );
    };
  };
}
