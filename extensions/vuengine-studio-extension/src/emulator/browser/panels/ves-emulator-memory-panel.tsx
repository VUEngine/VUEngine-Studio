import { ArrowDown, ArrowUDownLeft, ArrowUp, Plug } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { EMULATOR_PANEL_LABELS, hex, VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';

export const VB_MEMORY_REGIONS = [
    {
      label: 'VIP',
      address: 0x00000000,
      short: 'VIP',
    },
    {
      label: 'VSU',
      address: 0x01000000,
      short: 'VSU',
    },
    {
      label: 'Hardware Registers',
      address: 0x02000000,
      short: 'Regs',
    },
    {
      label: 'Cartridge Expansion',
      address: 0x04000000,
      short: 'EXP',
    },
    {
      label: 'WRAM',
      address: 0x05000000,
      short: 'WRAM',
    },
    {
      label: 'Cartridge RAM',
      address: 0x06000000,
      short: 'RAM',
    },
    {
      label: 'Cartridge ROM',
      address: 0x07000000,
      short: 'ROM',
    },
];

const BYTES_PER_ROW = 16;
const ROWS = 16;
const WINDOW = BYTES_PER_ROW * ROWS;

/**
 * Hex view of the address space.
 *
 * Reads go through the CPU's view of memory rather than the state struct, so
 * mirroring and mapped hardware registers read exactly as the running program
 * sees them.
 */
export class VesEmulatorMemoryPanel extends VesEmulatorPanel {

    protected address = 0x05000000; // WRAM, the usual starting point
    protected bytes?: Uint8Array;
    /**
     * The address box, which is uncontrolled so that polling cannot overwrite
     * a half-typed address. Its value therefore lives in the DOM rather than
     * here, and both ways of submitting it have to go and read it.
     */
    protected readonly addressInput = React.createRef<HTMLInputElement>();

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.MEMORY, source, instanceId);
        this.title.label = EMULATOR_PANEL_LABELS[EmulatorPanelType.MEMORY];
    }

    protected async refresh(): Promise<void> {
        const buffer = await this.source.sim?.readMemory(this.address, WINDOW);
        this.bytes = buffer ? new Uint8Array(buffer) : undefined;
        this.update();
    }

    protected goto(address: number): void {
        // Align to a row so the columns stay meaningful while scrolling.
        this.address = (Math.max(0, address) & ~(BYTES_PER_ROW - 1)) >>> 0;
        this.refresh();
    }

    /**
     * Jump to whatever the address box holds, ignoring anything that is not an
     * address. Typing is how it is edited, so most of what passes through here
     * is half-finished and silently doing nothing is the useful response.
     */
    protected gotoTypedAddress(): void {
        const typed = this.addressInput.current?.value.trim().replace(/^0x/i, '') ?? '';
        // parseInt would take "12nonsense" as 0x12; nothing that is not
        // entirely hex digits was an address anyone meant to go to.
        if (!/^[0-9a-f]+$/i.test(typed)) {
            return;
        }
        this.goto(parseInt(typed, 16));
    }

    protected render(): React.ReactNode {
        const bytes = this.bytes;

        return (
          <div className="ves-emulator-memory">

            <div className="ves-emulator-memory-toolbar">
              {VB_MEMORY_REGIONS.map(region => (
                <button
                  key={region.short}
                  title={region.label}
                  className="theia-button secondary"
                  onClick={() => this.goto(region.address)}
                >
                  {region.short}
                </button>
              ))}
              <input
                ref={this.addressInput}
                className="theia-input"
                spellCheck={false}
                defaultValue={hex(this.address, 8)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    this.gotoTypedAddress();
                  }
                }}
              />
              <button
                className="theia-button secondary"
                title={nls.localize(
                  'vuengine/emulator/panels/memoryGoTo', 'Go to address'
                )}
                onClick={() => this.gotoTypedAddress()}
              >
                <ArrowUDownLeft size={14} />
              </button>
              <button
                className="theia-button secondary"
                onClick={() => this.goto(this.address - WINDOW)}
                disabled={this.address === 0}
              >
                <ArrowUp size={14} />
              </button>
              <button
                className="theia-button secondary"
                onClick={() => this.goto(this.address + WINDOW)}
              >
                <ArrowDown size={14} />
              </button>
            </div>

            {!bytes ? (
              <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />
            ) : (
              <div className="ves-emulator-memory-rows">
                {Array.from({ length: ROWS }, (unused, row) => {
                  const offset = row * BYTES_PER_ROW;
                  const slice = bytes.subarray(offset, offset + BYTES_PER_ROW);
                  return (
                    <div className="ves-emulator-memory-row" key={row}>
                      <span className="address">
                        {hex(this.address + offset, 8)}
                      </span>
                      <span className="bytes">
                        {Array.from(slice, byte => hex(byte, 2)).join(' ')}
                      </span>
                      <span className="ascii">
                        {Array.from(slice, byte =>
                          byte >= 0x20 && byte < 0x7f
                            ? String.fromCharCode(byte)
                            : '.',
                        ).join('')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
    }
}
