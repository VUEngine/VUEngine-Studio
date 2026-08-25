import { CommandService, Disposable, MessageService, nls, PreferenceService } from '@theia/core';
import {
  ApplicationShell,
  HoverService,
  KeybindingRegistry,
  LocalStorageService,
  Message,
  NavigatableWidget
} from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { TabBar, Widget } from '@lumino/widgets';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import * as React from 'react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent, FileChangeType } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { crc32 } from 'crc';
import * as iconv from 'iconv-lite';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import PopUpDialog from 'vueport-core/lib/browser/components/kit/PopUpDialog';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import { VesEmulatorTheiaRumblePack } from './ves-emulator-theia-rumble';
import { VueportRumblePack } from 'vueport-core/lib/common/emulator-rumble';
import { formatRomId } from 'vueport-core/lib/common/emulator-cheat-database';
import { VueportInputBindings, VueportSettings } from 'vueport-core/lib/common/emulator-settings';
import { VueportHover } from 'vueport-core/lib/browser/components/kit/KitContext';
import { VesEmulatorTheiaSettings } from './ves-emulator-theia-settings';
import { VesEmulatorTheiaBindings } from './ves-emulator-theia-bindings';
import {
  buildVbDisplayMode,
  VB_FRAME_RATE,
  VbAnaglyphPalette,
  VbDisplayMode,
  VbPalette,
  VbRenderingMode,
} from 'vueport-core/lib/common/vb-constants';
import { VesVbProfileResult } from 'vueport-core/lib/common/vb-protocol';
import { EmulatorControlsOverlay } from 'vueport-core/lib/browser/components/EmulatorControlsOverlay';
import { Emulator } from 'vueport-core/lib/browser/components/Emulator';
import {
  freshSaveRam,
  unwrapSaveState,
  VesEmulatorSaveStateIdentity,
  wrapSaveState,
} from 'vueport-core/lib/common/emulator-save-state';
import { EmulatorInputController, GAMEPAD_KEY_TO_VB_KEY } from 'vueport-core/lib/browser/emulator-input';
import { EmulatorTimeControl, EmulatorTimeSettings } from 'vueport-core/lib/browser/emulator-time-control';
import { VesEmulatorTheiaNotifications } from './ves-emulator-theia-notifications';
import { VesEmulatorTheiaStorage } from './ves-emulator-theia-storage';
import { VueportNotifications, VueportStorage } from 'vueport-core/lib/common/emulator-host';
import EmulatorPalettes, { AnaglyphSwatch, PaletteSwatch } from 'vueport-core/lib/browser/components/EmulatorPalettes';
import EmulatorPreferences from 'vueport-core/lib/browser/components/EmulatorPreferences';
import { readBuildModeFromMap, readElf, readElfPathFromMap } from 'vueport-core/lib/browser/core/emulator-elf';
import {
  findFunctionAt,
  functionDisplayName,
  indexElfSymbols,
  VesEmulatorSymbolIndex,
} from 'vueport-core/lib/browser/core/emulator-symbols';
import { toFirefoxProfile } from 'vueport-core/lib/common/emulator-profile';
import { VesVbCore, VesVbSim } from 'vueport-core/lib/browser/core/vb-core';
import { VesEmulatorAreaLayout, VesEmulatorDock, VesEmulatorDockLayout } from 'vueport-core/lib/browser/panels/emulator-dock';
import { EmulatorPanelType } from 'vueport-core/lib/browser/panels/emulator-panel';
import { VesEmulatorCheatStore } from 'vueport-core/lib/browser/emulator-cheat-store';
import {
  EMULATOR_ACTION_COMMANDS,
  EmulatorCommands,
} from 'vueport-core/lib/browser/emulator-commands';
import { VesEmulatorCoreService, VesEmulatorSession } from 'vueport-core/lib/browser/emulator-core-service';
import { VesEmulatorEsSoundPlayer } from 'vueport-core/lib/browser/emulator-essound-player';
import {
  CUSTOM_PALETTE_PREFIX,
  emulationAnaglyphPalettes,
  emulationPalettes,
  EmulatorAction,
  EmulatorGamePadKeyCode,
  EmulatorMode,
  EmulatorRomStatus,
  formatColor,
  resolveAnaglyphPalette,
  resolvePalette,
  RomHeader,
} from 'vueport-core/lib/browser/emulator-types';
import { VES_EMULATOR_WIDGET_ID } from './ves-emulator-types';

export const VesEmulatorWidgetOptions = Symbol('VesEmulatorWidgetOptions');

export interface VesEmulatorWidgetOptions {
  uri: string;
  /**
   * Distinguishes several emulators running the same ROM. Absent for the
   * ordinary single instance, which keeps the bare widget id it always had.
   */
  instanceId?: string;
  /**
   * Emulators sharing a link group run in one worker and are wired together
   * over the link port. Peered simulations have to live in the same core, so
   * joining one after the widget already exists (see joinLinkGroup) means
   * rebuilding its session in the group's core, not just setting this field.
   */
  linkGroupId?: string;
  /**
   * Which player this emulator is, which is what its save RAM is filed under
   * (see getSaveRamUri). Absent means player 1. Set once, when the widget is
   * created, rather than when it joins a link group: two emulators of the same
   * ROM each own their own cartridge whether or not they are linked at the
   * moment, so the file a save lands in must not change under them when a pair
   * is linked or unlinked.
   */
  player?: number;
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
  /** Whether the palette window is open. */
  showPalettes: boolean;
  /** Whether the emulator's own settings window is open. */
  showPreferences: boolean;
  /** Whether the currently selected slot holds a save state. */
  saveStateExists: boolean;
  romHeader: RomHeader;
  romSize: number;
  mode: EmulatorMode;
}

/**
 * The arrangement an emulator opens with in the studio.
 *
 * vueport's own default leaves Memory Pools and Actors closed, because they
 * read VUEngine's heap and class hierarchy and say nothing about a ROM built
 * any other way. Here every ROM is a VUEngine build, so they are worth having
 * open — which is what this layout adds, and the only thing it changes.
 */
