import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../Common/HContainer';
import NumberArrayPreview from '../Common/NumberArrayPreview';
import RadioSelect from '../Common/RadioSelect';
import { clamp } from '../Common/Utils';
import VContainer from '../Common/VContainer';
import {
    ENVELOPE_INITIAL_VALUE_MAX,
    ENVELOPE_INITIAL_VALUE_MIN,
    ENVELOPE_STEP_TIME_MAX,
    ENVELOPE_STEP_TIME_MIN,
    NUMBER_OF_WAVEFORM_BANKS,
    SWEEP_MODULATION_FREQUENCY_MAX,
    SWEEP_MODULATION_FREQUENCY_MIN,
    SWEEP_MODULATION_INTERVAL_MAX,
    SWEEP_MODULATION_INTERVAL_MIN,
    SWEEP_MODULATION_SHIFT_MAX,
    SWEEP_MODULATION_SHIFT_MIN,
    VsuChannelData
} from './VsuSandboxTypes';

interface ChannelProps {
    index: number
    supportSweepAndModulation: boolean
    isNoiseChannel: boolean
    channel: VsuChannelData
    setChannel: (channel: VsuChannelData) => void
    waveForms: number[][]
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const { index, supportSweepAndModulation, isNoiseChannel, channel, setChannel, waveForms } = props;

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

