import { Disposable, Emitter } from '@theia/core';
import { ApplicationShell } from '@theia/core/lib/browser';
import { Drag } from '@theia/core/shared/@lumino/dragdrop';
import { Message } from '@theia/core/shared/@lumino/messaging';
import { DockLayout, DockPanel, TabBar, Widget } from '@theia/core/shared/@lumino/widgets';
import { VesRumblePackService } from '../../../rumble-pack/browser/ves-rumble-pack-service';
import { VesEmulatorCheatStore } from '../ves-emulator-cheat-store';
import { VesEmulatorEsSoundPlayer } from '../ves-emulator-essound-player';
import { VesVbSim } from '../core/ves-vb-core';
import { VesEmulatorSymbolIndex } from '../core/ves-emulator-symbols';
import { EMPTY_ROM_HEADER, RomHeader } from '../ves-emulator-types';
import { VesEmulatorCheatsPanel } from './ves-emulator-cheats-panel';
import { VesEmulatorDisassemblyPanel } from './ves-emulator-disassembly-panel';
import { VesEmulatorEsSoundPanel } from './ves-emulator-essound-panel';
import { VesEmulatorMemoryPanel } from './ves-emulator-memory-panel';
import { VesEmulatorActorsPanel } from './ves-emulator-actors-panel';
import { VesEmulatorMemoryPoolsPanel } from './ves-emulator-memory-pools-panel';
import { VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';
import { VesEmulatorRegistersPanel } from './ves-emulator-registers-panel';
import { VesEmulatorRomInfoPanel } from './ves-emulator-rom-info-panel';
import { VesEmulatorRumblePackPanel } from './ves-emulator-rumble-pack-panel';
import { VesEmulatorScreenPanel, VesScreenRect } from './ves-emulator-screen-panel';
import { VesEmulatorTabBar } from './ves-emulator-tab-bar';
import { VesEmulatorTerminalPanel } from './ves-emulator-terminal-panel';
import { VesEmulatorVipBgMapsPanel } from './ves-emulator-vip-bgmaps-panel';
import { VesEmulatorVipCharactersPanel } from './ves-emulator-vip-characters-panel';
import { VesEmulatorVipFrameBuffersPanel } from './ves-emulator-vip-framebuffers-panel';
import { VesEmulatorVipObjectsPanel } from './ves-emulator-vip-objects-panel';
import { VesEmulatorVipPalettesPanel } from './ves-emulator-vip-palettes-panel';
import { VesEmulatorVipWorldsPanel } from './ves-emulator-vip-worlds-panel';
import { VesEmulatorVsuPanel } from './ves-emulator-vsu-panel';

/** Panels other than the screen, which is always present. */
export const VES_EMULATOR_DEBUG_PANELS = [
    EmulatorPanelType.REGISTERS,
    EmulatorPanelType.DISASSEMBLY,
    EmulatorPanelType.MEMORY,
    EmulatorPanelType.MEMORY_POOLS,
    EmulatorPanelType.ACTORS,
    EmulatorPanelType.VIP_PALETTES,
    EmulatorPanelType.VIP_CHARACTERS,
    EmulatorPanelType.VIP_BGMAPS,
    EmulatorPanelType.VIP_WORLDS,
    EmulatorPanelType.VIP_OBJECTS,
    EmulatorPanelType.VIP_FRAME_BUFFERS,
    EmulatorPanelType.VSU,
    EmulatorPanelType.TERMINAL,
    EmulatorPanelType.ROM_INFO,
    EmulatorPanelType.RUMBLE_PACK,
    EmulatorPanelType.CHEATS,
    EmulatorPanelType.ES_SOUND,
];

/**
 * The arrangement a freshly opened emulator starts with, and what Reset
 * Layout restores: the screen over a strip of the text panels on the left,
 * every inspector tabbed together on the right, and the two halves even.
 *
 * Every group takes its share of a resize, so the proportions here are what a
 * window of any size keeps.
 */
const DEFAULT_LAYOUT: VesEmulatorAreaLayout = {
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
                EmulatorPanelType.VIP_WORLDS,
                EmulatorPanelType.VIP_BGMAPS,
                EmulatorPanelType.VIP_OBJECTS,
                EmulatorPanelType.REGISTERS,
            ],
            currentIndex: 0,
        }
    ],
};