const VES_EMULATOR_STUDIO_LAYOUT: VesEmulatorAreaLayout = {
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
  @inject(FileService)
  protected readonly fileService!: FileService;
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
  @inject(VesEmulatorCoreService)
  protected readonly vesEmulatorCoreService!: VesEmulatorCoreService;
  @inject(VesEmulatorWidgetOptions)
  protected readonly options!: VesEmulatorWidgetOptions;
  @inject(VesRumblePackService)
  protected readonly vesRumblePackService!: VesRumblePackService;
  @inject(WorkspaceService)
  protected readonly workspaceService!: WorkspaceService;

  static readonly ID = VES_EMULATOR_WIDGET_ID;
  static readonly LABEL = nls.localize(
    'vuengine/emulator/emulator',
    'Emulator'
  );

  status: EmulatorRomStatus = EmulatorRomStatus.CHECKING;

  static readonly RESOLUTIONX = 384;
  static readonly RESOLUTIONY = 224;

  /** Unity gain. The core accepts 0 to 10. */
  static readonly DEFAULT_VOLUME = 1;

  /**
   * The actions that still work while the emulator is paused: the one that
   * unpauses it, and the ones that do not depend on it running.
   */
  static readonly ACTIONS_WHILE_PAUSED: EmulatorAction[] = [
    EmulatorAction.PauseToggle,
    EmulatorAction.Fullscreen,
    EmulatorAction.AudioMute,
    EmulatorAction.Reset,
    EmulatorAction.Screenshot,
    EmulatorAction.ToggleControlsOverlay,
  ];

  /** The emulation session backing this widget, created on first boot. */
  protected session?: VesEmulatorSession;
  core?: VesVbCore;
  sim?: VesVbSim;
  /** The other half of a linked pair, if any — see getLinkedPeer. */
  linkedPeer?: VesEmulatorWidget;
  /** Rearrangeable panels: the screen plus whichever inspectors are open. */
  dock: VesEmulatorDock;
  /** The ROM's cheats: loaded with it, and in effect whether or not the panel is open. */
  protected cheats: VesEmulatorCheatStore;
  /** ESSound playback, likewise independent of its panel being open. */
  esSound: VesEmulatorEsSoundPlayer;
  /** Cached location of the selected slot's save state, for the file watcher. */
  protected saveStatePath?: string;
  /** Live subscription forwarding link port traffic to a rumble pack, if any. */
  protected rumbleForwarding?: Disposable;
  /** Live subscription following which RumbleEffectSpec the game started. */
  protected rumbleSpecWatch?: Disposable;
  /** The current ROM's symbol table, in flight or read — see loadSymbols. */
  protected symbols?: Promise<VesEmulatorSymbolIndex | undefined>;

  /**
   * The host's side of things: files, and telling the user something. Built
   * here from the Theia services above, and the only place the emulator's
   * own code learns that Theia exists.
   */
  protected storage: VueportStorage;
  protected notifications: VueportNotifications;
  protected rumblePack: VueportRumblePack;
  settings: VueportSettings;
  bindings: VueportInputBindings;

  /** Speed, rewind, and the ordering of run/suspend transitions. */
  protected time: EmulatorTimeControl;

  /** Whether rewind input is currently held — read by the toolbar. */
  get rewinding(): boolean {
    return this.time.rewinding;
  }

  /**
   * Rewind, as the chrome and the key handler reach it.
   *
   * Delegated rather than exposing the time controls themselves, so that what
   * the toolbar and the keyboard can ask for stays a short, named list.
   */
  isRewindEnabled(): boolean {
    return this.time.isRewindEnabled();
  }

  stopRewinding(): void {
    this.time.stopRewinding();
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

  get loaded(): boolean {
    return this.state.loaded;
  }

  /** Everything the time controls read, gathered out of the settings. */
  timeSettings(): EmulatorTimeSettings {
    return {
      fastForwardRatio: this.settings.get('fastForwardRatio'),
      slowMotionRatio: this.settings.get('slowMotionRatio'),
      rewindEnabled: this.settings.get('rewindEnabled'),
      rewindGranularity: this.settings.get('rewindGranularity'),
      rewindBufferBytes: this.settings.get('rewindBufferSize') * 1024 * 1024,
    };
  }

  /**
   * Theia's hover service, as the copied controls want it.
   *
   * They ask only to show and hide an explanation somewhere; how it is placed
   * and styled stays the host's business.
   */
  readonly hover: VueportHover = {
    show: (target, content) => this.hoverService.requestHover({ content, target, position: 'top' }),
    hide: () => this.hoverService.cancelHover(),
  };

  /** Run one of the emulator's commands, for the chrome's buttons. */
  runCommand(id: string): void {
    this.commandService.executeCommand(id);
  }

  /** Redraw, for subsystems that changed something the chrome shows. */
  onDidChange(): void {
    this.update();
  }

  /** Report a failure from a subsystem that cannot show one itself. */
  onError(message: string): void {
    this.handleCoreError(message);
  }

  /** Keyboard and game pad input, which owns the key masks the core is told. */
  protected input: EmulatorInputController;

  /** The low battery signal, which the input controller folds into every mask. */
  get lowPower(): boolean {
    return this.state.lowPower;
  }

  /**
   * Whether key input should reach the game.
   *
   * False before the ROM has booted, and while the palette or settings window
   * is open, so that typing in one of those does not also play the game behind
   * it.
   */
  isAcceptingInput(): boolean {
    return this.state.loaded && !this.state.showPalettes && !this.state.showPreferences;
  }

  /** What a save state's header is stamped with, so it cannot load into another game. */
  protected get saveStateIdentity(): VesEmulatorSaveStateIdentity {
    return { romIdentity: this.romIdentity, romSize: this.state.romSize };
  }

  /** The ROM's CRC32, which is how the built-in cheats are looked up. */
  protected romId: string | undefined;

  /** The ROM's 32-byte header, used to bind save states to their cartridge. */
  protected romIdentity = new Uint8Array(32);

  state: vesEmulatorWidgetState;

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

    // Widget ids must be unique within the shell, so a linked pair cannot both
    // use the bare id. The lone instance keeps it, so existing saved layouts
    // still resolve.
    this.id = this.options?.instanceId
      ? `${VesEmulatorWidget.ID}:${this.options.instanceId}`
      : VesEmulatorWidget.ID;
    this.title.label = label;
    this.title.caption = caption;
    this.title.iconClass = 'codicon codicon-play';
    this.title.closable = true;
  }

  /**
   * Toolbar fixed above a dock area.
   *
   * The dock is a real Lumino dock panel, so the screen and the inspectors can
   * be dragged, split, tabbed, resized and closed like any other. The toolbar
   * stays put above it, and the controller overlay sits on top of both.
   */
  protected buildLayout(): void {
    // vueport's stylesheet is what dresses this node, so the class is its.
    this.addClass('vueport-widget');
    // ReactWidget defaults to a PerfectScrollbar-managed scroll container,
    // which this widget has no use for: it is a flex column that sizes its
    // own children and never scrolls as a whole.
    this.scrollOptions = undefined;

    const instanceId = this.options?.instanceId ?? 'default';
    this.storage = new VesEmulatorTheiaStorage(this.fileService, this.workspaceService);
    this.notifications = new VesEmulatorTheiaNotifications(this.messageService);
    this.rumblePack = new VesEmulatorTheiaRumblePack(this.vesRumblePackService);
    this.settings = new VesEmulatorTheiaSettings(this.preferenceService);
    this.bindings = new VesEmulatorTheiaBindings(this.vesCommonService, this.keybindingRegistry);
    this.cheats = new VesEmulatorCheatStore(this.storage);
    this.toDispose.push(Disposable.create(() => this.cheats.dispose()));
    this.esSound = new VesEmulatorEsSoundPlayer(this.storage);
    this.toDispose.push(Disposable.create(() => this.esSound.dispose()));
    this.dock = new VesEmulatorDock(
      instanceId,
      // Theia's shell tracks pointer drags across the whole window; a drag
      // inside this dock has to clear that or the shell keeps believing one of
      // its own is in progress. Standing alone there is no such shell.
      {
        cancelForeignDrag: () => { (this.shell as unknown as { dragState?: unknown }).dragState = undefined; },
        defaultLayout: VES_EMULATOR_STUDIO_LAYOUT,
      },
      this.rumblePack, this.cheats, this.notifications, this.esSound,
      () => this.loadSymbols()
    );
    this.input = new EmulatorInputController(this, this.bindings);
    this.time = new EmulatorTimeControl(this);

    // Restoring the dock layout has to wait until state.mode is known (loaded
    // asynchronously in initState), so it happens once, from doInit, rather
    // than racing it here.
    // Each tab group's "+" asks for a panel to put in that group; the picker
    // itself lives with the command, hence the round trip through it.
    this.toDispose.push(this.dock.onDidRequestAddPanel(tabBar =>
      this.commandService.executeCommand(EmulatorCommands.ADD_PANEL.id, this, tabBar)
    ));

    this.toDispose.push(this.dock.onDidChangeLayout(() => {
      this.persistDockLayout();
      // Opening or closing the Rumble Pack panel is what decides whether link
      // port capture is worth running when no pack is plugged in, and this is
      // the event that reports it.
      this.applyRumbleForwarding();
    }));
  }

  /** Open or focus one of the inspector panels. */
  togglePanel(kind: EmulatorPanelType): void {
    this.dock.togglePanel(kind);
  }

  /** Open one in a particular tab group, moving it there if it is open elsewhere. */
  addPanelTo(kind: EmulatorPanelType, tabBar: TabBar<Widget>): void {
    this.dock.addPanelTo(kind, tabBar);
  }

  isPanelOpen(kind: EmulatorPanelType): boolean {
    return this.dock.isPanelOpen(kind);
  }

  /** Put the panels back to just the screen. */
  resetLayout(): void {
    this.dock.resetLayout();
    this.persistDockLayout();
  }

  protected get dockLayoutStorageKey(): string {
    return 'emulator-dock-layout';
  }

  protected async restoreDockLayout(): Promise<void> {
    const stored = await this.localStorageService.getData<VesEmulatorDockLayout>(
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
  }

  update(): void {
    // One React tree now, so a single update redraws the toolbar, the overlays
    // and everything else the chrome shows.
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
    // Everything below reads preferences — the display mode and its palette,
    // the scale, the rewind budget, the speed ratios. A widget restored with
    // the workbench layout is built before the folder-scoped providers have
    // resolved, and until they have, PreferenceService.get answers with the
    // fallback it was passed rather than what is configured: the emulator
    // would come up in the default palette on every start-up and only pick up
    // the configured one when something changed a preference afterwards.
    await this.settings.ready;
    await this.initState();

    await this.restoreDockLayout();
    this.dock.setPlayMode(this.state.mode === EmulatorMode.PLAY);
    if (this.state.mode === EmulatorMode.PLAY) {
      this.dock.showScreenOnly();
    }

    await this.checkRomExists();

    // The old iframe-based widget started emulation from the iframe's onLoad
    // event, which fired once as an ordinary part of rendering. There is no
    // equivalent event for the imperative canvas that replaced it, so the
    // first start has to be kicked off explicitly. A missing ROM is left for
    // bindEvents to pick up once the build produces one.
    if (this.status === EmulatorRomStatus.EXISTS) {
      await this.startEmulator();
    }

    // TODO: find out why the emulator is only x1 size initially, without setTimeout
    setTimeout(() => {
      this.update();
    }, 50);
  }

  protected onCloseRequest(msg: Message): void {
    // The worker outlives the widget just long enough to read save RAM back.
    this.saveSaveRam().finally(() => this.disposeSession());
    super.onCloseRequest(msg);
  }

  protected disposeSession(): void {
    this.time.stopRewinding();
    // Bound to the simulation that is going away; a new session re-establishes
    // it from startEmulator.
    this.rumbleForwarding?.dispose();
    this.rumbleForwarding = undefined;
    this.rumbleSpecWatch?.dispose();
    this.rumbleSpecWatch = undefined;
    this.rumblePack.forwarding = false;
    // The whole record belongs to the run that is ending, not just the spec.
    this.rumblePack.clearEmulatedTraffic();
    if (this.session) {
      this.vesEmulatorCoreService.disposeSession(this.session);
      this.session = undefined;
    }
    this.sim = undefined;
    this.core = undefined;
    this.dock.setSim(undefined);
    this.cheats.setSim(undefined);
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
    return !!this.options?.linkGroupId;
  }

  /**
   * The other half of a linked pair, once linkSecondPlayer has introduced
   * them. Stays set across an unlink (see leaveLinkGroup), so the two tabs
   * can find each other again for relinkPlayers — only clearing when the
   * peer itself closes (handlePeerClosed).
   */
  getLinkedPeer(): VesEmulatorWidget | undefined {
    return this.linkedPeer;
  }

  /** Record a link partner and fall back to solo if it closes. */
  setLinkedPeer(peer: VesEmulatorWidget): void {
    this.linkedPeer = peer;
    this.toDispose.push(peer.onDidDispose(() => this.handlePeerClosed()));
  }

  /**
   * The peer tab closed. If this instance was still actively linked to it —
   * as opposed to having already been unlinked while both stayed open — fall
   * back to running solo, the same non-destructive rebuild an explicit
   * unlink does, just triggered from the other side.
   */
  protected async handlePeerClosed(): Promise<void> {
    this.linkedPeer = undefined;
    if (!this.isDisposed && this.isLinked()) {
      await this.leaveLinkGroup();
    }
  }

  protected baseLabel(): string {
    return this.options
      ? this.vesCommonService.basename(this.options.uri)
      : VesEmulatorWidget.LABEL;
  }

  /** Set this tab's title to "<rom>.vb (P{n})", the linked-player convention. */
  setPlayerLabel(player: number): void {
    this.title.label = `${this.baseLabel()} (P${player})`;
  }

  protected resetPlayerLabel(): void {
    this.title.label = this.baseLabel();
  }

  /**
   * Move this already-running, unlinked emulator into a link group.
   *
   * Linked simulations have to share a worker (see the note on
   * VesEmulatorWidgetOptions.linkGroupId), and this instance's session is
   * already running in its own, private one — so joining means tearing that
   * session down and rebuilding it in the group's shared core via
   * startEmulator. rebuildSession carries the running game across that
   * rebuild, so — unlike a freshly linked pair, which boots from scratch —
   * joining an already-running emulator does not reset it.
   */
  async joinLinkGroup(linkGroupId: string, player: number): Promise<void> {
    this.setPlayerLabel(player);
    await this.rebuildSession(linkGroupId);
  }

  /**
   * Leave this instance's link group, if it is in one, returning to a plain,
   * solo title and its own private core — without losing progress, and
   * without forgetting the peer (see getLinkedPeer), so relinkPlayers can
   * reconnect the same two tabs later.
   */
  async leaveLinkGroup(): Promise<void> {
    if (!this.isLinked()) {
      return;
    }
    this.resetPlayerLabel();
    await this.rebuildSession(undefined);
  }

  /**
   * Rebuild this emulator's session under a different link group (or none,
   * for solo), preserving the running game rather than rebooting it.
   *
   * The struct startEmulator's snapshot restores is a flat memcpy of CPU/VIP
   * state (see docs/emulator-rewrite-plan.md §2) that excludes cart RAM —
   * that lives in its own allocation, referenced only by pointer — so it is
   * carried separately, read live from the old simulation rather than from
   * whatever was last written to the save file, in case there are unsaved
   * changes.
   */
  protected async rebuildSession(linkGroupId: string | undefined): Promise<void> {
    let snapshot: ArrayBuffer | undefined;
    let cartRam: ArrayBuffer | undefined;
    if (this.state.loaded && this.sim) {
      snapshot = await this.sim.saveState();
      cartRam = await this.sim.getCartRam();
    }
    if (this.options) {
      this.options.linkGroupId = linkGroupId;
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

    // Reset widget state first: initState clears the ROM header, so loading
    // the ROM afterwards is what leaves it populated.
    await this.initState();
    await this.loadRom();
    await this.loadSaveRam();
    await this.refreshSaveStateExists();
    await this.resetSim();
    // initState cleared the paused and low power flags, so make the core agree.
    await this.input.applyKeys();
    await this.core?.run();
    this.state.loaded = true;
    this.update();
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
      showPalettes: false,
      showPreferences: false,
      saveStateExists: false,
      romHeader: {
        name: '',
        maker: '',
        code: '',
        version: 0,
      },
      romSize: 0,
      mode:
        (await this.localStorageService.getData<EmulatorMode>(
          'ves-emulator-state-mode'
        )) || EmulatorMode.DEBUG,
    };
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
          // A session already running gets the new ROM swapped in; a widget
          // that opened before the ROM existed gets its first one.
          if (this.sim) {
            this.reload();
          } else {
            this.status = EmulatorRomStatus.EXISTS;
            this.startEmulator();
          }
          return;
        }

        // A save state may have been written or deleted outside the emulator.
        const saveStatePath = this.saveStatePath;
        if (saveStatePath && fileChangesEvent.changes.some(change => change.resource.toString() === saveStatePath)) {
          this.refreshSaveStateExists();
        }
      }),
      this.keybindingRegistry.onKeybindingsChanged(() => {
        this.input.refreshBindings();
        this.update();
      }),
      this.settings.onDidChange(setting => {
        // Switching display mode is now a handful of uniforms and a resize, so
        // it no longer costs a restart.
        if ([
          'renderingMode', 'palette', 'anaglyphPalette',
          'customPalettes', 'customAnaglyphPalettes',
        ].includes(setting)) {
          this.applyDisplayMode();
          this.update();
        } else if (setting === 'scale') {
          this.applyScale();
          // The toolbar's scale select is controlled: it shows what the
          // setting says, not what was last clicked in it, so picking an
          // entry only moves the selection once the toolbar re-renders.
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
        }
      }),
      this.rumblePack.onDidChangeConnected(() => this.applyRumbleForwarding()),
    ]);
  }

  /**
   * Send what the game clocks out of the link port to a connected rumble pack.
   *
   * The pack is a link port peripheral: VUEngine broadcasts its rumble
   * commands over that port rather than to any address of its own (see
   * `Rumble::execute` and `Communications::broadcastData`), so a physical pack
   * plugged into this machine buzzes for an emulated game exactly as it would
   * for a real one, without the ROM knowing the difference.
   *
   * Watching the port costs the core a callback on every CPU write, so capture
   * runs only while the bytes have somewhere to go: a pack is connected, or
   * the Rumble Pack panel is on screen, which shows them decoded whether or
   * not anyone owns the hardware. On screen rather than merely open, because
   * the default layout docks that panel behind other tabs — a tab nobody has
   * looked at is not worth a callback per CPU write. Called whenever any of
   * that changes — a pack coming or going, a panel being opened, closed or
   * brought to the front, a session being built — and does nothing when the
   * answer has not changed, since a dock layout event fires for every drag
   * and resize too.
   */
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
      // Only worth turning off for a simulation that is still there; a
      // disposed one takes its capture with it.
      if (sim) {
        await Promise.all([
          sim.setLinkCapture(false),
          sim.setPointerWatch(0),
        ]).catch(() => {
          // The session may be on its way out, which switches both off anyway.
        });
      }
      return;
    }

    this.rumbleForwarding = sim!.onLink(bytes => this.forwardToRumblePack(bytes));
    try {
      await sim!.setLinkCapture(true);
      this.rumblePack.forwarding = true;
      // After capture, and not awaited alongside it: reading a build's symbol
      // table takes long enough to be worth not holding up the bytes.
      this.applyRumbleSpecWatch(sim!).catch(error =>
        console.error('[emulator] rumble spec watch could not be set up:', error)
      );
    } catch (error) {
      // Reported rather than swallowed: a core that rejects the command — a
      // worker bundle older than this build, say — is otherwise indis-
      // tinguishable from a game that simply never rumbles.
      this.rumbleForwarding.dispose();
      this.rumbleForwarding = undefined;
      this.rumblePack.forwarding = false;
      // Logged rather than run through handleCoreError, which tears the
      // running emulator down — losing rumble is not losing the session.
      console.error('[emulator] rumble pack forwarding could not be enabled:', error);
    }
  }

  /**
   * Follow which RumbleEffectSpec the game is playing, when the ROM was built
   * with symbols.
   *
   * Nothing on the link port says where an effect came from — two specs with
   * the same settings broadcast identical bytes — but `Rumble::startEffect`
   * stores the spec it was handed into a static before configuring anything,
   * and a store is exactly what the core can be asked to report. Following
   * that one address turns a stream of settings into the name of the spec in
   * the project that produced them.
   */
  protected async applyRumbleSpecWatch(sim: VesVbSim): Promise<void> {
    const symbols = await this.loadSymbols();
    // Reading a symbol table takes long enough for the panel to have been
    // closed, or the session rebuilt, while it was going on.
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

  /**
   * Name each stored pointer.
   *
   * Two things can leave an effect unnamed, and they mean opposite things, so
   * they are reported differently: a null pointer is `Rumble::reset` saying
   * nothing is playing any more, while a pointer no symbol covers means an
   * effect really did start and only its name is missing — a spec that is not
   * a global of its own, or symbols belonging to a different build than the
   * ROM. The address is kept either way, so the second case can be told apart
   * from the first at a glance.
   */
  protected resolveRumbleSpec(symbols: VesEmulatorSymbolIndex, values: number[]): void {
    for (const value of values) {
      const address = value >>> 0;
      this.rumblePack.emulatedSpec = address === 0
        ? undefined
        : { address, name: symbols.rumbleSpecNames.get(address) };
    }
  }

  // --- Profiling ------------------------------------------------------------

  /** True while a session is being recorded for profiling. */
  isProfiling(): boolean {
    return this.profiling;
  }

  profiling = false;

  /**
   * Begin recording the session, so it can be profiled once it is over.
   *
   * The recording is input, not execution: the machine as it stands plus what
   * it is told from here on. That is enough because emulation is
   * deterministic, and it means watching costs almost nothing while the game
   * is trying to run — the expensive part happens afterwards.
   */
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

  /**
   * Stop recording, replay what was recorded, and write the profile out.
   *
   * The replay occupies the emulator for a few seconds — it is the whole
   * session again, following every instruction — so the game is stopped for
   * the duration and put back exactly as it was.
   */
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

  /**
   * Turn a collected tree into a Firefox Profiler file beside the ROM.
   *
   * Named for when it was taken rather than after the ROM, since profiling the
   * same game twice is the normal case and overwriting the first one would be
   * the wrong default.
   */
  protected async writeProfile(result: VesVbProfileResult): Promise<URI> {
    const symbols = await this.loadSymbols();
    const romUri = this.getResourceUri();
    const romSize = this.state.romSize * 131072;

    // The game's own name, so a capture says what it is of. Falling back to
    // the ROM's file name rather than to nothing, since a profile with no
    // title is indistinguishable from every other one.
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

  /**
   * The ROM's symbols, read once and shared by everything that wants one.
   *
   * Several features are built on the symbol table — which RumbleEffectSpec
   * is playing, where the memory pools are, which class is in a given block —
   * and a build's `.elf` is tens of megabytes, so it is read at most once per
   * ROM. The promise itself is what gets kept, so callers arriving while a
   * read is still in flight wait on that one rather than starting another.
   * `loadRom` drops it, which is what makes a rebuild pick up new symbols
   * instead of describing the running ROM with the previous build's.
   */
  loadSymbols(): Promise<VesEmulatorSymbolIndex | undefined> {
    if (!this.symbols) {
      this.symbols = this.readSymbols();
    }
    return this.symbols;
  }

  /**
   * Read the ROM's symbols.
   *
   * The `.map` beside the ROM is what ties the two together: `build/output.vb`
   * is a copy whose name says nothing about which build mode made it, but the
   * map copied alongside it names its own image — `OUTPUT(build/working/
   * output-beta.elf elf32-v810)` — and only the `.elf` has the file-scope
   * statics this needs. A ROM built without either simply leaves the features
   * built on them off.
   */
  protected async readSymbols(): Promise<VesEmulatorSymbolIndex | undefined> {
    try {
      // Inside the guard, not ahead of it: everything here is best-effort, and
      // a caller that asked for symbols has a way to carry on without them but
      // no way to carry on with a rejected promise.
      const romUri = this.getResourceUri();
      if (!romUri) {
        return undefined;
      }
      const elfUri = await this.findElfUri(romUri);
      if (!elfUri) {
        return undefined;
      }
      const image = readElf((await this.fileService.readFile(elfUri)).value.buffer);
      return image && indexElfSymbols(image);
    } catch (error) {
      // A ROM with no symbols beside it is the ordinary case for anything not
      // built here, and costs only the features that read them. Anything else
      // reaching here is a real fault, and the stack is what tells them apart.
      console.warn('[emulator] ROM symbols could not be read:', error);
      return undefined;
    }
  }

  /**
   * The build mode a ROM was made with, from the `.map` beside it.
   *
   * Read separately from the symbols rather than as part of them: this is one
   * line out of a map, which every ROM built here has, while the symbols mean
   * pulling a `.elf` of tens of megabytes that most sessions never need.
   */
  protected async readBuildMode(romUri: URI): Promise<string | undefined> {
    try {
      const mapUri = romUri.parent.resolve(`${romUri.path.name}.map`);
      if (!await this.fileService.exists(mapUri)) {
        return undefined;
      }
      return readBuildModeFromMap((await this.fileService.readFile(mapUri)).value.toString());
    } catch (error) {
      // A ROM with no map beside it is the ordinary case for anything not
      // built here, and costs only this one line of the ROM Info panel.
      console.warn('[emulator] build mode could not be read:', error);
      return undefined;
    }
  }

  /** The `.elf` belonging to a ROM: named by its `.map`, or sitting beside it. */
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

    // The path the build wrote is relative to where it ran, which is the
    // project root, and absolute only if the toolchain was told to be.
    const root = this.workspaceService.tryGetRoots()[0]?.resource;
    const elfUri = declared.startsWith('/') ? new URI(declared) : root?.resolve(declared);
    return elfUri && await this.fileService.exists(elfUri) ? elfUri : undefined;
  }

  /**
   * Restart the machine, and forget whatever was describing its last run.
   *
   * Every reset goes through here rather than calling the simulation directly,
   * so that the Rumble Pack panel cannot end up showing an effect from before
   * the restart — the engine's own rumble state is cleared by the same reset
   * (`Rumble::reset`, via `Hardware::reset`), so keeping ours would be
   * describing settings the game no longer believes it has sent.
   */
  protected async resetSim(): Promise<void> {
    this.rumblePack.clearEmulatedTraffic();
    await this.sim?.reset();
  }

  protected forwardToRumblePack(bytes: number[]): void {
    for (const byte of bytes) {
      // Not awaited: writes queue on the port's writer in the order they are
      // made, and the emulator must not wait on a serial line to keep running.
      this.rumblePack.sendByte(byte).catch(() => {
        // A pack unplugged mid-effect. Detection notices, and the change
        // event that follows tears this forwarding down.
      });
    }
  }

  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.input.attach(this.node, this.dock.screen.node);
  }

  /**
   * Redraw once this node is in the document, so that the Emulator component
   * can attach the dock — Lumino refuses a host that is not itself attached.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.input.detach();
  }

  /**
   * Hide and show the dock along with this widget.
   *
   * The dock used to be a child of this widget's Lumino layout, which
   * propagated visibility to it and on to every panel — and the panels stop
   * polling while hidden, which is what keeps a stack of closed tabs free. It
   * is attached into a plain container now (see the Emulator component), so it
   * has no Lumino parent to hear that from and has to be told directly.
   * `setHidden` is what does the telling: it carries on down the dock's own
   * tree to the panels, which is the part that matters.
   */
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.dock.setHidden(false);
  }

  protected onAfterHide(msg: Message): void {
    super.onAfterHide(msg);
    this.dock.setHidden(true);
  }

  /**
   * Whether this emulator answers to the second player's own key mappings.
   *
   * Only the second emulator of a link session can, and only while the
   * preference says its controls are not shared with the first player's.
   */
  usesPlayer2Controls(): boolean {
    return this.player === 2 && !this.settings.get('player2SameControls');
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.tabIndex = 0;
    this.node.focus();
  }

  /**
   * (Re)build the session backing this widget.
   *
   * Passing a snapshot/cartRam pair — see rebuildSession — restores the
   * running game instead of resetting it, for moving an already-running
   * emulator into or out of a link group. Ordinary boots (initial load, ROM
   * rebuilt on disk) call this with neither and get the normal fresh reset.
   */
  protected startEmulator = async (snapshot?: ArrayBuffer, cartRam?: ArrayBuffer): Promise<void> => {
    this.disposeSession();
    // The panel has to know the mode before it hands out a canvas: takeCanvas
    // sizes the backing store from it, and relayout sizes the CSS box from it.
    // The worker's renderer resizes the backing store to the mode's geometry
    // regardless, so a panel still on the default would leave a wide mode —
    // side by side is 768x224 — squeezed into a 384-wide box and stretched to
    // twice its proper height until something else changed the mode.
    const displayMode = this.getDisplayMode();
    this.dock.screen.setDisplayMode(displayMode);
    const canvas = this.dock.screen.takeCanvas();

    try {
      const session = await this.vesEmulatorCoreService.createSession(this.options?.linkGroupId);
      this.session = session;
      const core = session.core;
      this.core = core;
      this.toDispose.push(core.onError(message => this.handleCoreError(message)));

      this.sim = session.sim;
      this.dock.setSim(this.sim);
      this.cheats.setSim(this.sim);
      this.applyScale();
      await this.sim.setDisplayMode(displayMode);
      await this.sim.attachCanvas(canvas);
      await this.sim.setVolume(this.state.muted ? 0 : VesEmulatorWidget.DEFAULT_VOLUME);

      await this.time.applySpeed();
      await this.time.applyRewindSettings();
      await this.applyRumbleForwarding();

      await this.loadRom();
      const romUri = await this.getRomUri();
      await this.cheats.load(romUri.toString(), this.romId);
      // Scanned before the port is watched, since whether there is anything to
      // play is what decides whether watching it is worth the callback.
      await this.esSound.scan(romUri.toString());
      await this.esSound.setSim(this.sim);
      this.esSound.setMuted(this.state.muted);
      this.toDispose.push(this.sim.onEsSound(commands => commands.forEach(raw => this.esSound.handle(raw))));
      // byteLength, not just truthiness: getCartRam hands back an empty
      // buffer rather than throwing when a sim has none allocated yet, and
      // an empty ArrayBuffer is itself truthy.
      if (cartRam && cartRam.byteLength > 0) {
        await this.sim.setCartRam(cartRam);
      } else {
        await this.loadSaveRam();
      }
      await this.refreshSaveStateExists();
      if (snapshot) {
        // Not a restart: this is an already-running game being moved into or
        // out of a link group, and it carries on where it left off.
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

  /** Read the ROM from disk and hand it to the core. */
  protected async loadRom(): Promise<void> {
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
    this.romIdentity = new Uint8Array(romContentHeaderBuffer);
    // Over the whole file, which is what the preservation catalogues the cheat
    // database is drawn from key on. Computed here because the ROM is already
    // in memory; reading it again just to checksum it would be the only cost.
    // A view over the same bytes rather than a copy, and a Buffer because
    // that is what `crc` is typed for.
    this.romId = formatRomId(crc32(Buffer.from(
      romContentBuffer.buffer, romContentBuffer.byteOffset, romContentBuffer.byteLength
    )));
    // Dropped rather than reread here: whatever a rebuild changed, the symbols
    // that described the previous build no longer describe this one, and
    // nothing needs them until something asks. See loadSymbols.
    this.symbols = undefined;
    // Pushed to the dock rather than read from widget state, because the ROM
    // Info panel only has access to what VesEmulatorDebugSource exposes.
    this.dock.setRomInfo(this.state.romHeader, this.state.romSize, await this.readBuildMode(romUri));

    // The buffer is transferred into the worker, so hand over a copy that owns
    // an exactly sized ArrayBuffer.
    await this.sim?.setCartRom(romContentBuffer.slice().buffer);
  }

  protected onResize(): void {
    this.update();
  }

  /**
   * The toolbar button rewinds for as long as it is held, like the keyboard
   * shortcut. The pointer is captured so that releasing off the button, or
   * dragging away from it, still ends the rewind.
   */
  onRewindButtonDown = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (!this.time.isRewindEnabled()) {
      // Nothing to hold down. Left alone, the press turns into an ordinary
      // click, which is what offers to enable the feature.
      return;
    }
    // Keep the press from moving focus onto the button: the widget node is what
    // listens for the emulator's keys, and giving them up for the length of a
    // click is exactly what the old handler had to undo afterwards.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    this.time.startRewinding();
  };

  /**
   * Offer to turn rewind on, from the greyed-out toolbar button.
   *
   * Recording history is not free and the preference defaults to off, so the
   * button explains what switching it on costs rather than either hiding the
   * feature or quietly making everyone pay for it.
   */
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
    // Hand the keyboard back, so the shortcuts keep working after a click.
    this.node.focus();
  };

  /**
   * Run one of the emulator's actions.
   *
   * Through its command rather than by calling the implementation, so that the
   * toolbar, the command palette and a key press all take the same route and
   * are gated by the same `isEnabled`. The work itself is in `performAction`,
   * which the command's handler calls back into.
   */
  public runAction = (action: EmulatorAction): void => {
    this.commandService.executeCommand(EMULATOR_ACTION_COMMANDS[action].id);
    // Hand the keyboard back, so the shortcuts keep working after a click.
    this.node.focus();
  };

  /**
   * Whether an action can run right now.
   *
   * The rules the key handler and the toolbar used to state separately, in one
   * place: the controls overlay takes the widget over and only the action that
   * closes it works; a paused emulator still takes the handful of actions that
   * mean something while it is stopped; frame advance repeats only once frame
   * advance has been entered.
   */
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

  /** Carry out an action. Called by its command, never directly. */
  public async performAction(action: EmulatorAction): Promise<void> {
    await this.sendCommand('keyPress', action);
  }

  protected render(): React.ReactNode {
    return <Emulator emulator={this} attached={this.isAttached} />;
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
    return <>
      {this.state.showControls &&
        <PopUpDialog
          open={this.state.showControls}
          title={nls.localize('vuengine/emulator/configureInput', 'Configure Input')}
          okLabel={nls.localizeByDefault('Close')}
          cancelButton={false}
          onClose={() => this.toggleControlsOverlay()}
          onOk={() => this.toggleControlsOverlay()}
          height='90%'
          width='90%'
          overflow='auto'
        >
          <EmulatorControlsOverlay
            settings={this.settings}
            bindings={this.bindings}
          />
        </PopUpDialog>
      }
      {this.state.showPalettes &&
        <PopUpDialog
          open={this.state.showPalettes}
          title={nls.localize('vuengine/emulator/colorPalettes', 'Color Palettes')}
          okLabel={nls.localizeByDefault('Close')}
          cancelButton={false}
          onClose={() => this.togglePaletteWindow()}
          onOk={() => this.togglePaletteWindow()}
          height='640px'
          width='690px'
          overflow='hidden'
        >
          <EmulatorPalettes
            settings={this.settings}
            notifications={this.notifications}
            anaglyph={this.getRenderingMode() === VbRenderingMode.ANAGLYPH}
          />
        </PopUpDialog>
      }
      {this.state.showPreferences &&
        <PopUpDialog
          open={this.state.showPreferences}
          title={nls.localize('vuengine/emulator/emulatorSettings', 'Emulator Settings')}
          okLabel={nls.localizeByDefault('Close')}
          cancelButton={false}
          onClose={() => this.togglePreferencesWindow()}
          onOk={() => this.togglePreferencesWindow()}
          height='540px'
          width='540px'
        >
          <EmulatorPreferences
            settings={this.settings}
            hover={this.hover}
          />
        </PopUpDialog>
      }
    </>;
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

    // Rewind is held rather than toggled, so it needs the press and the
    // release, unlike the function keys below which act on release.
    if (data === EmulatorAction.Rewind) {
      if (command === 'keydown') {
        this.time.startRewinding();
      } else if (command === 'keyup') {
        this.time.stopRewinding();
      } else if (command === 'keyPress') {
        // Activating the toolbar button from the keyboard has no release to
        // wait for, so it steps back once.
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
          // ESSound plays alongside the emulator's own audio, so it follows
          // the same switch.
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
          // ESSound plays alongside the emulator, so it stops alongside it too.
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
        case EmulatorAction.StateSlotDecrease:
          if (this.state.saveSlot > 1) {
            this.state.saveSlot--;
            this.update();
            await this.localStorageService.setData(
              'ves-emulator-state-save-slot',
              this.state.saveSlot
            );
            await this.refreshSaveStateExists();
          }
          break;
        case EmulatorAction.StateSlotIncrease:
          this.state.saveSlot++;
          this.update();
          await this.localStorageService.setData(
            'ves-emulator-state-save-slot',
            this.state.saveSlot
          );
          await this.refreshSaveStateExists();
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

  protected get player(): number {
    return this.options?.player ?? 1;
  }

  // Save RAM lives next to the ROM, as <rom>.p{player}.sram
  protected async getSaveRamPath(): Promise<string> {
    const rom = (await this.getRomUri()).toString();
    return this.storage.join(
      this.storage.parent(rom), `${this.storage.stem(rom)}.p${this.player}.sram`
    );
  }

  protected async loadSaveRam(): Promise<void> {
    const path = await this.getSaveRamPath();
    const ram = freshSaveRam(this.settings.get('sramInit'));

    if (await this.storage.exists(path)) {
      const stored = await this.storage.read(path);
      // The core requires a power of two, so a truncated or hand-edited file
      // starts the game fresh rather than failing to boot. A file shorter than
      // the full window — anything written before DEFAULT_SAVE_RAM_SIZE covered
      // the whole cartridge bus — keeps its contents but is placed in a
      // correctly sized buffer, since handing the core the short one is what
      // makes the window mirror in the first place.
      if (stored.length === 0 || (stored.length & (stored.length - 1)) !== 0) {
        console.warn(`[emulator] ignoring save RAM of unusable size ${stored.length}: ${path}`);
      } else if (stored.length >= ram.length) {
        await this.sim?.setCartRam(stored.slice().buffer);
        return;
      } else {
        ram.set(stored);
      }
    }

    await this.sim?.setCartRam(ram.slice().buffer);
  }

  protected async saveSaveRam(): Promise<void> {
    const ram = await this.sim?.getCartRam();
    if (!ram || ram.byteLength === 0) {
      return;
    }
    await this.storage.write(await this.getSaveRamPath(), new Uint8Array(ram));
  }

  // Save states live next to the ROM, as <rom>.<slot>.state
  protected async getSaveStatePath(slot: number): Promise<string> {
    const rom = (await this.getRomUri()).toString();
    return this.storage.join(
      this.storage.parent(rom), `${this.storage.stem(rom)}.${slot}.state`
    );
  }

  protected async refreshSaveStateExists(): Promise<void> {
    this.saveStatePath = await this.getSaveStatePath(this.state.saveSlot);
    const exists = await this.storage.exists(this.saveStatePath);
    if (exists !== this.state.saveStateExists) {
      this.state.saveStateExists = exists;
      this.update();
    }
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

  protected async saveState(): Promise<void> {
    const sims = this.session?.siblings;
    if (!sims?.length) {
      return;
    }
    const states: ArrayBuffer[] = [];
    for (const sim of sims) {
      states.push(await sim.saveState());
    }
    await this.storage.write(
      await this.getSaveStatePath(this.state.saveSlot),
      wrapSaveState(states, this.saveStateIdentity, this.esSound.snapshot())
    );
    await this.refreshSaveStateExists();
    this.notifications.info(
      nls.localize('vuengine/emulator/saveStateSaved', 'Save state saved to slot {0}.', this.state.saveSlot)
    );
  }

  protected async loadState(): Promise<void> {
    const sims = this.session?.siblings;
    if (!sims?.length) {
      return;
    }
    const path = await this.getSaveStatePath(this.state.saveSlot);
    if (!await this.storage.exists(path)) {
      return;
    }
    try {
      const { states, esSound } = unwrapSaveState(
        await this.storage.read(path), sims.length, this.saveStateIdentity
      );
      // Suspended across the restore so the pair cannot emulate half-loaded.
      const running = !this.state.paused;
      if (running) {
        await this.core?.suspend();
      }
      for (let i = 0; i < sims.length; i++) {
        await sims[i].loadState(states[i]);
      }
      // After the machine's own state, so the audio follows what it belongs to
      this.restoreEsSound(esSound);
      if (running) {
        await this.core?.run();
      }
      this.notifications.info(
        nls.localize('vuengine/emulator/saveStateLoaded', 'Save state loaded from slot {0}.', this.state.saveSlot)
      );
    } catch (error) {
      this.handleCoreError(error instanceof Error ? error.message : String(error));
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

  protected getDisplayMode(): VbDisplayMode {
    return buildVbDisplayMode(
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

  togglePaletteWindow(): void {
    this.state.showPalettes = !this.state.showPalettes;
    this.update();
  }

  togglePreferencesWindow(): void {
    this.state.showPreferences = !this.state.showPreferences;
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
    this.state.showControls = !this.state.showControls;
    this.update();
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
