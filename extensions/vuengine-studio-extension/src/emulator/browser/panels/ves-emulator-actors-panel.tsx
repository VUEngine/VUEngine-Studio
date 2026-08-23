import { FileX, Plug, Warning } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { Message } from '@theia/core/shared/@lumino/messaging';
import * as React from '@theia/core/shared/react';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { VesVbSim } from '../core/ves-vb-core';
import { ancestryOf, isSubclassOf } from '../core/ves-emulator-classes';
import { readStructFields, VesFieldValue, VesStruct } from '../core/ves-emulator-dwarf';
import {
    BLOCK_HEADER_BYTES,
    parseMemoryPoolLayout,
    readMemoryPoolBlocks,
    symbolsMatchRunningBuild,
    VesMemoryPoolLayout,
} from '../core/ves-emulator-memory-pool';
import { VesScreenRect } from './ves-emulator-screen-panel';
import { findSymbolAt, structNameOf, VesEmulatorSymbolIndex } from '../core/ves-emulator-symbols';
import { EMULATOR_PANEL_LABELS, EmulatorPanelType, hex, VesEmulatorDebugSource, VesEmulatorPanel } from './ves-emulator-panel';
import { control, field } from './ves-emulator-vip-detail';

/**
 * What to call a spec, from the symbol the linker recorded.
 *
 * The ABI's leading underscore goes, and so does the generated suffix that is
 * on every one of them — `_PlayerRacerActorSpec` is the project's `PlayerRacer`.
 * A name that is nothing but the suffix keeps it, since an empty column would
 * say less than an ugly one.
 */
function specDisplayName(symbol: string): string {
    const trimmed = symbol.replace(/^_/, '');
    const shortened = trimmed.replace(/ActorSpec$/, '').replace(/Spec$/, '');
    return shortened === '' ? trimmed : shortened;
}

/** Where a named member sits in a struct, or undefined if it has none. */
function memberOffset(struct: VesStruct, name: string): number | undefined {
    return struct.members.find(member => member.name === name)?.offset;
}

/** The block size of the pool an address falls in, if it falls in one. */
function blockSizeAt(layout: VesMemoryPoolLayout, address: number): number | undefined {
    for (const pool of layout.pools) {
        if (address >= pool.address && address < pool.address + pool.poolSize) {
            return pool.blockSize;
        }
    }
    return undefined;
}

/** The class every actor descends from, whatever the project calls its own. */
const ACTOR_CLASS = 'Actor';

/** Fields the list has columns of its own for, looked up by DWARF path. */
const NAME_FIELD = 'name';
const ID_FIELD = 'internalId';
const POSITION_FIELDS = ['transformation.position.x', 'transformation.position.y', 'transformation.position.z'];
const HIDDEN_FIELD = 'hidden';
const SPEC_FIELD = 'actorSpec';

/** The class every component descends from, and the one that draws. */
const COMPONENT_CLASS = 'Component';
const SPRITE_CLASS = 'Sprite';
/** Where a component records the entity it is attached to. */
const OWNER_FIELD = 'owner';

/**
 * The fields a sprite's on-screen rectangle is made of.
 *
 * `BgmapSprite::doRender` builds the world it hands the VIP out of exactly
 * these — `gx = position.x + displacement.x - halfWidth`, and the width is
 * `halfWidth << 1` — so reading them back gives the rectangle the engine
 * itself drew, with no projection to redo.
 */
const SPRITE_RECT_FIELDS = {
    x: 'position.x',
    y: 'position.y',
    parallax: 'position.parallax',
    displacementX: 'displacement.x',
    displacementY: 'displacement.y',
    displacementParallax: 'displacement.parallax',
    halfWidth: 'halfWidth',
    halfHeight: 'halfHeight',
};

/** How much of a `char*` is read looking for its terminator. */
const NAME_BYTES = 32;

/**
 * How many names are resolved per refresh.
 *
 * Each one is a read of its own, since the strings are scattered wherever the
 * linker put them, so they are fetched a few at a time and kept — a name is
 * set when its actor is built and does not change under it.
 */
