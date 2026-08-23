import { nls } from '@theia/core';
import { Message } from '@theia/core/shared/@lumino/messaging';
import * as React from '@theia/core/shared/react';
import { VB_VSU_BASE } from '../../common/ves-vb-constants';
import { VesVbSim } from '../core/ves-vb-core';
import { hex, VesEmulatorDebugSource, VesEmulatorPanel, EmulatorPanelType } from './ves-emulator-panel';
import {
    decodeVsuChannel,
    VSU_CHANNEL_COUNT,
    VSU_REGISTER_BASE,
    VSU_REGISTER_BLOCK_BYTES,
    VSU_WAVEFORM_BASES,
    VSU_WAVEFORM_BYTES,
    VsuChannel,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction,
    vsuChannelAddress,
    vsuWaveformSamples,
} from './ves-emulator-vsu-memory';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { Plug, Warning } from '@phosphor-icons/react';

/** Sparkline geometry, in the same units as its viewBox. */
const SPARK_WIDTH = 64;
const SPARK_HEIGHT = 18;
/** Waveform samples are six-bit. */
const SAMPLE_MAX = 63;

function sparklinePoints(samples: number[]): string {
    if (samples.length < 2) {
        return '';
    }
    const step = SPARK_WIDTH / (samples.length - 1);
    return samples
        .map((sample, index) => `${(index * step).toFixed(1)},${(SPARK_HEIGHT - (sample / SAMPLE_MAX) * SPARK_HEIGHT).toFixed(1)}`)
        .join(' ');
}

/**
 * Live view of the VSU's six channels: frequency, stereo volume, envelope,
 * interval, the waveform bank in use (or, for Noise, its tap), and — for the
 * fifth channel — its sweep/modulation settings.
 *
 * Unlike every other inspector, this cannot simply poll memory: real hardware
 * never lets the VSU's registers be read back, and this core matches that (see
 * VB_VSU_BASE's own comment). So instead this drives setVsuCapture, which
 * watches writes as they happen and keeps a shadow copy, and polls that
 * shadow with readVsu — capture is therefore only switched on while this
 * panel is actually visible, the same tradeoff the Terminal panel makes for
 * its own write-watching capture. Bit layouts for what comes back are decoded
 * in ves-emulator-vsu-memory.ts; see there for sourcing.
 */
export class VesEmulatorVsuPanel extends VesEmulatorPanel {

    protected channels?: VsuChannel[];
    protected waveforms: (number[] | undefined)[] = [];
    protected error?: string;

    /** Which sim, if any, capture is currently switched on for. */
    protected capturedSim?: VesVbSim;

    constructor(source: VesEmulatorDebugSource, instanceId: string) {
        super(EmulatorPanelType.VSU, source, instanceId);
        this.title.label = nls.localize('vuengine/emulator/panels/vsu', 'VSU');
        this.title.caption = nls.localize('vuengine/emulator/panels/vsuCaption', 'Virtual Sound Unit channels');
    }

    protected onAfterHide(msg: Message): void {
        super.onAfterHide(msg);
        this.stopCapture();
    }

    protected onBeforeDetach(msg: Message): void {
        this.stopCapture();
        super.onBeforeDetach(msg);
    }

    /** Turn capture on for `sim`, turning it off for whatever sim it was previously on for. */
    protected syncCapture(sim: VesVbSim): void {
        if (this.capturedSim === sim) {
            return;
        }
        this.stopCapture();
        this.capturedSim = sim;
        sim.setVsuCapture(true).catch(error => {
            this.error = error instanceof Error ? error.message : String(error);
        });
    }

    protected stopCapture(): void {
        const sim = this.capturedSim;
        if (!sim) {
            return;
        }
        this.capturedSim = undefined;
        sim.setVsuCapture(false).catch(() => { /* nothing to release */ });
    }

