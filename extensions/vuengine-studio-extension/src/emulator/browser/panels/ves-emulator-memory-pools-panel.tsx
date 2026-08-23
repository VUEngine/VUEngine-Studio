import { FileX, Plug, Warning } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import {
    describesMemoryPool,
    parseMemoryPoolLayout,
    readMemoryPoolUsage,
    symbolsMatchRunningBuild,
    VesMemoryPool,
    VesMemoryPoolLayout,
    VesMemoryPoolUsage,
} from '../core/ves-emulator-memory-pool';
import { EMULATOR_PANEL_LABELS, EmulatorPanelType, VesEmulatorDebugSource, VesEmulatorPanel } from './ves-emulator-panel';

/**
 * The share of a pool at which the engine itself starts complaining, from
 * `__MEMORY_POOL_WARNING_THRESHOLD`. Projects can move it, but the point of
 * showing it here is to flag a pool before it overflows, and the engine's
 * default is a sound place to do that.
 */
const WARNING_THRESHOLD = 85;

/** Why the panel has nothing to show, when it has nothing to show. */
enum PoolStatus {
    OK = 'ok',
    NOT_RUNNING = 'notRunning',
    NO_SYMBOLS = 'noSymbols',
    NOT_VUENGINE = 'notVuengine',
    NOT_INITIALIZED = 'notInitialized',
    WRONG_BUILD = 'wrongBuild',
}

/** One class' occupancy, totalled across every pool it is allocated from. */
interface ClassTotal {
    name: string;
    count: number;
    bytes: number;
    /** The block sizes it was found in — normally just the one. */
    blockSizes: number[];
}

/**
 * What the engine's heap is holding right now.
 *
 * VUEngine allocates every dynamic object out of `MemoryPool`: a fixed set of
 * pools of equally sized blocks, sized per project at compile time and never
 * grown at runtime, so running out is a crash rather than a slowdown. The
 * engine can print its own usage to the screen (`MemoryPool::printDetailedUsage`),
 * but only as totals, and only where it covers the game.
 *
 * This shows the same totals without disturbing the display, and adds the part
 * the engine cannot report: which classes the used blocks actually hold, read
 * back from each object's vTable pointer. A pool creeping towards full is a
 * question of what is filling it, and that is the answer.
 *
 * Both halves come out of a single read of the pool struct — see
 * `parseMemoryPoolLayout`, which also explains how the per-project pool table
 * is recovered rather than assumed.
 */
export class VesEmulatorMemoryPoolsPanel extends VesEmulatorPanel {

    /**
     * Slower than the default: a read here is the whole heap struct, tens of
     * kilobytes, and every block in it is then walked. Four times a second
     * still tracks allocation churn well enough to watch a pool fill.
     */
    protected static readonly POOLS_POLL_HZ = 4;

