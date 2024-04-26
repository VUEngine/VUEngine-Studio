import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../Common/HContainer';
import NumberArrayPreview from '../Common/NumberArrayPreview';
import { clamp } from '../Common/Utils';
import VContainer from '../Common/VContainer';
import { NUMBER_OF_WAVEFORM_BANKS, VsuChannelData } from './VsuSandboxTypes';

interface ChannelProps {
    index: number
    supportSweepAndModulation: boolean
    isNoiseChannel: boolean
    channel: VsuChannelData
    setChannel: (channel: VsuChannelData) => void
    waveForms: number[][]
    modulationData: number[]
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const { index, isNoiseChannel, channel, setChannel, waveForms } = props;

    const toHertz = (frequency: number): number =>
        5000000 / ((2048 - frequency) * 32);

    /*
    const fromHertz = (fHz: number): number =>
        Math.round(2048 - 5000000 / (32 * fHz));
    */

    const toggleEnabled = () => {
        setChannel({
            ...channel,
            enabled: !channel?.enabled,
        });
    };

    const setWaveform = (waveform: number) => {
        setChannel({
            ...channel,
            waveform,
        });
    };

    const toggleIntervalEnabled = () => {
        setChannel({
            ...channel,
            interval: {
                ...channel?.interval,
                enabled: !channel?.interval?.enabled,
            },
        });
    };

    const toggleEnvelopeEnabled = () => {
        setChannel({
            ...channel,
            envelope: {
                ...channel?.envelope,
                enabled: !channel?.envelope?.enabled,
            },
        });
    };

    const setInterval = (interval: number) => {
        setChannel({
            ...channel,
            interval: {
                ...channel?.interval,
                value: clamp(interval, 0, 31),
            },
        });
    };

    const setStereoLevel = (side: 'left' | 'right', value: number) => {
        setChannel({
            ...channel,
            stereoLevels: {
                ...channel?.stereoLevels,
                [side]: value,
            }
        });
    };

    const setFrequency = (frequency: number): void => {
        setChannel({
            ...channel,
            frequency: clamp(frequency, 0, 2047),
        });
    };

    return <VContainer>
        <label>
            {nls.localize('vuengine/vsuSandbox/channel', 'Channel')} {index}
            {isNoiseChannel &&
                ` (${nls.localize('vuengine/vsuSandbox/noise', 'Noise')})`
            }
        </label>
        <label>
            <input
                type="checkbox"
                checked={channel?.enabled ?? false}
                onChange={toggleEnabled}
            />
            Enabled
        </label>
        {channel?.enabled &&
            <HContainer gap={15} wrap='wrap'>
                {!isNoiseChannel && <>
                    <VContainer>
                        {nls.localize('vuengine/vsuSandbox/waveForm', 'WaveForm')}
                        <HContainer>
                            {([...Array(NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                                <NumberArrayPreview
                                    key={x}
                                    maximum={64}
                                    active={x === (channel?.waveform ?? 0)}
                                    data={waveForms[x] ?? []}
                                    onClick={() => setWaveform(x)}
                                />
                            ))}
                        </HContainer>
                        {/* supportSweepAndModulation && <>
                        {nls.localize('vuengine/vsuSandbox/modulationData', 'Modulation Data')}
                        <HContainer>
                            <NumberArrayPreview
                                maximum={256}
                                active={true}
                                data={modulationData ?? []}
                            />
                        </HContainer>
                    </> */}
                    </VContainer>
                </>}
                <VContainer>
                    <label>
                        {nls.localize('vuengine/vsuSandbox/stereoLevels', 'Stereo Levels')}
                    </label>
                    <HContainer alignItems='center'>
                        <div style={{ minWidth: 10, width: 10 }}>
                            L
                        </div>
                        <input
                            type='range'
                            value={channel?.stereoLevels?.left ?? 15}
                            max={15}
                            min={0}
                            step={1}
                            onChange={e => setStereoLevel('left', parseInt(e.target.value))}
                        />
                        <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                            {channel?.stereoLevels?.left ?? 15}
                        </div>
                    </HContainer>
                    <HContainer alignItems='center'>
                        <div style={{ minWidth: 10, width: 10 }}>
                            R
                        </div>
                        <input
                            type='range'
                            value={channel?.stereoLevels?.right ?? 15}
                            max={15}
                            min={0}
                            step={1}
                            onChange={e => setStereoLevel('right', parseInt(e.target.value))}
                        />
                        <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                            {channel?.stereoLevels?.right ?? 15}
                        </div>
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/vsuSandbox/frequency', 'Frequency')}
                    </label>
                    <input
                        className='theia-input'
                        style={{ width: 72 }}
                        type='number'
                        min={0}
                        max={2047}
                        value={channel?.frequency ?? 0}
                        onChange={e => setFrequency(parseInt(e.target.value))}
                    />
                    {Math.round(toHertz(channel?.frequency ?? 0) * 100) / 100} Hz
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/vsuSandbox/interval', 'Interval')}
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={channel?.interval?.enabled ?? false}
                            onChange={toggleIntervalEnabled}
                        />
                        Enabled
                    </label>
                    {channel?.interval?.enabled &&
                        <input
                            className='theia-input'
                            style={{ width: 72 }}
                            type='number'
                            min={0}
                            max={31}
                            value={channel?.interval?.value ?? 0}
                            onChange={e => setInterval(parseInt(e.target.value))}
                        />
                    }
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/vsuSandbox/envelope', 'Envelope')}
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={channel?.envelope?.enabled ?? false}
                            onChange={toggleEnvelopeEnabled}
                        />
                        Enabled
                    </label>
                </VContainer>
            </HContainer>
        }
    </VContainer>;
}
