import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import { hex, VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';
import {
    VIP_BGMAP_PALETTES,
    VIP_OBJECT_PALETTES,
    VIP_REGISTER_BASE,
    VIP_REGISTER_BLOCK_BYTES,
    vipBrightnessLevelsFromRegisters,
    vipPaletteIntensities,
    VipRegister,
} from './ves-emulator-vip-memory';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { Plug, Warning } from '@phosphor-icons/react';

/**
 * The VIP's brightness and palette registers, shown as swatches.
 *
 * A palette register maps each of a pixel's four possible values to one of
 * the three brightness levels (or black); this shows exactly that mapping
 * rather than the raw register value, which alone is not very readable.
 */
export class VesEmulatorVipPalettesPanel extends VesEmulatorPanel {

    protected registers?: DataView;
    protected error?: string;

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.VIP_PALETTES, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/palettes', 'Palettes');
        this.title.caption = nls.localize(
            'vuengine/emulator/panels/palettesCaption', 'Brightness and palette registers'
        );
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.registers = undefined;
            this.update();
            return;
        }

        try {
            this.registers = new DataView(await sim.readMemory(VIP_REGISTER_BASE, VIP_REGISTER_BLOCK_BYTES));
            this.error = undefined;
        } catch (error) {
            this.error = error instanceof Error ? error.message : String(error);
        }
        this.update();
    }

    protected render(): React.ReactNode {
        if (this.error) {
            return <EmptyContainer
                title={this.error ?? nls.localizeByDefault('Error')}
                icon={<Warning size={32} />}
            />;
        }
        const registers = this.registers;
        if (!registers) {
            return <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />;
        }

        const levels = vipBrightnessLevelsFromRegisters(registers);
        const renderPalette = (name: string, register: VipRegister): React.ReactNode => {
            const value = registers.getUint16(register, true) & 0xff;
            const intensities = vipPaletteIntensities(value, levels);
            return <tr key={name}>
                <th>{name}</th>
                <td><code>{hex(value, 2)}</code></td>
                <td>
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
                </td>
            </tr>;
        };

        return <div className='ves-emulator-vip'>
            <div className='ves-emulator-vip-groups'>
                <div className='ves-emulator-vip-group'>
                    <h4>{nls.localize('vuengine/emulator/panels/vip/bgMapPalettes', 'BGMap palettes')}</h4>
                    <table><tbody>
                        {VIP_BGMAP_PALETTES.map((register, index) => renderPalette(`GPLT${index}`, register))}
                    </tbody></table>
                </div>
                <div className='ves-emulator-vip-group'>
                    <h4>{nls.localize('vuengine/emulator/panels/vip/objectPalettes', 'Object palettes')}</h4>
                    <table><tbody>
                        {VIP_OBJECT_PALETTES.map((register, index) => renderPalette(`JPLT${index}`, register))}
                    </tbody></table>
                </div>
                <div className='ves-emulator-vip-group'>
                    <h4>{nls.localize('vuengine/emulator/panels/vip/brightness', 'Brightness')}</h4>
                    <table><tbody>
                        {[
                            ['BRTA', VipRegister.BRTA],
                            ['BRTB', VipRegister.BRTB],
                            ['BRTC', VipRegister.BRTC],
                        ].map(([name, register]) => (
                            <tr key={name as string}>
                                <th>{name}</th>
                                <td><code>{hex(registers.getUint16(register as number, true) & 0xff, 2)}</code></td>
                            </tr>
                        ))}
                        <tr>
                            <th title={nls.localize(
                                'vuengine/emulator/panels/vip/level3Hint',
                                'The brightest level is the sum of all three registers'
                            )}>
                                {nls.localize('vuengine/emulator/panels/vip/levels', 'Levels')}
                            </th>
                            <td colSpan={2}>
                                <div className='ves-emulator-vip-swatches'>
                                    {levels.map((intensity, index) => (
                                        <span
                                            key={index}
                                            className='ves-emulator-vip-swatch'
                                            style={{ background: `rgb(${intensity}, 0, 0)` }}
                                            title={`${index}: ${intensity}`}
                                        />
                                    ))}
                                </div>
                            </td>
                        </tr>
                    </tbody></table>
                </div>
            </div>
        </div>;
    }
}