/**
 * The emulator's dockable area.
 *
 * Panels can be dragged, split, resized, tabbed and closed like any other dock
 * area, and the arrangement is saved so it survives reopening the emulator.
 * Reset Layout puts it back to the built-in default (DEFAULT_LAYOUT), which is
 * also what a freshly opened emulator starts with. That dragging is sealed off
 * from the rest of the application in both directions — see `trackOwnDrag`
 * and `blockForeignOverlay` — so none of it can end up as a tab in the main
 * shell, and nothing from the shell can end up docked here.
 */
export class VesEmulatorDock extends DockPanel implements VesEmulatorDebugSource {

    readonly screen: VesEmulatorScreenPanel;

    protected currentSim: VesVbSim | undefined;
    protected currentRomHeader: RomHeader = EMPTY_ROM_HEADER;
    protected currentRomSize = 0;
    protected currentBuildMode?: string;
    protected readonly panels = new Map<EmulatorPanelType, VesEmulatorPanel>();
    protected readonly onDidChangeEmitter = new Emitter<void>();
    protected readonly onDidChangeLayoutEmitter = new Emitter<void>();
    protected readonly onDidRequestAddPanelEmitter = new Emitter<TabBar<Widget>>();

    /** Fires when the arrangement changes, so it can be persisted. */
    readonly onDidChangeLayout = this.onDidChangeLayoutEmitter.event;

    /**
     * Fires when a tab group's "+" is pressed, with the group it was pressed
     * on — which is where whatever the user then picks should land.
     *
     * The dock raises this rather than asking for a panel itself, because
     * choosing one is a quick pick, and that belongs to the view contribution
     * that owns the Add Emulator Panel command.
     */
    readonly onDidRequestAddPanel = this.onDidRequestAddPanelEmitter.event;

    constructor(
        protected readonly instanceId: string,
        protected readonly shell: ApplicationShell,
        // Neither of these is part of VesEmulatorDebugSource: the rumble pack
        // is external hardware rather than something the simulation exposes,
        // and the cheats belong to the ROM rather than to a running
        // simulation. Both are handed to the one panel that needs them
        // instead of to all of them.
        protected readonly rumblePackService: VesRumblePackService,
        protected readonly cheats: VesEmulatorCheatStore,
        protected readonly esSound: VesEmulatorEsSoundPlayer,
        // Unlike those, this one *is* part of VesEmulatorDebugSource: the
        // symbols describe the ROM the simulation is running, so a panel may
        // ask for them the same way it asks for memory. It arrives as a
        // callback because reading them belongs to the widget, which owns both
        // the file access and the caching. See `getSymbols`.
        protected readonly symbolLoader: () => Promise<VesEmulatorSymbolIndex | undefined>
    ) {
        // Refuses a tab dragged in from outside. Lumino checks this on the
        // panel being dropped into, so it is only half of the boundary — see
        // enforceDragBoundary for the other half, and why this alone is not
        // redundant with it.
        //
        // `addButtonEnabled` puts Lumino's own "+" on every tab bar this dock
        // creates, now and later. It renders as an empty div and leaves the
        // glyph to CSS, the same way the close icon does.
        super({
            mode: 'multiple-document',
            tabsConstrained: true,
            addButtonEnabled: true,
            // Tab bars of our own, for the scrollbar they carry.
            renderer: {
                createTabBar: () => new VesEmulatorTabBar(),
                createHandle: () => DockPanel.defaultRenderer.createHandle(),
            },
        });
        this.addClass('ves-emulator-dock');
        this.screen = new VesEmulatorScreenPanel(instanceId);
        this.layoutModified.connect(() => this.onDidChangeLayoutEmitter.fire());
        this.addRequested.connect((unused, tabBar) => this.onDidRequestAddPanelEmitter.fire(tabBar));
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        // Capture phase, and on the document rather than this.node, so these
        // see every pointer move and every Lumino drag event in the whole
        // application, not just ones over this dock.
        const document = this.node.ownerDocument;
        document.addEventListener('pointermove', this.pointerMoveListener, true);
        document.addEventListener('lm-dragenter', this.dragEnterListener, true);
        // Bubble phase, on this dock's own node, and registered *after*
        // `super.onAfterAttach` has bound Lumino's own handlers to that same
        // node — so those still run first and this only decides whether the
        // event may continue upwards. See `sealDragFromAncestors`.
        for (const type of VesEmulatorDock.DRAG_EVENTS) {
            this.node.addEventListener(type, this.sealDragListener);
        }
    }

