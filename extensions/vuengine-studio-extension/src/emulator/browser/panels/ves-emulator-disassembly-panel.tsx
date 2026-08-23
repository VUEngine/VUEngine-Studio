import { Plug, Warning } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { VesVbDisassemblyLine } from '../../common/ves-vb-protocol';
import { hex, VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';

const LINES = 48;

/**
 * Disassembly around the program counter, produced by the core's own V810
 * disassembler rather than a reimplementation.
 *
 * Following the program counter is the default because that is what you want
 * while stepping; unfollowing pins the view so you can read somewhere else
 * while the game runs.
 */
export class VesEmulatorDisassemblyPanel extends VesEmulatorPanel {

    protected lines: VesVbDisassemblyLine[] = [];
    protected error?: string;
    protected follow = true;
    protected address = 0;

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.DISASSEMBLY, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/disassembly', 'Disassembly');
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.lines = [];
            this.update();
            return;
        }

        try {
            if (this.follow) {
                // Start a little before the program counter so there is some
                // context above the current instruction.
                const { pc } = await sim.readRegisters();
                this.address = Math.max(0, pc - 16) >>> 0;
            }
            this.lines = await sim.disassemble(this.address, LINES);
            this.error = undefined;
        } catch (error) {
            this.lines = [];
            this.error = error instanceof Error ? error.message : String(error);
        }
        this.update();
    }

    protected render(): React.ReactNode {
        return (
          <div className="ves-emulator-disassembly">
            <div className="ves-emulator-panel-toolbar">
              <label>
                <input
                  type="checkbox"
                  checked={this.follow}
                  onChange={e => {
                    this.follow = e.target.checked;
                    this.refresh();
                  }}
                />
                {nls.localize('vuengine/emulator/panels/followPc', 'Follow PC')}
              </label>
              <input
                className="theia-input"
                spellCheck={false}
                disabled={this.follow}
                defaultValue={hex(this.address, 8)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const parsed = parseInt(
                      (e.target as HTMLInputElement).value.replace(/^0x/i, ''),
                      16,
                    );
                    if (Number.isFinite(parsed)) {
                      this.address = parsed >>> 0;
                      this.refresh();
                    }
                  }
                }}
              />
            </div>

            {this.error ? (
              <EmptyContainer
                  title={this.error ?? nls.localizeByDefault('Error')}
                  icon={<Warning size={32} />}
              />
            ) : this.lines.length === 0 ? (
              <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />
            ) : (
              <div className="ves-emulator-disassembly-lines">
                {this.lines.map(line => (
                  <div
                    className={`ves-emulator-disassembly-line${line.isPC ? ' current' : ''}`}
                    key={line.address}
                  >
                    <span className="address">{hex(line.address, 8)}</span>
                    <span className="code">
                      {line.code.map(word => hex(word, 4)).join(' ')}
                    </span>
                    <span className="mnemonic">{line.mnemonic}</span>
                    <span className="operands">{line.operands.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
}
