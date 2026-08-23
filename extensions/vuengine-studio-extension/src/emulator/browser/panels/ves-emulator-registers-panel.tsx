import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import { VesVbRegisters } from '../../common/ves-vb-protocol';
import { hex, VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';
import { VIP_REGISTER_BASE, VIP_REGISTER_BLOCK_BYTES, VipRegister } from './ves-emulator-vip-memory';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { Plug, Warning } from '@phosphor-icons/react';

interface Register {
    name: string
    offset: number
    label: string
}

interface RegisterGroup {
    group: string
    registers: Register[]
}

const VIP_REGISTER_GROUPS: RegisterGroup[] = [
    {
        group: 'Interrupts',
        registers: [
            { name: 'INTPND', offset: VipRegister.INTPND, label: 'Pending' },
            { name: 'INTENB', offset: VipRegister.INTENB, label: 'Enable' },
            { name: 'INTCLR', offset: VipRegister.INTCLR, label: 'Clear' },
        ],
    },
    {
        group: 'Display',
        registers: [
            { name: 'DPSTTS', offset: VipRegister.DPSTTS, label: 'Control Read' },
            { name: 'DPCTRL', offset: VipRegister.DPCTRL, label: 'Control Write' },
            { name: 'REST', offset: VipRegister.REST, label: 'Rest' },
            { name: 'FRMCYC', offset: VipRegister.FRMCYC, label: 'Frame Cycle' },
            { name: 'CTA', offset: VipRegister.CTA, label: 'Column Table Start' },
        ],
    },
    {
        group: 'Brightness',
        registers: [
            { name: 'BRTA', offset: VipRegister.BRTA, label: 'Brightness A' },
            { name: 'BRTB', offset: VipRegister.BRTB, label: 'Brightness B' },
            { name: 'BRTC', offset: VipRegister.BRTC, label: 'Brightness C' },
            { name: 'BKCOL', offset: VipRegister.BKCOL, label: 'Background Color' },
        ],
    },
    {
        group: 'Drawing',
        registers: [
            { name: 'XPSTTS', offset: VipRegister.XPSTTS, label: 'Control Read' },
            { name: 'XPCTRL', offset: VipRegister.XPCTRL, label: 'Control Write' },
            { name: 'VER', offset: VipRegister.VER, label: 'VIP Version' },
            { name: 'SPT0', offset: VipRegister.SPT0, label: 'Object Group 0' },
            { name: 'SPT1', offset: VipRegister.SPT1, label: 'Object Group 1' },
            { name: 'SPT2', offset: VipRegister.SPT2, label: 'Object Group 2' },
            { name: 'SPT3', offset: VipRegister.SPT3, label: 'Object Group 3' },
        ],
    },
    {
        group: 'Palettes',
        registers: [
            { name: 'GPLT0', offset: VipRegister.GPLT0, label: 'BGMap 1' },
            { name: 'GPLT1', offset: VipRegister.GPLT1, label: 'BGMap 2' },
            { name: 'GPLT2', offset: VipRegister.GPLT2, label: 'BGMap 3' },
            { name: 'GPLT3', offset: VipRegister.GPLT3, label: 'BGMap 4' },
            { name: 'JPLT0', offset: VipRegister.JPLT0, label: 'Object 1' },
            { name: 'JPLT1', offset: VipRegister.JPLT1, label: 'Object 2' },
            { name: 'JPLT2', offset: VipRegister.JPLT2, label: 'Object 3' },
            { name: 'JPLT3', offset: VipRegister.JPLT3, label: 'Object 4' },
        ],
    },
];

/**
 * What each program register is for.
 *
 * r0 and r31 are the hardware's own (zero and the link register); the rest of
 * these are the V810 calling convention rather than anything the silicon
 * enforces, so a hand-written routine is free to ignore them — the toolchain's
 * `crt0.s` does exactly that in places. The bit string registers are the
 * exception: the string instructions read those five implicitly.
 */
const PROGRAM_REGISTER_LABELS: Record<number, string> = {
    0: 'Zero Register',
    1: 'Assembler Reserved',
    2: 'Handler Stack Pointer (hp)',
    3: 'Stack Pointer (sp)',
    4: 'Global Pointer (gp)',
    5: 'Text Pointer (tp)',
    6: 'Argument 1',
    7: 'Argument 2',
    8: 'Argument 3',
    9: 'Argument 4',
    10: 'Return Value',
    26: 'Bit String Source Offset',
    27: 'Bit String Destination Offset',
    28: 'Bit String Source Address',
    29: 'Bit String Destination Address',
    30: 'Bit String Length',
    31: 'Link Pointer (lp)',
};

const SYSTEM_REGISTER_LABELS: Record<string, string> = {
    ADTRE: 'Address Trap',
    CHCW: 'Cache Control Word',
    EIPC: 'Exception/Interrupt PC',
    EIPSW: 'Exception/Interrupt PSW',
    ECR: 'Exception Cause',
    FEPC: 'Fatal Error PC',
    FEPSW: 'Fatal Error PSW',
    PIR: 'Processor ID',
    PSW: 'Program Status Word',
    TKCW: 'Task Control Word',
};

const PROGRAM_REGISTERS_PER_COLUMN = 16;

/**
 * The VIP's control registers, and the V810's below them.
 *
 * The VIP block is read through the CPU's view of memory, so those are the
 * values the running program would see if it read them itself. The CPU's own
 * registers come from the core rather than from memory, since they live
 * nowhere in the address space.
 *
 * r0 is hardwired to zero and r31 is the link register; the rest are general
 * purpose. The system registers carry the exception and interrupt state, which
 * is usually what you want when a game has stopped somewhere unexpected.
 */
export class VesEmulatorRegistersPanel extends VesEmulatorPanel {

    protected registers?: VesVbRegisters;
    protected vipRegisters?: DataView;
    protected error?: string;

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.REGISTERS, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/registers', 'Registers');
        this.title.caption = nls.localize(
            'vuengine/emulator/panels/registersCaption', 'CPU and VIP control registers'
        );
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.registers = undefined;
            this.vipRegisters = undefined;
            this.update();
            return;
        }

        try {
            this.registers = await sim.readRegisters();
            this.vipRegisters = new DataView(await sim.readMemory(VIP_REGISTER_BASE, VIP_REGISTER_BLOCK_BYTES));
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
        const vipRegisters = this.vipRegisters;
        if (!registers || !vipRegisters) {
            return <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />;
        }

        return <div className='ves-emulator-registers-panel'>
            {this.renderVip(vipRegisters)}
            {this.renderCpu(registers)}
        </div>;
    }

    protected renderVip(block: DataView): React.ReactNode {
        return <fieldset className='ves-emulator-vip-inspector-group ves-emulator-vip'>
            <legend>VIP</legend>
            <div className='ves-emulator-vip-groups'>
                {VIP_REGISTER_GROUPS.map(({ group, registers }) => (
                    <div className='ves-emulator-vip-group' key={group}>
                        <h4>{group}</h4>
                        <table>
                            <tbody>
                                {registers.map(({ name, offset, label: hint }) => (
                                    <tr key={name}>
                                        <th title={hint}>{name}</th>
                                        <td><code>{hex(block.getUint16(offset, true), 4)}</code></td>
                                        <td className='hint'>{hint ?? ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </fieldset>;
    }

    protected renderCpu(registers: VesVbRegisters): React.ReactNode {
        const columns = [];
        for (let first = 0; first < registers.program.length; first += PROGRAM_REGISTERS_PER_COLUMN) {
            columns.push(registers.program.slice(first, first + PROGRAM_REGISTERS_PER_COLUMN).map(
                (value, offset) => ({ index: first + offset, value })
            ));
        }

        return <fieldset className='ves-emulator-vip-inspector-group'>
            <legend>CPU</legend>
            <div className='ves-emulator-registers'>
                <div className='ves-emulator-registers-pc'>
                    <span>PC</span><code>{hex(registers.pc, 8)}</code>
                    <span className='hint'>{nls.localize('vuengine/emulator/panels/programCounter', 'Program Counter')}</span>
                </div>
                <div className='ves-emulator-vip-group'>
                    <h4>{nls.localize('vuengine/emulator/panels/programRegisters', 'Program')}</h4>
                    <div className='ves-emulator-vip-groups'>
                        {columns.map(column => (
                            <table key={column[0].index}>
                                <tbody>
                                    {column.map(({ index, value }) => (
                                        <tr key={index}>
                                            <th title={PROGRAM_REGISTER_LABELS[index]}>r{index}</th>
                                            <td><code>{hex(value, 8)}</code></td>
                                            <td className='hint'>{PROGRAM_REGISTER_LABELS[index] ?? ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ))}
                    </div>
                </div>
                <div className='ves-emulator-vip-group'>
                    <h4>{nls.localize('vuengine/emulator/panels/systemRegisters', 'System')}</h4>
                    <table>
                        <tbody>
                            {Object.entries(registers.system).map(([name, value]) => (
                                <tr key={name}>
                                    <th title={SYSTEM_REGISTER_LABELS[name]}>{name}</th>
                                    <td><code>{hex(value, 8)}</code></td>
                                    <td className='hint'>{SYSTEM_REGISTER_LABELS[name] ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </fieldset>;
    }
}