    protected onBeforeDetach(msg: Message): void {
        const document = this.node.ownerDocument;
        document.removeEventListener('pointermove', this.pointerMoveListener, true);
        document.removeEventListener('lm-dragenter', this.dragEnterListener, true);
        for (const type of VesEmulatorDock.DRAG_EVENTS) {
            this.node.removeEventListener(type, this.sealDragListener);
        }
        super.onBeforeDetach(msg);
    }

    protected static readonly DRAG_EVENTS = ['lm-dragenter', 'lm-dragover', 'lm-dragleave', 'lm-drop'] as const;

    protected readonly pointerMoveListener = (event: Event) => this.trackOwnDrag(event as PointerEvent);
    protected readonly dragEnterListener = (event: Event) => this.blockForeignOverlay(event as Drag.Event);
    protected readonly sealDragListener = (event: Event) => this.sealDragFromAncestors(event as Drag.Event);

    /**
     * Keep this dock's own drag events from reaching the dock panels it is
     * nested inside — which is what left drop indicators stranded over the
     * shell's left, right and top edges.
     *
     * This dock is a `DockPanel` inside a Theia widget inside the shell's main
     * `DockPanel`, and Lumino binds `lm-drag*` on `this.node` in the *bubble*
     * phase. So every drag event in here travels up through the ancestor dock
     * panel on its way out, and two asymmetries in Lumino's own handlers turn
     * that into a stuck overlay:
     *
     * - `_evtDragOver` calls `_showOverlay(…)` as the second operand of an
     *   `||`, so the overlay is shown as a *side effect* of deciding the drop
     *   is invalid, and `stopPropagation()` only happens on the accepting
     *   branch. Any position this dock declines — over the screen panel, or a
     *   gap between panels — therefore bubbles on, and the ancestor obligingly
     *   shows its own drop indicator for a drag that can never land there.
     * - `_evtDragLeave` *does* call `stopPropagation()` for a drag whose
     *   source is this panel. So the leave that would have hidden that
     *   indicator is exactly the event the ancestor never receives.
     *
     * Hence the asymmetry is self-sustaining: the ancestor is told to show,
     * and never told to hide. `trackOwnDrag`'s `overlay.hide(0)` cannot help,
     * because that hides *this* dock's overlay, not an ancestor's.
     *
     * Only this dock's own drags are sealed. A foreign tab dragged across the
     * emulator on its way to the main area must still reach the panel that can
     * accept it — `tabsConstrained` already refuses the drop here, and Lumino's
     * own handlers deliberately leave that case propagating.
     */
    protected sealDragFromAncestors(event: Drag.Event): void {
        if (event.source === this) {
            event.stopPropagation();
        }
    }

    /** The `Drag` this dock's own tab bar started, for as long as one is in flight. */
    protected get ownDrag(): Drag | null {
        return (this as unknown as { _drag: Drag | null })._drag;
    }

