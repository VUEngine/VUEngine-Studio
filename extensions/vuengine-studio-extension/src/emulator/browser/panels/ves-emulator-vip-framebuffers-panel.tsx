import { Plug, Warning } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import RadioSelect from '../../../editors/browser/components/Common/Base/RadioSelect';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { EmulatorPanelType, hex, VesEmulatorDebugSource, VesEmulatorPanel } from './ves-emulator-panel';
import { VipCanvas } from './ves-emulator-vip-canvas';
import {
    sameVipBytes,
    VIP_FRAME_BUFFER_BYTES,
    VIP_FRAME_BUFFER_HEIGHT,
    VIP_FRAME_BUFFER_WIDTH,
    VIP_GENERIC_PALETTE_INTENSITIES,
    VIP_GRAPHICS_POLL_HZ,
    VIP_REGISTER_BASE,
    VIP_REGISTER_BLOCK_BYTES,
    vipBrightnessLevelsFromRegisters,
    VipFrameBuffer,
    vipFrameBufferAddress,
    VipIntensityWatcher,
} from './ves-emulator-vip-memory';

/**
 * The two eyes' frame buffers, overlaid as a red/blue anaglyph — red for the
 * left eye, blue for the right, the same pairing the Anaglyph rendering mode
 * offers as "Red / Blue".
 *
 * A frame buffer's pixels are already resolved brightness levels rather than
 * palette indices (see VipFrameBuffer), so unlike the Characters and BGMaps
 * panels there is no palette to pick — only whether to read the levels from
 * the real BRTA/BRTB/BRTC registers or the flat generic ramp.
 */
export class VesEmulatorVipFrameBuffersPanel extends VesEmulatorPanel {

    protected error?: string;
    protected registers?: DataView;
    protected leftBytes?: Uint8Array;
    protected rightBytes?: Uint8Array;
    protected index = 0;
    protected zoom = 2;
    protected showLeft = true;
    protected showRight = true;
    protected showGenericColors = true;

    protected image?: ImageData;
    protected dirty = true;
    protected readonly intensityWatcher = new VipIntensityWatcher();

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.VIP_FRAME_BUFFERS, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/frameBuffers', 'Frame Buffers');
    }

    protected pollHz(): number {
        return VIP_GRAPHICS_POLL_HZ;
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.registers = undefined;
            this.leftBytes = undefined;
            this.rightBytes = undefined;
            this.image = undefined;
            this.update();
            return;
        }

        try {
            this.registers = new DataView(await sim.readMemory(VIP_REGISTER_BASE, VIP_REGISTER_BLOCK_BYTES));

            const [left, right] = await Promise.all([
                sim.readMemory(vipFrameBufferAddress('left', this.index), VIP_FRAME_BUFFER_BYTES),
                sim.readMemory(vipFrameBufferAddress('right', this.index), VIP_FRAME_BUFFER_BYTES),
            ]);
            const leftBytes = new Uint8Array(left);
            if (!sameVipBytes(leftBytes, this.leftBytes)) {
                this.leftBytes = leftBytes;
                this.dirty = true;
            }
            const rightBytes = new Uint8Array(right);
            if (!sameVipBytes(rightBytes, this.rightBytes)) {
                this.rightBytes = rightBytes;
                this.dirty = true;
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

    protected setIndex(index: number): void {
        if (Number.isNaN(index)) {
            return;
        }
        this.index = Math.min(1, Math.max(0, index));
        this.dirty = true;
        this.refresh();
    }

    protected rasterise(registers: DataView): ImageData {
        const levels = this.showGenericColors
            ? VIP_GENERIC_PALETTE_INTENSITIES
            : vipBrightnessLevelsFromRegisters(registers);
        const left = new VipFrameBuffer(this.leftBytes);
        const right = new VipFrameBuffer(this.rightBytes);
        const width = VIP_FRAME_BUFFER_WIDTH;
        const height = VIP_FRAME_BUFFER_HEIGHT;
        const pixels = new Uint8ClampedArray(width * height * 4);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                pixels[offset] = this.showLeft ? levels[left.pixel(x, y)] : 0;
                pixels[offset + 1] = 0;
                pixels[offset + 2] = this.showRight ? levels[right.pixel(x, y)] : 0;
                pixels[offset + 3] = 255;
            }
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
                {nls.localize('vuengine/emulator/panels/framebuffers/reading', 'Reading VIP memory…')}
            </div>;
        }

        return <div className='ves-emulator-vip-inspector'>
            <div className='ves-emulator-vip-inspector-sidebar'>
                <div className='ves-emulator-vip-inspector-field'>
                    <label>{nls.localize('vuengine/emulator/panels/framebuffers/index', 'Index')}</label>
                    <RadioSelect
                        options={[{
                            value: 0,
                            label: '0',
                        }, {
                            value: 1,
                            label: '1',
                        }]}
                        defaultValue={this.index}
                        onChange={options => this.setIndex(options[0].value as number)}
                        fitSpace
                    />
                </div>
                <div className='ves-emulator-vip-inspector-field'>
                    <label>{nls.localize('vuengine/emulator/panels/framebuffers/left', 'Left')}</label>
                    <input
                        className='theia-input'
                        readOnly
                        value={hex(vipFrameBufferAddress('left', this.index), 8)}
                    />
                </div>
                <div className='ves-emulator-vip-inspector-field'>
                    <label>{nls.localize('vuengine/emulator/panels/framebuffers/right', 'Right')}</label>
                    <input
                        className='theia-input'
                        readOnly
                        value={hex(vipFrameBufferAddress('right', this.index), 8)}
                    />
                </div>

                <fieldset className='ves-emulator-vip-inspector-group'>
                    <legend>{nls.localize('vuengine/emulator/panels/framebuffers/display', 'Display')}</legend>
                    <label>
                        {nls.localize('vuengine/emulator/panels/framebuffers/scale', 'Scale')}
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
                            checked={this.showLeft}
                            onChange={e => { this.showLeft = e.target.checked; this.dirty = true; this.refresh(); }}
                        />
                        {nls.localize('vuengine/emulator/panels/framebuffers/left', 'Left')}
                    </label>
                    <label>
                        <input
                            type='checkbox'
                            checked={this.showRight}
                            onChange={e => { this.showRight = e.target.checked; this.dirty = true; this.refresh(); }}
                        />
                        {nls.localize('vuengine/emulator/panels/framebuffers/right', 'Right')}
                    </label>
                    <label>
                        <input
                            type='checkbox'
                            checked={this.showGenericColors}
                            onChange={e => { this.showGenericColors = e.target.checked; this.dirty = true; this.refresh(); }}
                        />
                        {nls.localize('vuengine/emulator/panels/framebuffers/genericColors', 'Generic colors')}
                    </label>
                </fieldset>
            </div>
            <div className='ves-emulator-vip-inspector-main'>
                <VipCanvas image={this.image} zoom={this.zoom} />
            </div>
        </div>;
    }
}
