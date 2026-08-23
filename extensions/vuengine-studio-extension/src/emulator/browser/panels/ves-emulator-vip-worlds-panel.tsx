import { Plug, Warning } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import RadioSelect from '../../../editors/browser/components/Common/Base/RadioSelect';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { VesVbSim } from '../core/ves-vb-core';
import { EmulatorPanelType, hex, VesEmulatorDebugSource, VesEmulatorPanel } from './ves-emulator-panel';
import { VipCanvas } from './ves-emulator-vip-canvas';
import { control, field, numberInput } from './ves-emulator-vip-detail';
import {
    decodeVipWorld,
    drawVipWorld,
    encodeVipWorldHead,
    sameVipBytes,
    VIP_BGMAP_BYTES,
    VIP_BGMAP_COUNT,
    VIP_BGMAP_PALETTES,
    VIP_CHAR_SEGMENT_BYTES,
    VIP_CHAR_SEGMENTS,
    VIP_FRAME_BUFFER_HEIGHT,
    VIP_FRAME_BUFFER_WIDTH,
    VIP_GENERIC_PALETTE_INTENSITIES,
    VIP_GRAPHICS_POLL_HZ,
    VIP_HBIAS_ENTRY_BYTES,
    VIP_REGISTER_BASE,
    VIP_REGISTER_BLOCK_BYTES,
    VIP_WORLD_BASE,
    VIP_WORLD_BLOCK_BYTES,
    VIP_WORLD_BYTES,
    VIP_WORLD_COUNT,
    VIP_WORLD_MODE_NAMES,
    vipBgMapAddress,
    VipCharacters,
    vipCharSegmentAddress,
    VipEye,
    vipHBiasRow,
    vipIntensitiesForRegister,
    VipIntensityWatcher,
    vipParamRows,
    vipParamTableAddress,
    vipParamTableBytes,
    VipWorld,
    vipWorldAddress,
    vipWorldExtents,
    VipWorldField,
    VipWorldMap,
    VipWorldMode,
} from './ves-emulator-vip-memory';

/** The preview is screen-sized, so it needs less zoom than a tile atlas does. */
const MAX_PREVIEW_ZOOM = 4;

/** A halfword read as signed, which is how the position fields are decoded. */
const SIGNED_MIN = -0x8000;
const SIGNED_MAX = 0x7fff;
/** ...and as unsigned, which is how the size and param fields are. */
const UNSIGNED_MAX = 0xffff;

/**
 * The param register's low four bits are masked off when the engine writes it
 * (`WORLD_PARAM` in `world.h`), so the table it points at moves 32 bytes at a
 * time.
 */
const PARAM_STEP = 0x10;

/**
 * The VIP's 32 world attribute entries.
 *
 * The table decodes straight out of world attribute memory, and the detail
 * view below it inspects — and edits — one world at a time, alongside a
 * preview of what that world alone puts on screen. Rendering that preview is
 * what makes this panel read character and BGMap memory too; the table on its
 * own needs neither.
 */
export class VesEmulatorVipWorldsPanel extends VesEmulatorPanel {

    protected error?: string;
    protected registers?: DataView;
    protected worldBytes?: Uint8Array;
    protected charSegments: (Uint8Array | undefined)[] = [];
    /** Indexed by absolute BGMap segment; only the ones the world spans are read. */
    protected bgMapSegments: (Uint8Array | undefined)[] = [];
    /** The selected world's H-bias or Affine table, when it has one. */
    protected paramBytes?: Uint8Array;

    /**
     * The world the detail view below the table describes. There is always
     * one: drawing starts at world 31, so that is where the panel opens.
     */
    protected selected = VIP_WORLD_COUNT - 1;
    protected hbiasRow = 0;
    protected eye: VipEye = 'left';
    protected zoom = 1;
    protected showGenericPalette = true;
    protected showExtents = true;

