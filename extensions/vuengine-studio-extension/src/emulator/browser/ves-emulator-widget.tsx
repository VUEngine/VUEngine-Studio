import { FileX } from '@phosphor-icons/react';
import { CommandService, Disposable, MessageService, nls, PreferenceScope, PreferenceService } from '@theia/core';
import {
  ApplicationShell,
  BaseWidget,
  ConfirmDialog,
  KeybindingRegistry,
  LocalStorageService,
  Message,
  NavigatableWidget,
  ScopedKeybinding
} from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { PanelLayout, TabBar, Widget } from '@theia/core/shared/@lumino/widgets';
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
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import AdvancedSelect from '../../editors/browser/components/Common/Base/AdvancedSelect';
import HContainer from '../../editors/browser/components/Common/Base/HContainer';
import Input from '../../editors/browser/components/Common/Base/Input';
import PopUpDialog from '../../editors/browser/components/Common/Base/PopUpDialog';
import RadioSelect from '../../editors/browser/components/Common/Base/RadioSelect';
import EmptyContainer from '../../editors/browser/components/Common/EmptyContainer';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import {
  buildVbDisplayMode,
  VB_DEFAULT_ANAGLYPH_PALETTE_ID,
  VB_DEFAULT_PALETTE_ID,
  VB_DEFAULT_RENDERING_MODE,
  VB_FRAME_RATE,
  VbAnaglyphPalette,
  VbDisplayMode,
  VbKey,
  VbPalette,
  VbRenderingMode,
} from '../common/ves-vb-constants';
import { VesVbProfileResult } from '../common/ves-vb-protocol';
import { EmulatorControlsOverlay } from './components/EmulatorControlsOverlay';
import EmulatorPalettes, { AnaglyphSwatch, PaletteSwatch } from './components/EmulatorPalettes';
import { readBuildModeFromMap, readElf, readElfPathFromMap } from './core/ves-emulator-elf';
import {
  findFunctionAt,
  functionDisplayName,
  indexElfSymbols,
  VesEmulatorSymbolIndex,
} from './core/ves-emulator-symbols';
import { toFirefoxProfile } from '../common/ves-emulator-profile';
import { VesVbCore, VesVbSim } from './core/ves-vb-core';
import { VesEmulatorDock, VesEmulatorDockLayout } from './panels/ves-emulator-dock';
import { EmulatorPanelType } from './panels/ves-emulator-panel';
import { VesEmulatorCheatStore } from './ves-emulator-cheat-store';
import {
  EMULATOR_ACTION_COMMANDS,
  EMULATOR_ACTIONS,
  EMULATOR_GAMEPAD_BUTTONS,
  EMULATOR_GAMEPAD_INPUTS,
  EmulatorCommands,
  emulatorGamePadCommand,
} from './ves-emulator-commands';
import { VesEmulatorCoreService, VesEmulatorSession } from './ves-emulator-core-service';
import { VesEmulatorEsSoundPlayer } from './ves-emulator-essound-player';
import { readGamepadKeys } from './ves-emulator-gamepad';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import {
  CUSTOM_PALETTE_PREFIX,
  CustomAnaglyphPalette,
  CustomPalette,
  EMULATION_ANAGLYPH_PALETTES,
  EMULATION_PALETTES,
  EMULATION_RENDERING_MODES,
  EMULATOR_SCALE_OPTIONS,
  EmulatorAction,
  EmulatorGamePadKeyCode,
  EmulatorMode,
  EmulatorScale,
  formatColor,
  resolveAnaglyphPalette,
  resolvePalette,
  RomHeader,
  VES_EMULATOR_WIDGET_ID,
} from './ves-emulator-types';

/**
 * One mapping: the keys currently bound to it, and what pressing them does.
 *
 * A game pad button is held, so it carries the pad code the core wants; an
 * action is run once, so it carries the action. Which of the two it is decides
 * how the key handler treats press and release.
 */
interface EmulatorInputBinding {
  keys: ScopedKeybinding[];
  command: EmulatorAction | EmulatorGamePadKeyCode;
}

enum EmulatorRomStatus {
  CHECKING = 'checking',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
}

const GAMEPAD_KEY_TO_VB_KEY: Record<EmulatorGamePadKeyCode, VbKey> = {
  [EmulatorGamePadKeyCode.A]: VbKey.A,
  [EmulatorGamePadKeyCode.B]: VbKey.B,
  [EmulatorGamePadKeyCode.Start]: VbKey.STA,
  [EmulatorGamePadKeyCode.Select]: VbKey.SEL,
  [EmulatorGamePadKeyCode.LUp]: VbKey.LU,
  [EmulatorGamePadKeyCode.LRight]: VbKey.LR,
  [EmulatorGamePadKeyCode.LDown]: VbKey.LD,
  [EmulatorGamePadKeyCode.LLeft]: VbKey.LL,
  [EmulatorGamePadKeyCode.RUp]: VbKey.RU,
  [EmulatorGamePadKeyCode.RRight]: VbKey.RR,
  [EmulatorGamePadKeyCode.RDown]: VbKey.RD,
  [EmulatorGamePadKeyCode.RLeft]: VbKey.RL,
  [EmulatorGamePadKeyCode.LT]: VbKey.LT,
  [EmulatorGamePadKeyCode.RT]: VbKey.RT,
};

const EmulatorControls = styled.div`
  display: flex;
  gap: 5px;
  justify-content: space-between;
  min-width: 384px;
  padding: calc(var(--theia-ui-padding) * 2);
`;

const EmulatorControlsGroup = styled.div`
  display: flex;
  gap: calc(var(--theia-ui-padding) * 2);

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

const SaveSlotInputWrapper = styled.div`
  position: relative;

  i {
    left: 7px;
    position: absolute;
    top: 7px;
    z-index: 1;
  }

  input {
    padding-left: 20px;
  }
`;

const PaletteButton = styled.button`
  border: 1px solid transparent;
  padding: 0;
