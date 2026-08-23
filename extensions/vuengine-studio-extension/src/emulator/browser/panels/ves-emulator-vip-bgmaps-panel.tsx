import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import { hex, VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';
import { VipCanvas } from './ves-emulator-vip-canvas';
import {
    decodeVipBgMapCell,
    decodeVipWorld,
    drawVipChar,
    encodeVipBgMapCell,
    sameVipBytes,
    VIP_BGMAP_BYTES,
    VIP_BGMAP_CELLS,
    VIP_BGMAP_COUNT,
    VIP_BGMAP_PALETTES,
    VIP_CHAR_COUNT,
    VIP_CHAR_SEGMENT_BYTES,
    VIP_CHAR_SEGMENTS,
    VIP_CHAR_SIZE,
    VIP_GENERIC_PALETTE_INTENSITIES,
    VIP_GRAPHICS_POLL_HZ,
    VIP_REGISTER_BASE,
    VIP_REGISTER_BLOCK_BYTES,
    VIP_WORLD_BASE,
    VIP_WORLD_BLOCK_BYTES,
    VIP_WORLD_BYTES,
    VIP_WORLD_COUNT,
    vipBgMapAddress,
    VipBgMapCell,
    vipBgMapSegmentUses,
    vipCharSegmentAddress,
    VipCharacters,
    vipIntensitiesForRegister,
    VipIntensityWatcher,
} from './ves-emulator-vip-memory';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { Plug, Warning } from '@phosphor-icons/react';

/** Cells per side of a 64x64 map, for the "Scale" preview zoom. */
const PREVIEW_ZOOM = 24;

/**
 * The fourteen BGMap segments as a table, and the selected one rasterised as
 * one 512x512 bitmap below it, with a sidebar for inspecting — and, for
 * palette/flip, editing — one cell at a time.
 *
 * Reads the selected segment's cells plus the character memory they reference
 * each refresh, and re-rasterises only when the pixels or the shading actually
 * changed — see the Characters panel, whose caching this mirrors. The table
 * costs one more read, of world attribute memory, since what a segment is
 * being used for is a fact about the worlds pointing at it rather than about
 * the segment itself.
 */
export class VesEmulatorVipBgMapsPanel extends VesEmulatorPanel {

    protected error?: string;
    protected registers?: DataView;
    protected charSegments: (Uint8Array | undefined)[] = [];
    protected cells?: Uint8Array;
    protected worldBytes?: Uint8Array;
    protected segment = 0;
    protected selected = 0;
    protected zoom = 2;
    protected showGrid = false;
    protected showGenericPalette = true;

    protected image?: ImageData;
    protected dirty = true;
    protected readonly intensityWatcher = new VipIntensityWatcher();

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.VIP_BGMAPS, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/bgMaps', 'BGMaps');
        // Stacks the segment table above the inspector, which is why this
        // panel's render returns the two as siblings rather than wrapping
        // them: the widget's own node is the column they sit in.
        this.addClass('ves-emulator-vip-split');
    }

    protected pollHz(): number {
        return VIP_GRAPHICS_POLL_HZ;
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.registers = undefined;
            this.charSegments = [];
            this.cells = undefined;
            this.worldBytes = undefined;
            this.image = undefined;
            this.update();
            return;
        }

        try {
            this.registers = new DataView(await sim.readMemory(VIP_REGISTER_BASE, VIP_REGISTER_BLOCK_BYTES));

            const segments = await Promise.all(VIP_CHAR_SEGMENTS.map(
                (unused, index) => sim.readMemory(vipCharSegmentAddress(index), VIP_CHAR_SEGMENT_BYTES)
            ));
            segments.forEach((buffer, index) => {
                const bytes = new Uint8Array(buffer);
                if (!sameVipBytes(bytes, this.charSegments[index])) {
                    this.charSegments[index] = bytes;
                    this.dirty = true;
                }
            });

            const cells = new Uint8Array(await sim.readMemory(vipBgMapAddress(this.segment), VIP_BGMAP_BYTES));
            if (!sameVipBytes(cells, this.cells)) {
                this.cells = cells;
                this.dirty = true;
            }

            // Only the table above needs this, and nothing about it is
            // rasterised, so it does not take part in the dirty tracking.
            this.worldBytes = new Uint8Array(await sim.readMemory(VIP_WORLD_BASE, VIP_WORLD_BLOCK_BYTES));

            if (this.intensityWatcher.changed(this.registers)) {
                this.dirty = true;
            }
            this.error = undefined;
        } catch (error) {
            this.error = error instanceof Error ? error.message : String(error);
        }

        if (this.dirty && this.registers) {
            this.image = this.rasterise(this.registers);
            this.dirty = false;
        }
        this.update();
    }

    protected setSegment(segment: number): void {
        if (Number.isNaN(segment)) {
            return;
        }
        this.segment = Math.min(VIP_BGMAP_COUNT - 1, Math.max(0, segment));
        // Selected cell index is left as-is: it stays valid across a segment
        // switch (every map is 64x64), and keeping it lets you compare the
        // same position across maps.
        this.dirty = true;
        this.refresh();
    }

    protected selectCell(cell: number): void {
        if (Number.isNaN(cell)) {
            return;
        }
        const count = VIP_BGMAP_CELLS * VIP_BGMAP_CELLS;
        this.selected = Math.min(count - 1, Math.max(0, cell));
        this.update();
    }

    protected setShowGenericPalette(value: boolean): void {
        this.showGenericPalette = value;
        this.dirty = true;
        this.refresh();
    }

    /**
     * Patch the selected cell — its character and/or its palette/flip bits —
     * and write the result back to VRAM. Callers are trusted to have already
     * clamped `char` to a valid character index; palette and the flip flags
     * come from a bounded <select> and checkboxes respectively, so need no
     * clamping of their own.
     */
    protected async writeCell(patch: Partial<VipBgMapCell>): Promise<void> {
        const sim = this.source.sim;
        const cells = this.cells;
        if (!sim || !cells) {
            return;
        }

        const offset = this.selected * 2;
        const view = new DataView(cells.buffer, cells.byteOffset, cells.byteLength);
        const current = decodeVipBgMapCell(view.getUint16(offset, true));
        const raw = encodeVipBgMapCell({ ...current, ...patch });

        const buffer = new ArrayBuffer(2);
        new DataView(buffer).setUint16(0, raw, true);
        await sim.writeMemory(vipBgMapAddress(this.segment) + offset, buffer);

        this.dirty = true;
        await this.refresh();
    }

    /** The four BGMap palettes' shading, or the same generic ramp four times. */
    protected palettes(registers: DataView): number[][] {
        return this.showGenericPalette
            ? [0, 1, 2, 3].map(() => VIP_GENERIC_PALETTE_INTENSITIES)
            : VIP_BGMAP_PALETTES.map(register => vipIntensitiesForRegister(registers, register));
    }

    protected rasterise(registers: DataView): ImageData | undefined {
        const cells = this.cells;
        if (!cells || this.charSegments.length === 0) {
            return undefined;
        }
        const characters = new VipCharacters(this.charSegments);
        const palettes = this.palettes(registers);
        const size = VIP_BGMAP_CELLS * VIP_CHAR_SIZE;
        const pixels = new Uint8ClampedArray(size * size * 4);
        const view = new DataView(cells.buffer, cells.byteOffset, cells.byteLength);

        for (let row = 0; row < VIP_BGMAP_CELLS; row++) {
            for (let column = 0; column < VIP_BGMAP_CELLS; column++) {
                const cell = decodeVipBgMapCell(view.getUint16((row * VIP_BGMAP_CELLS + column) * 2, true));
                drawVipChar(
                    pixels,
                    size,
                    column * VIP_CHAR_SIZE,
                    row * VIP_CHAR_SIZE,
                    characters,
                    cell.char,
                    palettes[cell.palette],
                    cell.hFlip,
                    cell.vFlip
                );
            }
        }
        return new ImageData(pixels, size, size);
    }

    /**
     * The fourteen segments, and what the worlds currently being drawn do with
     * each: which of them read their map out of it, and whose param table is
     * sitting in it. A segment listed under neither is free.
     *
     * Clicking a row is the other way to pick the segment the inspector below
     * shows, alongside the sidebar's Map field.
     */
    protected renderSegmentTable(): React.ReactNode {
        const bytes = this.worldBytes;
        const view = bytes && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const worlds = view
            ? Array.from({ length: VIP_WORLD_COUNT }, (unused, index) => decodeVipWorld(view, index, index * VIP_WORLD_BYTES))
            : [];
        const uses = vipBgMapSegmentUses(worlds);

        return <div className='ves-emulator-vip-split-table'>
            <fieldset className='ves-emulator-vip-inspector-group'>
                <legend>
                    {nls.localize('vuengine/emulator/panels/bgMapsCaption', 'Background Maps')}
                </legend>
                <table className='ves-emulator-vip-table ves-emulator-vip-selectable-table'>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{nls.localize('vuengine/emulator/panels/bgmaps/address', 'Address')}</th>
                            <th title={nls.localize(
                                'vuengine/emulator/panels/bgmaps/segmentWorldsHint', 'Worlds whose map this segment is part of'
                            )}>{nls.localize('vuengine/emulator/panels/worlds', 'Worlds')}</th>
                            <th title={nls.localize(
                                'vuengine/emulator/panels/bgmaps/segmentParamsHint', 'Worlds whose param table this segment holds'
                            )}>{nls.localize('vuengine/emulator/panels/bgmaps/params', 'Params')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uses.map((use, segment) => (
                            <tr
                                key={segment}
                                className={`${use.worlds.length || use.params.length ? '' : 'inactive'}${
                                    segment === this.segment ? ' selected' : ''}`}
                                onClick={() => this.setSegment(segment)}
                            >
                                <td>{segment}</td>
                                <td><code>{hex(vipBgMapAddress(segment), 8)}</code></td>
                                <td>{use.worlds.join(', ') || '—'}</td>
                                <td>{use.params.join(', ') || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </fieldset>
        </div>;
    }

    /** Just the selected cell's character, for the sidebar preview. */
    protected rasterisePreview(characters: VipCharacters, palettes: number[][], cell: VipBgMapCell): ImageData {
        const pixels = new Uint8ClampedArray(VIP_CHAR_SIZE * VIP_CHAR_SIZE * 4);
        drawVipChar(pixels, VIP_CHAR_SIZE, 0, 0, characters, cell.char, palettes[cell.palette], cell.hFlip, cell.vFlip);
        return new ImageData(pixels, VIP_CHAR_SIZE, VIP_CHAR_SIZE);
    }

    protected render(): React.ReactNode {
        if (this.error) {
            return <EmptyContainer
                title={this.error ?? nls.localizeByDefault('Error')}
                icon={<Warning size={32} />}
            />;
        }
        if (!this.registers) {
            return (
              <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />
            );
        }
        if (!this.image || !this.cells) {
            return <div className='ves-emulator-panel-empty'>
                {nls.localize('vuengine/emulator/panels/bgmaps/reading', 'Reading VIP memory…')}
            </div>;
        }

        const registers = this.registers;
        const cells = this.cells;
        const selected = this.selected;
        const view = new DataView(cells.buffer, cells.byteOffset, cells.byteLength);
        const cell = decodeVipBgMapCell(view.getUint16(selected * 2, true));
        const address = vipBgMapAddress(this.segment) + selected * 2;

        const characters = new VipCharacters(this.charSegments);
        const palettes = this.palettes(registers);
        const preview = this.rasterisePreview(characters, palettes, cell);

        return <>
            {this.renderSegmentTable()}
            <div className='ves-emulator-vip-inspector'>
                <div className='ves-emulator-vip-inspector-sidebar'>
                    <fieldset className='ves-emulator-vip-inspector-group'>
                        <legend>{nls.localize('vuengine/emulator/panels/bgmaps/selected', 'Selected')}</legend>
                        <div className='ves-emulator-vip-inspector-field'>
                            <label>{nls.localize('vuengine/emulator/panels/bgmaps/map', 'Map')}</label>
                            <input
                                type='number'
                                className='theia-input'
                                min={0}
                                max={VIP_BGMAP_COUNT - 1}
                                value={this.segment}
                                onChange={e => this.setSegment(parseInt(e.target.value, 10))}
                            />
                        </div>
                        <div className='ves-emulator-vip-inspector-field'>
                            <label>{nls.localize('vuengine/emulator/panels/bgmaps/cell', 'Cell')}</label>
                            <input
                                type='number'
                                className='theia-input'
                                min={0}
                                max={VIP_BGMAP_CELLS * VIP_BGMAP_CELLS - 1}
                                value={selected}
                                onChange={e => this.selectCell(parseInt(e.target.value, 10))}
                            />
                        </div>
                        <div className='ves-emulator-vip-inspector-field'>
                            <label>{nls.localize('vuengine/emulator/panels/bgmaps/address', 'Address')}</label>
                            <input className='theia-input' readOnly value={hex(address, 8)} />
                        </div>
                    </fieldset>

                    <fieldset className='ves-emulator-vip-inspector-group'>
                        <legend>{nls.localize('vuengine/emulator/panels/bgmaps/character', 'Character')}</legend>
                        <VipCanvas image={preview} zoom={PREVIEW_ZOOM} />
                    </fieldset>

                    <fieldset className='ves-emulator-vip-inspector-group'>
                        <legend>{nls.localize('vuengine/emulator/panels/bgmaps/cell', 'Cell')}</legend>
                        <label>
                            {nls.localize('vuengine/emulator/panels/bgmaps/character', 'Character')}
                            <input
                                type='number'
                                className='theia-input'
                                min={0}
                                max={VIP_CHAR_COUNT - 1}
                                value={cell.char}
                                onChange={e => {
                                    const char = parseInt(e.target.value, 10);
                                    if (!Number.isNaN(char)) {
                                        this.writeCell({ char: Math.min(VIP_CHAR_COUNT - 1, Math.max(0, char)) });
                                    }
                                }}
                            />
                        </label>
                        <label>
                            {nls.localize('vuengine/emulator/panels/bgmaps/palette', 'Palette')}
                            <select
                                className='theia-select'
                                value={cell.palette}
                                onChange={e => this.writeCell({ palette: parseInt(e.target.value, 10) })}
                            >
                                {VIP_BGMAP_PALETTES.map((unused, index) => (
                                    <option key={index} value={index}>BG {index}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <input
                                type='checkbox'
                                checked={cell.hFlip}
                                onChange={e => this.writeCell({ hFlip: e.target.checked })}
                            />
                            {nls.localize('vuengine/emulator/panels/bgmaps/horizontalFlip', 'Horizontal Flip')}
                        </label>
                        <label>
                            <input
                                type='checkbox'
                                checked={cell.vFlip}
                                onChange={e => this.writeCell({ vFlip: e.target.checked })}
                            />
                            {nls.localize('vuengine/emulator/panels/bgmaps/verticalFlip', 'Vertical Flip')}
                        </label>
                    </fieldset>

                    <fieldset className='ves-emulator-vip-inspector-group'>
                        <legend>{nls.localize('vuengine/emulator/panels/bgmaps/display', 'Display')}</legend>
                        <label>
                            {nls.localize('vuengine/emulator/panels/bgmaps/scale', 'Scale')}
                            <input
                                type='range'
                                min={1}
                                max={8}
                                value={this.zoom}
                                onChange={e => { this.zoom = parseInt(e.target.value, 10); this.update(); }}
                            />
                            <span className='hint'>{this.zoom}</span>
                        </label>
                        <label>
                            <input
                                type='checkbox'
                                checked={this.showGrid}
                                onChange={e => { this.showGrid = e.target.checked; this.update(); }}
                            />
                            {nls.localize('vuengine/emulator/panels/bgmaps/showGrid', 'Show grid')}
                        </label>
                        <label>
                            <input
                                type='checkbox'
                                checked={this.showGenericPalette}
                                onChange={e => this.setShowGenericPalette(e.target.checked)}
                            />
                            {nls.localize('vuengine/emulator/panels/bgmaps/genericPalette', 'Generic palette')}
                        </label>
                    </fieldset>
                </div>
                <div className='ves-emulator-vip-inspector-main'>
                    <VipCanvas
                        image={this.image}
                        zoom={this.zoom}
                        cellSize={VIP_CHAR_SIZE}
                        showGrid={this.showGrid}
                        selected={{ x: selected % VIP_BGMAP_CELLS, y: Math.floor(selected / VIP_BGMAP_CELLS) }}
                        onPick={(x, y) => {
                            const picked = Math.floor(y / VIP_CHAR_SIZE) * VIP_BGMAP_CELLS + Math.floor(x / VIP_CHAR_SIZE);
                            this.selectCell(picked);
                        }}
                    />
                </div>
            </div>
        </>;
    }
}