    /**
     * Keep this dock's own drag from leaking into the rest of the
     * application, in every sense that turned out to matter. Three separate
     * problems, addressed together because each has a different, unrelated
     * cause:
     *
     * 1. **A foreign panel showing its own drop-target overlay.** Handled by
     *    `blockForeignOverlay`, on `lm-dragenter`.
     *
     * 2. **`ApplicationShell` revealing a collapsed sidebar or the bottom
     *    panel near a screen edge, mid-drag.** Its "drag near an edge for
     *    500ms" gate (`onDragOver`) measures from `dragState.startTime`,
     *    which is set the moment *any* `lm-dragenter` fires anywhere in the
     *    application — including ones entirely within this dock's own tab
     *    bars, during perfectly ordinary in-dock dragging. An real drag
     *    gesture easily takes longer than 500ms before ever nearing an edge,
     *    so by the time one is reached the gate is already open and the
     *    panel expands on the very first qualifying tick — no interception
     *    at the boundary, however early, can prevent that, because the clock
     *    started long before the boundary was ever approached. The only fix
     *    is to keep that clock from ever running while the drag is still
     *    ours: `trackOwnDrag`, on every `pointermove` for as long as this
     *    dock has a drag in flight, unconditionally clears `dragState`
     *    (private — there is no public way to opt a drag out of this) so it
     *    is never more than one tick old, wherever the cursor currently is.
     *
     * 3. **Ending the gesture once it truly leaves.** Also `trackOwnDrag`:
     *    once the raw cursor position falls outside this dock's own
     *    rectangle, it calls `Drag.dispose()` — Lumino's own sanctioned way
     *    to abort mid-gesture, the same thing pressing Escape does, and what
     *    `DockPanel`'s own `dispose()` calls on a drag it still has in
     *    flight. That tears down the pointer tracking driving every later
     *    dragenter/dragover/drop, so nothing gets another tick to react to
     *    this drag again. The tab itself was only ever hidden while dragged,
     *    never actually removed from its tab bar, so it simply reappears
     *    where it was — exactly what already happens when an ordinary drag
     *    is cancelled over invalid space. `overlay.hide(0)` alongside it is
     *    cheap insurance for this dock's own drop-target indicator, in case
     *    the `dragleave` `dispose()` sends on its way out does not reach it.
     *
     * Position is read straight from the event rather than resolved through
     * Lumino's own `elementFromPoint`-based target tracking, deliberately:
     * two earlier designs built on `lm-dragenter`/`lm-dragover` each modelled
     * that machinery well enough to fix one symptom, then left another
     * boundary case (a still-stuck overlay, then this edge-expansion timing
     * issue) for the next region of the screen to surface. Raw cursor
     * position against this dock's own rectangle has no such subtlety.
     */
    protected trackOwnDrag(event: PointerEvent): void {
        const drag = this.ownDrag;
        // `isDisposed` matters as much as the null check. `DockPanel` clears
        // its `_drag` from the `then()` of `Drag.start()`, so between a drag
        // finishing and that callback running — and permanently, if that
        // callback is never registered — `_drag` still points at a dead drag.
        // Acting on one would clear `dragState` out from under a *foreign*
        // drag on every pointer move, and `ApplicationShell` guards both
        // `onDrop` and `onDragLeave` with `if (state)`, so its side panels
        // would then never collapse and its drag visuals never tear down.
        if (!drag || drag.isDisposed) {
            return;
        }

        (this.shell as unknown as { dragState?: unknown }).dragState = undefined;

        const bounds = this.node.getBoundingClientRect();
        const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
            && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
        if (!inside) {
            // Deferred, never disposed inline, because this handler can be
            // running *inside* `Drag.start()`. Its last act is to dispatch a
            // synthetic `pointermove` on the document to kick the gesture off,
            // and it does that before returning its promise to `DockPanel`,
            // which has already assigned `_drag` and hidden the tab node. So a
            // tab detached at a point already outside this dock — dragging up
            // out of the dock, where the tab bars sit, is the easy way to do
            // that in one gesture — would otherwise be disposed re-entrantly.
            // `_finalize` nulls `_promise` before resolving it, so `start()`
            // would return null, `null.then(cleanup)` would throw inside the
            // signal handler, and the cleanup that clears `_drag` and unhides
            // the tab would never be registered: the tab stays invisible, and
            // `_onTabDetachRequested`'s `if (this._drag) return` then refuses
            // every future detach, killing drag and drop in this dock for good.
            // A microtask is enough — `then(cleanup)` is registered
            // synchronously, before this runs.
            queueMicrotask(() => {
                if (!drag.isDisposed) {
                    drag.dispose();
                }
                this.overlay.hide(0);
            });
        }
    }

