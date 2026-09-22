import { CommandService, Disposable, Emitter, MessageService, nls, PreferenceService } from '@theia/core';
import {
  ApplicationShell,
  HoverService,
  KeybindingRegistry,
  LocalStorageService,
  Message,
  NavigatableWidget
} from '@theia/core/lib/browser';
import { Endpoint } from '@theia/core/lib/browser/endpoint';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { TabBar, Widget } from '@lumino/widgets';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import * as React from 'react';
import {
  Camera,
  Cpu,
  FloppyDisk,
  Keyboard,
  Monitor,
  SpeakerHigh,
  Trophy,
} from '@phosphor-icons/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent, FileChangeType } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { crc32 } from 'crc';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesKeybindingService } from '../../core/browser/ves-keybinding-service';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import { VesEmulatorRumblePack } from './ves-emulator-rumble';
import { VueportRumblePack } from 'vueport-core/lib/common/emulator-rumble';
import { formatRomId } from 'vueport-core/lib/common/emulator-cheat-database';
import { CachedAnswer, CachedAnswerRead } from 'vueport-core/lib/common/emulator-cached-answer';
import { EmulatorCompanionLocation } from 'vueport-core/lib/common/emulator-sram';
import { VueportInputBindings, VueportSettings } from 'vueport-core/lib/common/emulator-settings';
import { VueportHover } from 'vueport-core/lib/browser/components/kit/KitContext';
import { VesEmulatorSettings } from './ves-emulator-settings';
import { VesEmulatorBindings } from './ves-emulator-bindings';
import {
  buildDisplayMode,
  VB_FRAME_RATE,
  VbAnaglyphPalette,
  DisplayMode,
  VbPalette,
  VbRenderingMode,
} from 'vueport-core/lib/common/vb-constants';
import { ProfileResult, Speed } from 'vueport-core/lib/common/vb-protocol';
import InputSettings from 'vueport-core/lib/browser/components/settings/InputSettings';
import { Emulator } from 'vueport-core/lib/browser/components/Emulator';
import { EmulatorControlStrip } from 'vueport-core/lib/browser/components/EmulatorControlStrip';
import {
  freshSaveRam,
  saveRamFileSize,
  saveRamWindowBytes,
  VesEmulatorSaveStateIdentity,
} from 'vueport-core/lib/common/emulator-save-state';
import { EmulatorInputController, GAMEPAD_KEY_TO_VB_KEY } from 'vueport-core/lib/browser/emulator-input';
import { EmulatorTimeControl, EmulatorTimeSettings } from 'vueport-core/lib/browser/emulator-time-control';
import { VesEmulatorNotifications } from './ves-emulator-notifications';
import { VesEmulatorStorage } from './ves-emulator-storage';
import { VueportNotifications, VueportStorage } from 'vueport-core/lib/common/emulator-host';
import { AnaglyphSwatch, PaletteSwatch } from 'vueport-core/lib/browser/components/EmulatorPalettes';
import DisplaySettings from 'vueport-core/lib/browser/components/settings/DisplaySettings';
import EmulationSettings from 'vueport-core/lib/browser/components/settings/EmulationSettings';
import SaveDataSettings from 'vueport-core/lib/browser/components/settings/SaveDataSettings';
import ScreenshotSettings from 'vueport-core/lib/browser/components/settings/ScreenshotSettings';
import SoundSettings from 'vueport-core/lib/browser/components/settings/SoundSettings';
import VbColorSettings from 'vueport-core/lib/browser/components/settings/VbColorSettings';
import {
  DISPLAY_SETTINGS,
  EMULATION_SETTINGS,
  SAVE_DATA_SETTINGS,
  SCREENSHOT_SETTINGS,
  SOUND_SETTINGS,
  VB_COLOR_SETTINGS,
} from 'vueport-core/lib/browser/components/settings/settings-index';
import EmulatorScreenPreview from 'vueport-core/lib/browser/components/EmulatorScreenPreview';
import EmulatorAchievementsSettings from 'vueport-core/lib/browser/components/EmulatorAchievementsSettings';
import TitleBar from 'vueport-core/lib/browser/components/TitleBar';
import {
  SettingsTabSpec,
  SettingsWindow,
} from 'vueport-core/lib/browser/components/SettingsWindow';
import { VbColorIcon } from 'vueport-core/lib/browser/components/kit/VbColorIcon';
import { BreakpointManager } from '@theia/debug/lib/browser/breakpoint/breakpoint-manager';
import { EditorManager } from '@theia/editor/lib/browser';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { EsSoundSnapshot } from 'vueport-core/lib/browser/emulator-essound-player';
import { VB_DEFAULT_DISPLAY_MODE } from 'vueport-core/lib/common/vb-constants';
import { CompanionRom } from 'vueport-core/lib/browser/emulator-companion-files';
import { SaveStateEntry, SaveStateMachine, SaveStateStore } from 'vueport-core/lib/browser/emulator-save-state-store';
import { VesEmulatorCompanionFiles } from './ves-emulator-companion-files';
import { readBuildModeFromMap, readElf, readElfPathFromMap } from 'vueport-core/lib/browser/core/emulator-elf';
import {
  makeSourcePathMapper,
  parseDwarfLineTable,
  recordedPathFor,
  romOffsetOf,
  sourcePathCandidates,
  VesLineTable,
  VesSourceRoot,
} from 'vueport-core/lib/browser/core/emulator-line-table';
import {
  findFunctionAt,
  functionDisplayName,
  indexElfSymbols,
  SymbolIndex,
} from 'vueport-core/lib/browser/core/emulator-symbols';
import { toFirefoxProfile } from 'vueport-core/lib/common/emulator-profile';
import { Core, Sim } from 'vueport-core/lib/browser/core/vb-core';
import { AreaLayout, VueportDock, VueportDockLayout } from 'vueport-core/lib/browser/panels/emulator-dock';
import { EmulatorPanelType } from 'vueport-core/lib/browser/panels/emulator-panel';
import EmulatorSaveStates from 'vueport-core/lib/browser/components/EmulatorSaveStates';
import EmulatorCheats from 'vueport-core/lib/browser/components/EmulatorCheats';
import EmulatorColors from 'vueport-core/lib/browser/components/EmulatorColors';
import EmulatorMacros from 'vueport-core/lib/browser/components/EmulatorMacros';
import EmulatorPatches from 'vueport-core/lib/browser/components/EmulatorPatches';
import EmulatorAchievements from 'vueport-core/lib/browser/components/EmulatorAchievements';
import { CheatFinder } from 'vueport-core/lib/browser/emulator-cheat-finder';
import { MacroActivity, MacroStore } from 'vueport-core/lib/browser/emulator-macro-store';
import { MoviePlayer } from 'vueport-core/lib/browser/emulator-movie-player';
import { PatchStore } from 'vueport-core/lib/browser/emulator-patch-store';
import { ColorStore } from 'vueport-core/lib/browser/emulator-vb-color-store';
import { VbcPatchDocument } from 'vueport-core/lib/common/emulator-vb-color';
import { RetroAchievementsService } from 'vueport-core/lib/browser/emulator-retroachievements';
import {
  VesEmulatorTheiaRetroAchievementsCredentials,
  VesEmulatorRetroAchievementsTransport,
} from './ves-emulator-retroachievements';
import { CheatStore } from 'vueport-core/lib/browser/emulator-cheat-store';
import {
  EMULATOR_ACTION_COMMANDS,
  resetLayoutConfirmation,
  EmulatorCommands,
} from 'vueport-core/lib/browser/emulator-commands';
import { EmulatorCoreService, EmulatorSession } from 'vueport-core/lib/browser/emulator-core-service';
import { EsSoundPlayer } from 'vueport-core/lib/browser/emulator-essound-player';
import {
  EMPTY_ROM_HEADER,
  parseRomHeader,
  romSizeInMBit,
  ROM_HEADER_OFFSET_FROM_END,
  CUSTOM_PALETTE_PREFIX,
  emulationAnaglyphPalettes,
  emulationPalettes,
  EmulatorAction,
  EmulatorGamePadKeyCode,
  EmulatorMode,
  EmulatorRomStatus,
  formatColor,
  resolveVbHardwareMode,
  VbHardwareMode,
  resolveAnaglyphPalette,
  resolvePalette,
  RomHeader,
} from 'vueport-core/lib/browser/emulator-types';
import { VES_EMULATOR_WIDGET_ID } from './ves-emulator-types';

