import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import { hex, VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';
import { VipCanvas } from './ves-emulator-vip-canvas';
import {
    drawVipChar,
    sameVipBytes,
    VIP_BGMAP_PALETTES,
    VIP_CHAR_BYTES,
    VIP_CHAR_COUNT,
    VIP_CHAR_SEGMENT_BYTES,
    VIP_CHAR_SEGMENTS,
    VIP_CHAR_SIZE,
    VIP_CHARS_PER_SEGMENT,
    VIP_GENERIC_PALETTE_INTENSITIES,
    VIP_GRAPHICS_POLL_HZ,
    VIP_OBJECT_PALETTES,
    VIP_REGISTER_BASE,
    VIP_REGISTER_BLOCK_BYTES,
    vipCharMirrorAddress,
    vipCharSegmentAddress,
    VipCharacters,
    vipIntensitiesForRegister,
    VipIntensityWatcher,
    VipRegister,
} from './ves-emulator-vip-memory';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { Plug, Warning } from '@phosphor-icons/react';

const CHARS_PER_ROW_OPTIONS = [8, 16, 32];
const DEFAULT_CHARS_PER_ROW = 16;

/** Scale of the single-character preview, source pixels to screen pixels. */
const PREVIEW_ZOOM = 24;

/** Selects the synthetic ramp (VIP_GENERIC_PALETTE_INTENSITIES) in the Palette dropdown. */
const GENERIC_PALETTE = 'generic';

type PaletteSelection = typeof GENERIC_PALETTE | VipRegister;

/**
 * Every character currently in VRAM, laid out as one atlas, with a sidebar
 * for inspecting one character at a time.
 *
 * Reads all four character segments each refresh and re-rasterises only when
 * either the pixels or the shading (palette and brightness registers)
 * actually changed — a paused emulator therefore costs one read per poll and
 * no drawing at all.
 */
export class VesEmulatorVipCharactersPanel extends VesEmulatorPanel {

    protected error?: string;
    protected registers?: DataView;
    protected charSegments: (Uint8Array | undefined)[] = [];
    protected palette: PaletteSelection = GENERIC_PALETTE;
    protected charsPerRow = DEFAULT_CHARS_PER_ROW;
    protected zoom = 4;
    protected selected = 0;
    protected showGrid = true;

    protected image?: ImageData;
    protected dirty = true;
    protected readonly intensityWatcher = new VipIntensityWatcher();

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.VIP_CHARACTERS, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/characters', 'Characters');
        this.title.caption = nls.localize('vuengine/emulator/panels/charactersCaption', 'Character (tile) memory');
    }

    protected pollHz(): number {
        return VIP_GRAPHICS_POLL_HZ;
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.registers = undefined;
            this.charSegments = [];
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

    protected setPalette(palette: PaletteSelection): void {
        this.palette = palette;
        this.dirty = true;
        this.refresh();
    }

    /** The shading the current Colors selection produces. */
    protected paletteIntensities(registers: DataView): number[] {
        return this.palette === GENERIC_PALETTE
            ? VIP_GENERIC_PALETTE_INTENSITIES
            : vipIntensitiesForRegister(registers, this.palette);
    }

    /** Relay out the atlas, which means rasterising it again. */
    protected setCharsPerRow(charsPerRow: number): void {
        this.charsPerRow = charsPerRow;
        this.dirty = true;
        this.refresh();
    }

    protected selectCharacter(char: number): void {
        if (Number.isNaN(char)) {
            return;
        }
        this.selected = Math.min(VIP_CHAR_COUNT - 1, Math.max(0, char));
        this.update();
    }

    protected rasterise(registers: DataView): ImageData | undefined {
        if (this.charSegments.length === 0) {
            return undefined;
        }
        const characters = new VipCharacters(this.charSegments);
        const intensities = this.paletteIntensities(registers);
        const width = this.charsPerRow * VIP_CHAR_SIZE;
        const height = (VIP_CHAR_COUNT / this.charsPerRow) * VIP_CHAR_SIZE;
        const pixels = new Uint8ClampedArray(width * height * 4);

        for (let char = 0; char < VIP_CHAR_COUNT; char++) {
            drawVipChar(
                pixels,
                width,
                (char % this.charsPerRow) * VIP_CHAR_SIZE,
                Math.floor(char / this.charsPerRow) * VIP_CHAR_SIZE,
                characters,
                char,
                intensities
            );
        }
        return new ImageData(pixels, width, height);
    }

    /** Just the selected character, for the sidebar preview. */
    protected rasterisePreview(characters: VipCharacters, intensities: number[], char: number): ImageData {
        const pixels = new Uint8ClampedArray(VIP_CHAR_SIZE * VIP_CHAR_SIZE * 4);
        drawVipChar(pixels, VIP_CHAR_SIZE, 0, 0, characters, char, intensities);
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
            return <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />;
        }
        if (!this.image) {
            return <div className='ves-emulator-panel-empty'>
                {nls.localize('vuengine/emulator/panels/vip/reading', 'Reading VIP memory…')}
            </div>;
        }

        const registers = this.registers;
        const selected = this.selected;
        const segment = selected >> 9;
        const charInSegment = selected % VIP_CHARS_PER_SEGMENT;
        const address = vipCharSegmentAddress(segment) + charInSegment * VIP_CHAR_BYTES;
        const mirror = vipCharMirrorAddress(segment) + charInSegment * VIP_CHAR_BYTES;

        const characters = new VipCharacters(this.charSegments);
        const intensities = this.paletteIntensities(registers);
        const preview = this.rasterisePreview(characters, intensities, selected);

        return <div className='ves-emulator-vip-inspector'>
            <div className='ves-emulator-vip-inspector-sidebar'>
                <div className='ves-emulator-vip-inspector-field'>
                    <label>{nls.localize('vuengine/emulator/panels/vip/index', 'Index')}</label>
                    <input
                        type='number'
                        className='theia-input'
                        min={0}
                        max={VIP_CHAR_COUNT - 1}
                        value={selected}
                        onChange={e => this.selectCharacter(parseInt(e.target.value, 10))}
                    />
                </div>
                <div className='ves-emulator-vip-inspector-field'>
                    <label>{nls.localize('vuengine/emulator/panels/vip/address', 'Address')}</label>
                    <input className='theia-input' readOnly value={hex(address, 8)} />
                </div>
                <div className='ves-emulator-vip-inspector-field'>
                    <label>{nls.localize('vuengine/emulator/panels/vip/mirror', 'Mirror')}</label>
                    <input className='theia-input' readOnly value={hex(mirror, 8)} />
                </div>

                <VipCanvas image={preview} zoom={PREVIEW_ZOOM} />

                <fieldset className='ves-emulator-vip-inspector-group'>
                    <legend>{nls.localize('vuengine/emulator/panels/vip/colors', 'Colors')}</legend>
                    <label>
                        {nls.localize('vuengine/emulator/panels/vip/palette', 'Palette')}
                        <select
                            className='theia-select'
                            value={this.palette}
                            onChange={e => this.setPalette(
                                e.target.value === GENERIC_PALETTE ? GENERIC_PALETTE : parseInt(e.target.value, 10)
                            )}
                        >
                            <option value={GENERIC_PALETTE}>
                                {nls.localize('vuengine/emulator/panels/vip/genericPalette', 'Generic')}
                            </option>
                            <optgroup label={nls.localize('vuengine/emulator/panels/vip/bgMapPalettes', 'BGMap palettes')}>
                                {VIP_BGMAP_PALETTES.map((register, index) => (
                                    <option key={register} value={register}>GPLT{index}</option>
                                ))}
                            </optgroup>
                            <optgroup label={nls.localize('vuengine/emulator/panels/vip/objectPalettes', 'Object palettes')}>
                                {VIP_OBJECT_PALETTES.map((register, index) => (
                                    <option key={register} value={register}>JPLT{index}</option>
                                ))}
                            </optgroup>
                        </select>
                    </label>
                    <div className='ves-emulator-vip-swatches'>
                        {intensities.map((intensity, index) => (
                            <span
                                key={index}
                                className='ves-emulator-vip-swatch'
                                style={{ background: `rgb(${intensity}, 0, 0)` }}
                                title={`${index}: ${intensity}`}
                            />
                        ))}
                    </div>
                </fieldset>

                <fieldset className='ves-emulator-vip-inspector-group'>
                    <legend>{nls.localize('vuengine/emulator/panels/vip/display', 'Display')}</legend>
                    <label>
                        {nls.localize('vuengine/emulator/panels/vip/columns', 'Columns')}
                        <input
                            type='range'
                            min={0}
                            max={CHARS_PER_ROW_OPTIONS.length - 1}
                            value={CHARS_PER_ROW_OPTIONS.indexOf(this.charsPerRow)}
                            onChange={e => this.setCharsPerRow(CHARS_PER_ROW_OPTIONS[parseInt(e.target.value, 10)])}
                        />
                        <span className='hint'>{this.charsPerRow}</span>
                    </label>
                    <label>
                        {nls.localize('vuengine/emulator/panels/vip/scale', 'Scale')}
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
                        {nls.localize('vuengine/emulator/panels/vip/showGrid', 'Show grid')}
                    </label>
                </fieldset>
            </div>
            <div className='ves-emulator-vip-inspector-main'>
                <VipCanvas
                    image={this.image}
                    zoom={this.zoom}
                    cellSize={VIP_CHAR_SIZE}
                    showGrid={this.showGrid}
                    selected={{ x: selected % this.charsPerRow, y: Math.floor(selected / this.charsPerRow) }}
                    onPick={(x, y) => {
                        const char = Math.floor(y / VIP_CHAR_SIZE) * this.charsPerRow + Math.floor(x / VIP_CHAR_SIZE);
                        this.selectCharacter(char);
                    }}
                />
            </div>
        </div>;
    }
}