    /**
     * Refuse one of this dock's own tabs onto a foreign panel's own overlay.
     *
     * The other direction — a foreign tab dragged in — is `tabsConstrained`
     * (set in the constructor), checked by Lumino's own `DockPanel` before
     * accepting a *drop*, which is enough on its own. Outgoing has no such
     * built-in support, since that check would have to run on whatever
     * foreign panel the drag has wandered onto, which knows nothing about
     * this dock — so this stops it here instead, in the capture phase, before
     * the event ever reaches that panel's own (bubble-phase) `_evtDragEnter`.
     * `stopPropagation()` alone, never `preventDefault()`: Lumino's own
     * `dispatchDragEnter` treats a *canceled* dragenter as *acceptance* —
     * `if (canceled) return currElem` — so calling `preventDefault()` to
     * reject, as an earlier version of this did, backfires by adopting the
     * foreign element as the drag's target instead of refusing it.
     */
    protected blockForeignOverlay(event: Drag.Event): void {
        if (event.source === this
            && event.mimeData.hasData('application/vnd.lumino.widget-factory')
            && !this.node.contains(event.target as Node)) {
            event.stopPropagation();
        }
    }

    get sim(): VesVbSim | undefined {
        return this.currentSim;
    }

    get romHeader(): RomHeader {
        return this.currentRomHeader;
    }

    get romSize(): number {
        return this.currentRomSize;
    }

    get buildMode(): string | undefined {
        return this.currentBuildMode;
    }

    onDidChange(listener: () => void): Disposable {
        return this.onDidChangeEmitter.event(listener);
    }

    getSymbols(): Promise<VesEmulatorSymbolIndex | undefined> {
        return this.symbolLoader();
    }

    setHighlights(rects: VesScreenRect[]): void {
        this.screen.setHighlights(rects);
    }

    setSim(sim: VesVbSim | undefined): void {
        this.currentSim = sim;
        this.onDidChangeEmitter.fire();
    }

    /** Called whenever a ROM is (re)loaded, independently of the sim changing. */
    setRomInfo(romHeader: RomHeader, romSize: number, buildMode?: string): void {
        this.currentRomHeader = romHeader;
        this.currentRomSize = romSize;
        this.currentBuildMode = buildMode;
        this.onDidChangeEmitter.fire();
    }

    /** Open a debug panel, or focus it if it is already there. */
    togglePanel(kind: EmulatorPanelType): void {
        const existing = this.panels.get(kind);
        if (existing && !existing.isDisposed) {
            if (existing.isAttached) {
                this.focusWidget(existing);
                return;
            }
            existing.dispose();
        }

        const panel = this.createPanel(kind);
        this.panels.set(kind, panel);
        // Beside the screen rather than on top of it, so opening an inspector
        // never hides what it is inspecting.
        this.addWidget(panel, { mode: 'split-right', ref: this.screen });
        this.focusWidget(panel);
    }

    /**
     * Open a panel in one particular tab group — what a group's "+" does.
     *
     * A panel that is already open elsewhere is moved rather than duplicated:
     * Lumino's `addWidget` relocates a widget the layout already contains, so
     * the same call covers both cases.
     */
    addPanelTo(kind: EmulatorPanelType, tabBar: TabBar<Widget>): void {
        const panel = this.widgetFor(kind);
        if (!panel) {
            return;
        }
        // Already in this group: there is nothing to move, and asking Lumino
        // to insert a widget next to itself is an error.
        if (this.tabBarFor(panel) !== tabBar) {
            const ref = tabBar.currentTitle?.owner;
            this.addWidget(panel, ref ? { mode: 'tab-after', ref } : { mode: 'split-right', ref: this.screen });
        }
        this.focusWidget(panel);
    }

    /** The tab group a widget is currently in, if it is in one. */
    protected tabBarFor(widget: Widget): TabBar<Widget> | undefined {
        for (const tabBar of this.tabBars()) {
            if (tabBar.titles.includes(widget.title)) {
                return tabBar;
            }
        }
        return undefined;
    }

    isPanelOpen(kind: EmulatorPanelType): boolean {
        const panel = this.panels.get(kind);
        return !!panel && !panel.isDisposed && panel.isAttached;
    }

    /** Open *and* on top of its tab group, rather than behind another tab. */
    isPanelVisible(kind: EmulatorPanelType): boolean {
        const panel = this.panels.get(kind);
        return !!panel && !panel.isDisposed && panel.isVisible;
    }