    protected image?: ImageData;
    protected dirty = true;
    protected readonly intensityWatcher = new VipIntensityWatcher();

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.VIP_WORLDS, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/worlds', 'Worlds');
        // Stacks the table above the detail view, each scrolling on its own,
        // which is why render returns the two as siblings rather than
        // wrapping them: the widget's own node is the column they sit in.
        this.addClass('ves-emulator-vip-split');
    }

    protected pollHz(): number {
        return VIP_GRAPHICS_POLL_HZ;
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.registers = undefined;
            this.worldBytes = undefined;
            this.charSegments = [];
            this.bgMapSegments = [];
            this.paramBytes = undefined;
            this.image = undefined;
            this.update();
            return;
        }

        try {
            this.registers = new DataView(await sim.readMemory(VIP_REGISTER_BASE, VIP_REGISTER_BLOCK_BYTES));

            const worldBytes = new Uint8Array(await sim.readMemory(VIP_WORLD_BASE, VIP_WORLD_BLOCK_BYTES));
            if (!sameVipBytes(worldBytes, this.worldBytes)) {
                this.worldBytes = worldBytes;
                this.dirty = true;
            }

            // Which memory the preview needs follows from the world that was
            // just read, so this is a second round of reads rather than part
            // of the first.
            const world = this.world();
            if (world) {
                await this.readSources(sim, world);
            }

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

    /** Read the character, BGMap and param memory the selected world draws from. */
    protected async readSources(sim: VesVbSim, world: VipWorld): Promise<void> {
        if (world.mode === VipWorldMode.OBJECT) {
            // An OBJECT world draws from OAM under the SPT registers rather
            // than from a map of its own, so none of this applies to it.
            this.charSegments = [];
            this.bgMapSegments = [];
            this.paramBytes = undefined;
            return;
        }

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

        const needed = VesEmulatorVipWorldsPanel.worldSegments(world);
        const maps = await Promise.all(needed.map(segment => sim.readMemory(vipBgMapAddress(segment), VIP_BGMAP_BYTES)));
        const bgMapSegments: (Uint8Array | undefined)[] = [];
        needed.forEach((segment, index) => {
            const bytes = new Uint8Array(maps[index]);
            if (!sameVipBytes(bytes, this.bgMapSegments[segment])) {
                this.dirty = true;
            }
            bgMapSegments[segment] = bytes;
        });
        this.bgMapSegments = bgMapSegments;

        const length = vipParamTableBytes(world);
        if (length === 0) {
            this.paramBytes = undefined;
            return;
        }
        const params = new Uint8Array(await sim.readMemory(vipParamTableAddress(world.param), length));
        if (!sameVipBytes(params, this.paramBytes)) {
            this.paramBytes = params;
            this.dirty = true;
        }
    }

    /**
     * The BGMap segments a world spans, in the order it lays them out: scx
     * across then scy down, from its base segment.
     *
     * Segments past the last real one are dropped rather than read — 14 and 15
     * are where world attribute and object memory live, not map data.
     */
    protected static worldSegments(world: VipWorld): number[] {
        const count = Math.min(world.scx * world.scy, VIP_BGMAP_COUNT);
        const segments = new Set<number>();
        for (let index = 0; index < count; index++) {
            const segment = (world.bgMap + index) & 0x0f;
            if (segment < VIP_BGMAP_COUNT) {
                segments.add(segment);
            }
        }
        return [...segments];
    }

    /** The selected world, decoded out of the last read of world memory. */
    protected world(): VipWorld | undefined {
        const bytes = this.worldBytes;
        if (!bytes) {
            return undefined;
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        return decodeVipWorld(view, this.selected, this.selected * VIP_WORLD_BYTES);
    }

    /** The param table, as a view, or undefined when the world has none read. */
    protected params(): DataView | undefined {
        const bytes = this.paramBytes;
        return bytes ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength) : undefined;
    }

    protected selectWorld(index: number): void {
        if (Number.isNaN(index)) {
            return;
        }
        this.selected = Math.min(VIP_WORLD_COUNT - 1, Math.max(0, index));
        this.dirty = true;
        this.refresh();
    }

    protected setShowGenericPalette(value: boolean): void {
        this.showGenericPalette = value;
        this.dirty = true;
        this.refresh();
    }

    protected setEye(eye: VipEye): void {
        this.eye = eye;
        this.dirty = true;
        this.refresh();
    }

    /** The four BGMap palettes' shading, or the same generic ramp four times. */
    protected palettes(registers: DataView): number[][] {
        return this.showGenericPalette
            ? [0, 1, 2, 3].map(() => VIP_GENERIC_PALETTE_INTENSITIES)
            : VIP_BGMAP_PALETTES.map(register => vipIntensitiesForRegister(registers, register));
    }

    // --- Writing ------------------------------------------------------------

    /** Write one halfword of VRAM and pick the change straight back up. */
    protected async writeHalfword(address: number, value: number): Promise<void> {
        const sim = this.source.sim;
        if (!sim || Number.isNaN(value)) {
            return;
        }
        const buffer = new ArrayBuffer(2);
        new DataView(buffer).setUint16(0, value & 0xffff, true);
        await sim.writeMemory(address, buffer);
        this.dirty = true;
        await this.refresh();
    }

    /** One field of the selected world's attribute entry. */
    protected writeField(worldField: VipWorldField, value: number): void {
        this.writeHalfword(vipWorldAddress(this.selected) + worldField * 2, value);
    }

    /**
     * Everything the head halfword packs together, which has to be rewritten
     * whole: the mode, the map size and base, and the four flags.
     */
    protected writeHead(patch: Partial<VipWorld>): void {
        const world = this.world();
        if (world) {
            this.writeField(VipWorldField.HEAD, encodeVipWorldHead({ ...world, ...patch }));
        }
    }

    /** One eye's shift on one row of an H-bias world's param table. */
    protected writeHBias(world: VipWorld, row: number, eye: VipEye, value: number): void {
        const address = vipParamTableAddress(world.param) + row * VIP_HBIAS_ENTRY_BYTES + (eye === 'left' ? 0 : 2);
        this.writeHalfword(address, value);
    }

    // --- Rendering ----------------------------------------------------------

    /**
     * A screen-sized bitmap of what the selected world alone draws.
     *
     * The area the world does not cover stays opaque black — the Frame Buffers
     * panel is the view that shows worlds composited into a finished image.
     */
    protected rasterise(registers: DataView): ImageData {
        const width = VIP_FRAME_BUFFER_WIDTH;
        const height = VIP_FRAME_BUFFER_HEIGHT;
        const pixels = new Uint8ClampedArray(width * height * 4);
        for (let offset = 3; offset < pixels.length; offset += 4) {
            pixels[offset] = 255;
        }

        const world = this.world();
        if (world) {
            drawVipWorld(
                pixels,
                width,
                height,
                world,
                new VipWorldMap(world, this.bgMapSegments, new VipCharacters(this.charSegments)),
                this.palettes(registers),
                this.eye,
                this.params()
            );
        }
        return new ImageData(pixels, width, height);
    }

    protected render(): React.ReactNode {
        if (this.error) {
            return <EmptyContainer
                title={this.error ?? nls.localizeByDefault('Error')}
                icon={<Warning size={32} />}
            />;
        }
        const bytes = this.worldBytes;
        if (!bytes) {
            return <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />;
        }

        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        // Drawing runs from world 31 downwards, so that is the order to read
        // them in: the first row is the first world the VIP considers.
        const worlds = Array.from({ length: VIP_WORLD_COUNT }, (unused, index) =>
            decodeVipWorld(view, VIP_WORLD_COUNT - 1 - index, (VIP_WORLD_COUNT - 1 - index) * VIP_WORLD_BYTES)
        );

        return <>
            <div className='ves-emulator-vip-split-table'>
                <fieldset className='ves-emulator-vip-inspector-group'>
                    <legend>
                        Worlds
                    </legend>
                    <table className='ves-emulator-vip-table ves-emulator-vip-selectable-table'>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th title={nls.localize('vuengine/emulator/panels/worlds/headHint', 'Header register')}>Head</th>
                                <th>Eyes</th>
                                <th>Mode</th>
                                <th title={nls.localize('vuengine/emulator/panels/worlds/bgMapHint', 'Base BGMap segment')}>Map</th>
                                <th title={nls.localize('vuengine/emulator/panels/worlds/scHint', 'Segments across and down')}>Sc</th>
                                <th>GX</th>
                                <th>GP</th>
                                <th>GY</th>
                                <th>MX</th>
                                <th>MP</th>
                                <th>MY</th>
                                <th title={nls.localize(
                                    'vuengine/emulator/panels/worlds/sizeHint', 'Register value, which is size minus one'
                                )}>W</th>
                                <th title={nls.localize(
                                    'vuengine/emulator/panels/worlds/sizeHint', 'Register value, which is size minus one'
                                )}>H</th>
                                <th>Flags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {worlds.map(world => (
                                <tr
                                    key={world.index}
                                    className={`${world.lon || world.ron ? '' : 'inactive'}${
                                        world.index === this.selected ? ' selected' : ''}`}
                                    title={hex(vipWorldAddress(world.index), 8)}
                                    onClick={() => this.selectWorld(world.index)}
                                >
                                    <td>{world.index}</td>
                                    <td><code>{hex(world.head, 4)}</code></td>
                                    <td>{`${world.lon ? 'L' : '-'}${world.ron ? 'R' : '-'}`}</td>
                                    <td>{VIP_WORLD_MODE_NAMES[world.mode]}</td>
                                    <td>{world.bgMap}</td>
                                    <td>{world.scx}&times;{world.scy}</td>
                                    <td>{world.gx}</td>
                                    <td>{world.gp}</td>
                                    <td>{world.gy}</td>
                                    <td>{world.mx}</td>
                                    <td>{world.mp}</td>
                                    <td>{world.my}</td>
                                    <td>{world.w}</td>
                                    <td>{world.h}</td>
                                    <td>{`${world.overplane ? 'OVR ' : ''}${world.end ? 'END' : ''}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </fieldset>
            </div>
            {this.renderDetail(worlds[VIP_WORLD_COUNT - 1 - this.selected])}
        </>;
    }

    /**
     * Everything world attribute memory holds for the selected world, the
     * halfwords the table has no column for included, beside a preview of
     * what it draws.
     */
    protected renderDetail(world: VipWorld): React.ReactNode {
        return <div className='ves-emulator-vip-detail'>
            <div className='ves-emulator-vip-detail-groups'>
                {this.renderWorldGroup(world)}
                {this.renderPropertiesGroup(world)}
                {world.mode === VipWorldMode.HBIAS && this.renderHBiasGroup(world)}
                {this.renderDisplayGroup()}
            </div>
            {this.renderPreview(world)}
        </div>;
    }

    protected renderWorldGroup(world: VipWorld): React.ReactNode {
        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>{nls.localize('vuengine/emulator/panels/worlds/world', 'World')}</legend>
            <div className='ves-emulator-vip-detail-fields'>
                {control(
                    nls.localize('vuengine/emulator/panels/worlds/index', 'Index'),
                    numberInput(world.index, 0, VIP_WORLD_COUNT - 1, value => this.selectWorld(value))
                )}
                {field(
                    nls.localize('vuengine/emulator/panels/worlds/address', 'Address'),
                    hex(vipWorldAddress(world.index), 8)
                )}
                {field(
                    'Head',
                    hex(world.head, 4),
                    nls.localize('vuengine/emulator/panels/worlds/headHint', 'Header register')
                )}
            </div>
        </fieldset>;
    }

    protected renderPropertiesGroup(world: VipWorld): React.ReactNode {
        const sizeHint = nls.localize('vuengine/emulator/panels/worlds/sizeHint', 'Register value, which is size minus one');
        const scHint = nls.localize('vuengine/emulator/panels/worlds/scHint', 'Segments across and down');
        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>{nls.localize('vuengine/emulator/panels/worlds/properties', 'Properties')}</legend>
            <div className='ves-emulator-vip-detail-fields'>
                {control('Mode', <select
                    className='theia-select'
                    value={world.mode}
                    onChange={e => this.writeHead({ mode: parseInt(e.target.value, 10) as VipWorldMode })}
                >
                    {Object.entries(VIP_WORLD_MODE_NAMES).map(([mode, name]) => (
                        <option key={mode} value={mode}>{name}</option>
                    ))}
                </select>)}
                {control(
                    nls.localize('vuengine/emulator/panels/worlds/map', 'Map'),
                    numberInput(world.bgMap, 0, 0x0f, value => this.writeHead({ bgMap: value })),
                    nls.localize('vuengine/emulator/panels/worlds/bgMapHint', 'Base BGMap segment')
                )}
                {control('Sc X', this.segmentCountInput(world.scx, value => this.writeHead({ scx: value })), scHint)}
                {control('Sc Y', this.segmentCountInput(world.scy, value => this.writeHead({ scy: value })), scHint)}
                {control('GX', numberInput(world.gx, SIGNED_MIN, SIGNED_MAX, v => this.writeField(VipWorldField.GX, v)))}
                {control('GP', numberInput(world.gp, SIGNED_MIN, SIGNED_MAX, v => this.writeField(VipWorldField.GP, v)))}
                {control('GY', numberInput(world.gy, SIGNED_MIN, SIGNED_MAX, v => this.writeField(VipWorldField.GY, v)))}
                {control('MX', numberInput(world.mx, SIGNED_MIN, SIGNED_MAX, v => this.writeField(VipWorldField.MX, v)))}
                {control('MP', numberInput(world.mp, SIGNED_MIN, SIGNED_MAX, v => this.writeField(VipWorldField.MP, v)))}
                {control('MY', numberInput(world.my, SIGNED_MIN, SIGNED_MAX, v => this.writeField(VipWorldField.MY, v)))}
                {control('W', numberInput(world.w, 0, UNSIGNED_MAX, v => this.writeField(VipWorldField.W, v)), sizeHint)}
                {control('H', numberInput(world.h, 0, UNSIGNED_MAX, v => this.writeField(VipWorldField.H, v)), sizeHint)}
                {control(
                    nls.localize('vuengine/emulator/panels/worlds/param', 'Param'),
                    numberInput(world.param, 0, UNSIGNED_MAX, v => this.writeField(VipWorldField.PARAM, v), PARAM_STEP),
                    nls.localize('vuengine/emulator/panels/worlds/paramHint', 'Register value, which is a halfword offset into BGMap memory')
                )}
                {field(
                    nls.localize('vuengine/emulator/panels/worlds/paramAddress', 'Param address'),
                    hex(vipParamTableAddress(world.param), 8),
                    nls.localize('vuengine/emulator/panels/worlds/paramAddressHint', 'Where the H-bias or Affine table the param register points at starts')
                )}
                {control(
                    nls.localize('vuengine/emulator/panels/worlds/overplane', 'Overplane'),
                    numberInput(world.overplaneCell, 0, UNSIGNED_MAX, v => this.writeField(VipWorldField.OVERPLANE_CELL, v)),
                    nls.localize('vuengine/emulator/panels/worlds/overplaneHint', 'The cell drawn outside the map')
                )}
            </div>
            <div className='ves-emulator-vip-detail-flags'>
                <label>
                    <input type='checkbox' checked={world.lon} onChange={e => this.writeHead({ lon: e.target.checked })} />
                    {nls.localize('vuengine/emulator/panels/worlds/left', 'Left')}
                </label>
                <label>
                    <input type='checkbox' checked={world.ron} onChange={e => this.writeHead({ ron: e.target.checked })} />
                    {nls.localize('vuengine/emulator/panels/worlds/right', 'Right')}
                </label>
                <label title={nls.localize('vuengine/emulator/panels/worlds/endHint', 'Drawing stops at this world')}>
                    <input type='checkbox' checked={world.end} onChange={e => this.writeHead({ end: e.target.checked })} />
                    {nls.localize('vuengine/emulator/panels/worlds/end', 'End')}
                </label>
                <label title={nls.localize(
                    'vuengine/emulator/panels/worlds/overplaneFlagHint',
                    'Draw the overplane outside the map instead of repeating it'
                )}>
                    <input
                        type='checkbox'
                        checked={world.overplane}
                        onChange={e => this.writeHead({ overplane: e.target.checked })}
                    />
                    {nls.localize('vuengine/emulator/panels/worlds/overplane', 'Overplane')}
                </label>
            </div>
        </fieldset>;
    }

    /** A picker for one of the four map sizes a world can have per axis. */
    protected segmentCountInput(value: number, commit: (value: number) => void): React.JSX.Element {
        return <select className='theia-select' value={value} onChange={e => commit(parseInt(e.target.value, 10))}>
            {[1, 2, 4, 8].map(count => <option key={count} value={count}>{count}</option>)}
        </select>;
    }

    protected renderHBiasGroup(world: VipWorld): React.ReactNode {
        const rows = vipParamRows(world);
        const row = Math.min(this.hbiasRow, Math.max(0, rows - 1));
        const entry = vipHBiasRow(this.params(), row);
        const address = vipParamTableAddress(world.param) + row * VIP_HBIAS_ENTRY_BYTES;
        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>{nls.localize('vuengine/emulator/panels/worlds/hbias', 'H-bias')}</legend>
            <div className='ves-emulator-vip-detail-fields'>
                {control(
                    nls.localize('vuengine/emulator/panels/worlds/index', 'Index'),
                    numberInput(row, 0, Math.max(0, rows - 1), value => { this.hbiasRow = value; this.update(); }),
                    nls.localize('vuengine/emulator/panels/worlds/hbiasRowHint', 'Which row of the table to show; there is one per row of the world')
                )}
                {field(nls.localize('vuengine/emulator/panels/worlds/address', 'Address'), hex(address, 8))}
                {control(
                    nls.localize('vuengine/emulator/panels/worlds/left', 'Left'),
                    numberInput(entry?.left ?? 0, SIGNED_MIN, SIGNED_MAX, value => this.writeHBias(world, row, 'left', value))
                )}
                {control(
                    nls.localize('vuengine/emulator/panels/worlds/right', 'Right'),
                    numberInput(entry?.right ?? 0, SIGNED_MIN, SIGNED_MAX, value => this.writeHBias(world, row, 'right', value))
                )}
            </div>
        </fieldset>;
    }

    protected renderDisplayGroup(): React.ReactNode {
        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>{nls.localize('vuengine/emulator/panels/worlds/display', 'Display')}</legend>
            <label>
                {nls.localize('vuengine/emulator/panels/worlds/scale', 'Scale')}
                <input
                    type='range'
                    min={1}
                    max={MAX_PREVIEW_ZOOM}
                    value={this.zoom}
                    onChange={e => { this.zoom = parseInt(e.target.value, 10); this.update(); }}
                />
            </label>
            <label>
                {nls.localize('vuengine/emulator/panels/worlds/eye', 'Eye')}
                <RadioSelect
                    options={[{
                        value: 'left',
                        label: nls.localize('vuengine/emulator/panels/worlds/left', 'Left'),
                    }, {
                        value: 'right',
                        label: nls.localize('vuengine/emulator/panels/worlds/right', 'Right'),
                    }]}
                    defaultValue={this.eye}
                    onChange={options => this.setEye(options[0].value as VipEye)}
                />
            </label>
            <label>
                <input
                    type='checkbox'
                    checked={this.showGenericPalette}
                    onChange={e => this.setShowGenericPalette(e.target.checked)}
                />
                {nls.localize('vuengine/emulator/panels/worlds/genericPalette', 'Generic palette')}
            </label>
            <label>
                <input
                    type='checkbox'
                    checked={this.showExtents}
                    onChange={e => { this.showExtents = e.target.checked; this.update(); }}
                />
                {nls.localize('vuengine/emulator/panels/worlds/showExtents', 'Show extents')}
            </label>
        </fieldset>;
    }

    protected renderPreview(world: VipWorld): React.ReactNode {
        if (!this.image) {
            return undefined;
        }
        return <div className='ves-emulator-vip-detail-preview'>
            <VipCanvas
                image={this.image}
                zoom={this.zoom}
                extents={this.showExtents ? vipWorldExtents(world, this.eye) : undefined}
            />
            {world.mode === VipWorldMode.OBJECT &&
                <div className='ves-emulator-vip-footer'>
                    {nls.localize(
                        'vuengine/emulator/panels/worlds/objectWorld',
                        'An Object world draws objects from OAM, which the Objects panel lists.'
                    )}
                </div>
            }
        </div>;
    }
}
