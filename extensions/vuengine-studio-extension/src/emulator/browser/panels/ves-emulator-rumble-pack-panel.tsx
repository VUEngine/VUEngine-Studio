import { nls } from '@theia/core';
import { Message } from '@theia/core/shared/@lumino/messaging';
import * as React from '@theia/core/shared/react';
import {
    getRumbleEffectName,
    RumbleCommand,
    RumbleState,
} from '../../../rumble-pack/browser/ves-rumble-pack-protocol';
import { VesRumblePackService } from '../../../rumble-pack/browser/ves-rumble-pack-service';
import { getRumblePackName } from '../../../rumble-pack/browser/ves-rumble-pack-types';
import { VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';

/**
 * What the running game is asking a rumble pack to do, and whether one is
 * plugged in to do it.
 *
 * Everything but the connection block is shown either way. The rumble commands
 * a game broadcasts are read off the emulated link port, not off the hardware,
 * so decoding them is just as useful to somebody who owns no pack — which is
 * also why opening this panel is enough to make the widget turn link port
 * capture on (see applyRumbleForwarding).
 *
 * Connection is pushed as an event, so the inherited polling is slowed right
 * down; it is what keeps the decoded traffic below up to date.
 */
export class VesEmulatorRumblePackPanel extends VesEmulatorPanel {

    /** Set while a detection triggered from here is in flight. */
    protected detecting = false;
    /** Why the last detection failed, if it did. Cleared by the next attempt. */
    protected error: string | undefined;

    constructor(
        source: VesEmulatorDebugSource,
        instanceId: string,
        protected readonly rumblePackService: VesRumblePackService
    ) {
        super(EmulatorPanelType.RUMBLE_PACK, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/rumblePack', 'Rumble Pack');
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        // Re-subscribed on every attach because toDisposeOnDetach is emptied
        // when the panel is detached, which a dock layout change does.
        this.toDisposeOnDetach.push(
            this.rumblePackService.onDidChangeConnectedRumblePack(() => this.update())
        );
    }

    protected pollHz(): number {
        return 1;
    }

    protected refresh(): void {
        this.update();
    }

    protected async detect(): Promise<void> {
        // The port prompt is modal, but the button stays clickable behind a
        // detection that is only waiting on the device itself.
        if (this.detecting) {
            return;
        }
        this.detecting = true;
        this.error = undefined;
        this.update();
        try {
            await this.rumblePackService.detectConnectedRumblePack();
        } catch (error) {
            // Picking no device in the port prompt is swallowed by the service
            // itself; what reaches here is a port that could not be opened,
            // usually because something else already holds it.
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            this.detecting = false;
            this.update();
        }
    }

    protected render(): React.ReactNode {
        const port = this.rumblePackService.connectedRumblePack;
        const info = port?.getInfo();
        const name = info && getRumblePackName(info);
        const commands = this.rumblePackService.emulatedCommands;
        const rumbleState = this.rumblePackService.emulatedRumbleState;
        // What the pack itself last said, which is where a command it did not
        // understand shows up.
        const lastReply = [...this.rumblePackService.rumblePackLog]
            .reverse()
            .find(line => line.text.trim() !== '')
            ?.text.trim();

        return <div className='ves-emulator-rumble-pack'>
            <div className={`ves-emulator-rumble-pack-status ${port ? 'connected' : 'disconnected'}`}>
                {port
                    ? <>
                        <i className='codicon codicon-pass-filled' />
                        {nls.localize('vuengine/emulator/panels/rumblePack/connected', 'Rumble Pack connected')}
                    </>
                    : <>
                        <i className='codicon codicon-circle-slash' />
                        {nls.localize('vuengine/emulator/panels/rumblePack/notConnected', 'No Rumble Pack connected')}
                        <button
                            className='theia-button secondary'
                            onClick={() => this.detect()}
                            disabled={this.detecting}
                        >
                            {this.detecting
                                ? nls.localize('vuengine/emulator/panels/rumblePack/detecting', 'Searching...')
                                : nls.localize('vuengine/emulator/panels/rumblePack/detect', 'Detect')}
                        </button>
                    </>}
            </div>
            {this.error && <div className='ves-emulator-rumble-pack-error'>{this.error}</div>}
            <fieldset className='ves-emulator-vip-inspector-group'>
                <legend>
                    {nls.localize('vuengine/emulator/panels/rumblePack/status', 'Status')}
                </legend>
                <table className='ves-emulator-rumble-pack-info'>
                    <tbody>
                        {info && <>
                            <tr>
                                <th>{nls.localize('vuengine/emulator/panels/rumblePack/board', 'Board')}</th>
                                <td>{name ?? nls.localize('vuengine/emulator/panels/rumblePack/unknownBoard', 'Unknown')}</td>
                            </tr>
                            <tr>
                                <th>{nls.localize('vuengine/emulator/panels/rumblePack/vendorId', 'Vendor ID')}</th>
                                <td><code>{usbId(info.usbVendorId)}</code></td>
                            </tr>
                            <tr>
                                <th>{nls.localize('vuengine/emulator/panels/rumblePack/productId', 'Product ID')}</th>
                                <td><code>{usbId(info.usbProductId)}</code></td>
                            </tr>
                        </>}
                        <tr>
                            <th>{nls.localize('vuengine/emulator/panels/rumblePack/forwarding', 'Link port')}</th>
                            <td>{this.rumblePackService.emulatorForwarding
                                ? nls.localize('vuengine/emulator/panels/rumblePack/forwardingOn', 'Forwarding from the emulator')
                                : nls.localize('vuengine/emulator/panels/rumblePack/forwardingOff', 'Not forwarding')}</td>
                        </tr>
                        <tr>
                            {/* Nothing is sent anywhere with no pack attached, but the
                                bytes are still read off the link port and decoded. */}
                            <th>{port
                                ? nls.localize('vuengine/emulator/panels/rumblePack/bytes', 'Bytes sent')
                                : nls.localize('vuengine/emulator/panels/rumblePack/bytesCaptured', 'Bytes captured')}</th>
                            <td><code>{this.rumblePackService.emulatedByteCount}</code></td>
                        </tr>
                        {port && <tr>
                            <th>{nls.localize('vuengine/emulator/panels/rumblePack/lastReply', 'Last reply')}</th>
                            <td><code>{lastReply ?? '—'}</code></td>
                        </tr>}
                    </tbody>
                </table>
            </fieldset>

            {this.renderEffect(rumbleState)}
            {this.renderCommands(commands)}
        </div>;
    }

    /**
     * The effect the forwarded bytes add up to, laid out the way the rumble
     * effect editor lays out the same settings.
     *
     * Every field is filled in only over time: the engine skips a command
     * whose value has not changed since the last effect (`Rumble.c` caches
     * them), so a game that never varies its frequency sends it once and a
     * field that has not been seen yet is genuinely unknown rather than zero.
     */
    protected renderEffect(state: RumbleState): React.ReactNode {
        const spec = this.rumblePackService.emulatedSpec;
        const rows: [string, string][] = [
            [
                nls.localize('vuengine/emulator/panels/rumblePack/spec', 'Spec'),
                // No spec at all is the engine's own "nothing is playing"; one
                // without a name is an effect whose spec could not be named.
                spec
                    ? spec.name ?? nls.localize(
                        'vuengine/emulator/panels/rumblePack/unnamedSpec',
                        'Unnamed, at {0}',
                        `0x${spec.address.toString(16).toUpperCase().padStart(8, '0')}`
                    )
                    : '—',
            ],
            [
                nls.localize('vuengine/editors/rumbleEffect/effect', 'Effect'),
                state.effect === undefined ? '—' : getRumbleEffectName(state.effect),
            ],
            [
                nls.localize('vuengine/editors/rumbleEffect/frequency', 'Frequency'),
                state.frequency === undefined ? '—' : `${state.frequency} Hz`,
            ],
            [
                nls.localize('vuengine/editors/rumbleEffect/overdrive', 'Overdrive'),
                state.overdrive?.toString() ?? '—',
            ],
            [
                nls.localize('vuengine/editors/rumbleEffect/sustainPos', 'Sustain (Pos.)'),
                state.sustainPositive?.toString() ?? '—',
            ],
            [
                nls.localize('vuengine/editors/rumbleEffect/sustainNeg', 'Sustain (Neg.)'),
                state.sustainNegative?.toString() ?? '—',
            ],
            [
                nls.localize('vuengine/editors/rumbleEffect/break', 'Break'),
                state.breaking?.toString() ?? '—',
            ],
        ];

        return (
            <fieldset className='ves-emulator-vip-inspector-group'>
                <legend>
                    {nls.localize('vuengine/emulator/panels/rumblePack/effect', 'Last Effect')}
                    {state.playing !== undefined && <span className='ves-emulator-rumble-pack-playing'>
                        {state.playing
                            ? nls.localize('vuengine/emulator/panels/rumblePack/effectPlaying', 'Playing')
                            : nls.localize('vuengine/emulator/panels/rumblePack/effectStopped', 'Stopped')}
                    </span>}
                </legend>
                <table className='ves-emulator-rumble-pack-info'>
                    <tbody>
                        {rows.map(([label, value]) => <tr key={label}>
                            <th>{label}</th>
                            <td>{value}</td>
                        </tr>)}
                    </tbody>
                </table>
            </fieldset>
        );
    }

    /** The forwarded bytes mapped back to what each of them asked for. */
    protected renderCommands(commands: RumbleCommand[]): React.ReactNode {
        return (
            <fieldset className='ves-emulator-vip-inspector-group'>
                <legend>
                    {nls.localize('vuengine/emulator/panels/rumblePack/commands', 'Last commands')}
                </legend>
                {commands.length === 0 && <div className='ves-emulator-panel-empty'>
                    {this.source.sim
                        ? nls.localize(
                            'vuengine/emulator/panels/rumblePack/noCommands',
                            'Nothing broadcast yet.'
                        )
                        : nls.localize('vuengine/emulator/panels/notRunning', 'The emulator is not running.')}
                </div>}
                <div className='ves-emulator-rumble-pack-commands'>
                    {commands.map((command, index) => <div
                        key={index}
                        className={command.unknown ? 'unknown' : undefined}
                    >
                        <code>{command.bytes.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')}</code>
                        <span>{command.label}</span>
                    </div>)}
                </div>
            </fieldset>
        );
    }
}

/** A USB id as it is written on a device's data sheet, or a dash if unreported. */
function usbId(value: number | undefined): string {
    return value === undefined ? '—' : `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
}