    protected async refresh(): Promise<void> {
        const sim = this.source.sim;
        if (!sim) {
            this.stopCapture();
            this.channels = undefined;
            this.waveforms = [];
            this.update();
            return;
        }

        this.syncCapture(sim);

        try {
            const shadow = new Uint8Array(await sim.readVsu());
            const registers = new DataView(shadow.buffer, VSU_REGISTER_BASE - VB_VSU_BASE, VSU_REGISTER_BLOCK_BYTES);
            this.channels = Array.from({ length: VSU_CHANNEL_COUNT }, (unused, index) => decodeVsuChannel(registers, index));
            this.waveforms = VSU_WAVEFORM_BASES.map(base =>
                vsuWaveformSamples(shadow.subarray(base - VB_VSU_BASE, base - VB_VSU_BASE + VSU_WAVEFORM_BYTES))
            );
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
        const channels = this.channels;
        if (!channels) {
            return <EmptyContainer
                title={nls.localize(
                  'vuengine/emulator/panels/notRunning',
                  'The emulator is not running.',
                )}
                icon={<Plug size={32} />}
              />;
        }

        return <div className='ves-emulator-vip'>
            <table className='ves-emulator-vip-table'>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{nls.localize('vuengine/emulator/panels/vsu/channel', 'Channel')}</th>
                        <th>{nls.localize('vuengine/emulator/panels/vsu/freq', 'Freq')}</th>
                        <th>L</th>
                        <th>R</th>
                        <th>{nls.localize('vuengine/emulator/panels/vsu/envelope', 'Envelope')}</th>
                        <th>{nls.localize('vuengine/emulator/panels/vsu/interval', 'Interval')}</th>
                        <th>{nls.localize('vuengine/emulator/panels/vsu/source', 'Source')}</th>
                        <th>{nls.localize('vuengine/emulator/panels/vsu/mode', 'Mode')}</th>
                    </tr>
                </thead>
                <tbody>
                    {channels.map(channel => (
                        <tr
                            key={channel.index}
                            className={channel.enabled ? '' : 'inactive'}
                            title={hex(vsuChannelAddress(channel.index), 8)}
                        >
                            <td>{channel.index}</td>
                            <td>{channel.name}</td>
                            <td>
                                <code>{hex(channel.frequencyRaw, 3)}</code>{' '}
                                <span className='hint'>{Math.round(channel.frequencyHz)} Hz</span>
                            </td>
                            <td>{channel.left}</td>
                            <td>{channel.right}</td>
                            <td>
                                {channel.envelope.initialValue}
                                {channel.envelope.direction === VsuEnvelopeDirection.GROW ? '↑' : '↓'}
                                {' '}
                                <span className='hint'>
                                    {channel.envelope.stepMs}ms{channel.repeat ? ' ↻' : ''}
                                </span>
                            </td>
                            <td>
                                {channel.interval.enabled
                                    ? <>
                                        {channel.interval.value}{' '}
                                        <span className='hint'>{channel.interval.durationMs}ms</span>
                                    </>
                                    : <span className='hint'>{nls.localize('vuengine/emulator/panels/vsu/off', 'off')}</span>}
                            </td>
                            <td>
                                <div className='ves-emulator-vsu-source'>
                                    {channel.noise
                                        ? <span className='hint'>
                                            {nls.localize('vuengine/emulator/panels/vsu/tap', 'Tap')} {channel.noise.tap}
                                            {' '}({channel.noise.period})
                                        </span>
                                        : <>
                                            {channel.waveform !== undefined && this.waveforms[channel.waveform] && (
                                                <svg className='ves-emulator-vsu-spark' viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}>
                                                    <polyline points={sparklinePoints(this.waveforms[channel.waveform]!)} />
                                                </svg>
                                            )}
                                            <span className='hint'>#{channel.waveform}</span>
                                        </>}
                                </div>
                            </td>
                            <td>
                                {channel.sweepModulation
                                    ? <span className='hint'>
                                        {channel.sweepModulation.function === VsuSweepModulationFunction.MODULATION
                                            ? nls.localize('vuengine/emulator/panels/vsu/modulation', 'Mod')
                                            : nls.localize('vuengine/emulator/panels/vsu/sweep', 'Sweep')}
                                        {' '}
                                        {channel.sweepModulation.direction === VsuSweepDirection.UP ? '↑' : '↓'}
                                        {channel.sweepModulation.shift}
                                        {!channel.sweepModulation.enabled || channel.sweepModulation.interval === 0
                                            ? ` (${nls.localize('vuengine/emulator/panels/vsu/off', 'off')})`
                                            : ` ${channel.sweepModulation.intervalMs}ms`}
                                    </span>
                                    : '–'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>;
    }
}