    const setInterval = (interval: number) => {
        setChannel({
            ...channel,
            interval: {
                ...channel?.interval,
                value: clamp(interval, 0, 31),
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

    const toggleEnvelopeRepeat = () => {
        setChannel({
            ...channel,
            envelope: {
                ...channel?.envelope,
                repeat: !channel?.envelope?.repeat,
            },
        });
    };

    const setEnvelopeDecay = (decay: boolean) => {
        setChannel({
            ...channel,
            envelope: {
                ...channel?.envelope,
                decay,
            },
        });
    };

    const setEnvelopeStepTime = (stepTime: number) => {
        setChannel({
            ...channel,
            envelope: {
                ...channel?.envelope,
                stepTime: clamp(stepTime, ENVELOPE_STEP_TIME_MIN, ENVELOPE_STEP_TIME_MAX),
            },
        });
    };

    const setEnvelopeInitialValue = (initialValue: number) => {
        setChannel({
            ...channel,
            envelope: {
                ...channel?.envelope,
                initialValue: clamp(initialValue, ENVELOPE_INITIAL_VALUE_MIN, ENVELOPE_INITIAL_VALUE_MAX),
            },
        });
    };

    const toggleSweepModulationEnabled = () => {
        setChannel({
            ...channel,
            sweepModulation: {
                ...channel?.sweepModulation,
                enabled: !channel?.sweepModulation?.enabled,
            },
        });
    };

    const toggleSweepModulationRepeat = () => {
        setChannel({
            ...channel,
            sweepModulation: {
                ...channel?.sweepModulation,
                repeat: !channel?.sweepModulation?.repeat,
            },
        });
    };

    const setSweepModulationSweep = (sweep: boolean) => {
        setChannel({
            ...channel,
            sweepModulation: {
                ...channel?.sweepModulation,
                sweep,
            },
        });
    };

    const setSweepModulationFrequency = (frequency: number) => {
        setChannel({
            ...channel,
            sweepModulation: {
                ...channel?.sweepModulation,
                frequency: clamp(frequency, SWEEP_MODULATION_FREQUENCY_MIN, SWEEP_MODULATION_FREQUENCY_MAX),
            },
        });
    };

    const setSweepModulationInterval = (interval: number) => {
        setChannel({
            ...channel,
            sweepModulation: {
                ...channel?.sweepModulation,
                interval: clamp(interval, SWEEP_MODULATION_INTERVAL_MIN, SWEEP_MODULATION_INTERVAL_MAX),
            },
        });
    };

    const setSweepModulationSweepDown = (sweepDown: boolean) => {
        setChannel({
            ...channel,
            sweepModulation: {
                ...channel?.sweepModulation,
                sweepDown,
            },
        });
    };

    const setSweepModulationShift = (shift: number) => {
        setChannel({
            ...channel,
            sweepModulation: {
                ...channel?.sweepModulation,
                shift: clamp(shift, SWEEP_MODULATION_SHIFT_MIN, SWEEP_MODULATION_SHIFT_MAX),
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

    return <VContainer gap={15}>
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
                    <HContainer gap={15} wrap='wrap'>
                        <VContainer>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={channel?.envelope?.enabled ?? false}
                                    onChange={toggleEnvelopeEnabled}
                                />
                                Enabled
                            </label>
                            {channel?.envelope?.enabled &&
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={channel?.envelope?.repeat ?? false}
                                        onChange={toggleEnvelopeRepeat}
                                    />
                                    Repeat
                                </label>
                            }
                        </VContainer>
                        {channel?.envelope?.enabled &&
                            <>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/vsuSandbox/type', 'Type')}
                                    </label>
                                    <RadioSelect
                                        options={[{
                                            label: 'Grow',
                                            value: false,
                                        }, {
                                            label: 'Decay',
                                            value: true,
                                        }]}
                                        defaultValue={channel?.envelope?.decay ?? true}
                                        onChange={options => setEnvelopeDecay(options[0].value as boolean)}
                                        allowBlank
                                    />
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/vsuSandbox/initialValue', 'Initial Value')}
                                    </label>
                                    <input
                                        className='theia-input'
                                        style={{ width: 72 }}
                                        type='number'
                                        min={ENVELOPE_INITIAL_VALUE_MIN}
                                        max={ENVELOPE_INITIAL_VALUE_MAX}
                                        value={channel?.envelope?.initialValue ?? 0}
                                        onChange={e => setEnvelopeInitialValue(parseInt(e.target.value))}
                                    />
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/vsuSandbox/stepTime', 'Step Time')}
                                    </label>
                                    <select
                                        className="theia-select"
                                        value={channel?.envelope?.stepTime ?? 0}
                                        onChange={e => setEnvelopeStepTime(parseInt(e.target.value))}
                                    >
                                        <option value="0">15.4 ms</option>
                                        <option value="1">30.7 ms</option>
                                        <option value="2">46.1 ms</option>
                                        <option value="3">61.4 ms</option>
                                        <option value="4">76.8 ms</option>
                                        <option value="5">92.2 ms</option>
                                        <option value="6">107.5 ms</option>
                                        <option value="7">122.9 ms</option>
                                    </select>
                                </VContainer>
                            </>
                        }
                    </HContainer>
                </VContainer>
                {supportSweepAndModulation &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/vsuSandbox/sweepModulation', 'Sweep/Modulation')}
                        </label>
                        <HContainer gap={15} wrap='wrap'>
                            <VContainer>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={channel?.sweepModulation?.enabled ?? false}
                                        onChange={toggleSweepModulationEnabled}
                                    />
                                    Enabled
                                </label>
                                {channel?.sweepModulation?.enabled &&
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={channel?.sweepModulation?.repeat ?? false}
                                            onChange={toggleSweepModulationRepeat}
                                        />
                                        Repeat
                                    </label>
                                }
                            </VContainer>
                            {channel?.sweepModulation?.enabled &&
                                <>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/vsuSandbox/type', 'Type')}
                                        </label>
                                        <RadioSelect
                                            options={[{
                                                label: 'Sweep',
                                                value: true,
                                            }, {
                                                label: 'Modulation',
                                                value: false,
                                            }]}
                                            defaultValue={channel?.sweepModulation?.sweep ?? true}
                                            onChange={options => setSweepModulationSweep(options[0].value as boolean)}
                                            allowBlank
                                        />
                                    </VContainer>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/vsuSandbox/clockFrequency', 'Clock Frequency')}
                                        </label>
                                        <select
                                            className="theia-select"
                                            value={channel?.sweepModulation?.frequency ?? 0}
                                            onChange={e => setSweepModulationFrequency(parseInt(e.target.value))}
                                        >
                                            <option value="0">0.96 ms</option>
                                            <option value="1">7.68 ms</option>
                                        </select>
                                    </VContainer>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/vsuSandbox/interval', 'Interval')}
                                        </label>
                                        <input
                                            className='theia-input'
                                            style={{ width: 72 }}
                                            type='number'
                                            min={SWEEP_MODULATION_INTERVAL_MIN}
                                            max={SWEEP_MODULATION_INTERVAL_MAX}
                                            value={channel?.sweepModulation?.interval ?? 0}
                                            onChange={e => setSweepModulationInterval(parseInt(e.target.value))}
                                        />
                                    </VContainer>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/vsuSandbox/sweep', 'Sweep')}
                                        </label>
                                        <RadioSelect
                                            options={[{
                                                label: 'Down',
                                                value: true,
                                            }, {
                                                label: 'Up',
                                                value: false,
                                            }]}
                                            defaultValue={channel?.sweepModulation?.sweepDown ?? true}
                                            onChange={options => setSweepModulationSweepDown(options[0].value as boolean)}
                                            allowBlank
                                        />
                                    </VContainer>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/vsuSandbox/shiftAmount', 'Shift Amount')}
                                        </label>
                                        <input
                                            className='theia-input'
                                            style={{ width: 72 }}
                                            type='number'
                                            min={SWEEP_MODULATION_SHIFT_MIN}
                                            max={SWEEP_MODULATION_SHIFT_MAX}
                                            value={channel?.sweepModulation?.shift ?? 0}
                                            onChange={e => setSweepModulationShift(parseInt(e.target.value))}
                                        />
                                    </VContainer>
                                </>
                            }
                        </HContainer>
                    </VContainer>
                }
            </HContainer>
        }
    </VContainer>;
}