`;

const SELECT_STYLE = { width: 'auto' };

export const VesEmulatorWidgetOptions = Symbol('VesEmulatorWidgetOptions');
/** A save state file, taken apart: one block per simulation, and the audio. */
interface VesEmulatorSaveState {
  states: ArrayBuffer[];
  /** The ESSound section, absent in files written before version 2. */
  esSound: string | undefined;
}

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
  /** Whether the currently selected slot holds a save state. */
  saveStateExists: boolean;
  romHeader: RomHeader;
  romSize: number;
  input: Record<string, EmulatorInputBinding>;
  mode: EmulatorMode;
}

@injectable()
export class VesEmulatorWidget extends BaseWidget implements NavigatableWidget {
  @inject(ApplicationShell)
  protected readonly shell!: ApplicationShell;
  @inject(CommandService)
  protected readonly commandService!: CommandService;
  @inject(FileService)
  protected readonly fileService!: FileService;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
  @inject(LocalStorageService)
  protected readonly localStorageService!: LocalStorageService;
  @inject(MessageService)
  protected readonly messageService!: MessageService;
  @inject(VesProjectService)
  protected readonly vesProjectService!: VesProjectService;
  @inject(PreferenceService)
  protected readonly preferenceService!: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService!: VesBuildService;
  @inject(VesCommonService)
  protected readonly vesCommonService!: VesCommonService;
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

  protected status: EmulatorRomStatus = EmulatorRomStatus.CHECKING;

  static readonly RESOLUTIONX = 384;
  static readonly RESOLUTIONY = 224;

  /** Unity gain. The core accepts 0 to 10. */
  static readonly DEFAULT_VOLUME = 1;

  /**
   * Save RAM allocated for a cartridge that has no save file yet.
   *
   * This is a size in the cartridge's *address space*, not a count of storage
   * cells: only the low byte of each halfword is wired to the SRAM chip, so
   * the 8 KiB a game pak actually holds spans 16 KiB of bus. The core indexes
   * the buffer by masked address (`cart.ram[address & ramMask]`), so a buffer
   * that is only as large as the chip makes the upper half of the window
   * mirror onto the lower half and a game's own writes corrupt each other.
   * Lemur, which runs the same core, allocates the same 16 KiB.
   */
  static readonly DEFAULT_SAVE_RAM_SIZE = 16384;

  /** Fallbacks for preferences that are unset or meaningless. */
  static readonly DEFAULT_FAST_FORWARD_RATIO = 4;
  static readonly DEFAULT_SLOW_MOTION_RATIO = 3;

  /** How much history a single rewind tick may make up for after a stall. */
  static readonly REWIND_MAX_CATCHUP_MS = 100;

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
  protected core?: VesVbCore;
  protected sim?: VesVbSim;
  /** The other half of a linked pair, if any — see getLinkedPeer. */
  protected linkedPeer?: VesEmulatorWidget;
  /** Fixed toolbar above the dock area. */
  protected toolbar: VesEmulatorToolbar;
  /** Rearrangeable panels: the screen plus whichever inspectors are open. */
  protected dock: VesEmulatorDock;
  /** The ROM's cheats: loaded with it, and in effect whether or not the panel is open. */
  protected cheats: VesEmulatorCheatStore;
  /** ESSound playback, likewise independent of its panel being open. */
  protected esSound: VesEmulatorEsSoundPlayer;
  /** Controller reference, laid over everything. */
  protected overlay: VesEmulatorOverlay;

  /** Currently held keyboard buttons, as a VbKey mask. */
  protected pressedKeys = 0;
  /** Currently held physical controller buttons, as a VbKey mask. */
  protected gamepadKeys = 0;
  /** Last mask handed to the core, so unchanged frames cost nothing. */
  protected appliedKeys = -1;
  protected gamepadPollHandle?: number;
  /** True from the moment rewind input is pressed until it is released. */
  protected rewinding = false;
  protected rewindHandle?: number;
  /** Timestamp of the last rewind tick, for pacing playback by the wall clock. */
  protected rewindLastTick = 0;
  /** History entries owed from earlier ticks, kept fractional so pacing does not drift. */
  protected rewindOwed = 0;
  /** Serializes run/suspend, so a release can never overtake its own press. */
  protected coreTransition: Promise<void> = Promise.resolve();
  /** Cached location of the selected slot's save state, for the file watcher. */
  protected saveStateUri?: URI;
  /** Live subscription forwarding link port traffic to a rumble pack, if any. */
  protected rumbleForwarding?: Disposable;
  /** Live subscription following which RumbleEffectSpec the game started. */
  protected rumbleSpecWatch?: Disposable;
  /** The current ROM's symbol table, in flight or read — see loadSymbols. */
  protected symbols?: Promise<VesEmulatorSymbolIndex | undefined>;

  /** The ROM's 32-byte header, used to bind save states to their cartridge. */
  protected romIdentity = new Uint8Array(32);

  protected state: vesEmulatorWidgetState;

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
    this.addClass('ves-emulator-widget');

    const instanceId = this.options?.instanceId ?? 'default';
    this.toolbar = new VesEmulatorToolbar(this);
    this.cheats = new VesEmulatorCheatStore(this.fileService);
    this.toDispose.push(Disposable.create(() => this.cheats.dispose()));
    this.esSound = new VesEmulatorEsSoundPlayer(this.fileService);
    this.toDispose.push(Disposable.create(() => this.esSound.dispose()));
    this.dock = new VesEmulatorDock(
      instanceId, this.shell, this.vesRumblePackService, this.cheats, this.esSound,
      () => this.loadSymbols()
    );
    this.overlay = new VesEmulatorOverlay(this);

    // A plain PanelLayout just inserts each widget's node into the DOM in
    // order and leaves sizing to CSS, unlike BoxLayout, which explicitly
    // positions and sizes every child from a stretch factor and a size hint
    // that has to be set by hand — with the hint left at its default of 0,
    // BoxLayout was giving the toolbar zero height regardless of its content.
    // Flexbox is what actually makes "sized by its content, dock gets the
    // rest" (see the CSS) true.
    const layout = new PanelLayout();
    layout.addWidget(this.toolbar);
    layout.addWidget(this.dock);
    this.layout = layout;

    // The overlay is deliberately not in the box layout, so that it can cover
    // the whole widget rather than take space in it. That means attaching it by
    // hand, which has to wait until this widget's own node is in the document —
    // see onAfterAttach.

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
    return 'ves-emulator-dock-layout';
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
    super.update();
    this.toolbar?.update();
    this.overlay?.update();
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
    await this.preferenceService.ready;
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
    this.stopRewinding();
    // Bound to the simulation that is going away; a new session re-establishes
    // it from startEmulator.
    this.rumbleForwarding?.dispose();
    this.rumbleForwarding = undefined;
    this.rumbleSpecWatch?.dispose();
    this.rumbleSpecWatch = undefined;
    this.vesRumblePackService.emulatorForwarding = false;
    // The whole record belongs to the run that is ending, not just the spec.
    this.vesRumblePackService.clearEmulatedTraffic();
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
      const saveRamUri = await this.getSaveRamUri();
      if (await this.fileService.exists(saveRamUri)) {
        await this.fileService.delete(saveRamUri);
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
    await this.applyKeys();
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
      saveStateExists: false,
      romHeader: {
        name: '',
        maker: '',
        code: '',
        version: 0,
      },
      romSize: 0,
      input: {},
      mode:
        (await this.localStorageService.getData<EmulatorMode>(
          'ves-emulator-state-mode'
        )) || EmulatorMode.DEBUG,
    };
    this.keybindingToState();
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
        const saveStateUri = this.saveStateUri;
        if (saveStateUri && fileChangesEvent.changes.some(change => change.resource.isEqual(saveStateUri))) {
          this.refreshSaveStateExists();
        }
      }),
      this.keybindingRegistry.onKeybindingsChanged(() => {
        this.keybindingToState();
        this.update();
      }),
      this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
        // Switching display mode is now a handful of uniforms and a resize, so
        // it no longer costs a restart.
        if ([
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_RENDERING_MODE,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES,
        ].includes(preferenceName)) {
          this.applyDisplayMode();
          this.update();
        } else if (preferenceName === VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE) {
          this.applyScale();
          // The toolbar's scale select is controlled: it shows what the
          // preference says, not what was last clicked in it, so picking an
          // entry only moves the selection once the toolbar re-renders.
          this.update();
        } else if ([
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_BUFFER_SIZE,
        ].includes(preferenceName)) {
          this.applyRewindSettings();
          // The toolbar button greys out when the feature is off.
          this.update();
        } else if ([
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO,
          VesEmulatorPreferenceIds.EMULATOR_BUILTIN_FAST_FORWARD_RATIO,
        ].includes(preferenceName)) {
          this.applySpeed();
        } else if (preferenceName === VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PLAYER_2_SAME_CONTROLS) {
          // Which set of mappings this emulator answers to has changed.
          this.keybindingToState();
          this.update();
        }
      }),
      this.vesRumblePackService.onDidChangeConnectedRumblePack(() => this.applyRumbleForwarding()),
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
      this.vesRumblePackService.connectedRumblePack !== undefined
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
      this.vesRumblePackService.emulatorForwarding = false;
      this.vesRumblePackService.emulatedSpec = undefined;
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
      this.vesRumblePackService.emulatorForwarding = true;
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
      this.vesRumblePackService.emulatorForwarding = false;
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
      this.vesRumblePackService.emulatedSpec = address === 0
        ? undefined
        : { address, name: symbols.rumbleSpecNames.get(address) };
    }
  }

  // --- Profiling ------------------------------------------------------------

  /** True while a session is being recorded for profiling. */
  isProfiling(): boolean {
    return this.profiling;
  }

  protected profiling = false;

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
    this.messageService.info(nls.localize(
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
        this.messageService.warn(nls.localize(
          'vuengine/emulator/profilingNothing', 'Nothing was recorded.'
        ));
        return;
      }

      const progress = await this.messageService.showProgress({
        text: nls.localize('vuengine/emulator/profilingReplaying', 'Replaying to collect the profile…'),
      });
      let result;
      try {
        result = await sim.replayProfile(recording);
      } finally {
        progress.cancel();
      }

      const uri = await this.writeProfile(result);
      this.messageService.info(nls.localize(
        'vuengine/emulator/profilingWritten',
        'Profiled {0} instructions over {1} s of play into {2}. Open it at profiler.firefox.com.',
        result.instructions.toLocaleString(),
        (recording.chunks / VB_FRAME_RATE).toFixed(1),
        this.vesCommonService.basename(uri)
      ));
      if (result.resets > 0) {
        this.messageService.warn(nls.localize(
          'vuengine/emulator/profilingResets',
          'The machine restarted {0} times while recording, so the profile covers more than one run.',
          result.resets
        ));
      }
    } catch (error) {
      this.messageService.error(
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
    this.vesRumblePackService.clearEmulatedTraffic();
    await this.sim?.reset();
  }

  protected forwardToRumblePack(bytes: number[]): void {
    for (const byte of bytes) {
      // Not awaited: writes queue on the port's writer in the order they are
      // made, and the emulator must not wait on a serial line to keep running.
      this.vesRumblePackService.sendCommandEmulateVbByte(byte).catch(() => {
        // A pack unplugged mid-effect. Detection notices, and the change
        // event that follows tears this forwarding down.
      });
    }
  }

  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.bindListeners();
  }

  /**
   * Attach the controller overlay.
   *
   * Lumino refuses to attach to a host that is not in the document, so this
   * cannot happen while the layout is being built: the shell has not put this
   * widget anywhere yet at that point.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    if (!this.overlay.isAttached) {
      Widget.attach(this.overlay, this.node);
    }
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    // Detached alongside its host, so that reattaching the widget later does
    // not find the overlay already claimed by a node that has gone away.
    if (this.overlay.isAttached) {
      Widget.detach(this.overlay);
    }
    this.unbindListeners();
  }

  /**
   * Whether this emulator answers to the second player's own key mappings.
   *
   * Only the second emulator of a link session can, and only while the
   * preference says its controls are not shared with the first player's.
   */
  protected usesPlayer2Controls(): boolean {
    return this.player === 2 && !this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PLAYER_2_SAME_CONTROLS, true
    );
  }

  /**
   * Re-read every mapping out of the keybinding registry.
   *
   * Built from the two tables that already say what exists — the game pad's
   * buttons and the emulator's actions — rather than listed again here, so a
   * new action needs adding in one place and gets its mapping for free.
   */
  protected keybindingToState(): void {
    const player = this.usesPlayer2Controls() ? 2 : 1;
    const input: Record<string, EmulatorInputBinding> = {};

    for (const button of EMULATOR_GAMEPAD_BUTTONS) {
      input[button] = {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          emulatorGamePadCommand(button, player).id
        ),
        command: EMULATOR_GAMEPAD_INPUTS[button].key,
      };
    }

    for (const action of EMULATOR_ACTIONS) {
      input[action] = {
        keys: this.keybindingRegistry.getKeybindingsForCommand(
          EMULATOR_ACTION_COMMANDS[action].id
        ),
        command: action,
      };
    }

    this.state.input = input;
  }

  protected keyEventListerner = (e: KeyboardEvent) => this.processKeyEvent(e);

  /**
   * Reclaim keyboard focus for the widget that owns the keydown listener.
   *
   * The screen used to be an iframe, which is its own focus scope, so
   * clicking into it and then pressing a key just worked. It is a plain
   * canvas now, nested inside the debug dock's own Lumino DockPanel — clicking
   * around inside that dock (switching tabs, focusing another panel's input)
   * moves DOM focus without ever involving this widget, so the keydown
   * listener on `this.node` stops receiving anything. Scoped to the screen
   * rather than the whole widget, so it does not fight over focus with, say,
   * typing an address into the Memory panel.
   */
  protected focusListener = () => this.node.focus();

  /**
   * Focus leaving the widget swallows the release, which would leave rewind
   * stuck on. Moves within the widget are fine and must not end it, since the
   * toolbar button lives here too.
   */
  protected focusOutListener = (e: FocusEvent) => {
    const next = e.relatedTarget;
    if (!(next instanceof Node) || !this.node.contains(next)) {
      this.stopRewinding();
    }
  };

  protected bindListeners(): void {
    this.node.tabIndex = 0;
    this.node.addEventListener('keydown', this.keyEventListerner);
    this.node.addEventListener('keyup', this.keyEventListerner);
    this.node.addEventListener('focusout', this.focusOutListener);
    this.dock.screen.node.addEventListener('mousedown', this.focusListener);
    this.startGamepadPolling();
  }

  protected unbindListeners(): void {
    this.node.removeEventListener('keydown', this.keyEventListerner);
    this.node.removeEventListener('keyup', this.keyEventListerner);
    this.node.removeEventListener('focusout', this.focusOutListener);
    this.dock.screen.node.removeEventListener('mousedown', this.focusListener);
    this.stopGamepadPolling();
  }

  protected processKeyEvent(e: KeyboardEvent): void {
    // Releasing rewind always ends it, before any of the guards below, since a
    // release that got filtered out would leave the emulator suspended with no
    // way back: pausing, or opening the controls overlay, while the key is held
    // is enough to change what those guards allow through.
    if (
      e.type === 'keyup' &&
      this.rewinding &&
      this.matchKey(this.state.input[EmulatorAction.Rewind]?.keys ?? [], e.code)
    ) {
      this.stopRewinding();
    }

    // do not process key input...
    if (
      e.repeat || // ... on repeated event firing
      !this.isVisible || // ... if emulator is not visible
      !this.state.loaded || // ... if emulator has not loaded yet
      this.state.showPalettes // ... while the palette window is taking typing
    ) {
      return;
    }

    for (const key in this.state.input) {
      if (!this.state.input.hasOwnProperty(key)) {
        continue;
      }
      const input = this.state.input[key];
      if (!this.matchKey(input.keys, e.code)) {
        continue;
      }
      // A game pad button is held, so it needs the press and the release;
      // rewind is held too, and its release is what ends it. Everything else
      // is an action, and acts once, through its command.
      if (GAMEPAD_KEY_TO_VB_KEY[input.command as EmulatorGamePadKeyCode] !== undefined
        || input.command === EmulatorAction.Rewind) {
        this.sendCommand(e.type, input.command);
      } else if (e.type === 'keydown' && this.canRunAction(input.command as EmulatorAction)) {
        this.runAction(input.command as EmulatorAction);
      }
    }
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.tabIndex = 0;
    this.node.focus();
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

      await this.applySpeed();
      await this.applyRewindSettings();
      await this.applyRumbleForwarding();

      await this.loadRom();
      const romUri = await this.getRomUri();
      await this.cheats.load(romUri);
      // Scanned before the port is watched, since whether there is anything to
      // play is what decides whether watching it is worth the callback.
      await this.esSound.scan(romUri);
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
      await this.applyKeys();
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
  protected onRewindButtonDown = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (!this.isRewindEnabled()) {
      // Nothing to hold down. Left alone, the press turns into an ordinary
      // click, which is what offers to enable the feature.
      return;
    }
    // Keep the press from moving focus onto the button: the widget node is what
    // listens for the emulator's keys, and giving them up for the length of a
    // click is exactly what the old handler had to undo afterwards.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    this.startRewinding();
  };

  protected isRewindEnabled(): boolean {
    return this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE
    ) as boolean;
  }

  /**
   * Offer to turn rewind on, from the greyed-out toolbar button.
   *
   * Recording history is not free and the preference defaults to off, so the
   * button explains what switching it on costs rather than either hiding the
   * feature or quietly making everyone pay for it.
   */
  protected promptEnableRewind = async (): Promise<void> => {
    const bufferSize = this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_BUFFER_SIZE
    ) as number;

    const message = this.node.ownerDocument.createElement('div');
    for (const paragraph of [
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
    ]) {
      const node = this.node.ownerDocument.createElement('p');
      node.textContent = paragraph;
      message.appendChild(node);
    }

    const dialog = new ConfirmDialog({
      title: nls.localize('vuengine/emulator/enableRewindTitle', 'Enable Rewind?'),
      msg: message,
      ok: nls.localize('vuengine/emulator/enableRewindConfirm', 'Enable'),
    });
    if (await dialog.open()) {
      await this.preferenceService.set(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE,
        true,
        PreferenceScope.User
      );
    }
  };

  protected onRewindButtonUp = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    this.stopRewinding();
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

  /** Content of the fixed toolbar above the dock area. */
  renderToolbar(): React.ReactNode {
    const rewindEnabled = this.isRewindEnabled();
    return this.status === EmulatorRomStatus.NOT_EXISTS ? (
      <EmptyContainer
        title={nls.localize('vuengine/emulator/romNotFound', 'ROM not found')}
        icon={<FileX size={32} />}
      />
    ) : (
      <>
        <EmulatorControls>
          <EmulatorControlsGroup>
            <div>
              <button
                className={
                  this.state.paused ? 'theia-button' : 'theia-button secondary'
                }
                title={`${this.state.paused
                  ? nls.localize('vuengine/emulator/resume', 'Resume')
                  : nls.localize('vuengine/emulator/pause', 'Pause')
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_PAUSE_TOGGLE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.PauseToggle)
                }
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i className="fa fa-pause"></i>
              </button>
              <button
                className="theia-button secondary"
                title={`${EmulatorCommands.INPUT_RESET.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_RESET.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.Reset)
                }
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
                    EmulatorCommands.INPUT_AUDIO_MUTE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.AudioMute)
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
                  this.state.lowPower
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={`${EmulatorCommands.INPUT_TOGGLE_LOW_POWER.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_TOGGLE_LOW_POWER.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.ToggleLowPower)
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
              <button
                // Greyed out rather than truly disabled when the feature is
                // off: the click is what offers to turn it on, and a disabled
                // button would never see one.
                className={
                  (this.rewinding ? 'theia-button' : 'theia-button secondary')
                  + (rewindEnabled ? '' : ' ves-emulator-button-off')
                }
                title={`${EmulatorCommands.INPUT_REWIND.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_REWIND.id,
                    true,
                  )}${rewindEnabled ? '' : ` — ${nls.localize(
                    'vuengine/emulator/rewindIsOff',
                    'off, click to enable'
                  )}`}`}
                onPointerDown={this.onRewindButtonDown}
                onPointerUp={this.onRewindButtonUp}
                onPointerCancel={this.onRewindButtonUp}
                onLostPointerCapture={() => this.stopRewinding()}
                onClick={e => {
                  if (!rewindEnabled) {
                    this.promptEnableRewind();
                  } else if (e.detail === 0) {
                    // Pointer presses rewind for as long as they are held, and
                    // have already stepped by the time the click arrives. A
                    // click with no pointer behind it is the button being
                    // activated from the keyboard: step back once.
                    this.runAction(EmulatorAction.Rewind);
                  }
                }}
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i className="fa fa-backward"></i>
              </button>
              <button
                className={
                  this.state.slowmotion
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={`${EmulatorCommands.INPUT_TOGGLE_SLOWMOTION.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.ToggleSlowmotion)
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
                title={`${EmulatorCommands.INPUT_FRAME_ADVANCE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_FRAME_ADVANCE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.FrameAdvance)
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
                title={`${EmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.ToggleFastForward)
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
            <HContainer alignItems='center' gap={0}>
              <button
                className="theia-button secondary"
                title={`${EmulatorCommands.INPUT_SAVE_STATE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_SAVE_STATE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.SaveState)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused
                }
              >
                <i className='fa fa-save' />
              </button>
              <button
                className="theia-button secondary"
                title={`${EmulatorCommands.INPUT_LOAD_STATE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_LOAD_STATE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.LoadState)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused ||
                  !this.state.saveStateExists
                }
              >
                <i className="fa fa-level-down"></i>
              </button>
              <SaveSlotInputWrapper>
                <i className="fa fa-bookmark-o"></i>
                <Input
                  value={this.state.saveSlot}
                  type='number'
                  width={56}
                  min={1}
                  max={99}
                  title={nls.localize(
                    'vuengine/emulator/currentSaveStateSlot',
                    'Current Save State Slot',
                  )}
                  disabled={
                    !this.state.loaded ||
                    this.state.showControls ||
                    this.state.paused
                  }
                />
              </SaveSlotInputWrapper>
            </HContainer>
            {/*
            <div>
              <button
                className="theia-button secondary"
                title={`${EmulatorCommands.INPUT_SAVE_STATE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_SAVE_STATE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.SaveState)
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
                title={`${EmulatorCommands.INPUT_LOAD_STATE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_LOAD_STATE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.LoadState)
                }
                disabled={
                  !this.state.loaded ||
                  this.state.showControls ||
                  this.state.paused ||
                  !this.state.saveStateExists
                }
              >
                <i className="fa fa-bookmark-o"></i>{' '}
                <i className="fa fa-level-up"></i>
              </button>
              <button
                className="theia-button secondary"
                title={nls.localize(
                  'vuengine/emulator/currentSaveState',
                  'Current Save State',
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
                title={`${EmulatorCommands.INPUT_STATE_SLOT_DECREASE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_STATE_SLOT_DECREASE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.StateSlotDecrease)
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
                title={`${EmulatorCommands.INPUT_STATE_SLOT_INCREASE.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_STATE_SLOT_INCREASE.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.StateSlotIncrease)
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
            */}
            <div>
              <button
                className={
                  this.isLinked() ? 'theia-button' : 'theia-button secondary'
                }
                title={
                  this.isLinked()
                    ? nls.localize('vuengine/emulator/unlink', 'Unlink')
                    : this.linkedPeer
                      ? nls.localize('vuengine/emulator/relink', 'Re-link')
                      : nls.localize(
                        'vuengine/emulator/linkSecondPlayer',
                        'Link Second Player',
                      )
                }
                // Through the commands, so the button and the palette are the
                // same three operations; which one this is depends on how the
                // pair currently stands, exactly as the label above does.
                onClick={e =>
                  this.commandService.executeCommand(
                    this.isLinked()
                      ? EmulatorCommands.UNLINK_PLAYERS.id
                      : this.linkedPeer
                        ? EmulatorCommands.RELINK_PLAYERS.id
                        : EmulatorCommands.LINK_SECOND_PLAYER.id
                  )
                }
                disabled={!this.state.loaded}
              >
                <i
                  className={
                    this.isLinked() ? 'ph ph-link-break' : 'ph ph-link-simple'
                  }
                ></i>
              </button>
            </div>
            <div>
              <button
                className={
                  this.profiling ? 'theia-button' : 'theia-button secondary'
                }
                title={`${this.profiling
                  ? EmulatorCommands.PROFILE_STOP.label
                  : EmulatorCommands.PROFILE_START.label
                  }${this.vesCommonService.getKeybindingLabel(
                    this.profiling
                      ? EmulatorCommands.PROFILE_STOP.id
                      : EmulatorCommands.PROFILE_START.id,
                    true,
                  )}`}
                onClick={e =>
                  this.commandService.executeCommand(
                    this.profiling
                      ? EmulatorCommands.PROFILE_STOP.id
                      : EmulatorCommands.PROFILE_START.id
                  )
                }
                disabled={!this.state.loaded}
              >
                <i
                  className={this.profiling ? 'fa fa-stop' : 'fa fa-circle'}
                ></i>
              </button>
            </div>
          </EmulatorControlsGroup>
          <EmulatorControlsGroup>
            <div>
              <RadioSelect
                options={[
                  {
                    value: EmulatorMode.PLAY,
                    label: nls.localize('vuengine/emulator/play', 'Play'),
                  },
                  {
                    value: EmulatorMode.DEBUG,
                    label: nls.localize('vuengine/emulator/debug', 'Debug'),
                  },
                ]}
                defaultValue={this.state.mode}
                onChange={options =>
                  this.setMode(options[0].value as EmulatorMode)
                }
              />
            </div>
            <HContainer>
              <AdvancedSelect
                title={nls.localize('vuengine/emulator/scale', 'Scale')}
                options={EMULATOR_SCALE_OPTIONS}
                defaultValue={this.preferenceService.get(
                  VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE,
                ) ?? EmulatorScale.AUTO}
                onChange={option => this.setScale(option[0] as string)}
                disabled={!this.state.loaded || this.state.showControls}
                style={SELECT_STYLE}
              />
              <AdvancedSelect
                title={nls.localize(
                  'vuengine/emulator/renderingMode',
                  'Rendering Mode',
                )}
                options={Object.entries(EMULATION_RENDERING_MODES).map(([value, label]) => ({
                  value,
                  label,
                }))}
                defaultValue={this.getRenderingMode()}
                onChange={option => this.setRenderingMode(option[0] as string)}
                disabled={!this.state.loaded || this.state.showControls}
                style={SELECT_STYLE}
              />
              <PaletteButton
                className={
                  this.state.showPalettes
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={`${nls.localize('vuengine/emulator/colors', 'Colors')}: ${this.getPaletteLabel()}`}
                onClick={() => this.togglePaletteWindow()}
                disabled={!this.state.loaded || this.state.showControls}
              >
                {this.renderPalettePreview()}
              </PaletteButton>
            </HContainer>
            <div>
              <button
                className="theia-button secondary"
                title={`${EmulatorCommands.INPUT_FULLSCREEN.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_FULLSCREEN.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.Fullscreen)
                }
                disabled={!this.state.loaded || this.state.showControls}
              >
                <i className="fa fa-arrows-alt"></i>
              </button>
              <button
                className="theia-button secondary"
                title={`${EmulatorCommands.INPUT_SCREENSHOT.label
                  }${this.vesCommonService.getKeybindingLabel(
                    EmulatorCommands.INPUT_SCREENSHOT.id,
                    true,
                  )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.Screenshot)
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
                  'Configure Input',
                )}${this.vesCommonService.getKeybindingLabel(
                  EmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id,
                  true,
                )}`}
                onClick={e =>
                  this.runAction(EmulatorAction.ToggleControlsOverlay)
                }
                disabled={!this.state.loaded}
              >
                <i className="fa fa-keyboard-o"></i>
              </button>
            </div>
          </EmulatorControlsGroup>
        </EmulatorControls>
      </>
    );
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

  /** The controller mapping and the palette window. */
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
            keybindingRegistry={this.keybindingRegistry}
            preferenceService={this.preferenceService}
            vesCommonService={this.vesCommonService}
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
          width='674px'
        >
          <EmulatorPalettes
            preferenceService={this.preferenceService}
            anaglyph={this.getRenderingMode() === VbRenderingMode.ANAGLYPH}
          />
        </PopUpDialog>
      }
    </>;
  }

  protected async sendCommand(command: string, data?: any): Promise<void> {
    // Game pad input maps straight onto the core's key mask.
    const vbKey = GAMEPAD_KEY_TO_VB_KEY[data as EmulatorGamePadKeyCode];
    if (vbKey !== undefined) {
      if (command === 'keydown' || command === 'keyPress') {
        this.pressedKeys |= vbKey;
      } else if (command === 'keyup') {
        this.pressedKeys &= ~vbKey;
      }
      await this.applyKeys();
      if (command === 'keyPress') {
        // The on-screen controls send a press rather than a hold, so release
        // it again after long enough for the ROM to notice.
        setTimeout(() => {
          this.pressedKeys &= ~vbKey;
          this.applyKeys();
        }, 50);
      }
      return;
    }

    // Rewind is held rather than toggled, so it needs the press and the
    // release, unlike the function keys below which act on release.
    if (data === EmulatorAction.Rewind) {
      if (command === 'keydown') {
        this.startRewinding();
      } else if (command === 'keyup') {
        this.stopRewinding();
      } else if (command === 'keyPress') {
        // Activating the toolbar button from the keyboard has no release to
        // wait for, so it steps back once.
        this.queueCoreTransition(async core => {
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
          await this.applyKeys();
          this.update();
          break;
        case EmulatorAction.ToggleSlowmotion:
          this.state.slowmotion = !this.state.slowmotion;
          this.state.fastForward = false;
          await this.applySpeed();
          this.update();
          break;
        case EmulatorAction.ToggleFastForward:
          this.state.fastForward = !this.state.fastForward;
          this.state.slowmotion = false;
          await this.applySpeed();
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

  /** Push the current key mask to the core, if it changed. */
  protected async applyKeys(): Promise<void> {
    const keys = VbKey.SGN                                  // marks a controller as present
      | (this.state.lowPower ? VbKey.PWR : 0)               // low battery signal
      | this.pressedKeys
      | this.gamepadKeys;

    // The gamepad is polled every frame, and most frames change nothing.
    if (keys === this.appliedKeys) {
      return;
    }
    this.appliedKeys = keys;
    await this.sim?.setKeys(keys);
  }

  protected startGamepadPolling(): void {
    if (this.gamepadPollHandle !== undefined) {
      return;
    }
    const poll = () => {
      this.gamepadPollHandle = requestAnimationFrame(poll);
      const keys = readGamepadKeys();
      if (keys !== this.gamepadKeys) {
        this.gamepadKeys = keys;
        this.applyKeys();
      }
    };
    this.gamepadPollHandle = requestAnimationFrame(poll);
  }

  protected stopGamepadPolling(): void {
    if (this.gamepadPollHandle !== undefined) {
      cancelAnimationFrame(this.gamepadPollHandle);
      this.gamepadPollHandle = undefined;
    }
  }

  protected async getRomUri(): Promise<URI> {
    return this.options ? new URI(this.options.uri) : this.vesBuildService.getDefaultRomUri();
  }

  /** Which player this emulator is; see VesEmulatorWidgetOptions.player. */
  protected get player(): number {
    return this.options?.player ?? 1;
  }

  /**
   * Save RAM lives next to the ROM, as `<rom>.p{player}.sram` — Lemur's
   * convention, so the two emulators can read each other's saves.
   */
  protected async getSaveRamUri(): Promise<URI> {
    const romUri = await this.getRomUri();
    return romUri.parent.resolve(`${romUri.path.name}.p${this.player}.sram`);
  }

  /**
   * Cartridge RAM as it comes out of the box.
   *
   * Powered-up SRAM holds whatever its cells settled on, and a game tells "no
   * save yet" from "a save" by looking for its own signature there — so an
   * all-zero buffer is not a neutral starting point but a specific pattern a
   * game may mistake for valid data. Only even addresses reach the chip, so
   * the odd byte of every halfword stays as it is. Lemur seeds a fresh save
   * the same way.
   */
  protected static freshSaveRam(): Uint8Array {
    const ram = new Uint8Array(VesEmulatorWidget.DEFAULT_SAVE_RAM_SIZE);
    for (let i = 0; i < ram.length; i += 2) {
      ram[i] = Math.floor(Math.random() * 256);
    }
    return ram;
  }

  protected async loadSaveRam(): Promise<void> {
    const uri = await this.getSaveRamUri();
    const ram = VesEmulatorWidget.freshSaveRam();

    if (await this.fileService.exists(uri)) {
      const stored = (await this.fileService.readFile(uri)).value.buffer;
      // The core requires a power of two, so a truncated or hand-edited file
      // starts the game fresh rather than failing to boot. A file shorter than
      // the full window — anything written before DEFAULT_SAVE_RAM_SIZE covered
      // the whole cartridge bus — keeps its contents but is placed in a
      // correctly sized buffer, since handing the core the short one is what
      // makes the window mirror in the first place.
      if (stored.length === 0 || (stored.length & (stored.length - 1)) !== 0) {
        console.warn(`[emulator] ignoring save RAM of unusable size ${stored.length}: ${uri.toString()}`);
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
    await this.fileService.writeFile(
      await this.getSaveRamUri(),
      BinaryBuffer.wrap(new Uint8Array(ram))
    );
  }

  /** Save states live next to the ROM, as `<rom>.<slot>.state`. */
  protected async getSaveStateUri(slot: number): Promise<URI> {
    const romUri = await this.getRomUri();
    return romUri.parent.resolve(`${romUri.path.name}.${slot}.state`);
  }

  /**
   * Track whether the selected slot holds a state, so that loading an empty
   * one is not offered. Caches the URI, which the file watcher compares
   * against without having to resolve the ROM on every change event.
   */
  protected async refreshSaveStateExists(): Promise<void> {
    this.saveStateUri = await this.getSaveStateUri(this.state.saveSlot);
    const exists = await this.fileService.exists(this.saveStateUri);
    if (exists !== this.state.saveStateExists) {
      this.state.saveStateExists = exists;
      this.update();
    }
  }

  /**
   * Save state container.
   *
   * The header guards against loading a state into the wrong game, or one
   * produced by a core whose state layout differs, either of which would
   * otherwise restore convincing nonsense.
   */
  protected static readonly STATE_MAGIC = 0x56455353; // 'VESS'
  /**
   * Version 2 added the ESSound section; version 1 files are still read, and
   * simply restore no audio.
   */
  protected static readonly STATE_VERSION = 2;
  protected static readonly STATE_HEADER_BYTES = 48;
  /** Version 2's extra header word: how many bytes of ESSound state follow the machine's. */
  protected static readonly STATE_EXTRA_BYTES = 4;

  /**
   * A linked pair is snapshotted as a unit: restoring one machine but not the
   * other leaves them disagreeing about the conversation on the link port.
   * The blobs are all the same size, so their count is implied by the file
   * length and needs no field of its own.
   */
  /**
   * The file a save state is written as: a header, one block per simulation of
   * the session, and what ESSound was playing.
   *
   * The audio is played on this side rather than by the core, so its state is
   * nowhere in the blocks the core hands over — without this last section,
   * loading a state would leave whatever was playing before running on.
   */
  protected wrapSaveState(states: ArrayBuffer[]): Uint8Array {
    const size = states[0].byteLength;
    const esSound = new TextEncoder().encode(JSON.stringify(this.esSound.snapshot()));
    const start = VesEmulatorWidget.STATE_HEADER_BYTES + VesEmulatorWidget.STATE_EXTRA_BYTES;
    const out = new Uint8Array(start + size * states.length + esSound.length);
    const header = new DataView(out.buffer, 0, start);
    header.setUint32(0, VesEmulatorWidget.STATE_MAGIC);
    header.setUint32(4, VesEmulatorWidget.STATE_VERSION);
    header.setUint32(8, this.state.romSize);
    header.setUint32(12, size);
    out.set(this.romIdentity, 16);
    header.setUint32(VesEmulatorWidget.STATE_HEADER_BYTES, esSound.length);
    states.forEach((state, index) => {
      out.set(new Uint8Array(state), start + size * index);
    });
    out.set(esSound, start + size * states.length);
    return out;
  }

  protected unwrapSaveState(stored: Uint8Array, expectedCount: number): VesEmulatorSaveState {
    if (stored.length <= VesEmulatorWidget.STATE_HEADER_BYTES) {
      throw new Error('This save state file is truncated.');
    }
    // Over the whole file rather than the fixed header: version 2's length
    // word sits just past it.
    const header = new DataView(stored.buffer, stored.byteOffset, stored.byteLength);
    if (header.getUint32(0) !== VesEmulatorWidget.STATE_MAGIC) {
      throw new Error('This is not a save state file.');
    }
    const version = header.getUint32(4);
    if (version > VesEmulatorWidget.STATE_VERSION || version < 1) {
      throw new Error('This save state was written by a different version of VUEngine Studio.');
    }

    const identity = stored.subarray(16, 16 + this.romIdentity.length);
    if (!this.romIdentity.every((byte, index) => byte === identity[index])) {
      throw new Error('This save state belongs to a different ROM.');
    }

    const size = header.getUint32(12);
    // Version 1 had no ESSound section and no word to say how long it is.
    const start = VesEmulatorWidget.STATE_HEADER_BYTES
      + (version >= 2 ? VesEmulatorWidget.STATE_EXTRA_BYTES : 0);
    if (stored.length <= start) {
      throw new Error('This save state file is truncated.');
    }
    const esSoundBytes = version >= 2 ? header.getUint32(VesEmulatorWidget.STATE_HEADER_BYTES) : 0;
    const body = stored.length - start - esSoundBytes;
    if (size === 0 || body <= 0 || body % size !== 0) {
      throw new Error('This save state file is malformed.');
    }

    const count = body / size;
    if (count !== expectedCount) {
      throw new Error(count > expectedCount
        ? 'This save state was made by a linked pair of emulators and needs both to be running.'
        : 'This save state was made by a single emulator and cannot be loaded into a linked pair.');
    }

    return {
      states: Array.from({ length: count }, (unused, index) => {
        const from = start + size * index;
        return stored.slice(from, from + size).buffer;
      }),
      esSound: esSoundBytes > 0
        ? new TextDecoder().decode(stored.subarray(start + body, start + body + esSoundBytes))
        : undefined,
    };
  }

  /** Put ESSound back as the state being loaded found it, if it says. */
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
    await this.fileService.writeFile(
      await this.getSaveStateUri(this.state.saveSlot),
      BinaryBuffer.wrap(this.wrapSaveState(states))
    );
    await this.refreshSaveStateExists();
    this.messageService.info(
      nls.localize('vuengine/emulator/saveStateSaved', 'Save state saved to slot {0}.', this.state.saveSlot)
    );
  }

  protected async loadState(): Promise<void> {
    const sims = this.session?.siblings;
    if (!sims?.length) {
      return;
    }
    const uri = await this.getSaveStateUri(this.state.saveSlot);
    if (!await this.fileService.exists(uri)) {
      return;
    }
    try {
      const stored = (await this.fileService.readFile(uri)).value.buffer;
      const { states, esSound } = this.unwrapSaveState(new Uint8Array(stored), sims.length);
      // Suspended across the restore so the pair cannot emulate half-loaded.
      const running = !this.state.paused;
      if (running) {
        await this.core?.suspend();
      }
      for (let i = 0; i < sims.length; i++) {
        await sims[i].loadState(states[i]);
      }
      // After the machine's own state, so the audio follows what it belongs
      // to rather than leading it.
      this.restoreEsSound(esSound);
      if (running) {
        await this.core?.run();
      }
      this.messageService.info(
        nls.localize('vuengine/emulator/saveStateLoaded', 'Save state loaded from slot {0}.', this.state.saveSlot)
      );
    } catch (error) {
      this.handleCoreError(error instanceof Error ? error.message : String(error));
    }
  }

  /** Ratio at which fast forward and slow motion run, from the preferences. */
  protected async applySpeed(): Promise<void> {
    let speed = 1;
    if (this.state.fastForward) {
      const ratio = this.preferenceService.get(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_FAST_FORWARD_RATIO
      ) as number;
      speed = ratio > 1 ? ratio : VesEmulatorWidget.DEFAULT_FAST_FORWARD_RATIO;
    } else if (this.state.slowmotion) {
      const ratio = this.preferenceService.get(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO
      ) as number;
      speed = 1 / (ratio > 1 ? ratio : VesEmulatorWidget.DEFAULT_SLOW_MOTION_RATIO);
    }
    await this.core?.setSpeed(speed);
    // ESSound runs at the machine's speed, so fast forward and slow motion
    // carry its audio with them.
    this.esSound.setSpeed(speed);
  }

  protected async applyRewindSettings(): Promise<void> {
    await this.core?.setRewind(
      this.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE) as boolean,
      this.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY) as number,
      (this.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_BUFFER_SIZE) as number) * 1024 * 1024
    );
  }

  /**
   * Rewinding suspends normal emulation and walks the history backwards for as
   * long as the input is held.
   *
   * Whether it is held is tracked in a flag rather than in the animation frame
   * handle, because both the suspend and every step are round trips to the
   * worker: a release landing while one is in flight would otherwise be lost,
   * and the loop would keep running until it had eaten the entire history.
   */
  protected startRewinding(): void {
    if (
      this.rewinding ||
      !this.core ||
      !this.state.loaded ||
      // With no history being recorded there is nothing to walk back through,
      // and suspending for the length of the hold would just look like a freeze.
      !this.isRewindEnabled()
    ) {
      return;
    }
    this.rewinding = true;
    this.esSound.setRewinding(true);
    this.rewindLastTick = 0;
    // Owe one entry up front, so even a tap steps back immediately.
    this.rewindOwed = 1;
    // Lights the toolbar button up for the length of the hold, whether it was
    // the button or the keyboard that started it.
    this.update();
    this.queueCoreTransition(async core => {
      await core.suspend();
      // The input may already have been released while the core was still
      // suspending, in which case the queued resume takes it from here.
      if (this.rewinding) {
        this.rewindHandle = requestAnimationFrame(now => { this.rewindTick(now); });
      }
    });
  }

  protected stopRewinding(): void {
    if (!this.rewinding) {
      return;
    }
    this.rewinding = false;
    // Winds the tracks back by everything the core gave up, and starts them
    // again if the machine is running.
    this.esSound.setRewinding(false);
    if (this.rewindHandle !== undefined) {
      cancelAnimationFrame(this.rewindHandle);
      this.rewindHandle = undefined;
    }
    // Not on the way out: disposeSession stops any rewind as it tears down.
    if (!this.isDisposed) {
      this.update();
    }
    this.queueCoreTransition(async core => {
      if (!this.state.paused) {
        await core.run();
      }
    });
  }

  /**
   * Play the history back at the speed it was recorded at.
   *
   * Pacing is by elapsed time rather than one entry per animation frame: the
   * machine runs at VB_FRAME_RATE and an entry covers `granularity` frames of
   * it, so a 120 Hz display would otherwise rewind at more than twice speed and
   * tear through a minute of history in seconds.
   */
  protected async rewindTick(now: number): Promise<void> {
    this.rewindHandle = undefined;
    if (!this.rewinding) {
      return;
    }

    // Cap the catch-up so a stalled frame cannot jump back by seconds at once.
    const elapsed = this.rewindLastTick
      ? Math.min(now - this.rewindLastTick, VesEmulatorWidget.REWIND_MAX_CATCHUP_MS)
      : 0;
    this.rewindLastTick = now;
    const granularity = Math.max(1, this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY
    ) as number);
    this.rewindOwed += (elapsed / 1000) * (VB_FRAME_RATE / granularity);

    const count = Math.floor(this.rewindOwed);
    if (count > 0) {
      this.rewindOwed -= count;
      const applied = await this.core?.rewindStep(count) ?? 0;
      // An entry covers `granularity` frames, so this is how much emulated
      // time the machine has just given up.
      this.esSound.rewind((applied * granularity) / VB_FRAME_RATE);
      if (!this.rewinding) {
        return;
      }
      if (applied === 0) {
        // Nothing left to go back to. Hold on the oldest state rather than
        // resuming under the user's finger; the release resumes as usual.
        return;
      }
    }

    this.rewindHandle = requestAnimationFrame(next => { this.rewindTick(next); });
  }

  /**
   * Serialize transitions between running and suspended.
   *
   * Both VesVbCore#run and #suspend touch the audio context as well as the
   * worker, so overlapping them can leave the context suspended while the
   * worker believes it is emulating — which stalls emulation outright, since it
   * is the audio graph that clocks it. Pressing and releasing rewind faster
   * than a suspend completes is exactly that case.
   *
   * The action is bound to the core that was current when it was queued and is
   * skipped if the session has been torn down or rebuilt since, so a release
   * queued on the way out cannot resume a disposed core or a fresh one.
   */
  protected queueCoreTransition(action: (core: VesVbCore) => Promise<void>): void {
    const core = this.core;
    if (!core) {
      return;
    }
    this.coreTransition = this.coreTransition
      .then(() => this.core === core ? action(core) : undefined)
      .catch(error => this.handleCoreError(
        error instanceof Error ? error.message : String(error)
      ));
  }

  protected async takeScreenshot(): Promise<void> {
    const png = await this.sim?.capture();
    if (!png) {
      return;
    }

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return;
    }

    const now = new Date();
    const pad = (value: number) => `${value}`.padStart(2, '0');
    const timestamp = `${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
      + `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const romUri = await this.getRomUri();
    const screenshotFilename = `${romUri.path.name}-${timestamp}.png`;

    await this.fileService.writeFile(
      workspaceRootUri.resolve('screenshots').resolve(screenshotFilename),
      BinaryBuffer.wrap(new Uint8Array(png))
    );
    this.messageService.info(
      nls.localize('vuengine/emulator/screenshotSaved', 'Screenshot saved to screenshots/{0}.', screenshotFilename)
    );
  }

  protected setRenderingMode = async (mode: string): Promise<void> => {
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_RENDERING_MODE,
      mode,
      PreferenceScope.User
    );
  };

  protected setScale = async (scale: string): Promise<void> => {
    await this.preferenceService.set(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE,
      scale,
      PreferenceScope.User
    );
    this.applyScale();
  };

  protected getRenderingMode(): string {
    return this.preferenceService.get(
      VesEmulatorPreferenceIds.EMULATOR_BUILTIN_RENDERING_MODE,
      VB_DEFAULT_RENDERING_MODE
    );
  }

  /** The colours the current rendering mode is shown in. */
  protected getPalette(): VbPalette {
    return resolvePalette(
      this.preferenceService.get(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE, VB_DEFAULT_PALETTE_ID
      ),
      this.preferenceService.get<CustomPalette[]>(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES, []
      )
    );
  }

  protected getAnaglyphPalette(): VbAnaglyphPalette {
    return resolveAnaglyphPalette(
      this.preferenceService.get(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE, VB_DEFAULT_ANAGLYPH_PALETTE_ID
      ),
      this.preferenceService.get<CustomAnaglyphPalette[]>(
        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES, []
      )
    );
  }

  protected getDisplayMode(): VbDisplayMode {
    return buildVbDisplayMode(
      this.getRenderingMode(),
      this.getPalette(),
      this.getAnaglyphPalette()
    );
  }

  /** Name of the palette in use, built-in or custom. */
  protected getPaletteLabel(): string {
    const anaglyph = this.getRenderingMode() === VbRenderingMode.ANAGLYPH;
    const id = this.preferenceService.get(
      anaglyph
        ? VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE
        : VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE,
      anaglyph ? VB_DEFAULT_ANAGLYPH_PALETTE_ID : VB_DEFAULT_PALETTE_ID
    );
    if (id.startsWith(CUSTOM_PALETTE_PREFIX)) {
      return id.slice(CUSTOM_PALETTE_PREFIX.length);
    }
    return (anaglyph ? EMULATION_ANAGLYPH_PALETTES : EMULATION_PALETTES)[id] ?? id;
  }

  protected togglePaletteWindow(): void {
    this.state.showPalettes = !this.state.showPalettes;
    this.update();
  }

  protected async applyDisplayMode(): Promise<void> {
    const mode = this.getDisplayMode();
    this.dock.screen.setDisplayMode(mode);
    await this.sim?.setDisplayMode(mode);
  }

  protected applyScale(): void {
    this.dock.screen.setScale(
      this.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE) as string
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

  protected toButton(
    keyCode: EmulatorGamePadKeyCode | EmulatorAction
  ): string {
    let button: string = keyCode;
    if (keyCode.startsWith('Key')) {
      button = keyCode.substring(3);
    } else if (keyCode.startsWith('Arrow')) {
      button = keyCode.substring(5);
    }
    return button.toLowerCase();
  }

  /**
   * Throw away the cartridge's save memory and boot again.
   *
   * Reached only through its command — see `EmulatorCommands.DELETE_SRAM`.
   */
  public deleteSramAndRestart = async () => {
    const dialog = new ConfirmDialog({
      title: nls.localize('vuengine/emulator/deleteSram', 'Delete SRAM'),
      msg: nls.localize(
        'vuengine/emulator/areYouSureYouWantToDeleteSram',
        'Are you sure you want to delete SRAM and restart? Any saved progress will be lost.'
      ),
    });
    if (await dialog.open()) {
      this.reload(true);
    }
  };

}

/**
 * The fixed toolbar above the dock area.
 *
 * Its content stays on the emulator widget, which owns the state the controls
 * act on; this is only the surface it renders into.
 */
class VesEmulatorToolbar extends ReactWidget {
  constructor(protected readonly emulator: VesEmulatorWidget) {
    super();
    this.addClass('ves-emulator-toolbar');
  }

  protected render(): React.ReactNode {
    return this.emulator.renderToolbar();
  }
}

/** The controller reference, laid over the whole emulator widget. */
class VesEmulatorOverlay extends ReactWidget {
  constructor(protected readonly emulator: VesEmulatorWidget) {
    super();
    this.addClass('ves-emulator-overlay');
  }

  protected render(): React.ReactNode {
    return this.emulator.renderOverlay();
  }
}