const NAMES_PER_REFRESH = 12;

/** Why the panel has nothing to show, when it has nothing to show. */
enum ActorsStatus {
    OK = 'ok',
    NOT_RUNNING = 'notRunning',
    NO_SYMBOLS = 'noSymbols',
    NO_LAYOUTS = 'noLayouts',
    NOT_INITIALIZED = 'notInitialized',
    STALE_SYMBOLS = 'staleSymbols',
}

/** One component attached to an actor. */
interface ActorComponentEntry {
    address: number;
    className: string;
    /** Set for a sprite: where the engine last drew it. */
    rect?: VesScreenRect;
    /** Sprites only: whether it is being shown and was rendered. */
    shown?: boolean;
    /** Sprites only: the DRAM block it configures, or -1 when unassigned. */
    index?: number;
}

/** One live actor, as read out of the block it occupies. */
interface ActorEntry {
    objectAddress: number;
    blockAddress: number;
    blockSize: number;
    className: string;
    /** The class this was read as, which is a base when the exact one is unknown. */
    readAs: string;
    /** The class and everything above it, for saying what it is. */
    ancestry: string[];
    components: ActorComponentEntry[];
    fields: VesFieldValue[];
    namePointer?: number;
    /** The spec it was built from, as the project named it. */
    spec?: string;
    /** Where in that spec the pointer landed, which is normally its start. */
    specOffset?: number;
    specAddress?: number;
    internalId?: number;
    hidden?: boolean;
    position: (number | undefined)[];
}

/**
 * Every actor currently alive, and everything one of them holds.
 *
 * Actors are what a VUEngine game is made of, and they live in the same memory
 * pools everything else does — so the engine has no list of them, only blocks
 * that happen to hold one. Finding them means three things the build already
 * knows: which blocks are occupied, which class each occupant is (its vTable
 * pointer), and whether that class descends from `Actor` (the chain of
 * `getBaseClass` stubs). A project's own `PlayerRacer` is therefore found the
 * same way the engine's own classes are, without knowing anything about it.
 *
 * The detail view reads the selected actor field by field, using the layout
 * the build's debug sections give for its exact class — so a subclass shows
 * its own fields under the inherited ones, again without this knowing what
 * they are.
 */
export class VesEmulatorActorsPanel extends VesEmulatorPanel {

    /** As for the pools: a whole-heap read, and every block in it walked. */
    protected static readonly ACTORS_POLL_HZ = 4;