    protected createPanel(kind: EmulatorPanelType): VesEmulatorPanel {
        switch (kind) {
            case EmulatorPanelType.REGISTERS: return new VesEmulatorRegistersPanel(this, this.instanceId);
            case EmulatorPanelType.MEMORY: return new VesEmulatorMemoryPanel(this, this.instanceId);
            case EmulatorPanelType.MEMORY_POOLS: return new VesEmulatorMemoryPoolsPanel(this, this.instanceId);
            case EmulatorPanelType.ACTORS: return new VesEmulatorActorsPanel(this, this.instanceId);
            case EmulatorPanelType.DISASSEMBLY: return new VesEmulatorDisassemblyPanel(this, this.instanceId);
            case EmulatorPanelType.VIP_PALETTES: return new VesEmulatorVipPalettesPanel(this, this.instanceId);
            case EmulatorPanelType.VIP_CHARACTERS: return new VesEmulatorVipCharactersPanel(this, this.instanceId);
            case EmulatorPanelType.VIP_BGMAPS: return new VesEmulatorVipBgMapsPanel(this, this.instanceId);
            case EmulatorPanelType.VIP_WORLDS: return new VesEmulatorVipWorldsPanel(this, this.instanceId);
            case EmulatorPanelType.VIP_OBJECTS: return new VesEmulatorVipObjectsPanel(this, this.instanceId);
            case EmulatorPanelType.VIP_FRAME_BUFFERS: return new VesEmulatorVipFrameBuffersPanel(this, this.instanceId);
            case EmulatorPanelType.VSU: return new VesEmulatorVsuPanel(this, this.instanceId);
            case EmulatorPanelType.TERMINAL: return new VesEmulatorTerminalPanel(this, this.instanceId);
            case EmulatorPanelType.ROM_INFO: return new VesEmulatorRomInfoPanel(this, this.instanceId);
            case EmulatorPanelType.RUMBLE_PACK: return new VesEmulatorRumblePackPanel(this, this.instanceId, this.rumblePackService);
            case EmulatorPanelType.CHEATS: return new VesEmulatorCheatsPanel(this, this.instanceId, this.cheats);
            case EmulatorPanelType.ES_SOUND: return new VesEmulatorEsSoundPanel(this, this.instanceId, this.esSound);
            default: throw new Error(`Unknown emulator panel: ${kind}`);
        }
    }

    protected clearPanels(): void {
        for (const panel of this.panels.values()) {
            if (!panel.isDisposed) {
                panel.dispose();
            }
        }
        this.panels.clear();
    }

    /** Put the panels back to the built-in default arrangement (DEFAULT_LAYOUT). */
    resetLayout(): void {
        this.clearPanels();

        const main = this.deserializeArea(DEFAULT_LAYOUT);
        if (main) {
            try {
                this.restoreLayout({ main });
            } catch {
                // A bug in the built-in default is still better recovered
                // from than left half-applied.
                this.clearPanels();
            }
        }

        // Not an "else": this is both the happy-path outcome, since
        // DEFAULT_LAYOUT includes the screen, and the fallback if building or
        // applying it failed above and left nothing docked at all.
        if (!this.screen.isAttached) {
            this.addWidget(this.screen);
        }
        this.onDidChangeLayoutEmitter.fire();
    }

    /**
     * Play mode: show only the screen, hiding whatever debug panels are open
     * without closing them. `restoreLayout` only unparents widgets that drop
     * out of the new config rather than disposing them, so this is fully
     * reversible — `applySerializedLayout`/`resetLayout` bring back exactly
     * what was open before, `widgetFor` finding the same still-live instances.
     */
    showScreenOnly(): void {
        const main = this.deserializeArea({ type: 'tab-area', panels: [EmulatorPanelType.SCREEN], currentIndex: 0 });
        if (main) {
            this.restoreLayout({ main });
        }
    }

    /**
     * The screen's own tab bar is pointless chrome when it is the only thing
     * docked (Play mode always leaves it that way, via showScreenOnly), so
     * hide it entirely rather than render a single-tab bar above the screen.
     */
    setPlayMode(active: boolean): void {
        this.toggleClass('ves-emulator-dock-play-mode', active);
    }

    /**
     * Record the arrangement, including splits and their sizes.
     *
     * Lumino's own layout config holds widget instances, which cannot be
     * stored, so the tree is copied with each widget replaced by the kind of
     * panel it is. Restoring rebuilds the same tree with fresh instances.
     */
    serializeLayout(): VesEmulatorDockLayout {
        return { main: this.serializeArea(this.saveLayout().main) };
    }