function ownedCopy(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export const VesEmulatorWidgetOptions = Symbol('VesEmulatorWidgetOptions');

export interface VesEmulatorWidgetOptions {
  uri: string;
  instanceId?: string;
  player?: number;
}

export type VesEmulatorSettingsTab =
  | 'display'
  | 'input'
  | 'vbcolor'
  | 'sound'
  | 'emulation'
  | 'saveData'
  | 'screenshots'
  | 'achievements';

export interface vesEmulatorWidgetState {
  loaded: boolean;
  paused: boolean;
  lowPower: boolean;
  muted: boolean;
  showSaveStates: boolean;
  slowmotion: boolean;
  fastForward: boolean;
  frameAdvance: boolean;
  showControls: boolean;
  showPalettes: boolean;
  showPreferences: boolean;
  showCheats: boolean;
  showMacros: boolean;
  showPatches: boolean;
  showColors: boolean;
  showAchievements: boolean;
  saveStateExists: boolean;
  romHeader: RomHeader;
  romSize: number;
  mode: EmulatorMode;
}

const VES_EMULATOR_STUDIO_LAYOUT: AreaLayout = {
  type: 'split-area',
  orientation: 'horizontal',
  sizes: [50, 50],
  children: [
    {
      type: 'split-area',
      orientation: 'vertical',
      sizes: [70, 30],
      children: [
        { type: 'tab-area', panels: [EmulatorPanelType.SCREEN], currentIndex: 0 },
        {
          type: 'tab-area',
          panels: [
            EmulatorPanelType.ROM_INFO,
            EmulatorPanelType.MEMORY,
            EmulatorPanelType.TERMINAL,
          ],
          currentIndex: 0,
        },
      ],
    },
    {
      type: 'tab-area',
      panels: [
        EmulatorPanelType.MEMORY_POOLS,
        EmulatorPanelType.ACTORS,
        EmulatorPanelType.VIP_CHARACTERS,
        EmulatorPanelType.VIP_BGMAPS,
        EmulatorPanelType.VIP_WORLDS,
        EmulatorPanelType.VIP_OBJECTS,
        EmulatorPanelType.REGISTERS,
      ],
      currentIndex: 0,
    },
  ],
};

@injectable()
export class VesEmulatorWidget extends ReactWidget implements NavigatableWidget {
  @inject(ApplicationShell)
  protected readonly shell!: ApplicationShell;
  @inject(CommandService)
  readonly commandService!: CommandService;
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer!: EnvVariablesServer;
  @inject(BreakpointManager)
  protected readonly breakpointManager!: BreakpointManager;
  @inject(EditorManager)
  protected readonly editorManager!: EditorManager;
  @inject(FileService)
  protected readonly fileService!: FileService;
  @inject(VesBuildPathsService)
  protected readonly vesBuildPathsService!: VesBuildPathsService;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
  @inject(LocalStorageService)
  protected readonly localStorageService!: LocalStorageService;
  @inject(HoverService)
  protected readonly hoverService!: HoverService;
  @inject(MessageService)
  protected readonly messageService!: MessageService;
  @inject(VesProjectService)
  protected readonly vesProjectService!: VesProjectService;
  @inject(PreferenceService)
  readonly preferenceService!: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService!: VesBuildService;
  @inject(VesCommonService)
  readonly vesCommonService!: VesCommonService;
  @inject(VesKeybindingService)
  readonly vesKeybindingService!: VesKeybindingService;
  @inject(EmulatorCoreService)
  protected readonly vesEmulatorCoreService!: EmulatorCoreService;
  @inject(VesEmulatorWidgetOptions)
  protected readonly options!: VesEmulatorWidgetOptions;
  @inject(VesRumblePackService)
  protected readonly vesRumblePackService!: VesRumblePackService;
  @inject(WorkspaceService)
  protected readonly workspaceService!: WorkspaceService;

  protected static readonly colorPatches = new Map<string, Promise<unknown>>();

  static readonly ID = VES_EMULATOR_WIDGET_ID;
  static readonly LABEL = nls.localize(
    'vuengine/emulator/emulator',
    'Emulator'
  );

  status: EmulatorRomStatus = EmulatorRomStatus.CHECKING;

  static readonly RESOLUTIONX = 384;
  static readonly RESOLUTIONY = 224;

  static readonly DEFAULT_VOLUME = 1;

  static readonly ACTIONS_WHILE_PAUSED: EmulatorAction[] = [
    EmulatorAction.PauseToggle,
    EmulatorAction.Fullscreen,
    EmulatorAction.AudioMute,
    EmulatorAction.Reset,
    EmulatorAction.Screenshot,
    EmulatorAction.ToggleControlsOverlay,
  ];

  protected session?: EmulatorSession;
  core?: Core;
  sim?: Sim;
  linkedPeer?: VesEmulatorWidget;
  protected linkHost?: VesEmulatorWidget;
  protected ownsSession = true;
  dock: VueportDock;
  protected cheats: CheatStore;
  protected cheatFinder: CheatFinder;
  protected macros: MacroStore;
  protected moviePlayer: MoviePlayer;
  protected patches: PatchStore;
  protected colors: ColorStore;
  retroAchievements: RetroAchievementsService;
  esSound: EsSoundPlayer;
  protected companions!: VesEmulatorCompanionFiles;
  saveStates!: SaveStateStore;
  protected configRoot: string | undefined;
  protected rumbleForwarding?: Disposable;
  protected rumbleSpecWatch?: Disposable;
  protected readonly symbols = new CachedAnswer<SymbolIndex>(
    () => this.readSymbols(), VesEmulatorWidget.SYMBOL_RETRY_DELAY
  );

  protected readonly lineTable = new CachedAnswer<VesLineTable>(
    () => this.readLineTable(), VesEmulatorWidget.SYMBOL_RETRY_DELAY
  );

  protected readonly sourceFiles = new Map<string, string | undefined>();

  protected storage: VueportStorage;
  protected notifications: VueportNotifications;
  rumblePack: VueportRumblePack;
  settings: VueportSettings;
  bindings: VueportInputBindings;

  protected time: EmulatorTimeControl;

  get rewinding(): boolean {
    return this.time.rewinding;
  }

  isRewindEnabled(): boolean {
    return this.time.isRewindEnabled();
  }

  stopRewinding(): void {
    this.time.stopRewinding();
  }

  protected _emulationSpeed?: Speed;
  protected readonly onDidChangeEmulationSpeedEmitter = new Emitter<Speed | undefined>();
  readonly onDidChangeEmulationSpeed = this.onDidChangeEmulationSpeedEmitter.event;

  protected readonly onDidChangeModeEmitter = new Emitter<EmulatorMode>();
  readonly onDidChangeMode = this.onDidChangeModeEmitter.event;

  get emulationSpeed(): Speed | undefined {
    return this._emulationSpeed;
  }

  protected setEmulationSpeed(speed: Speed | undefined): void {
    this._emulationSpeed = speed;
    this.onDidChangeEmulationSpeedEmitter.fire(speed);
  }

  get paused(): boolean {
    return this.state.paused;
  }

  get fastForward(): boolean {
    return this.state.fastForward;
  }

  get slowMotion(): boolean {
    return this.state.slowmotion;
  }

  get romLoaded(): boolean {
    return this.state.loaded;
  }

  timeSettings(): EmulatorTimeSettings {
    return {
      fastForwardRatio: this.settings.get('fastForwardRatio'),
      slowMotionRatio: this.settings.get('slowMotionRatio'),
      rewindEnabled: this.settings.get('rewindEnabled'),
      rewindGranularity: this.settings.get('rewindGranularity'),
      rewindBufferBytes: this.settings.get('rewindBufferSize') * 1024 * 1024,
    };
  }

  readonly hover: VueportHover = {
    show: (target, content) => this.hoverService.requestHover({ content, target, position: 'top' }),
    hide: () => this.hoverService.cancelHover(),
  };

  runCommand(id: string): void {
    this.commandService.executeCommand(id, this);
  }

  onDidChange(): void {
    this.update();
  }

  onError(message: string): void {
    this.handleCoreError(message);
  }

  protected input: EmulatorInputController;

  get lowPower(): boolean {
    return this.state.lowPower;
  }

  isAcceptingInput(): boolean {
    return this.state.loaded && !this.state.showPreferences;
  }

  protected get saveStateIdentity(): VesEmulatorSaveStateIdentity {
    return { romIdentity: this.romIdentity, romSize: this.state.romSize };
  }

  protected romId: string | undefined;
  protected sourceRom: Uint8Array | undefined;
  protected romIdentity = new Uint8Array(32);

  state: vesEmulatorWidgetState = {
    loaded: false,
    paused: false,
    lowPower: false,
    muted: false,
    showSaveStates: false,
    slowmotion: false,
    fastForward: false,
    frameAdvance: false,
    showControls: false,
    showPalettes: false,
    showPreferences: false,
    showCheats: false,
    showMacros: false,
    showPatches: false,
    showColors: false,
    showAchievements: false,
    saveStateExists: false,
    romHeader: EMPTY_ROM_HEADER,
    romSize: 0,
    mode: EmulatorMode.DEBUG,
  };

  @postConstruct()
  protected init(): void {
    this.buildLayout();
    this.doInit();
    this.bindEvents();

    const label = this.options
      ? this.vesCommonService.basename(this.options.uri)
      : VesEmulatorWidget.LABEL;
    const caption = this.options
      ? this.options.uri.replace('file://', '')
      : VesEmulatorWidget.LABEL;

    this.id = this.options?.instanceId
      ? `${VesEmulatorWidget.ID}:${this.options.instanceId}`
      : VesEmulatorWidget.ID;
    this.title.label = label;
    this.title.caption = caption;
    this.title.iconClass = 'codicon codicon-play';
    this.title.closable = true;
  }

  protected buildLayout(): void {
    this.addClass('vueport-widget');
    this.scrollOptions = undefined;

    const instanceId = this.options?.instanceId ?? 'default';
    this.storage = new VesEmulatorStorage(this.fileService, this.workspaceService);
    this.notifications = new VesEmulatorNotifications(this.messageService);
    this.rumblePack = new VesEmulatorRumblePack(this.vesRumblePackService);
    this.settings = new VesEmulatorSettings(this.preferenceService);
    this.bindings = new VesEmulatorBindings(this.vesKeybindingService, this.keybindingRegistry);
    this.companions = new VesEmulatorCompanionFiles(
      this.storage,
      () => this.settings.get('companionFiles'),
      () => this.configRoot
    );
    this.saveStates = new SaveStateStore(this.storage, this.companions);
    this.toDispose.push(Disposable.create(() => this.saveStates.dispose()));
    this.toDispose.push(this.saveStates.onDidChange(() => {
      const exists = this.saveStates.latestManual !== undefined;
      if (exists !== this.state.saveStateExists) {
        this.state.saveStateExists = exists;
      }
      this.update();
    }));
    this.cheats = new CheatStore(this.storage);
    this.toDispose.push(Disposable.create(() => this.cheats.dispose()));
    this.toDispose.push(this.cheats.onDidChange(() => this.update()));
    this.cheatFinder = new CheatFinder();
    this.toDispose.push(this.onDidChangeEmulationSpeedEmitter);
    this.toDispose.push(this.onDidChangeModeEmitter);
    this.esSound = new EsSoundPlayer(this.storage);
    this.toDispose.push(Disposable.create(() => this.esSound.dispose()));
    this.macros = new MacroStore(this.storage, undefined, () => this.globalMacrosPath);
    this.toDispose.push(this.macros.onDidChange(() => this.update()));
    this.moviePlayer = new MoviePlayer();
    this.toDispose.push(this.moviePlayer.onDidChange(() => this.update()));
    this.patches = new PatchStore(this.storage);
    this.toDispose.push(this.patches.onDidChange(change => {
      if (change.affectsRom) {
        this.refreshRomHeader();
      }
      this.update();
    }));
    this.colors = this.buildColorStore();
    this.toDispose.push(this.colors.onDidChange(() => this.update()));
    this.retroAchievements = new RetroAchievementsService(
      new VesEmulatorRetroAchievementsTransport(),
      new VesEmulatorTheiaRetroAchievementsCredentials(this.localStorageService),
      this.notifications,
      () => this.settings.get('retroAchievementsEnabled'),
    );
    this.toDispose.push(this.retroAchievements);
    this.retroAchievements.setHardcoreControls({
      isEnabled: () => this.settings.get('retroAchievementsHardcore'),
      persist: enabled => this.settings.set('retroAchievementsHardcore', enabled),
      enter: () => this.enterHardcoreDiscipline(),
    });
    this.retroAchievements.restore().catch(() => undefined);
    this.dock = new VueportDock(
      instanceId,
      {
        cancelForeignDrag: () => { (this.shell as unknown as { dragState?: unknown }).dragState = undefined; },
        defaultLayout: VES_EMULATOR_STUDIO_LAYOUT,
        isProfiling: () => this.profiling,
        toggleProfiling: () => this.commandService.executeCommand(EmulatorCommands.PROFILE_START.id),
        isPaused: () => this.state.paused,
        setPaused: (paused: boolean) => {
          if (paused !== this.state.paused) {
            this.performAction(EmulatorAction.PauseToggle);
          }
        },
        lineTable: () => this.loadLineTable(),
        readSource: path => this.readSourceFile(path),
        readPanelPreferences: () => this.settings.get('debugPanelState'),
        writePanelPreferences: state => {
          this.settings.set('debugPanelState', state).catch(() => undefined);
        },
      },
      this.rumblePack,
      this.esSound,
      () => this.loadSymbols()
    );
    this.input = new EmulatorInputController(this, this.bindings);
    this.macros.setInput(this.input);
    this.input.setMacroHook(this.macros);
    this.time = new EmulatorTimeControl(this);

    this.toDispose.push(this.dock.onDidRequestAddPanel(tabBar =>
      this.commandService.executeCommand(EmulatorCommands.ADD_PANEL.id, this, tabBar)
    ));

    this.toDispose.push(this.dock.onDidRequestResetLayout(() =>
      this.commandService.executeCommand(EmulatorCommands.RESET_LAYOUT.id, this)
    ));

    this.toDispose.push(this.dock.onDidChangeLayout(() => {
      this.persistDockLayout();
      this.applyRumbleForwarding();
    }));
  }

  togglePanel(kind: EmulatorPanelType): void {
    this.dock.togglePanel(kind);
  }

  addPanelTo(kind: EmulatorPanelType, tabBar: TabBar<Widget>): void {
    this.dock.addPanelTo(kind, tabBar);
  }

  isPanelOpen(kind: EmulatorPanelType): boolean {
    return this.dock.isPanelOpen(kind);
  }

  async resetLayout(): Promise<void> {
    const agreed = await this.notifications.confirm(resetLayoutConfirmation());
    if (!agreed) {
      return;
    }
    this.dock.resetLayout();
    this.persistDockLayout();
  }

  protected get dockLayoutStorageKey(): string {
    return 'emulator-dock-layout';
  }

  protected async restoreDockLayout(): Promise<void> {
    const stored = await this.localStorageService.getData<VueportDockLayout>(
      this.dockLayoutStorageKey
    );
    this.dock.applySerializedLayout(stored);
  }

  protected persistDockLayout(): void {
    if (this.state.mode !== EmulatorMode.DEBUG) {
      return;
    }
    this.localStorageService.setData(this.dockLayoutStorageKey, this.dock.serializeLayout());
  }

  setMode(mode: EmulatorMode): void {
    if (this.state.mode === mode) {
      return;
    }
    this.state.mode = mode;
    this.localStorageService.setData('ves-emulator-state-mode', mode);
    this.dock.setPlayMode(mode === EmulatorMode.PLAY);
    if (mode === EmulatorMode.PLAY) {
      this.dock.showScreenOnly();
    } else {
      this.restoreDockLayout();
    }
    this.update();
    this.onDidChangeModeEmitter.fire(mode);
  }

  update(): void {
    super.update();
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
    await this.settings.ready;
    await this.resolveGlobalMacrosPath();
    await this.initState();

    await this.restoreDockLayout();
    this.dock.setPlayMode(this.state.mode === EmulatorMode.PLAY);
    if (this.state.mode === EmulatorMode.PLAY) {
      this.dock.showScreenOnly();
    }

    await this.checkRomExists();

    if (this.status === EmulatorRomStatus.EXISTS) {
      await this.startEmulator();
    }

    setTimeout(() => {
      this.update();
    }, 50);
  }

  protected onCloseRequest(msg: Message): void {
    this.saveSaveRam().finally(() => this.disposeSession());
    super.onCloseRequest(msg);
  }

  protected disposeSession(): void {
    this.time.stopRewinding();
    this.rumbleForwarding?.dispose();
    this.rumbleForwarding = undefined;
    this.rumbleSpecWatch?.dispose();
    this.rumbleSpecWatch = undefined;
    this.rumblePack.forwarding = false;
    this.rumblePack.clearEmulatedTraffic();
    if (this.session) {
      if (this.ownsSession) {
        this.vesEmulatorCoreService.disposeSession(this.session);
      }
      this.session = undefined;
    }
    this.sim = undefined;
    this.core = undefined;
    this.setEmulationSpeed(undefined);
    this.dock.setSim(undefined);
    this.cheats.setSim(undefined);
    this.cheatFinder.setSim(undefined);
    this.colors.setSim(undefined);
    this.moviePlayer.stop().catch(() => undefined);
    this.patches.unload();
    this.esSound.setSim(undefined);
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

  isLinked(): boolean {
    return !!this.session?.mirror;
  }

  linkStatus(): 'idle' | 'relinkable' | 'waiting' | 'linked' {
    if (this.isLinked()) {
      return 'linked';
    }
    return this.linkedPeer ? 'relinkable' : 'idle';
  }

  canInspectPeer(): boolean {
    return this.dock.hasPeerSim;
  }

  isInspectingPeer(): boolean {
    return this.dock.inspecting === 'peer';
  }

  getLinkedPeer(): VesEmulatorWidget | undefined {
    return this.linkedPeer;
  }

  setLinkedPeer(peer: VesEmulatorWidget): void {
    this.linkedPeer = peer;
    this.toDispose.push(peer.onDidDispose(() => this.handlePeerClosed()));
  }

  protected async handlePeerClosed(): Promise<void> {
    this.linkedPeer = undefined;
    if (!this.isDisposed && (this.isLinked() || this.isLinkGuest())) {
      await this.leaveLink();
    }
  }

  protected baseLabel(): string {
    return this.options
      ? this.vesCommonService.basename(this.options.uri)
      : VesEmulatorWidget.LABEL;
  }

  setPlayerLabel(player: number): void {
    this.title.label = `${this.baseLabel()} (P${player})`;
  }

  protected resetPlayerLabel(): void {
    this.title.label = this.baseLabel();
  }

  async startLink(): Promise<void> {
    if (!this.session || !this.sourceRom) {
      return;
    }
    this.setPlayerLabel(1);
    await this.session.attachMirror(ownedCopy(this.patchedRom()));
    this.update();
  }

  async lendMirrorSeat(): Promise<EmulatorSession | undefined> {
    if (!this.session || !this.sourceRom) {
      return undefined;
    }
    await this.session.attachMirror(ownedCopy(this.patchedRom()));
    this.update();
    return this.session;
  }

  async linkTo(host: VesEmulatorWidget): Promise<void> {
    this.linkHost = host;
    this.setPlayerLabel(2);
    await this.rebuildSession();
  }

  isLinkGuest(): boolean {
    return !!this.linkHost;
  }

  async unlinkFromPeer(): Promise<void> {
    const peer = this.linkedPeer;
    if (!peer || !(this.isLinked() || this.isLinkGuest())) {
      return;
    }
    const [guest, host] = this.isLinkGuest() ? [this, peer] : [peer, this];
    await guest.leaveLink();
    await host.leaveLink();
  }

  async leaveLink(): Promise<void> {
    if (this.linkHost) {
      this.linkHost = undefined;
      this.resetPlayerLabel();
      await this.rebuildSession();
      return;
    }
    if (!this.isLinked()) {
      return;
    }
    this.resetPlayerLabel();
    await this.session?.detachMirror();
    this.update();
  }

  protected async rebuildSession(): Promise<void> {
    let snapshot: ArrayBuffer | undefined;
    let cartRam: ArrayBuffer | undefined;
    if (this.state.loaded && this.sim) {
      snapshot = await this.sim.saveState();
      cartRam = await this.sim.getCartRam((await this.sim.cartRamInfo()).used);
    }
    await this.startEmulator(snapshot, cartRam);
  }

  async reload(deleteSram = false): Promise<void> {
    if (!this.sim) {
      return;
    }
    if (deleteSram) {
      const saveRamPath = await this.getSaveRamPath();
      if (await this.storage.exists(saveRamPath)) {
        await this.storage.delete(saveRamPath);
      }
    } else {
      await this.saveSaveRam();
    }

    await this.initState();
    await this.loadRom();
    await this.loadSaveRam();
    await this.attachSaveStates();
    await this.resetSim();
    await this.input.applyKeys();
    await this.core?.run();
    this.state.loaded = true;
    this.update();
  }

  protected async initState(): Promise<void> {
    this.state.muted =
      (await this.localStorageService.getData('ves-emulator-state-muted')) || false;
    this.state.mode =
      (await this.localStorageService.getData<EmulatorMode>('ves-emulator-state-mode'))
      || EmulatorMode.DEBUG;
    this.input.refreshBindings();
  }

  protected bindEvents(): void {
    const resourceUri = this.getResourceUri();
    this.toDispose.pushAll([
      this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
        const romRebuilt = fileChangesEvent.changes.some(change =>
          change.type !== FileChangeType.DELETED && resourceUri && change.resource.isEqual(resourceUri)
        );
        if (romRebuilt) {
          if (this.sim) {
            this.reload();
          } else {
            this.status = EmulatorRomStatus.EXISTS;
            this.startEmulator();
          }
          return;
        }

        if (fileChangesEvent.changes.some(change => change.resource.path.ext === '.state')) {
          this.saveStates.refresh().catch(() => undefined);
        }
      }),
      this.keybindingRegistry.onKeybindingsChanged(() => {
        this.input.refreshBindings();
        this.update();
      }),
      this.settings.onDidChange(setting => {
        if ([
          'renderingMode', 'palette', 'anaglyphPalette',
          'customPalettes', 'customAnaglyphPalettes',
        ].includes(setting)) {
          this.applyDisplayMode();
          this.update();
        } else if (setting === 'scale') {
          this.applyScale();
          this.update();
        } else if ([
          'rewindEnabled', 'rewindGranularity', 'rewindBufferSize',
        ].includes(setting)) {
          this.time.applyRewindSettings();
          // The toolbar button greys out when the feature is off.
          this.update();
        } else if (['slowMotionRatio', 'fastForwardRatio'].includes(setting)) {
          this.time.applySpeed();
        } else if (setting === 'player2SameControls') {
          // Which set of mappings this emulator answers to has changed.
          this.input.refreshBindings();
          this.update();
        } else if (['hardwareMode', 'vbcSupportEnabled'].includes(setting)) {
          this.applyHardwareConfiguration();
        }
      }),
      this.rumblePack.onDidChangeConnected(() => this.applyRumbleForwarding()),
    ]);
  }

  protected async applyRumbleForwarding(): Promise<void> {
    const sim = this.sim;
    const wanted = sim !== undefined && (
      this.rumblePack.connected
      || this.dock.isPanelVisible(EmulatorPanelType.RUMBLE_PACK)
    );
    if (wanted === (this.rumbleForwarding !== undefined)) {
      return;
    }

    if (!wanted) {
      this.rumbleForwarding?.dispose();
      this.rumbleForwarding = undefined;
      this.rumbleSpecWatch?.dispose();
      this.rumbleSpecWatch = undefined;
      this.rumblePack.forwarding = false;
      this.rumblePack.emulatedSpec = undefined;
      if (sim) {
        await Promise.all([
          sim.setLinkCapture(false),
          sim.setPointerWatch(0),
        ]).catch(() => {
          // NOOP
        });
      }
      return;
    }

    this.rumbleForwarding = sim!.onLink(bytes => this.forwardToRumblePack(bytes));
    try {
      await sim!.setLinkCapture(true);
      this.rumblePack.forwarding = true;
      this.applyRumbleSpecWatch(sim!).catch(error =>
        console.error('[emulator] rumble spec watch could not be set up:', error)
      );
    } catch (error) {
      this.rumbleForwarding.dispose();
      this.rumbleForwarding = undefined;
      this.rumblePack.forwarding = false;
      console.error('[emulator] rumble pack forwarding could not be enabled:', error);
    }
  }

  protected async applyRumbleSpecWatch(sim: Sim): Promise<void> {
    const symbols = await this.loadSymbols();
    if (symbols?.rumbleSpecPointer === undefined || this.sim !== sim || !this.rumbleForwarding) {
      return;
    }

    this.rumbleSpecWatch = sim.onPointerWrite(values => this.resolveRumbleSpec(symbols, values));
    try {
      await sim.setPointerWatch(symbols.rumbleSpecPointer);
    } catch (error) {
      this.rumbleSpecWatch.dispose();
      this.rumbleSpecWatch = undefined;
      console.error('[emulator] rumble spec watch could not be enabled:', error);
    }
  }

  protected resolveRumbleSpec(symbols: SymbolIndex, values: number[]): void {
    for (const value of values) {
      const address = value >>> 0;
      this.rumblePack.emulatedSpec = address === 0
        ? undefined
        : { address, name: symbols.rumbleSpecNames.get(address) };
    }
  }

  isProfiling(): boolean {
    return this.profiling;
  }

  profiling = false;

  async startProfiling(): Promise<void> {
    if (!this.sim || this.profiling) {
      return;
    }
    await this.sim.startProfileRecording();
    this.profiling = true;
    this.update();
    this.notifications.info(nls.localize(
      'vuengine/emulator/profilingStarted',
      'Profiling. Play the part you want to measure, then stop profiling to export it.'
    ));
  }

  async stopProfiling(): Promise<void> {
    const sim = this.sim;
    if (!sim || !this.profiling) {
      return;
    }
    this.profiling = false;
    this.update();

    try {
      const recording = await sim.stopProfileRecording();
      if (recording.chunks === 0) {
        this.notifications.warn(nls.localize(
          'vuengine/emulator/profilingNothing', 'Nothing was recorded.'
        ));
        return;
      }

      const progress = await this.notifications.progress(
        nls.localize('vuengine/emulator/profilingReplaying', 'Replaying to collect the profile…')
      );
      let result;
      try {
        result = await sim.replayProfile(recording);
      } finally {
        progress.cancel();
      }

      const uri = await this.writeProfile(result);
      this.notifications.info(nls.localize(
        'vuengine/emulator/profilingWritten',
        'Profiled {0} instructions over {1} s of play into {2}. Open it at profiler.firefox.com.',
        result.instructions.toLocaleString(),
        (recording.chunks / VB_FRAME_RATE).toFixed(1),
        this.vesCommonService.basename(uri)
      ));
      if (result.resets > 0) {
        this.notifications.warn(nls.localize(
          'vuengine/emulator/profilingResets',
          'The machine restarted {0} times while recording, so the profile covers more than one run.',
          result.resets
        ));
      }
    } catch (error) {
      this.notifications.error(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  protected async writeProfile(result: ProfileResult): Promise<URI> {
    const symbols = await this.loadSymbols();
    const romUri = this.getResourceUri();
    const romSize = this.state.romSize * 131072;
    const product = await this.vesProjectService.getProjectName()
      .catch(() => undefined) || romUri!.path.name;

    const profile = toFirefoxProfile(
      result.nodes.map((node, id) => ({ ...node, id, children: new Map() })),
      address => {
        const symbol = symbols && findFunctionAt(symbols, address, romSize);
        return {
          name: symbol
            ? functionDisplayName(symbols!, symbol.name)
            : `0x${(address >>> 0).toString(16).toUpperCase().padStart(8, '0')}`,
        };
      },
      product
    );

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const uri = romUri!.parent.resolve(`${romUri!.path.name}-${stamp}.profile.json`);
    await this.fileService.writeFile(uri, BinaryBuffer.fromString(JSON.stringify(profile)));
    return uri;
  }

  loadSymbols(): Promise<SymbolIndex | undefined> {
    return this.symbols.get();
  }

  loadLineTable(): Promise<VesLineTable | undefined> {
    return this.lineTable.get();
  }

  // breakpoints from editors
  protected async sourceRoots(): Promise<VesSourceRoot[]> {
    const roots: VesSourceRoot[] = [];
    try {
      const core = await this.vesBuildPathsService.getEngineCoreUri();
      roots.push({ name: core.path.base, root: core.path.fsPath() });

      const plugins = await this.vesBuildPathsService.getEnginePluginsUri();
      if (await this.fileService.exists(plugins)) {
        for (const vendor of (await this.fileService.resolve(plugins)).children ?? []) {
          if (!vendor.isDirectory) {
            continue;
          }
          for (const plugin of (await this.fileService.resolve(vendor.resource)).children ?? []) {
            if (plugin.isDirectory) {
              roots.push({
                name: `${vendor.resource.path.base}/${plugin.resource.path.base}`,
                root: plugin.resource.path.fsPath(),
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('[emulator] engine paths could not be read:', error);
    }

    for (const folder of this.workspaceService.tryGetRoots()) {
      roots.push({ name: folder.resource.path.base, root: folder.resource.path.fsPath() });
    }
    return roots;
  }

  protected async syncEditorBreakpoints(uri: URI): Promise<void> {
    const table = await this.loadLineTable();
    if (!table) {
      return;
    }
    const mapper = makeSourcePathMapper(await this.sourceRoots());
    const recorded = recordedPathFor(table, mapper, uri.path.fsPath());
    if (recorded === undefined) {
      // A file this build did not compile
      return;
    }
    this.dock.breakpoints.setForFile(
      recorded,
      this.breakpointManager.getBreakpoints(uri)
        .map(point => ({ line: point.line, enabled: point.enabled })),
      table
    );
  }

  protected async revealStop(address: number): Promise<void> {
    const table = await this.loadLineTable();
    const rom = await this.getRomUri();
    if (!table || !rom) {
      return;
    }
    const romBytes = (await this.fileService.readFile(rom)).value.buffer.byteLength;
    const found = table.locate(romOffsetOf(address, romBytes));
    if (!found) {
      return;
    }
    const mapper = makeSourcePathMapper(await this.sourceRoots());
    const source = new URI(mapper(found.file)).withScheme('file');
    if (!await this.fileService.exists(source)) {
      return;
    }
    const editor = await this.editorManager.open(source, { mode: 'reveal' });
    editor.editor.cursor = { line: Math.max(0, found.line - 1), character: 0 };
    editor.editor.revealPosition(editor.editor.cursor);
  }

  protected async syncAllEditorBreakpoints(): Promise<void> {
    for (const uri of [...this.breakpointManager.getUris()]) {
      await this.syncEditorBreakpoints(new URI(uri));
    }
  }

  static readonly SYMBOL_RETRY_DELAY = 2000;

  protected async readLineTable(): Promise<CachedAnswerRead<VesLineTable>> {
    try {
      const romUri = await this.getRomUri();
      const elfUri = await this.findElfUri(romUri);
      if (!elfUri || !romUri) {
        return { settled: true };
      }
      const image = readElf((await this.fileService.readFile(elfUri)).value.buffer);
      const section = image?.section('.debug_line');
      if (!section) {
        return { settled: true };
      }
      const rom = await this.fileService.readFile(romUri);
      return {
        value: parseDwarfLineTable(section, rom.value.buffer.byteLength),
        settled: true,
      };
    } catch (error) {
      console.warn('[emulator] ROM line table could not be read:', error);
      return { settled: false };
    }
  }

  protected async readSourceFile(path: string): Promise<string | undefined> {
    if (this.sourceFiles.has(path)) {
      return this.sourceFiles.get(path);
    }
    let text: string | undefined;
    try {
      const romUri = await this.getRomUri();
      if (romUri) {
        for (const candidate of sourcePathCandidates(path, romUri.parent.path.fsPath())) {
          const uri = new URI(candidate);
          if (await this.fileService.exists(uri)) {
            text = (await this.fileService.readFile(uri)).value.toString();
            break;
          }
        }
      }
    } catch (error) {
      console.warn('[emulator] source file could not be read:', error);
    }
    this.sourceFiles.set(path, text);
    return text;
  }

  protected async readSymbols(): Promise<CachedAnswerRead<SymbolIndex>> {
    try {
      const romUri = await this.getRomUri();
      const elfUri = await this.findElfUri(romUri);
      if (!elfUri) {
        return { settled: true };
      }
      const image = readElf((await this.fileService.readFile(elfUri)).value.buffer);
      return { value: image ? indexElfSymbols(image) : undefined, settled: true };
    } catch (error) {
      console.warn('[emulator] ROM symbols could not be read:', error);
      return { settled: false };
    }
  }

  protected async readBuildMode(romUri: URI): Promise<string | undefined> {
    try {
      const mapUri = romUri.parent.resolve(`${romUri.path.name}.map`);
      if (!await this.fileService.exists(mapUri)) {
        return undefined;
      }
      return readBuildModeFromMap((await this.fileService.readFile(mapUri)).value.toString());
    } catch (error) {
      console.warn('[emulator] build mode could not be read:', error);
      return undefined;
    }
  }

  protected async findElfUri(romUri: URI): Promise<URI | undefined> {
    const sibling = romUri.parent.resolve(`${romUri.path.name}.elf`);
    if (await this.fileService.exists(sibling)) {
      return sibling;
    }

    const mapUri = romUri.parent.resolve(`${romUri.path.name}.map`);
    if (!await this.fileService.exists(mapUri)) {
      return undefined;
    }
    const declared = readElfPathFromMap((await this.fileService.readFile(mapUri)).value.toString());
    if (!declared) {
      return undefined;
    }

    await this.workspaceService.ready;
    const root = this.workspaceService.tryGetRoots()[0]?.resource;
    const elfUri = declared.startsWith('/') ? new URI(declared) : root?.resolve(declared);
    return elfUri && await this.fileService.exists(elfUri) ? elfUri : undefined;
  }

  protected async resetSim(): Promise<void> {
    this.rumblePack.clearEmulatedTraffic();
    await this.sim?.reset();
  }

  protected forwardToRumblePack(bytes: number[]): void {
    for (const byte of bytes) {
      this.rumblePack.sendByte(byte).catch(() => {
        // A pack unplugged mid-effect
      });
    }
  }

  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.input.attach(this.node, this.dock.screen.node);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.input.detach();
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.dock.setHidden(false);
  }

  protected onAfterHide(msg: Message): void {
    super.onAfterHide(msg);
    this.dock.setHidden(true);
  }

  usesPlayer2Controls(): boolean {
    return this.player === 2 && !this.settings.get('player2SameControls');
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.tabIndex = 0;
    this.node.focus();
  }

  protected starting: Promise<void> = Promise.resolve();

  protected startEmulator = (snapshot?: ArrayBuffer, cartRam?: ArrayBuffer): Promise<void> => {
    this.starting = this.starting
      .catch(() => undefined)
      .then(() => this.buildSession(snapshot, cartRam));
    return this.starting;
  };

  protected buildSession = async (snapshot?: ArrayBuffer, cartRam?: ArrayBuffer): Promise<void> => {
    this.disposeSession();
    const displayMode = this.getDisplayMode();
    this.dock.screen.setDisplayMode(displayMode);
    const canvas = this.dock.screen.takeCanvas();

    try {
      const host = this.linkHost;
      const session = host
        ? await host.lendMirrorSeat()
        : await this.vesEmulatorCoreService.createSession();
      if (!session) {
        this.linkHost = undefined;
        return this.buildSession(snapshot, cartRam);
      }
      this.session = session;
      this.ownsSession = !host;
      const core = session.core;
      this.core = core;
      this.toDispose.push(core.onError(message => this.handleCoreError(message)));
      this.syncAllEditorBreakpoints().catch(() => undefined);
      this.toDispose.push(this.breakpointManager.onDidChangeBreakpoints(event => {
        this.syncEditorBreakpoints(event.uri).catch(() => undefined);
      }));
      this.toDispose.push(core.onStopped(stop => {
        this.state.paused = true;
        this.state.frameAdvance = false;
        this.esSound.setPaused(true);
        this.update();
        this.revealStop(stop.address).catch(() => undefined);
      }));
      this.toDispose.push(core.onSpeed(speed => this.setEmulationSpeed(speed)));

      this.sim = host ? session.mirror ?? session.sim : session.sim;
      this.dock.setSim(this.sim);
      this.cheats.setSim(this.sim);
      this.cheatFinder.setSim(this.sim);
      this.colors.setSim(this.sim);
      this.applyScale();
      await this.sim.setDisplayMode(displayMode);
      await this.sim.attachCanvas(canvas);
      await this.sim.setVolume(this.state.muted ? 0 : VesEmulatorWidget.DEFAULT_VOLUME);

      await this.time.applySpeed();
      await this.time.applyRewindSettings();
      await this.applyRumbleForwarding();

      await this.loadRom();
      const romUri = await this.getRomUri();
      await this.cheats.load(await this.companionRomPath(), this.romId);
      await this.esSound.scan(romUri.toString());
      await this.esSound.setSim(this.sim);
      this.esSound.setMuted(this.state.muted);
      this.toDispose.push(this.sim.onEsSound(commands => commands.forEach(raw => this.esSound.handle(raw))));
      if (cartRam && cartRam.byteLength > 0) {
        const window = saveRamWindowBytes(this.settings.get('sramWindow'));
        const whole = new Uint8Array(window);
        whole.set(new Uint8Array(cartRam, 0, Math.min(cartRam.byteLength, window)));
        await this.sim.setCartRam(whole.buffer as ArrayBuffer);
      } else {
        await this.loadSaveRam();
      }
      await this.attachSaveStates();
      if (snapshot) {
        await this.sim.loadState(snapshot);
      } else {
        await this.resetSim();
      }
      await this.input.applyKeys();
      await core.run();

      this.state.loaded = true;
      this.state.paused = false;
      this.esSound.setPaused(false);
      this.update();
    } catch (error) {
      this.handleCoreError(error instanceof Error ? error.message : String(error));
    }
  };

  protected handleCoreError(message: string): void {
    console.error('[emulator]', message);
    this.state.loaded = false;
    this.update();
  }

  protected appliedHardware?: { vbc: boolean, mode: string };

  protected applyHardwareConfiguration(): void {
    const wanted = {
      vbc: this.vbcSupportEnabled,
      mode: this.selectedHardwareMode,
    };
    if (this.appliedHardware
      && this.appliedHardware.vbc === wanted.vbc
      && this.appliedHardware.mode === wanted.mode) {
      return;
    }
    this.appliedHardware = wanted;
    this.restartForHardwareChange();
  }

  protected async restartForHardwareChange(): Promise<void> {
    const wasLinked = this.isLinked() || this.isLinkGuest();
    await this.unlinkFromPeer();
    if (wasLinked) {
      this.notifications.info(nls.localize(
        'vuengine/emulator/hardwareLinkEnded',
        'The link session ended because the hardware configuration changed.'
      ));
    }
    if (this.status !== EmulatorRomStatus.EXISTS) {
      this.update();
      return;
    }
    const wasPaused = this.state.paused;
    await this.startEmulator();
    if (wasPaused && this.core && this.state.loaded) {
      await this.core.suspend();
      this.state.paused = true;
      this.esSound.setPaused(true);
    }
    this.update();
  }

  protected async loadRom(): Promise<void> {
    const defaultRomUri = await this.vesBuildService.getDefaultRomUri();
    const romUri = this.options ? new URI(this.options.uri) : defaultRomUri;
    const romContent = await this.fileService.readFile(romUri);
    const romContentBuffer = romContent.value.buffer;
    this.state.romHeader = parseRomHeader(romContentBuffer);
    this.state.romSize = romSizeInMBit(romContentBuffer);
    this.romIdentity = new Uint8Array(
      romContentBuffer.slice(-ROM_HEADER_OFFSET_FROM_END).slice(0, 32)
    );
    this.romId = formatRomId(crc32(Buffer.from(
      romContentBuffer.buffer, romContentBuffer.byteOffset, romContentBuffer.byteLength
    )));
    this.symbols.clear();
    this.lineTable.clear();
    this.sourceFiles.clear();
    this.loadLineTable()
      .then(table => {
        if (!table) {
          return undefined;
        }
        this.dock.breakpoints.reresolve(table);
        return this.syncAllEditorBreakpoints();
      })
      .catch(() => undefined);
    this.dock.setRomInfo(
      this.state.romHeader,
      this.state.romSize,
      await this.readBuildMode(romUri),
      this.romId,
    );

    this.sourceRom = romContentBuffer;
    await this.patches.load(await this.companionRomPath(), this.romId, romContentBuffer);
    if (this.isHardcore()) {
      this.patches.disableAll();
    }
    await this.colors.load(this.romId, romContentBuffer);
    await this.macros.load(await this.companionRomPath());
    this.refreshRomHeader();

    this.appliedHardware = { vbc: this.vbcSupportEnabled, mode: this.selectedHardwareMode };
    await this.sim?.setHardwareMode(this.resolvedHardwareMode === VbHardwareMode.VB_COLOR);
    this.dock.setVbcSupportEnabled(this.vbcSupportEnabled, this.vbcHardwareActive);

    if (this.ownsSession) {
      await this.sim?.setCartRom(ownedCopy(this.patchedRom()));
    }
  }

  protected patchedRom(): Uint8Array {
    const source = this.sourceRom;
    if (!source) {
      return new Uint8Array();
    }
    try {
      return this.patches.apply(source);
    } catch (error) {
      console.warn('[emulator] could not apply the ROM patches:', error);
      return source;
    }
  }

  protected buildColorStore(): ColorStore {
    function prune<T>(all: Record<string, T>, id: string, value: T): Record<string, T> {
      const next = { ...all };
      if (Object.keys(value as object).length === 0) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return next;
    }

    return new ColorStore(
      this.patches,
      id => this.settings.get('vbcColorPaletteOverrides')[id] ?? {},
      (id, overrides) => {
        this.settings.set(
          'vbcColorPaletteOverrides',
          prune(this.settings.get('vbcColorPaletteOverrides'), id, overrides)
        ).catch(() => undefined);
      },
      id => this.settings.get('vbcColorPaletteNames')[id] ?? {},
      (id, names) => {
        this.settings.set(
          'vbcColorPaletteNames',
          prune(this.settings.get('vbcColorPaletteNames'), id, names)
        ).catch(() => undefined);
      },
      () => ({
        autoApply: this.settings.get('vbcAutoApplyColorPatches') && !this.isHardcore(),
        disabled: this.settings.get('vbcColorPatchesDisabled'),
      }),
      (id, apply) => this.rememberColorChoice(id, apply),
      (name, data) => this.storage.export(name, data),
      config => this.loadColorPatch(config),
      () => this.readCreatedColorPatch(),
      document => this.writeCreatedColorPatch(document),
    );
  }

  protected rememberColorChoice(id: string, apply: boolean): void {
    const disabled = this.settings.get('vbcColorPatchesDisabled');
    this.settings.set(
      'vbcColorPatchesDisabled',
      apply ? disabled.filter(entry => entry !== id) : [...disabled.filter(entry => entry !== id), id]
    ).catch(() => undefined);
    if (apply && !this.settings.get('vbcAutoApplyColorPatches')) {
      this.settings.set('vbcAutoApplyColorPatches', true).catch(() => undefined);
    }
  }

  protected loadColorPatch(config: string): Promise<unknown> {
    let pending = VesEmulatorWidget.colorPatches.get(config);
    if (!pending) {
      pending = fetch(new Endpoint({ path: `/emulator/${config}` }).getRestUrl().toString())
        .then(response => {
          if (!response.ok) {
            throw new Error(`${config}: ${response.status} ${response.statusText}`);
          }
          return response.json() as Promise<unknown>;
        });
      VesEmulatorWidget.colorPatches.set(config, pending);
    }
    return pending;
  }

  protected async colorPatchPath(): Promise<string> {
    const rom = (await this.getRomUri()).toString();
    return this.storage.join(
      await this.companionDirectory(), `${this.storage.stem(rom)}.vbc.json`
    );
  }

  protected async readCreatedColorPatch(): Promise<unknown> {
    const path = await this.colorPatchPath();
    try {
      return await this.storage.exists(path)
        ? JSON.parse(await this.storage.readText(path)) as unknown
        : undefined;
    } catch (error) {
      console.warn(`[emulator] could not read the color patch at ${path}:`, error);
      return undefined;
    }
  }

  protected async writeCreatedColorPatch(document: VbcPatchDocument | undefined): Promise<void> {
    const path = await this.colorPatchPath();
    if (!document) {
      if (await this.storage.exists(path)) {
        await this.storage.delete(path);
      }
      return;
    }
    await this.storage.writeText(path, `${JSON.stringify(document, undefined, 2)}\n`);
  }

  protected refreshRomHeader(): void {
    if (!this.sourceRom) {
      this.state.romHeader = EMPTY_ROM_HEADER;
      return;
    }
    this.state.romHeader = parseRomHeader(this.patchedRom());
    this.dock.setRomInfo(
      this.state.romHeader, this.state.romSize, undefined, this.romId
    );
  }

  protected onResize(): void {
    this.update();
  }

  onRewindButtonDown = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (!this.time.isRewindEnabled()) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    this.time.startRewinding();
  };

  promptEnableRewind = async (): Promise<void> => {
    const bufferSize = this.settings.get('rewindBufferSize');

    const message = [
      nls.localize(
        'vuengine/emulator/rewindWhat',
        'Rewind runs the game backwards for as long as you hold the button. \
To make that possible, the emulator records what changes in the \
machine on every frame while you play.'
      ),
      nls.localize(
        'vuengine/emulator/rewindCost',
        'Recording makes emulation roughly a third more expensive and uses up  \
to {0} MB of memory, which holds a bit over a minute of history.  \
Both are adjustable in the emulator preferences: a coarser rewind  \
granularity records less often and costs proportionally less.',
        bufferSize
      ),
    ];

    const confirmed = await this.notifications.confirm({
      title: nls.localize('vuengine/emulator/enableRewindTitle', 'Enable Rewind?'),
      message,
      okLabel: nls.localize('vuengine/emulator/enableRewindConfirm', 'Enable'),
    });
    if (confirmed) {
      await this.settings.set('rewindEnabled', true);
    }
  };

  onRewindButtonUp = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    this.time.stopRewinding();
    this.node.focus();
  };

  public runAction = (action: EmulatorAction): void => {
    this.commandService.executeCommand(EMULATOR_ACTION_COMMANDS[action].id);
    // Hand the keyboard back, so the shortcuts keep working after a click.
    this.node.focus();
  };

  public canRunAction(action: EmulatorAction): boolean {
    if (!this.state.loaded) {
      return false;
    }
    if (this.state.showControls) {
      return action === EmulatorAction.ToggleControlsOverlay;
    }
    if (this.state.paused) {
      return VesEmulatorWidget.ACTIONS_WHILE_PAUSED.includes(action)
        || (this.state.frameAdvance && action === EmulatorAction.FrameAdvance);
    }
    return true;
  }

  public async performAction(action: EmulatorAction): Promise<void> {
    await this.sendCommand('keyPress', action);
  }

  protected render(): React.ReactNode {
    return <>
      <TitleBar
        emulator={this}
        title={
          <div className='vueport-titlebar-toolbar'>
            <EmulatorControlStrip host={this} inline />
          </div>
        }
      />
      <Emulator emulator={this} attached={this.isAttached} chrome='hosted' />
    </>;
  }

  renderPalettePreview(): React.ReactNode {
    if (this.getRenderingMode() === VbRenderingMode.ANAGLYPH) {
      const anaglyph = this.getAnaglyphPalette();
      return <AnaglyphSwatch
        left={formatColor(anaglyph.left)}
        right={formatColor(anaglyph.right)}
        small
      />;
    }
    return <PaletteSwatch colors={this.getPalette().map(formatColor)} small />;
  }

  renderOverlay(): React.ReactNode {
    return this.state.showPreferences
      ? <SettingsWindow<VesEmulatorSettingsTab>
        tabs={this.settingsTabs()}
        tab={this.settingsTab ?? 'display'}
        onTab={next => { this.activeSettingsTab = next; this.update(); }}
        onClose={() => this.togglePreferencesWindow()}
        renderPane={(tab, search) => this.renderSettingsPane(tab, search)}
      />
      : undefined;
  }

  protected activeSettingsTab: VesEmulatorSettingsTab = 'display';

  get settingsTab(): VesEmulatorSettingsTab | undefined {
    return this.state.showPreferences ? this.activeSettingsTab : undefined;
  }

  protected settingsTabs(): SettingsTabSpec<VesEmulatorSettingsTab>[] {
    return [
      {
        id: 'display',
        label: nls.localize('vuengine/emulator/settings/display', 'Display'),
        icon: <Monitor size={18} />,
        settings: DISPLAY_SETTINGS,
      },
      {
        id: 'input',
        label: nls.localize('vuengine/emulator/configureInput', 'Configure Input'),
        icon: <Keyboard size={18} />,
        keywords: nls.localize(
          'vuengine/emulator/settings/inputKeywords',
          'input keybinding keyboard controller game pad button rebind d-pad player 2'
        ),
      },
      {
        id: 'vbcolor',
        label: nls.localize('vuengine/emulator/settings/vbColor', 'VB Color'),
        icon: <VbColorIcon size={16} />,
        settings: VB_COLOR_SETTINGS,
      },
      {
        id: 'sound',
        label: nls.localize('vuengine/emulator/settings/sound', 'Sound'),
        icon: <SpeakerHigh size={18} />,
        settings: SOUND_SETTINGS,
      },
      {
        id: 'emulation',
        label: nls.localize('vuengine/emulator/settings/emulation', 'Emulation'),
        icon: <Cpu size={18} />,
        settings: EMULATION_SETTINGS,
      },
      {
        id: 'saveData',
        label: nls.localize('vuengine/emulator/settings/saveData', 'Save Data'),
        icon: <FloppyDisk size={18} />,
        settings: SAVE_DATA_SETTINGS,
      },
      {
        id: 'screenshots',
        label: nls.localize('vuengine/emulator/settings/screenshots', 'Screenshots'),
        icon: <Camera size={18} />,
        settings: SCREENSHOT_SETTINGS,
      },
      {
        id: 'achievements',
        label: nls.localize('vuengine/emulator/settings/achievements', 'Achievements'),
        icon: <Trophy size={18} />,
        keywords: nls.localize(
          'vuengine/emulator/settings/achievementsKeywords',
          'retroachievements achievements leaderboards score account sign in hardcore points'
        ),
      },
    ];
  }

  protected renderSettingsPane(tab: VesEmulatorSettingsTab, search: string): React.ReactNode {
    const pane = { settings: this.settings, hover: this.hover, search };
    switch (tab) {
      case 'display':
        return <DisplaySettings
          {...pane}
          notifications={this.notifications}
          preview={<EmulatorScreenPreview screen={this.dock.screen} loaded={this.state.loaded} />}
        />;
      case 'screenshots':
        return <ScreenshotSettings {...pane} notifications={this.notifications} />;
      case 'input':
        return <InputSettings
          settings={this.settings}
          bindings={this.bindings}
          onChange={() => this.update()}
        />;
      case 'emulation':
        return <EmulationSettings {...pane} />;
      case 'saveData':
        return <SaveDataSettings {...pane} />;
      case 'vbcolor':
        return <VbColorSettings {...pane} />;
      case 'sound':
        return <SoundSettings {...pane} />;
      case 'achievements':
        return <EmulatorAchievementsSettings
          settings={this.settings}
          achievements={this.retroAchievements}
        />;
    }
  }

  async sendCommand(command: string, data?: any): Promise<void> {
    // Game pad input maps straight onto the core's key mask.
    const vbKey = GAMEPAD_KEY_TO_VB_KEY[data as EmulatorGamePadKeyCode];
    if (vbKey !== undefined) {
      if (command === 'keyPress') {
        await this.input.tapKey(vbKey);
      } else {
        await this.input.setKey(vbKey, command === 'keydown');
      }
      return;
    }

    if (data === EmulatorAction.Rewind) {
      if (command === 'keydown') {
        this.time.startRewinding();
      } else if (command === 'keyup') {
        this.time.stopRewinding();
      } else if (command === 'keyPress') {
        this.time.queueCoreTransition(async core => {
          await core.suspend();
          await core.rewindStep();
          if (!this.state.paused) {
            await core.run();
          }
        });
      }
      return;
    }

    if (command === 'keyPress' || command === 'keyup') {
      switch (data) {
        case EmulatorAction.AudioMute:
          this.state.muted = !this.state.muted;
          await this.sim?.setVolume(this.state.muted ? 0 : VesEmulatorWidget.DEFAULT_VOLUME);
          this.esSound.setMuted(this.state.muted);
          await this.localStorageService.setData(
            'ves-emulator-state-muted',
            this.state.muted
          );
          this.update();
          break;
        case EmulatorAction.PauseToggle:
          this.state.paused = !this.state.paused;
          this.state.frameAdvance = false;
          if (this.state.paused) {
            await this.core?.suspend();
          } else {
            await this.core?.run();
          }
          this.esSound.setPaused(this.state.paused);
          this.update();
          break;
        case EmulatorAction.ToggleLowPower:
          this.state.lowPower = !this.state.lowPower;
          await this.input.applyKeys();
          this.update();
          break;
        case EmulatorAction.ToggleSlowmotion:
          this.state.slowmotion = !this.state.slowmotion;
          this.state.fastForward = false;
          await this.time.applySpeed();
          this.update();
          break;
        case EmulatorAction.ToggleFastForward:
          this.state.fastForward = !this.state.fastForward;
          this.state.slowmotion = false;
          await this.time.applySpeed();
          this.update();
          break;
        case EmulatorAction.FrameAdvance:
          if (!this.state.paused) {
            this.state.paused = true;
            await this.core?.suspend();
            this.esSound.setPaused(true);
          }
          this.state.frameAdvance = true;
          await this.core?.stepFrame();
          this.update();
          break;
        case EmulatorAction.Fullscreen:
          this.enterFullscreen();
          break;
        case EmulatorAction.ToggleControlsOverlay:
          this.toggleControlsOverlay();
          break;
        case EmulatorAction.Reset:
          await this.resetSim();
          break;
        case EmulatorAction.SaveState:
          await this.saveState();
          break;
        case EmulatorAction.LoadState:
          await this.loadState();
          break;
        case EmulatorAction.Screenshot:
          await this.takeScreenshot();
          break;
      }
    }
  }

  protected async getRomUri(): Promise<URI> {
    return this.options ? new URI(this.options.uri) : this.vesBuildService.getDefaultRomUri();
  }

  get player(): 1 | 2 {
    return this.options?.player === 2 ? 2 : 1;
  }

  protected async companionDirectory(): Promise<string> {
    const rom = (await this.getRomUri()).toString();
    if (this.settings.get('companionFiles') === EmulatorCompanionLocation.ROM) {
      return this.storage.parent(rom);
    }
    const config = new URI(await this.envVariablesServer.getConfigDirUri());
    return config.resolve('vueport').resolve('roms')
      .resolve(this.storage.stem(rom)).toString();
  }

  protected globalMacrosPath: string | undefined;

  protected async ensureConfigRoot(): Promise<void> {
    if (this.configRoot !== undefined) {
      return;
    }
    const config = new URI(await this.envVariablesServer.getConfigDirUri());
    this.configRoot = config.resolve('vueport').toString();
  }

  protected async resolveGlobalMacrosPath(): Promise<void> {
    await this.ensureConfigRoot();
    this.globalMacrosPath = this.companions.globalMacros();
  }

  protected async companionRomPath(): Promise<string> {
    const rom = (await this.getRomUri()).toString();
    return this.storage.join(await this.companionDirectory(), this.storage.name(rom));
  }

  protected loadedSaveRamBytes = 0;

  protected async getSaveRamPath(): Promise<string> {
    const rom = (await this.getRomUri()).toString();
    return this.storage.join(
      await this.companionDirectory(), `${this.storage.stem(rom)}.p${this.player}.sram`
    );
  }

  protected async loadSaveRam(): Promise<void> {
    const path = await this.getSaveRamPath();
    const window = saveRamWindowBytes(this.settings.get('sramWindow'));
    const ram = freshSaveRam(this.settings.get('sramInit'), window);
    this.loadedSaveRamBytes = 0;

    if (await this.storage.exists(path)) {
      const stored = await this.storage.read(path);
      if (stored.length === 0 || (stored.length & (stored.length - 1)) !== 0) {
        console.warn(`[emulator] ignoring save RAM of unusable size ${stored.length}: ${path}`);
      } else {
        ram.set(stored.subarray(0, Math.min(stored.length, ram.length)));
        this.loadedSaveRamBytes = stored.length;
      }
    }

    await this.sim?.setCartRam(ram.buffer as ArrayBuffer);
  }

  protected async saveSaveRam(): Promise<void> {
    const info = await this.sim?.cartRamInfo();
    if (!info || info.size === 0) {
      return;
    }
    const bytes = Math.min(info.size, saveRamFileSize(info.used, this.loadedSaveRamBytes));
    const ram = await this.sim?.getCartRam(bytes);
    if (!ram || ram.byteLength === 0) {
      return;
    }
    const path = await this.getSaveRamPath();
    let out = new Uint8Array(ram);
    if (this.loadedSaveRamBytes > out.length && await this.storage.exists(path)) {
      const existing = await this.storage.read(path);
      if (existing.length > out.length) {
        const merged = existing.slice();
        merged.set(out);
        out = merged;
      }
    }
    await this.storage.write(path, out);
    this.loadedSaveRamBytes = out.length;
  }

  protected async attachSaveStates(): Promise<void> {
    await this.ensureConfigRoot();
    const uri = (await this.getRomUri()).toString();
    const rom: CompanionRom = { name: this.storage.name(uri), location: uri };
    await this.saveStates.attach(rom, this.createSaveStateMachine());
  }

  protected createSaveStateMachine(): SaveStateMachine {
    const host = this;
    return {
      get machineCount(): number {
        return host.sims.length || 1;
      },
      snapshot: async () => {
        const sims = host.sims;
        if (!sims.length) {
          return undefined;
        }
        const states: ArrayBuffer[] = [];
        for (const sim of sims) {
          states.push(await sim.saveState());
        }
        return states;
      },
      restore: async states => {
        const sims = host.sims;
        for (let index = 0; index < sims.length; index++) {
          await sims[index].loadState(states[index]);
        }
      },
      thumbnail: async () => {
        if (!host.sim || !host.state.loaded) {
          return undefined;
        }
        const png = await host.sim.capture(VB_DEFAULT_DISPLAY_MODE, 1);
        return png ? new Uint8Array(png) : undefined;
      },
      identity: () => host.saveStateIdentity,
      esSoundSnapshot: () => host.esSound.snapshot(),
      esSoundRestore: snapshot => host.esSound.restore(snapshot as EsSoundSnapshot),
    };
  }

  protected restoreEsSound(stored: string | undefined): void {
    if (!stored) {
      return;
    }
    try {
      this.esSound.restore(JSON.parse(stored));
    } catch (error) {
      console.warn('[emulator] could not restore ESSound playback from the save state:', error);
    }
  }

  protected get sims(): Sim[] {
    if (!this.session) {
      return [];
    }
    return this.session.mirror
      ? [this.session.sim, this.session.mirror]
      : [this.session.sim];
  }

  protected async saveState(): Promise<void> {
    if (!this.sims.length) {
      return;
    }
    try {
      const entry = await this.saveStates.create('manual');
      if (entry) {
        this.notifications.info(
          nls.localize('vuengine/emulator/saveStateSaved', 'Save state created.')
        );
      }
    } catch (error) {
      this.handleCoreError(error instanceof Error ? error.message : String(error));
    }
  }

  protected async loadState(): Promise<void> {
    if (!this.sims.length) {
      return;
    }
    const entry = this.saveStates.latestManual;
    if (!entry) {
      this.notifications.warn(
        nls.localize('vuengine/emulator/saveStateNone', 'This game has no save state to load.')
      );
      return;
    }
    await this.loadSaveState(entry);
  }

  async loadSaveState(entry: SaveStateEntry): Promise<void> {
    if (!this.sims.length) {
      return;
    }
    const running = !this.state.paused;
    try {
      if (running) {
        await this.core?.suspend();
      }
      await this.saveStates.restore(entry);
      this.notifications.info(
        nls.localize('vuengine/emulator/saveStateLoaded', 'Save state loaded.')
      );
    } catch (error) {
      this.handleCoreError(error instanceof Error ? error.message : String(error));
    } finally {
      if (running) {
        await this.core?.run();
      }
    }
  }

  protected async takeScreenshot(): Promise<void> {
    const png = await this.sim?.capture();
    if (!png) {
      return;
    }

    const now = new Date();
    const pad = (value: number) => `${value}`.padStart(2, '0');
    const timestamp = `${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
      + `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const romUri = await this.getRomUri();
    const screenshotFilename = `${romUri.path.name}-${timestamp}.png`;

    await this.storage.export(`screenshots/${screenshotFilename}`, new Uint8Array(png));
    this.notifications.info(
      nls.localize('vuengine/emulator/screenshotSaved', 'Screenshot saved to screenshots/{0}.', screenshotFilename)
    );
  }

  setRenderingMode = async (mode: string): Promise<void> => {
    await this.settings.set('renderingMode', mode);
  };

  setScale = async (scale: string): Promise<void> => {
    await this.settings.set('scale', scale);
    this.applyScale();
  };

  getRenderingMode(): string {
    return this.settings.get('renderingMode');
  }

  protected getPalette(): VbPalette {
    return resolvePalette(
      this.settings.get('palette'),
      this.settings.get('customPalettes')
    );
  }

  protected getAnaglyphPalette(): VbAnaglyphPalette {
    return resolveAnaglyphPalette(
      this.settings.get('anaglyphPalette'),
      this.settings.get('customAnaglyphPalettes')
    );
  }

  protected getDisplayMode(): DisplayMode {
    return buildDisplayMode(
      this.getRenderingMode(),
      this.getPalette(),
      this.getAnaglyphPalette()
    );
  }

  getPaletteLabel(): string {
    const anaglyph = this.getRenderingMode() === VbRenderingMode.ANAGLYPH;
    const id = anaglyph
      ? this.settings.get('anaglyphPalette')
      : this.settings.get('palette');
    if (id.startsWith(CUSTOM_PALETTE_PREFIX)) {
      return id.slice(CUSTOM_PALETTE_PREFIX.length);
    }
    return (anaglyph ? emulationAnaglyphPalettes() : emulationPalettes())[id] ?? id;
  }

  get activeCheats(): number {
    return this.cheats.list.filter(cheat => cheat.enabled).length;
  }

  toggleCheats(): void {
    this.showSideStrip(this.state.showCheats ? undefined : 'cheats');
  }

  protected showSideStrip(
    which: 'saveStates' | 'cheats' | 'macros' | 'patches' | 'colors' | 'achievements' | undefined,
  ): void {
    if (which !== undefined && which !== 'achievements' && this.refuseForHardcore()) {
      return;
    }
    this.state.showSaveStates = which === 'saveStates';
    this.state.showCheats = which === 'cheats';
    this.state.showMacros = which === 'macros';
    this.state.showPatches = which === 'patches';
    this.state.showColors = which === 'colors';
    this.state.showAchievements = which === 'achievements';
    this.update();
  }

  protected refuseForHardcore(): boolean {
    if (!this.isHardcore()) {
      return false;
    }
    this.notifications.info(nls.localize(
      'vuengine/emulator/hardcoreRefused',
      'Hardcore Mode is on, so this is not available.'
    ));
    return true;
  }

  isHardcore(): boolean {
    return this.settings.get('retroAchievementsEnabled')
      && this.settings.get('retroAchievementsHardcore');
  }

  protected async enterHardcoreDiscipline(): Promise<void> {
    this.showSideStrip(undefined);
    this.setMode(EmulatorMode.PLAY);
    this.cheats.disableAll();
    this.patches.disableAll();
    this.macros.stop();
    this.macros.cancelRecording();
    await this.time.applyRewindSettings();
    this.update();
  }

  get hasRom(): boolean {
    return this.status === EmulatorRomStatus.EXISTS;
  }

  get settingsOpen(): boolean {
    return this.settingsTab !== undefined;
  }

  get vbcSupportEnabled(): boolean {
    return this.settings.get('vbcSupportEnabled');
  }

  get selectedHardwareMode(): string {
    return this.vbcSupportEnabled
      ? this.settings.get('hardwareMode')
      : VbHardwareMode.VIRTUAL_BOY;
  }

  get resolvedHardwareMode(): VbHardwareMode.VIRTUAL_BOY | VbHardwareMode.VB_COLOR {
    return resolveVbHardwareMode(this.selectedHardwareMode, this.state.romHeader.vbcSupport);
  }

  get vbcHardwareActive(): boolean {
    return this.sim?.isVbcHardware ?? this.resolvedHardwareMode === VbHardwareMode.VB_COLOR;
  }

  get saveGameSlot(): string {
    return this.settings.get('saveGameSlot');
  }

  toggleDebugMode(): void {
    this.setMode(this.state.mode === EmulatorMode.DEBUG ? EmulatorMode.PLAY : EmulatorMode.DEBUG);
  }

  async offerToLeaveHardcore(): Promise<void> {
    await this.retroAchievements.offerToLeaveHardcore();
  }

  toggleMacros(): void {
    this.showSideStrip(this.state.showMacros ? undefined : 'macros');
  }

  togglePatches(): void {
    this.showSideStrip(this.state.showPatches ? undefined : 'patches');
  }

  toggleColors(): void {
    this.showSideStrip(this.state.showColors ? undefined : 'colors');
  }

  toggleAchievements(): void {
    this.showSideStrip(this.state.showAchievements ? undefined : 'achievements');
  }

  toggleSaveStates(): void {
    this.showSideStrip(this.state.showSaveStates ? undefined : 'saveStates');
  }

  showSaveStates(): void {
    this.showSideStrip('saveStates');
  }

  showCheats(): void {
    this.showSideStrip('cheats');
  }

  showMacros(): void {
    this.showSideStrip('macros');
  }

  showPatches(): void {
    this.showSideStrip('patches');
  }

  showColors(): void {
    this.showSideStrip('colors');
  }

  showAchievements(): void {
    this.showSideStrip('achievements');
  }

  get macroActivity(): MacroActivity {
    return this.macros.activity;
  }

  cancelMacroRecording(): void {
    this.macros.cancelRecording();
    this.update();
  }

  get moviePlaying(): boolean {
    return this.moviePlayer.playing;
  }

  get movieFrame(): number {
    return this.moviePlayer.frame;
  }

  get movieLength(): number {
    return this.moviePlayer.length;
  }

  stopMoviePlayback(): void {
    this.moviePlayer.stop().catch(() => undefined);
    this.update();
  }

  renderSaveStates(): React.ReactNode {
    return <EmulatorSaveStates
      states={this.saveStates}
      notifications={this.notifications}
      canSave={this.state.loaded}
      hardcore={this.isHardcore()}
      onSave={() => { this.saveState().catch(error => this.handleCoreError(String(error))); }}
      onLoad={entry => {
        this.loadSaveState(entry).catch(error => this.handleCoreError(String(error)));
      }}
      onClose={() => this.toggleSaveStates()}
    />;
  }

  renderCheats(): React.ReactNode {
    return <EmulatorCheats
      cheats={this.cheats}
      finder={this.cheatFinder}
      notifications={this.notifications}
      onClose={() => this.toggleCheats()}
    />;
  }

  renderMacros(): React.ReactNode {
    return <EmulatorMacros
      macros={this.macros}
      notifications={this.notifications}
      onClose={() => this.toggleMacros()}
    />;
  }

  renderPatches(): React.ReactNode {
    return <EmulatorPatches
      patches={this.patches}
      notifications={this.notifications}
      onClose={() => this.togglePatches()}
    />;
  }

  renderColors(): React.ReactNode {
    return <EmulatorColors
      colors={this.colors}
      notifications={this.notifications}
      onClose={() => this.toggleColors()}
    />;
  }

  renderAchievements(): React.ReactNode {
    return <EmulatorAchievements
      achievements={this.retroAchievements}
      onClose={() => this.toggleAchievements()}
      onOpenSettings={() => this.commandService.executeCommand(
        'preferences:open', 'emulator.builtIn.retroAchievements'
      )}
    />;
  }

  togglePaletteWindow(): void {
    this.toggleSettingsTab('display');
  }

  togglePreferencesWindow(): void {
    this.toggleSettingsTab('emulation');
  }

  protected toggleSettingsTab(tab: VesEmulatorSettingsTab): void {
    const open = !(this.state.showPreferences && this.activeSettingsTab === tab);
    if (open) {
      this.activeSettingsTab = tab;
      this.showSideStrip(undefined);
    }
    this.state.showPreferences = open;
    this.state.showPalettes = open && tab === 'display';
    this.state.showControls = open && tab === 'input';
    this.update();
  }

  protected async applyDisplayMode(): Promise<void> {
    const mode = this.getDisplayMode();
    this.dock.screen.setDisplayMode(mode);
    await this.sim?.setDisplayMode(mode);
  }

  protected applyScale(): void {
    this.dock.screen.setScale(
      this.settings.get('scale')
    );
  }

  protected enterFullscreen(): void {
    this.node.requestFullscreen();
  }

  protected toggleControlsOverlay(): void {
    if (!this.state.paused) {
      this.runAction(EmulatorAction.PauseToggle);
    }
    this.toggleSettingsTab('input');
  }

  public deleteSramAndRestart = async () => {
    const confirmed = await this.notifications.confirm({
      title: nls.localize('vuengine/emulator/deleteSram', 'Delete SRAM'),
      message: nls.localize(
        'vuengine/emulator/areYouSureYouWantToDeleteSram',
        'Are you sure you want to delete SRAM and restart? Any saved progress will be lost.'
      ),
    });
    if (confirmed) {
      this.reload(true);
    }
  };

}