    protected status = ActorsStatus.NOT_RUNNING;
    protected actors: ActorEntry[] = [];
    protected error?: string;
    protected reading = false;
    /** The selected actor, by the address of the object rather than its row. */
    protected selected?: number;
    /** Resolved `char*` names, which do not change once an actor has one. */
    protected readonly names = new Map<number, string>();
    /**
     * Whether the selected actor is marked on the picture.
     *
     * Deliberately just a field: it belongs to this panel while it is open and
     * is meant to go away with it, so it stays out of both the saved layout
     * and any preference.
     */
    protected highlighting = true;

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.ACTORS, source, instanceId);
        this.title.label = EMULATOR_PANEL_LABELS[EmulatorPanelType.ACTORS];
        // The same split the Worlds panel uses: a table that takes the slack,
        // and a detail view under it sized by its content.
        this.addClass('ves-emulator-vip-split');
    }

    protected pollHz(): number {
        return VesEmulatorActorsPanel.ACTORS_POLL_HZ;
    }

    protected onAfterHide(msg: Message): void {
        super.onAfterHide(msg);
        // The marks belong to a selection this panel is no longer showing.
        this.source.setHighlights([]);
    }

    protected onBeforeDetach(msg: Message): void {
        this.source.setHighlights([]);
        super.onBeforeDetach(msg);
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.reset(ActorsStatus.NOT_RUNNING);
            this.update();
            return;
        }
        if (this.reading) {
            return;
        }
        this.reading = true;

        try {
            const symbols = await this.source.getSymbols();
            if (!symbols?.memoryPool) {
                this.reset(ActorsStatus.NO_SYMBOLS);
                return;
            }
            if (symbols.structs.size === 0) {
                // Without the debug sections there are no field offsets, and
                // an actor is only an address — not worth a list.
                this.reset(ActorsStatus.NO_LAYOUTS);
                return;
            }

            const region = new Uint8Array(await sim.readMemory(symbols.memoryPool.address, symbols.memoryPool.size));
            const layout = parseMemoryPoolLayout(symbols.memoryPool.address, region);
            if (!layout) {
                this.reset(ActorsStatus.NOT_INITIALIZED);
                return;
            }
            if (!symbolsMatchRunningBuild(layout, symbols.vTables)) {
                // Every part of this rests on the symbols describing the ROM
                // in the machine: which class a vTable is, where its fields
                // are. From another build they would all be wrong together.
                this.reset(ActorsStatus.STALE_SYMBOLS);
                return;
            }

            this.actors = this.collect(symbols, readMemoryPoolBlocks(layout, region), region, layout);
            this.status = ActorsStatus.OK;
            this.error = undefined;
            // Keeps the selection on the same actor across refreshes, and
            // drops it once that actor has been freed.
            if (this.selected !== undefined && !this.actors.some(actor => actor.objectAddress === this.selected)) {
                this.selected = undefined;
            }
            await this.resolveNames(sim);
        } catch (error) {
            console.error('[emulator] actors could not be read:', error);
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            this.reading = false;
            this.applyHighlights();
            this.update();
        }
    }

    /** Turn the occupied blocks into the ones that hold actors. */
    protected collect(
        symbols: VesEmulatorSymbolIndex,
        blocks: ReturnType<typeof readMemoryPoolBlocks>,
        region: Uint8Array,
        layout: VesMemoryPoolLayout
    ): ActorEntry[] {
        const components = this.groupComponents(symbols, region, layout, blocks);
        const actors: ActorEntry[] = [];
        for (const block of blocks) {
            const className = symbols.vTables.get(block.vTable);
            if (className === undefined || !isSubclassOf(symbols.classes, className, ACTOR_CLASS)) {
                continue;
            }

            // The engine allocated a block big enough for the real class, so
            // a layout that does not fit one cannot be the right layout.
            const struct = this.layoutFor(symbols, className, block.blockSize - BLOCK_HEADER_BYTES);
            if (!struct) {
                continue;
            }
            const fields = readStructFields(struct, region, block.objectOffset);
            const valueOf = (path: string): number | undefined =>
                fields.find(entry => entry.path === path)?.value;

            actors.push({
                objectAddress: block.objectAddress,
                blockAddress: block.address,
                blockSize: block.blockSize,
                className,
                readAs: struct.name.replace(/_str$/, ''),
                ancestry: ancestryOf(symbols.classes, className),
                components: components.get(block.objectAddress) ?? [],
                fields,
                namePointer: valueOf(NAME_FIELD),
                ...this.specOf(symbols, valueOf(SPEC_FIELD)),
                internalId: valueOf(ID_FIELD),
                hidden: valueOf(HIDDEN_FIELD) !== 0,
                position: POSITION_FIELDS.map(valueOf),
            });
        }
        return actors;
    }

    /**
     * Every live component, grouped by the actor it belongs to.
     *
     * Components are pool allocations like everything else, and each one
     * records its `owner`, so the blocks already read contain all of them and
     * the grouping is a scan rather than a traversal. This deliberately does
     * not go through `Entity::components`: that array is a cache the engine
     * fills the first time the game asks for a type, so it is NULL on most
     * actors and complete on almost none.
     */
    protected groupComponents(
        symbols: VesEmulatorSymbolIndex,
        region: Uint8Array,
        layout: VesMemoryPoolLayout,
        blocks: ReturnType<typeof readMemoryPoolBlocks>
    ): Map<number, ActorComponentEntry[]> {
        const grouped = new Map<number, ActorComponentEntry[]>();
        const component = symbols.structs.get(structNameOf(COMPONENT_CLASS));
        const ownerAt = component && memberOffset(component, OWNER_FIELD);
        if (ownerAt === undefined) {
            return grouped;
        }
        const view = new DataView(region.buffer, region.byteOffset, region.byteLength);

        for (const block of blocks) {
            const className = symbols.vTables.get(block.vTable);
            if (className === undefined || !isSubclassOf(symbols.classes, className, COMPONENT_CLASS)) {
                continue;
            }
            const at = block.objectOffset + ownerAt;
            if (at < 0 || at + 4 > region.byteLength) {
                continue;
            }
            // Inherited fields sit at the same offset in every subclass, so
            // one lookup on Component reads the owner of any of them.
            const owner = view.getUint32(at, true) >>> 0;
            if (owner === 0) {
                continue;
            }
            const entries = grouped.get(owner) ?? [];
            entries.push(this.readComponent(symbols, region, layout, block.objectAddress, className));
            grouped.set(owner, entries);
        }
        return grouped;
    }

    /** One component, with its rectangle when it is something that draws. */
    protected readComponent(
        symbols: VesEmulatorSymbolIndex,
        region: Uint8Array,
        layout: VesMemoryPoolLayout,
        address: number,
        className: string
    ): ActorComponentEntry {
        const entry: ActorComponentEntry = { address, className };
        if (!isSubclassOf(symbols.classes, className, SPRITE_CLASS)) {
            return entry;
        }

        const block = blockSizeAt(layout, address);
        const struct = block === undefined
            ? undefined
            : this.layoutFor(symbols, className, block - BLOCK_HEADER_BYTES);
        if (!struct) {
            return entry;
        }

        const fields = readStructFields(struct, region, address - layout.base);
        const valueOf = (path: string): number | undefined => fields.find(f => f.path === path)?.value;
        const halfWidth = valueOf(SPRITE_RECT_FIELDS.halfWidth) ?? 0;
        const halfHeight = valueOf(SPRITE_RECT_FIELDS.halfHeight) ?? 0;

        entry.shown = (valueOf('show') ?? 0) !== 0;
        entry.index = valueOf('index');
        if (halfWidth > 0 && halfHeight > 0) {
            entry.rect = {
                x: (valueOf(SPRITE_RECT_FIELDS.x) ?? 0) + (valueOf(SPRITE_RECT_FIELDS.displacementX) ?? 0) - halfWidth,
                y: (valueOf(SPRITE_RECT_FIELDS.y) ?? 0) + (valueOf(SPRITE_RECT_FIELDS.displacementY) ?? 0) - halfHeight,
                width: halfWidth * 2,
                height: halfHeight * 2,
                parallax: (valueOf(SPRITE_RECT_FIELDS.parallax) ?? 0)
                    + (valueOf(SPRITE_RECT_FIELDS.displacementParallax) ?? 0),
            };
        }
        return entry;
    }

    /**
     * Which spec an actor was built from.
     *
     * `Actor::constructor` keeps the spec it was configured with, and a spec is
     * a global the project wrote — `_PlayerRacerActorSpec` and 878 others in a
     * real game — so the pointer names it. That is worth more than anything
     * else on an actor for telling one from another: the engine's own `name`
     * field is optional and usually NULL, while every actor built from a spec
     * has one of these.
     */
    protected specOf(
        index: VesEmulatorSymbolIndex, pointer: number | undefined
    ): { spec?: string, specOffset?: number, specAddress?: number } {
        if (pointer === undefined || pointer === 0) {
            return {};
        }
        const found = findSymbolAt(index, pointer);
        if (!found) {
            // A spec built at runtime rather than written as a global; the
            // address is still worth keeping, since it is what tells two of
            // them apart.
            return { specAddress: pointer };
        }
        return { spec: specDisplayName(found.symbol.name), specOffset: found.offset, specAddress: pointer };
    }

    /**
     * The layout to read an actor by: its own class', or the nearest ancestor
     * the build described that fits in the block.
     *
     * Two things send this up the chain. A class whose struct the debug
     * sections do not carry — one the compiler never had to lay out — still
     * has everything an `Actor` has at the same offsets, because the class
     * macro puts inherited fields first. And a layout larger than the block
     * holding it cannot be the right one, since the allocator picked a block
     * the real class fits in; reading it anyway would present the next
     * block's bytes as this object's fields. Either way the fallback reads
     * fewer fields, never wrong ones.
     */
    protected layoutFor(
        index: VesEmulatorSymbolIndex, className: string, availableBytes: number
    ): VesStruct | undefined {
        for (const ancestor of ancestryOf(index.classes, className)) {
            const struct = index.structs.get(structNameOf(ancestor));
            if (struct && struct.byteSize <= availableBytes) {
                return struct;
            }
            if (ancestor === ACTOR_CLASS) {
                return undefined;
            }
        }
        return undefined;
    }

    /**
     * Fetch a few of the names not yet known.
     *
     * Bounded per refresh because each is a round trip of its own; over a
     * couple of ticks every actor on screen has one, and the cache means it is
     * never asked for twice.
     */
    protected async resolveNames(sim: VesVbSim): Promise<void> {
        const wanted: number[] = [];
        for (const actor of this.actors) {
            const pointer = actor.namePointer;
            if (pointer !== undefined && pointer !== 0 && !this.names.has(pointer)
                && !wanted.includes(pointer) && wanted.length < NAMES_PER_REFRESH) {
                wanted.push(pointer);
            }
        }

        for (const pointer of wanted) {
            try {
                const bytes = new Uint8Array(await sim.readMemory(pointer, NAME_BYTES));
                const end = bytes.indexOf(0);
                this.names.set(pointer, String.fromCharCode(...bytes.subarray(0, end < 0 ? bytes.length : end)));
            } catch {
                // A name pointing nowhere readable is the actor's problem, not
                // this panel's; remembering the miss stops it being retried.
                this.names.set(pointer, '');
            }
        }
    }

    protected reset(status: ActorsStatus): void {
        this.status = status;
        this.actors = [];
        this.selected = undefined;
        this.error = undefined;
    }

    protected select(objectAddress: number): void {
        this.selected = objectAddress;
        this.applyHighlights();
        this.update();
    }

    /**
     * Mark the selected actor's sprites on the picture.
     *
     * Only sprites have a rectangle: a component that draws nothing is not
     * anywhere on screen, and an actor made only of those is highlighted by
     * nothing rather than by a box at the origin.
     */
    protected applyHighlights(): void {
        if (!this.highlighting) {
            this.source.setHighlights([]);
            return;
        }
        const selected = this.actors.find(actor => actor.objectAddress === this.selected) ?? this.actors[0];
        const rects: VesScreenRect[] = [];
        for (const component of selected?.components ?? []) {
            if (component.rect) {
                rects.push(component.rect);
            }
        }
        this.source.setHighlights(rects);
    }

    /** The name the game gave this actor, if it gave it one. */
    protected ownNameOf(actor: ActorEntry): string {
        const pointer = actor.namePointer;
        if (pointer === undefined || pointer === 0) {
            return '';
        }
        return this.names.get(pointer) ?? '…';
    }

    /**
     * What identifies an actor in the list.
     *
     * The spec it was built from, which nearly every actor has and which is
     * stable across runs. One built without a global spec falls back to the
     * address of whatever it was configured from, since that at least tells
     * two of them apart.
     */
    protected specLabelOf(actor: ActorEntry): string {
        if (actor.spec !== undefined) {
            return actor.spec;
        }
        return actor.specAddress !== undefined ? hex(actor.specAddress, 8) : '—';
    }

    protected render(): React.ReactNode {
        if (this.error) {
            return <EmptyContainer title={this.error} icon={<Warning size={32} />} />;
        }
        if (this.status !== ActorsStatus.OK) {
            return this.renderEmpty();
        }
        if (this.actors.length === 0) {
            return <EmptyContainer
                title={nls.localize('vuengine/emulator/panels/actorsNone', 'No actors are allocated')}
                description={nls.localize(
                    'vuengine/emulator/panels/actorsNoneDescription',
                    'Nothing in the memory pools is an Actor right now.'
                )}
                icon={<Plug size={32} />}
            />;
        }

        const selected = this.actors.find(actor => actor.objectAddress === this.selected) ?? this.actors[0];
        return <>
            {this.renderList(selected)}
            {this.renderDetail(selected)}
        </>;
    }

    protected renderEmpty(): React.ReactNode {
        const titles: Record<ActorsStatus, string> = {
            [ActorsStatus.OK]: '',
            [ActorsStatus.NOT_RUNNING]: nls.localize(
                'vuengine/emulator/panels/notRunning', 'The emulator is not running.'
            ),
            [ActorsStatus.NO_SYMBOLS]: nls.localize(
                'vuengine/emulator/panels/poolsNoSymbols', 'No symbols for this ROM.'
            ),
            [ActorsStatus.NO_LAYOUTS]: nls.localize(
                'vuengine/emulator/panels/actorsNoLayouts', 'No field layouts for this ROM.'
            ),
            [ActorsStatus.NOT_INITIALIZED]: nls.localize(
                'vuengine/emulator/panels/poolsNotInitialized', 'The memory pools are not up yet.'
            ),
            [ActorsStatus.STALE_SYMBOLS]: nls.localize(
                'vuengine/emulator/panels/actorsStale', 'The symbols belong to a different build.'
            ),
        };
        const descriptions: Partial<Record<ActorsStatus, string>> = {
            [ActorsStatus.NO_SYMBOLS]: nls.localize(
                'vuengine/emulator/panels/poolsNoSymbolsDescription',
                'Reading the pools needs the .elf the ROM was built from, which is found through the .map \
file beside it. A ROM built elsewhere, or built without either, cannot be inspected this way.'
            ),
            [ActorsStatus.NO_LAYOUTS]: nls.localize(
                'vuengine/emulator/panels/actorsNoLayoutsDescription',
                'The .elf beside this ROM carries no debug sections, and without them there is no way to \
know where an actor keeps its fields.'
            ),
            [ActorsStatus.STALE_SYMBOLS]: nls.localize(
                'vuengine/emulator/panels/actorsStaleDescription',
                'Which class a block holds, and where its fields are, both come from the symbols — from \
another build they would be wrong together. Rebuild, or reload the ROM.'
            ),
        };

        const missingFile = this.status === ActorsStatus.NO_SYMBOLS
            || this.status === ActorsStatus.NO_LAYOUTS
            || this.status === ActorsStatus.STALE_SYMBOLS;
        return <EmptyContainer
            title={titles[this.status]}
            description={descriptions[this.status]}
            icon={missingFile ? <FileX size={32} /> : <Plug size={32} />}
        />;
    }

    /**
     * What the actor is made of.
     *
     * Sprites carry the rectangle they were last drawn at, which is what the
     * picture is marked with; anything else is listed by class alone, because
     * that is all a component that draws nothing has to say from here.
     */
    protected renderComponents(actor: ActorEntry): React.ReactNode {
        return <fieldset className='ves-emulator-vip-inspector-group ves-emulator-actors-components'>
            <legend>
                {nls.localize('vuengine/emulator/panels/actorsComponents', 'Components')}
                {actor.components.length > 0 ? ` (${actor.components.length})` : ''}
            </legend>
            {actor.components.length === 0
                ? <div className='hint'>
                    {nls.localize('vuengine/emulator/panels/actorsNoComponents', 'None attached.')}
                </div>
                : <table className='ves-emulator-vip-table'>
                    <thead>
                        <tr>
                            <th className='ves-emulator-actors-name'>
                                {nls.localize('vuengine/emulator/panels/actorsClass', 'Class')}
                            </th>
                            <th title={nls.localize(
                                'vuengine/emulator/panels/actorsRectHint',
                                'Where the engine last drew it, in screen pixels: x, y and size.'
                            )}>
                                {nls.localize('vuengine/emulator/panels/actorsRect', 'Rectangle')}
                            </th>
                            <th title={nls.localize(
                                'vuengine/emulator/panels/actorsParallaxHint',
                                'How far the two eyes are drawn apart, which is what puts it in depth.'
                            )}>
                                {nls.localize('vuengine/emulator/panels/actorsParallax', 'Prlx')}
                            </th>
                            <th>{nls.localize('vuengine/emulator/panels/actorsAddress', 'Address')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actor.components.map(component => (
                            <tr
                                key={component.address}
                                className={component.shown === false ? 'inactive' : undefined}
                            >
                                <td className='ves-emulator-actors-name'>{component.className}</td>
                                <td>{component.rect
                                    ? `${component.rect.x}, ${component.rect.y} · ${component.rect.width}×${component.rect.height}`
                                    : '—'}</td>
                                <td>{component.rect ? component.rect.parallax : '—'}</td>
                                <td><code>{hex(component.address, 8)}</code></td>
                            </tr>
                        ))}
                    </tbody>
                </table>}
        </fieldset>;
    }

    protected renderList(selected: ActorEntry): React.ReactNode {
        return <div className='ves-emulator-vip-split-table'>
            <fieldset className='ves-emulator-vip-inspector-group'>
                <legend>
                {nls.localize(
                    'vuengine/emulator/panels/actorsCaption',
                    'Actors currently allocated in the memory pools'
                )}
                </legend>
                <table className='ves-emulator-vip-table ves-emulator-vip-selectable-table ves-emulator-actors-table'>
                    <thead>
                        <tr>
                            <th
                                className='ves-emulator-actors-name'
                                title={nls.localize(
                                    'vuengine/emulator/panels/actorsSpecColumnHint',
                                    'The spec this actor was built from, named as the project declares it.'
                                )}
                            >
                                {nls.localize('vuengine/emulator/panels/actorsSpec', 'Spec')}
                            </th>
                            <th className='ves-emulator-actors-name'>
                                {nls.localize('vuengine/emulator/panels/actorsClass', 'Class')}
                            </th>
                            <th title={nls.localize(
                                'vuengine/emulator/panels/actorsIdHint', "The engine's own id for this instance"
                            )}>
                                {nls.localize('vuengine/emulator/panels/actorsId', 'Id')}
                            </th>
                            <th>X</th>
                            <th>Y</th>
                            <th>Z</th>
                            <th title={nls.localize(
                                'vuengine/emulator/panels/actorsBlockHint', 'The pool block it occupies, in bytes'
                            )}>
                                {nls.localize('vuengine/emulator/panels/poolsBlock', 'Block')}
                            </th>
                            <th>{nls.localize('vuengine/emulator/panels/actorsAddress', 'Address')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.actors.map(actor => (
                            <tr
                                key={actor.objectAddress}
                                // Hidden actors are still live and still cost a
                                // block; dimming them says which are on screen.
                                className={`${actor.hidden ? 'inactive' : ''}${
                                    actor.objectAddress === selected.objectAddress ? ' selected' : ''}`}
                                onClick={() => this.select(actor.objectAddress)}
                            >
                                <td className='ves-emulator-actors-name'>{this.specLabelOf(actor)}</td>
                                <td className='ves-emulator-actors-name'>{actor.className}</td>
                                <td>{actor.internalId ?? '—'}</td>
                                {actor.position.map((value, axis) =>
                                    <td key={axis}>{value ?? '—'}</td>
                                )}
                                <td>{actor.blockSize}</td>
                                <td><code>{hex(actor.objectAddress, 8)}</code></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </fieldset>
        </div>;
    }

    /**
     * Everything the selected actor holds.
     *
     * The fields are whatever its class declares rather than a chosen set, so
     * a project's own subclass shows its own state without this knowing what
     * that is. Nested structs are flattened into their leaves, which is where
     * the numbers actually are.
     */
    protected renderDetail(actor: ActorEntry): React.ReactNode {
        // The actor's own name, not the list's fallback: the field listing
        // below shows what is actually in the object.
        const ownName = this.ownNameOf(actor);
        return <div className='ves-emulator-vip-detail'>
            <div className='ves-emulator-vip-detail-groups'>
                <fieldset className='ves-emulator-vip-inspector-group'>
                    <legend>{nls.localize('vuengine/emulator/panels/actorsActor', 'Actor')}</legend>
                    <div className='ves-emulator-vip-detail-fields'>
                        {control(
                            nls.localize('vuengine/emulator/panels/actorsHighlight', 'Highlight'),
                            <input
                                type='checkbox'
                                checked={this.highlighting}
                                onChange={e => {
                                    this.highlighting = e.target.checked;
                                    this.applyHighlights();
                                    this.update();
                                }}
                            />,
                            nls.localize(
                                'vuengine/emulator/panels/actorsHighlightHint',
                                'Mark the selected actor’s sprites on the picture. Lasts as long as this \
panel is open.'
                            )
                        )}
                        {field(
                            nls.localize('vuengine/emulator/panels/actorsSpec', 'Spec'),
                            actor.spec
                                ? `${actor.spec}${actor.specOffset ? ` +${actor.specOffset}` : ''}`
                                : actor.specAddress ? hex(actor.specAddress, 8) : '—',
                            actor.spec
                                ? nls.localize(
                                    'vuengine/emulator/panels/actorsSpecHint',
                                    'The spec this actor was built from, named as the project declares it.'
                                )
                                : nls.localize(
                                    'vuengine/emulator/panels/actorsSpecUnnamedHint',
                                    'No global spec covers this address, so it was likely built at runtime.'
                                )
                        )}
                        {field(
                            nls.localize('vuengine/emulator/panels/actorsClass', 'Class'),
                            actor.className,
                            actor.ancestry.join(' → ')
                        )}
                        {field(nls.localize('vuengine/emulator/panels/actorsAddress', 'Address'), hex(actor.objectAddress, 8))}
                        {field(
                            nls.localize('vuengine/emulator/panels/poolsBlock', 'Block'),
                            `${hex(actor.blockAddress, 8)} (${actor.blockSize} B)`
                        )}
                        {actor.readAs !== actor.className && field(
                            nls.localize('vuengine/emulator/panels/actorsReadAs', 'Read as'),
                            actor.readAs,
                            nls.localize(
                                'vuengine/emulator/panels/actorsReadAsHint',
                                'This build carries no field layout for the exact class, so it is read as \
the nearest one it does describe. Inherited fields are at the same offsets; the subclass’ own are not shown.'
                            )
                        )}
                        {field(
                            nls.localize('vuengine/emulator/panels/actorsName', 'Name'),
                            this.ownNameOf(actor) || '—',
                            nls.localize(
                                'vuengine/emulator/panels/actorsNameHint',
                                'The name the game passed to the constructor, which most actors are never \
given — unlike the spec, which nearly all of them have.'
                            )
                        )}
                    </div>
                </fieldset>
                {this.renderComponents(actor)}
                <fieldset className='ves-emulator-vip-inspector-group ves-emulator-actors-fields'>
                    <legend>{nls.localize('vuengine/emulator/panels/actorsFields', 'Fields')}</legend>
                    <div className='ves-emulator-vip-detail-fields'>
                        {actor.fields.map(entry => field(
                            entry.path,
                            // The one pointer worth following inline, since
                            // the string behind it is the point of the field.
                            entry.path === NAME_FIELD && ownName !== '' ? ownName : entry.text,
                            `+${entry.offset} · ${entry.type.name}`
                        ))}
                    </div>
                </fieldset>
            </div>
        </div>;
    }
}