    applySerializedLayout(layout: VesEmulatorDockLayout | undefined): void {
        const main = layout?.main ? this.deserializeArea(layout.main) : undefined;
        if (!main) {
            this.resetLayout();
            return;
        }

        try {
            this.restoreLayout({ main });
        } catch {
            // A stored layout can go stale, and a half-applied dock tree is
            // worse than the default one.
            this.resetLayout();
            return;
        }

        // The screen is not closable, so a layout that somehow lost it would
        // leave the emulator with nowhere to draw.
        if (!this.screen.isAttached) {
            this.addWidget(this.screen);
        }
    }

    protected serializeArea(area: DockLayout.AreaConfig | null): VesEmulatorAreaLayout | undefined {
        if (!area) {
            return undefined;
        }
        if (area.type === 'tab-area') {
            const panels = area.widgets
                .map(widget => this.kindOf(widget))
                .filter((kind): kind is EmulatorPanelType => kind !== undefined);
            return panels.length === 0
                ? undefined
                : { type: 'tab-area', panels, currentIndex: Math.max(0, Math.min(area.currentIndex, panels.length - 1)) };
        }

        const children = area.children
            .map(child => this.serializeArea(child))
            .filter((child): child is VesEmulatorAreaLayout => child !== undefined);
        if (children.length === 0) {
            return undefined;
        }
        return {
            type: 'split-area',
            orientation: area.orientation,
            children,
            sizes: area.sizes.slice(0, children.length),
        };
    }

    protected deserializeArea(area: VesEmulatorAreaLayout): DockLayout.AreaConfig | undefined {
        if (area.type === 'tab-area') {
            const widgets = area.panels
                .map(kind => this.widgetFor(kind))
                .filter((widget): widget is Widget => widget !== undefined);
            return widgets.length === 0
                ? undefined
                : { type: 'tab-area', widgets, currentIndex: Math.max(0, Math.min(area.currentIndex, widgets.length - 1)) };
        }

        const children = area.children
            .map(child => this.deserializeArea(child))
            .filter((child): child is DockLayout.AreaConfig => child !== undefined);
        return children.length === 0
            ? undefined
            : { type: 'split-area', orientation: area.orientation, children, sizes: area.sizes.slice(0, children.length) };
    }

    protected kindOf(widget: Widget): EmulatorPanelType | undefined {
        if (widget === this.screen) {
            return EmulatorPanelType.SCREEN;
        }
        return widget instanceof VesEmulatorPanel ? widget.kind : undefined;
    }

    /** The instance for a kind, creating a debug panel if it is not open yet. */
    protected widgetFor(kind: EmulatorPanelType): Widget | undefined {
        if (kind === EmulatorPanelType.SCREEN) {
            return this.screen;
        }
        if (!VES_EMULATOR_DEBUG_PANELS.includes(kind)) {
            return undefined;
        }

        const existing = this.panels.get(kind);
        if (existing && !existing.isDisposed) {
            return existing;
        }
        const panel = this.createPanel(kind);
        this.panels.set(kind, panel);
        return panel;
    }

    protected focusWidget(widget: Widget): void {
        this.selectWidget(widget);
        widget.activate();
        this.revealTab(widget);
    }

    /**
     * Scroll a widget's tab into view.
     *
     * Tab rows scroll once there are more tabs than fit, so the tab of a panel
     * just opened or focused can be off the end of one — which would look like
     * nothing happened.
     */
    protected revealTab(widget: Widget): void {
        const tabBar = this.tabBarFor(widget);
        const index = tabBar?.titles.indexOf(widget.title) ?? -1;
        if (!tabBar || index < 0) {
            return;
        }
        tabBar.contentNode.children[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    dispose(): void {
        this.onDidChangeEmitter.dispose();
        this.onDidChangeLayoutEmitter.dispose();
        this.onDidRequestAddPanelEmitter.dispose();
        super.dispose();
    }
}

export type VesEmulatorAreaLayout =
    | { type: 'tab-area', panels: EmulatorPanelType[], currentIndex: number }
    | {
        type: 'split-area',
        orientation: 'horizontal' | 'vertical',
        children: VesEmulatorAreaLayout[],
        sizes: number[]
    };

export interface VesEmulatorDockLayout {
    main?: VesEmulatorAreaLayout;
}
