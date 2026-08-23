import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import { hex, VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';
import { VipCanvas } from './ves-emulator-vip-canvas';
import {
    decodeVipObject,
    drawVipChar,
    drawVipObject,
    encodeVipObject,
    isVipObjectVisible,
    sameVipBytes,
    VIP_CHAR_COUNT,
    VIP_CHAR_SEGMENT_BYTES,
    VIP_CHAR_SEGMENTS,
    VIP_CHAR_SIZE,
    VIP_FRAME_BUFFER_HEIGHT,
    VIP_FRAME_BUFFER_WIDTH,
    VIP_GENERIC_PALETTE_INTENSITIES,
    VIP_GRAPHICS_POLL_HZ,
    VIP_OAM_BASE,
    VIP_OAM_BLOCK_BYTES,
    VIP_OBJECT_BYTES,
    VIP_OBJECT_COUNT,
    VIP_OBJECT_PALETTES,
    vipCharSegmentAddress,
    VipCharacters,
    VipEye,
    vipIntensitiesForRegister,
    VipIntensityWatcher,
    VIP_REGISTER_BASE,
    VIP_REGISTER_BLOCK_BYTES,
    VipObject,
    vipObjectAddress,
} from './ves-emulator-vip-memory';
import { control, field, numberInput } from './ves-emulator-vip-detail';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { Plug, Warning } from '@phosphor-icons/react';
import { VesVbSim } from '../core/ves-vb-core';

/** OAM has a thousand entries; rendering them all would swamp the panel. */
const MAX_OBJECT_ROWS = 256;

/** Scale of the single-character preview, source pixels to screen pixels. */
const CHARACTER_ZOOM = 16;

/** The screen preview is screen-sized, so it needs less zoom than a character. */
const MAX_PREVIEW_ZOOM = 4;

/** A screen position, read as a signed 10-bit field. */
const JX_MIN = -0x200;
const JX_MAX = 0x1ff;
/** ...and a parallax, as a signed 14-bit one. */
const JP_MIN = -0x2000;
const JP_MAX = 0x1fff;
/** JY is the one that is not signed: eight bits, top to bottom of the screen. */
const JY_MAX = 0xff;

/**
 * The VIP's object attribute memory: up to 1024 sprites.
 *
 * The table filters to only the ones actually drawn by default, since most of
 * OAM in a typical game is unused slots, and the detail view below it inspects
 * — and edits — one object at a time, with its character drawn beside the
 * fields and a preview of where on screen it lands. Rendering those is what
 * makes this panel read character memory too; the table on its own needs only
 * OAM.
 */
export class VesEmulatorVipObjectsPanel extends VesEmulatorPanel {

    protected objectBytes?: Uint8Array;
    protected registers?: DataView;
    protected charSegments: (Uint8Array | undefined)[] = [];
    protected error?: string;
    protected onlyVisible = true;

    /** The object the detail view describes. There is always one. */
    protected selected = 0;
    protected eye: VipEye = 'left';
    protected zoom = 1;
    protected showGenericPalette = true;

    protected image?: ImageData;
    protected dirty = true;
    protected readonly intensityWatcher = new VipIntensityWatcher();

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.VIP_OBJECTS, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/objects', 'Objects');
        // Stacks the table above the detail view, each scrolling on its own,
        // which is why render returns them as siblings rather than wrapping
        // them: the widget's own node is the column they sit in.
        this.addClass('ves-emulator-vip-split');
    }

    protected pollHz(): number {
        return VIP_GRAPHICS_POLL_HZ;
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.objectBytes = undefined;
            this.registers = undefined;
            this.charSegments = [];
            this.image = undefined;
            this.update();
            return;
        }

        try {
            this.registers = new DataView(await sim.readMemory(VIP_REGISTER_BASE, VIP_REGISTER_BLOCK_BYTES));

            const objectBytes = new Uint8Array(await sim.readMemory(VIP_OAM_BASE, VIP_OAM_BLOCK_BYTES));
            if (!sameVipBytes(objectBytes, this.objectBytes)) {
                this.objectBytes = objectBytes;
                this.dirty = true;
            }

            await this.readCharacters(sim);

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

    protected async readCharacters(sim: VesVbSim): Promise<void> {
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
    }

    /** The selected object, decoded out of the last read of OAM. */
    protected object(): VipObject | undefined {
        const bytes = this.objectBytes;
        if (!bytes) {
            return undefined;
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        return decodeVipObject(view, this.selected, this.selected * VIP_OBJECT_BYTES);
    }

    protected selectObject(index: number): void {
        if (Number.isNaN(index)) {
            return;
        }
        this.selected = Math.min(VIP_OBJECT_COUNT - 1, Math.max(0, index));
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

    /** The shading an object palette produces, or the generic ramp instead. */
    protected intensities(registers: DataView, palette: number): number[] {
        return this.showGenericPalette
            ? VIP_GENERIC_PALETTE_INTENSITIES
            : vipIntensitiesForRegister(registers, VIP_OBJECT_PALETTES[palette]);
    }

    /**
     * Patch the selected object and write it back to OAM.
     *
     * The whole eight-byte entry goes back rather than the one halfword that
     * changed: an object is small enough that rewriting it whole is simpler
     * than tracking which field lives where, and the values not being edited
     * are written back exactly as they were read.
     */
    protected async writeObject(patch: Partial<VipObject>): Promise<void> {
        const sim = this.source.sim;
        const object = this.object();
        if (!sim || !object) {
            return;
        }

        const buffer = new ArrayBuffer(VIP_OBJECT_BYTES);
        const view = new DataView(buffer);
        encodeVipObject({ ...object, ...patch }).forEach((halfword, index) => {
            view.setUint16(index * 2, halfword, true);
        });
        await sim.writeMemory(vipObjectAddress(this.selected), buffer);

        this.dirty = true;
        await this.refresh();
    }

    /** A screen-sized bitmap of what the selected object alone draws. */
    protected rasterise(registers: DataView): ImageData {
        const width = VIP_FRAME_BUFFER_WIDTH;
        const height = VIP_FRAME_BUFFER_HEIGHT;
        const pixels = new Uint8ClampedArray(width * height * 4);
        for (let offset = 3; offset < pixels.length; offset += 4) {
            pixels[offset] = 255;
        }

        const object = this.object();
        if (object) {
            drawVipObject(
                pixels,
                width,
                height,
                object,
                new VipCharacters(this.charSegments),
                this.intensities(registers, object.palette),
                this.eye
            );
        }
        return new ImageData(pixels, width, height);
    }

    /** Just the selected object's character, at its own zoom. */
    protected rasteriseCharacter(registers: DataView, object: VipObject): ImageData {
        const pixels = new Uint8ClampedArray(VIP_CHAR_SIZE * VIP_CHAR_SIZE * 4);
        drawVipChar(
            pixels,
            VIP_CHAR_SIZE,
            0,
            0,
            new VipCharacters(this.charSegments),
            object.char,
            this.intensities(registers, object.palette),
            object.hFlip,
            object.vFlip
        );
        return new ImageData(pixels, VIP_CHAR_SIZE, VIP_CHAR_SIZE);
    }

    protected render(): React.ReactNode {
        if (this.error) {
            return <EmptyContainer
                title={this.error ?? nls.localizeByDefault('Error')}
                icon={<Warning size={32} />}
            />;
        }
        const bytes = this.objectBytes;
        const registers = this.registers;
        if (!bytes || !registers) {
            return <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />;
        }

        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const all = Array.from({ length: VIP_OBJECT_COUNT }, (unused, index) =>
            decodeVipObject(view, index, index * VIP_OBJECT_BYTES)
        );
        const matching = this.onlyVisible ? all.filter(isVipObjectVisible) : all;
        const shown = matching.slice(0, MAX_OBJECT_ROWS);

        return <>
            <div className='ves-emulator-panel-toolbar'>
                <label>
                    <input
                        type='checkbox'
                        checked={this.onlyVisible}
                        onChange={e => {
                            this.onlyVisible = e.target.checked;
                            this.update();
                        }}
                    />
                    {nls.localize('vuengine/emulator/panels/objects/onlyVisible', 'Only visible')}
                </label>
            </div>
            <div className='ves-emulator-vip-split-table'>
                <fieldset className='ves-emulator-vip-inspector-group'>
                    <legend>
                        Objects
                    </legend>
                    <table className='ves-emulator-vip-table ves-emulator-vip-selectable-table'>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Eyes</th>
                                <th>JX</th>
                                <th>JP</th>
                                <th>JY</th>
                                <th title={nls.localize('vuengine/emulator/panels/objects/character', 'Character')}>Char</th>
                                <th>Pal</th>
                                <th>Flip</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map(object => (
                                <tr
                                    key={object.index}
                                    className={object.index === this.selected ? 'selected' : ''}
                                    title={hex(vipObjectAddress(object.index), 8)}
                                    onClick={() => this.selectObject(object.index)}
                                >
                                    <td>{object.index}</td>
                                    <td>{`${object.lon ? 'L' : '-'}${object.ron ? 'R' : '-'}`}</td>
                                    <td>{object.jx}</td>
                                    <td>{object.jp}</td>
                                    <td>{object.jy}</td>
                                    <td>{object.char}</td>
                                    <td>JPLT{object.palette}</td>
                                    <td>{`${object.hFlip ? 'H' : '-'}${object.vFlip ? 'V' : '-'}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </fieldset>
            </div>
            <div className='ves-emulator-vip-footer'>
                {matching.length === 0
                    ? nls.localize('vuengine/emulator/panels/objects/noObjects', 'No objects are being drawn.')
                    : shown.length < matching.length
                        ? nls.localize(
                            'vuengine/emulator/panels/objects/objectsTruncated',
                            'Showing {0} of {1} objects.',
                            shown.length,
                            matching.length
                        )
                        : nls.localize('vuengine/emulator/panels/objects/objectCount', '{0} objects.', matching.length)}
            </div>
            {this.renderDetail(all[this.selected], registers)}
        </>;
    }

    /**
     * Everything OAM holds for the selected object, its character drawn beside
     * the fields, and a preview of where on screen it lands.
     */
    protected renderDetail(object: VipObject, registers: DataView): React.ReactNode {
        return <div className='ves-emulator-vip-detail'>
            <div className='ves-emulator-vip-detail-groups'>
                {this.renderObjectGroup(object, registers)}
                {this.renderPropertiesGroup(object)}
                {this.renderDisplayGroup()}
            </div>
            {this.renderPreview()}
        </div>;
    }

    protected renderObjectGroup(object: VipObject, registers: DataView): React.ReactNode {
        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>{nls.localize('vuengine/emulator/panels/objects/object', 'Object')}</legend>
            <div className='ves-emulator-vip-detail-fields'>
                {control(
                    nls.localize('vuengine/emulator/panels/objects/index', 'Index'),
                    numberInput(object.index, 0, VIP_OBJECT_COUNT - 1, value => this.selectObject(value))
                )}
                {field(
                    nls.localize('vuengine/emulator/panels/objects/address', 'Address'),
                    hex(vipObjectAddress(object.index), 8)
                )}
            </div>
            <VipCanvas image={this.rasteriseCharacter(registers, object)} zoom={CHARACTER_ZOOM} />
        </fieldset>;
    }

    protected renderPropertiesGroup(object: VipObject): React.ReactNode {
        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>{nls.localize('vuengine/emulator/panels/objects/properties', 'Properties')}</legend>
            <div className='ves-emulator-vip-detail-fields'>
                {control(
                    nls.localize('vuengine/emulator/panels/objects/character', 'Character'),
                    numberInput(object.char, 0, VIP_CHAR_COUNT - 1, value => this.writeObject({ char: value }))
                )}
                {control(
                    nls.localize('vuengine/emulator/panels/objects/palette', 'Palette'),
                    <select
                        className='theia-select'
                        value={object.palette}
                        onChange={e => this.writeObject({ palette: parseInt(e.target.value, 10) })}
                    >
                        {VIP_OBJECT_PALETTES.map((unused, index) => (
                            <option key={index} value={index}>JPLT{index}</option>
                        ))}
                    </select>
                )}
                {control('JX', numberInput(object.jx, JX_MIN, JX_MAX, value => this.writeObject({ jx: value })))}
                {control('JY', numberInput(object.jy, 0, JY_MAX, value => this.writeObject({ jy: value })))}
                {control('JP', numberInput(object.jp, JP_MIN, JP_MAX, value => this.writeObject({ jp: value })))}
            </div>
            <div className='ves-emulator-vip-detail-flags'>
                <label>
                    <input
                        type='checkbox'
                        checked={object.hFlip}
                        onChange={e => this.writeObject({ hFlip: e.target.checked })}
                    />
                    {nls.localize('vuengine/emulator/panels/objects/hFlip', 'H-flip')}
                </label>
                <label>
                    <input
                        type='checkbox'
                        checked={object.vFlip}
                        onChange={e => this.writeObject({ vFlip: e.target.checked })}
                    />
                    {nls.localize('vuengine/emulator/panels/objects/vFlip', 'V-flip')}
                </label>
                <label>
                    <input
                        type='checkbox'
                        checked={object.lon}
                        onChange={e => this.writeObject({ lon: e.target.checked })}
                    />
                    {nls.localize('vuengine/emulator/panels/objects/left', 'Left')}
                </label>
                <label>
                    <input
                        type='checkbox'
                        checked={object.ron}
                        onChange={e => this.writeObject({ ron: e.target.checked })}
                    />
                    {nls.localize('vuengine/emulator/panels/objects/right', 'Right')}
                </label>
            </div>
        </fieldset>;
    }

    protected renderDisplayGroup(): React.ReactNode {
        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>{nls.localize('vuengine/emulator/panels/objects/display', 'Display')}</legend>
            <label>
                {nls.localize('vuengine/emulator/panels/objects/scale', 'Scale')}
                <input
                    type='range'
                    min={1}
                    max={MAX_PREVIEW_ZOOM}
                    value={this.zoom}
                    onChange={e => { this.zoom = parseInt(e.target.value, 10); this.update(); }}
                />
                <span className='hint'>{this.zoom}</span>
            </label>
            <label>
                {nls.localize('vuengine/emulator/panels/objects/eye', 'Eye')}
                <select className='theia-select' value={this.eye} onChange={e => this.setEye(e.target.value as VipEye)}>
                    <option value='left'>{nls.localize('vuengine/emulator/panels/objects/left', 'Left')}</option>
                    <option value='right'>{nls.localize('vuengine/emulator/panels/objects/right', 'Right')}</option>
                </select>
            </label>
            <label>
                <input
                    type='checkbox'
                    checked={this.showGenericPalette}
                    onChange={e => this.setShowGenericPalette(e.target.checked)}
                />
                {nls.localize('vuengine/emulator/panels/objects/genericPalette', 'Generic palette')}
            </label>
        </fieldset>;
    }

    protected renderPreview(): React.ReactNode {
        return this.image
            ? <div className='ves-emulator-vip-detail-preview'>
                <VipCanvas image={this.image} zoom={this.zoom} />
            </div>
            : undefined;
    }
}