    protected status = PoolStatus.NOT_RUNNING;
    /**
     * Not `layout`: that name belongs to Lumino's `Widget`, and shadowing its
     * accessor with a field leaves the dock reading `undefined` when it goes
     * to arrange this panel.
     */
    protected poolLayout?: VesMemoryPoolLayout;
    protected usage?: VesMemoryPoolUsage[];
    /**
     * Set when the symbols turned out to belong to a different build, which
     * leaves the pool figures usable but the occupant names not.
     */
    protected staleSymbols = false;
    protected error?: string;
    /** Guards against a slow read being overlapped by the next tick. */
    protected reading = false;

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.MEMORY_POOLS, source, instanceId);
        this.title.label = EMULATOR_PANEL_LABELS[EmulatorPanelType.MEMORY_POOLS];
        this.title.caption = nls.localize(
            'vuengine/emulator/panels/memoryPoolsCaption', "VUEngine's dynamic object allocation"
        );
    }

    protected pollHz(): number {
        return VesEmulatorMemoryPoolsPanel.POOLS_POLL_HZ;
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.reset(PoolStatus.NOT_RUNNING);
            // Unlike the paths below, this one does not reach the redraw in
            // `finally`, and a machine that has gone away has to stop being
            // described.
            this.update();
            return;
        }
        // Reads are big enough, and the struct is walked closely enough, that a
        // tick arriving while the last one is still out would just queue work
        // the panel is about to throw away anyway.
        if (this.reading) {
            return;
        }
        this.reading = true;

        try {
            const symbols = await this.source.getSymbols();
            if (!symbols) {
                this.reset(PoolStatus.NO_SYMBOLS);
                return;
            }
            const pool = symbols.memoryPool;
            if (!pool) {
                this.reset(PoolStatus.NOT_VUENGINE);
                return;
            }

            // The linker's size for the singleton is exactly the struct, which
            // is what lets the arrays at its end be found from its end.
            const region = new Uint8Array(await sim.readMemory(pool.address, pool.size));
            const layout = parseMemoryPoolLayout(pool.address, region);
            if (!layout) {
                // Two very different things fail here, and saying which
                // matters: a machine that has not reached `MemoryPool::reset`
                // yet will start working on its own, while symbols describing
                // a different build never will.
                const isPool = describesMemoryPool(region, symbols.vTables);
                console.warn(
                    '[emulator] memory pools did not parse at 0x%s (%d bytes); '
                    + 'the singleton\'s vTable %s the symbols\' MemoryPool',
                    pool.address.toString(16).toUpperCase(), pool.size, isPool ? 'matches' : 'does NOT match'
                );
                this.reset(isPool ? PoolStatus.NOT_INITIALIZED : PoolStatus.WRONG_BUILD);
                return;
            }

            // Occupant names are only as good as the symbols they come from,
            // and a table from another build names the wrong classes rather
            // than none — so it is checked against the machine before being
            // used at all, and dropped entirely if it disagrees.
            this.staleSymbols = !symbolsMatchRunningBuild(layout, symbols.vTables);
            this.poolLayout = layout;
            this.usage = readMemoryPoolUsage(
                layout, region, this.staleSymbols ? new Map() : symbols.vTables
            );
            this.status = PoolStatus.OK;
            this.error = undefined;
        } catch (error) {
            // Logged whole, not just messaged: what reaches the panel is one
            // line, and everything on this path — the symbol read, the RPC to
            // the worker, the parse — is far enough away from it that the
            // stack is the only thing that says which.
            console.error('[emulator] memory pools could not be read:', error);
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            this.reading = false;
            this.update();
        }
    }

    protected reset(status: PoolStatus): void {
        this.status = status;
        this.poolLayout = undefined;
        this.usage = undefined;
        this.staleSymbols = false;
        this.error = undefined;
    }

    protected render(): React.ReactNode {
        if (this.error) {
            return <EmptyContainer title={this.error} icon={<Warning size={32} />} />;
        }

        const layout = this.poolLayout;
        const usage = this.usage;
        if (!layout || !usage) {
            return this.renderEmpty();
        }

        const usedBytes = usage.reduce((total, pool) => total + pool.usedBytes, 0);
        const usedBlocks = usage.reduce((total, pool) => total + pool.usedBlocks, 0);
        const totalBlocks = layout.pools.reduce((total, pool) => total + pool.blocks, 0);

        return <div className='ves-emulator-memory-pools'>
            {this.renderSummary(layout.totalBytes, usedBytes, usedBlocks, totalBlocks)}
            {this.renderPools(layout.pools, usage)}
            {this.renderClasses(layout.pools, usage, usedBlocks)}
        </div>;
    }

    protected renderEmpty(): React.ReactNode {
        const titles: Record<PoolStatus, string> = {
            [PoolStatus.OK]: '',
            [PoolStatus.NOT_RUNNING]: nls.localize(
                'vuengine/emulator/panels/notRunning', 'The emulator is not running.'
            ),
            [PoolStatus.NO_SYMBOLS]: nls.localize(
                'vuengine/emulator/panels/poolsNoSymbols', 'No symbols for this ROM.'
            ),
            [PoolStatus.NOT_VUENGINE]: nls.localize(
                'vuengine/emulator/panels/poolsNotVuengine', 'No memory pools in this ROM.'
            ),
            [PoolStatus.NOT_INITIALIZED]: nls.localize(
                'vuengine/emulator/panels/poolsNotInitialized', 'The memory pools are not up yet.'
            ),
            [PoolStatus.WRONG_BUILD]: nls.localize(
                'vuengine/emulator/panels/poolsWrongBuild', 'The symbols belong to a different build.'
            ),
        };
        const descriptions: Partial<Record<PoolStatus, string>> = {
            [PoolStatus.NO_SYMBOLS]: nls.localize(
                'vuengine/emulator/panels/poolsNoSymbolsDescription',
                'Reading the pools needs the .elf the ROM was built from, which is found through the .map \
file beside it. A ROM built elsewhere, or built without either, cannot be inspected this way.'
            ),
            [PoolStatus.NOT_VUENGINE]: nls.localize(
                'vuengine/emulator/panels/poolsNotVuengineDescription',
                'This ROM has symbols, but none for MemoryPool. Only games built on VUEngine allocate \
through it.'
            ),
            [PoolStatus.NOT_INITIALIZED]: nls.localize(
                'vuengine/emulator/panels/poolsNotInitializedDescription',
                'The engine describes its pools as it constructs them. This clears once the game reaches \
that point in its startup.'
            ),
            [PoolStatus.WRONG_BUILD]: nls.localize(
                'vuengine/emulator/panels/poolsWrongBuildDescription',
                'The .elf beside this ROM puts the memory pools somewhere the running machine does not \
have them, so it was made by a different build. Rebuild, or restart the emulator so the ROM and its \
symbols are read together.'
            ),
        };

        // The two reasons are different in kind, and the icon should say
        // which: nothing to read yet, or nothing to read it with.
        const missingSymbols = this.status === PoolStatus.NO_SYMBOLS
            || this.status === PoolStatus.NOT_VUENGINE
            || this.status === PoolStatus.WRONG_BUILD;

        return <EmptyContainer
            title={titles[this.status]}
            description={descriptions[this.status]}
            icon={missingSymbols ? <FileX size={32} /> : <Plug size={32} />}
        />;
    }

    protected renderSummary(
        totalBytes: number, usedBytes: number, usedBlocks: number, totalBlocks: number
    ): React.ReactNode {
        return <div className='ves-emulator-memory-pools-summary'>
            <div className='ves-emulator-memory-pools-total'>
                <strong>{percent(usedBytes, totalBytes)}%</strong>
                <span className='hint'>
                    {nls.localize(
                        'vuengine/emulator/panels/poolsSummary',
                        '{0} of {1} bytes · {2} of {3} blocks',
                        bytes(usedBytes), bytes(totalBytes), count(usedBlocks), count(totalBlocks)
                    )}
                </span>
            </div>
            {bar(usedBytes, totalBytes)}
        </div>;
    }

    protected renderPools(pools: VesMemoryPool[], usage: VesMemoryPoolUsage[]): React.ReactNode {
        return <fieldset className='ves-emulator-memory-pools-group'>
            <legend>{nls.localize('vuengine/emulator/panels/poolsPools', 'Pools')}</legend>
            <table className='ves-emulator-memory-pools-table'>
                <thead>
                    <tr>
                        <th title={nls.localize(
                            'vuengine/emulator/panels/poolsBlockHint',
                            'How many bytes one block of this pool holds. An allocation takes the \
smallest block it fits in, so anything it does not use is lost until it is freed.'
                        )}>
                            {nls.localize('vuengine/emulator/panels/poolsBlock', 'Block')}
                        </th>
                        <th title={nls.localize(
                            'vuengine/emulator/panels/poolsSizeHint',
                            'How many blocks the project gave this pool. Fixed at build time: running \
out is what the overflow column counts.'
                        )}>
                            {nls.localize('vuengine/emulator/panels/poolsSize', 'Size')}
                        </th>
                        <th>{nls.localize('vuengine/emulator/panels/poolsUsed', 'Used')}</th>
                        <th>{nls.localize('vuengine/emulator/panels/poolsFree', 'Free')}</th>
                        <th title={nls.localize(
                            'vuengine/emulator/panels/poolsBytesHint',
                            'What this pool costs in WRAM, whether or not anything is in it: its block \
size times its block count.'
                        )}>
                            {nls.localize('vuengine/emulator/panels/poolsBytes', 'Bytes')}
                        </th>
                        <th className='ves-emulator-memory-pools-usage'>
                            {nls.localize('vuengine/emulator/panels/poolsUsage', 'Usage')}
                        </th>
                        <th title={nls.localize(
                            'vuengine/emulator/panels/poolsOverflowsHint',
                            'How often an allocation did not fit here and had to take a larger block. \
The engine counts these in a byte it never clears, so a long run can wrap it.'
                        )}>
                            {nls.localize('vuengine/emulator/panels/poolsOverflows', 'Over')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {pools.map((pool, index) => {
                        const used = usage[index].usedBlocks;
                        const share = percent(used, pool.blocks);
                        return <tr
                            key={pool.address}
                            className={share >= WARNING_THRESHOLD ? 'ves-emulator-memory-pools-warn' : undefined}
                        >
                            <td className='ves-emulator-memory-pools-number'>{pool.blockSize}</td>
                            <td className='ves-emulator-memory-pools-number'>{count(pool.blocks)}</td>
                            <td className='ves-emulator-memory-pools-number'>{count(used)}</td>
                            <td className='ves-emulator-memory-pools-number'>{count(pool.blocks - used)}</td>
                            <td className='ves-emulator-memory-pools-number'>{bytes(pool.poolSize)}</td>
                            <td className='ves-emulator-memory-pools-usage'>
                                <div>
                                    {bar(used, pool.blocks)}
                                    <span className='ves-emulator-memory-pools-percent'>{share}%</span>
                                </div>
                            </td>
                            <td className={`ves-emulator-memory-pools-number${
                                pool.overflows > 0 ? ' ves-emulator-memory-pools-warn' : ''
                            }`}>
                                {pool.overflows > 0 ? pool.overflows : ''}
                            </td>
                        </tr>;
                    })}
                </tbody>
            </table>
        </fieldset>;
    }

    /**
     * What is actually in the blocks, across every pool.
     *
     * A class allocates the same size every time, so it normally sits in one
     * pool; a class listed against several block sizes means the pool it
     * belongs in was full when some of them were allocated, which is the same
     * thing the overflow column counts.
     */
    protected renderClasses(
        pools: VesMemoryPool[], usage: VesMemoryPoolUsage[], usedBlocks: number
    ): React.ReactNode {
        const totals = new Map<string, ClassTotal>();
        let unidentified = 0;

        usage.forEach((pool, index) => {
            unidentified += pool.unidentified;
            for (const { name, count: occupants } of pool.classes) {
                const total = totals.get(name) ?? { name, count: 0, bytes: 0, blockSizes: [] };
                total.count += occupants;
                total.bytes += occupants * pools[index].blockSize;
                total.blockSizes.push(pools[index].blockSize);
                totals.set(name, total);
            }
        });

        const rows = [...totals.values()].sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));

        if (this.staleSymbols) {
            // The figures above are read from the machine and stand on their
            // own; only the names needed symbols, so only they are withheld.
            return <fieldset className='ves-emulator-memory-pools-group'>
                <legend>{nls.localize('vuengine/emulator/panels/poolsClasses', 'Occupants')}</legend>
                <div className='hint ves-emulator-memory-pools-note'>
                    {nls.localize(
                        'vuengine/emulator/panels/poolsStaleSymbols',
                        'The symbols beside this ROM belong to a different build, so they would name the \
wrong classes. Rebuild, or reload the ROM, to see what the blocks hold. The figures above are read from \
the running machine and are unaffected.'
                    )}
                </div>
            </fieldset>;
        }

        return <fieldset className='ves-emulator-memory-pools-group ves-emulator-memory-pools-occupants'>
            <legend>{nls.localize('vuengine/emulator/panels/poolsClasses', 'Occupants')}</legend>
            {rows.length === 0 && unidentified === 0
                ? <div className='hint'>
                    {nls.localize('vuengine/emulator/panels/poolsNothingAllocated', 'Nothing is allocated.')}
                </div>
                : <table className='ves-emulator-memory-pools-table'>
                    <thead>
                        <tr>
                            <th className='ves-emulator-memory-pools-name'>
                                {nls.localize('vuengine/emulator/panels/poolsClass', 'Class')}
                            </th>
                            <th>{nls.localize('vuengine/emulator/panels/poolsCount', 'Count')}</th>
                            <th>{nls.localize('vuengine/emulator/panels/poolsBlock', 'Block')}</th>
                            <th>{nls.localize('vuengine/emulator/panels/poolsBytes', 'Bytes')}</th>
                            <th className='ves-emulator-memory-pools-table-spacer'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => <tr key={row.name}>
                            <td className='ves-emulator-memory-pools-name'><code>{row.name}</code></td>
                            <td className='ves-emulator-memory-pools-number'>{count(row.count)}</td>
                            <td className='ves-emulator-memory-pools-number'>
                                {[...new Set(row.blockSizes)].join(', ')}
                            </td>
                            <td className='ves-emulator-memory-pools-number'>{bytes(row.bytes)}</td>
                            <td/>
                        </tr>)}
                        {unidentified > 0 && <tr className='hint' title={nls.localize(
                            'vuengine/emulator/panels/poolsUnidentifiedHint',
                            'Blocks holding something without a virtual table, which is what names the \
rest. Plain structs allocated with __NEW_BASIC are the usual reason.'
                        )}>
                            <td className='ves-emulator-memory-pools-name'>
                                {nls.localize('vuengine/emulator/panels/poolsUnidentified', 'Not an object')}
                            </td>
                            <td className='ves-emulator-memory-pools-number'>{count(unidentified)}</td>
                            <td/>
                            <td/>
                            <td/>
                        </tr>}
                    </tbody>
                </table>}
        </fieldset>;
    }
}

/** A whole-number percentage, saturating rather than rounding up to 100. */
function percent(part: number, whole: number): number {
    if (whole <= 0) {
        return 0;
    }
    const share = (100 * part) / whole;
    return share > 0 && share < 1 ? 1 : Math.min(100, Math.round(share));
}

/** Grouped by thousands, which is how the pool sizes read most easily. */
function count(value: number): string {
    return value.toLocaleString('en-US');
}

function bytes(value: number): string {
    return value.toLocaleString('en-US');
}

/** A fill bar. Purely presentational, so it carries no text of its own. */
function bar(part: number, whole: number): React.ReactNode {
    const share = percent(part, whole);
    return <div className='ves-emulator-memory-pools-bar'>
        <div
            className={share >= WARNING_THRESHOLD ? 'ves-emulator-memory-pools-warn' : undefined}
            style={{ width: `${share}%` }}
        />
    </div>;
}
