import { Plug, Terminal } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { Message } from '@theia/core/shared/@lumino/messaging';
import * as React from '@theia/core/shared/react';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { VesVbSim } from '../core/ves-vb-core';
import { VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';

/** Lines kept before the oldest are dropped. */
const MAX_LINES = 2000;

/**
 * Output the running program wrote to the terminal port.
 *
 * VUEngine's `Terminal::print` stores a string to a fixed address one byte at a
 * time and follows it with a newline. Capturing that means the core calls back
 * on every CPU write, so capture is switched on only while this panel is open
 * and torn down again when it closes — which is also why this is the one panel
 * that is pushed to rather than polled.
 *
 * Nothing appears for a shipping build: `Terminal::print` is compiled out
 * unless the ROM was built with debugging enabled.
 */
export class VesEmulatorTerminalPanel extends VesEmulatorPanel {

    protected lines: string[] = [];
    /** Text since the last newline, which is not a line yet. */
    protected partial = '';
    protected follow = true;
    protected capturing = false;

    protected scroller: HTMLDivElement | undefined;

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.TERMINAL, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/terminal', 'Terminal');
        this.title.caption = this.title.label;

        this.toDisposeOnDetach.push(this.source.onDidChange(() => this.startCapture()));
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.startCapture();
    }

    /**
     * Nothing to poll: output arrives as an event. The base class still drives
     * a timer, so it is slowed right down rather than left running at ten hertz.
     */
    protected pollHz(): number {
        return 1;
    }

    protected refresh(): void {
        // Output is pushed, so a poll only has to notice a simulation appearing
        // or going away.
        this.startCapture();
        // Rendered here too, even though nothing is polled for: ReactWidget
        // draws only from onUpdateRequest, so without this the panel — toolbar
        // and empty state alike — stayed blank until the first output arrived
        // and appended itself. It is also what swaps the empty state over when
        // a simulation appears or goes away.
        this.update();
    }

    protected startCapture(): void {
        const sim = this.source.sim;
        if (!sim || this.capturing) {
            return;
        }
        this.capturing = true;

        sim.setTerminalCapture(true).catch(error => this.append(
            `\n${nls.localize(
                'vuengine/emulator/panels/terminalFailed',
                'Terminal capture could not be enabled: {0}',
                error instanceof Error ? error.message : String(error)
            )}\n`
        ));

        this.toDisposeOnDetach.push(sim.onTerminal(text => this.append(text)));
        // Capture is per simulation and costs a callback on every write, so it
        // has to be given back when the panel goes away.
        this.toDisposeOnDetach.push({
            dispose: () => {
                this.capturing = false;
                this.stopCapture(sim);
            },
        });
    }

    protected stopCapture(sim: VesVbSim): void {
        // The simulation is often already gone by the time a panel closes, in
        // which case there is nothing left to turn off.
        sim.setTerminalCapture(false).catch(() => { /* nothing to release */ });
    }

    protected append(text: string): void {
        const combined = this.partial + text;
        const parts = combined.split('\n');
        this.partial = parts.pop() ?? '';
        this.lines.push(...parts);

        if (this.lines.length > MAX_LINES) {
            this.lines.splice(0, this.lines.length - MAX_LINES);
        }
        this.update();
    }

    protected clear(): void {
        this.lines = [];
        this.partial = '';
        this.update();
    }

    protected onUpdateRequest(message: Message): void {
        super.onUpdateRequest(message);
        if (this.follow && this.scroller) {
            this.scroller.scrollTop = this.scroller.scrollHeight;
        }
    }

    protected render(): React.ReactNode {
        const empty = this.lines.length === 0 && this.partial === '';

        return (
          <div className="ves-emulator-terminal">
            <div className="ves-emulator-panel-toolbar">
              <label>
                <input
                  type="checkbox"
                  checked={this.follow}
                  onChange={e => {
                    this.follow = e.target.checked;
                    this.update();
                  }}
                />
                {nls.localize(
                  'vuengine/emulator/panels/followOutput',
                  'Follow output',
                )}
              </label>
              <button
                className="theia-button secondary"
                onClick={() => this.clear()}
                disabled={empty}
              >
                {nls.localize('vuengine/emulator/panels/clear', 'Clear')}
              </button>
            </div>
            <div
              className="ves-emulator-terminal-lines"
              ref={element => {
                this.scroller = element ?? undefined;
              }}
            >
              {empty ? (
                this.source.sim ? (
                  <EmptyContainer
                    title={nls.localize(
                      'vuengine/emulator/panels/terminalWaiting',
                      'Waiting for output',
                    )}
                    description={nls.localize(
                      'vuengine/emulator/panels/terminalWaitingHint',
                      'Nothing appears unless the ROM was built with debugging enabled.',
                    )}
                    icon={<Terminal size={32} />}
                  />
                ) : (
                  <EmptyContainer
                    title={nls.localize(
                      'vuengine/emulator/panels/notRunning',
                      'The emulator is not running.',
                    )}
                    icon={<Plug size={32} />}
                  />
                )
              ) : (
                <>
                  {this.lines.map((line, index) => (
                    <div className="ves-emulator-terminal-line" key={index}>
                      {line}
                    </div>
                  ))}
                  {this.partial !== '' && (
                    <div className="ves-emulator-terminal-line partial">
                      {this.partial}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
    }
}
