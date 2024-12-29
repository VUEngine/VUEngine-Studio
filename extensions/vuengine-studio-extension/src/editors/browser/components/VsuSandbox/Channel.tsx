import { nls } from '@theia/core';
import React, { useEffect, useState } from 'react';
import HContainer from '../Common/Base/HContainer';
import RadioSelect from '../Common/Base/RadioSelect';
import { clamp } from '../Common/Utils';
import VContainer from '../Common/Base/VContainer';
import { NOTES } from '../MusicEditor/MusicEditorTypes';
import {
    VSU_ENVELOPE_INITIAL_VALUE_MAX,
    VSU_ENVELOPE_INITIAL_VALUE_MIN,
    VSU_ENVELOPE_STEP_TIME_MAX,
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_ENVELOPE_STEP_TIME_VALUES,
    VSU_FREQUENCY_MAX,
    VSU_FREQUENCY_MIN,
    VSU_INTERVAL_VALUES,
    VSU_NOISE_TAP,
    VSU_SWEEP_MODULATION_FREQUENCY_MAX,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MAX,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MAX,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuChannelData,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction
} from '../VsuEmulator/VsuEmulatorTypes';
import WaveformSelect from './WaveformSelect';

interface ChannelProps {
    index: number
    supportSweepAndModulation: boolean
    isNoiseChannel: boolean
    channel: VsuChannelData
    setChannel: (channel: VsuChannelData) => void
    waveForms: number[][]
    setPianoChannel: (channel: number) => void
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const { index, supportSweepAndModulation, isNoiseChannel, channel, setChannel, waveForms, setPianoChannel } = props;
    const [note, setNote] = useState<string>('');

    const frequencyToHertz = (frequency: number): number =>
        5000000 / ((2048 - frequency) * 32);

    /*
    const frequencyFromHertz = (fHz: number): number =>
        Math.round(2048 - 5000000 / (32 * fHz));
    */

    const noiseFrequencyToHertz = (frequency: number): number =>
        500000 / (2048 - frequency);

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

    const setTap = (tap: number) => {
        setChannel({
            ...channel,
            tap,
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

    const setEnvelopeDirection = (direction: VsuEnvelopeDirection) => {
        setChannel({
            ...channel,
            envelope: {
                ...channel?.envelope,
                direction,
            },
        });
    };

    const setEnvelopeStepTime = (stepTime: number) => {
        setChannel({
            ...channel,
            envelope: {
                ...channel?.envelope,
                stepTime: clamp(stepTime, VSU_ENVELOPE_STEP_TIME_MIN, VSU_ENVELOPE_STEP_TIME_MAX),
            },
        });
    };

    const setEnvelopeInitialValue = (initialValue: number) => {
        setChannel({
            ...channel,
            envelope: {
                ...channel?.envelope,
                initialValue: clamp(initialValue, VSU_ENVELOPE_INITIAL_VALUE_MIN, VSU_ENVELOPE_INITIAL_VALUE_MAX),
            },
        });
    };

    const toggleSweepModulationEnabled = () => {
        setChannel({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                enabled: !channel?.sweepMod?.enabled,
            },
        });
    };

    const toggleSweepModulationRepeat = () => {
        setChannel({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                repeat: !channel?.sweepMod?.repeat,
            },
        });
    };

    const setSweepModulationFunction = (fnc: VsuSweepModulationFunction) => {
        setChannel({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                function: fnc,
            },
        });
    };

    const setSweepModulationFrequency = (frequency: number) => {
        setChannel({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                frequency: clamp(frequency, VSU_SWEEP_MODULATION_FREQUENCY_MIN, VSU_SWEEP_MODULATION_FREQUENCY_MAX),
            },
        });
    };

    const setSweepModulationInterval = (interval: number) => {
        setChannel({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                interval: clamp(interval, VSU_SWEEP_MODULATION_INTERVAL_MIN, VSU_SWEEP_MODULATION_INTERVAL_MAX),
            },
        });
    };

    const setSweepDirection = (direction: VsuSweepDirection) => {
        setChannel({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                direction,
            },
        });
    };

    const setSweepModulationShift = (shift: number) => {
        setChannel({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                shift: clamp(shift, VSU_SWEEP_MODULATION_SHIFT_MIN, VSU_SWEEP_MODULATION_SHIFT_MAX),
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
            frequency: clamp(frequency, VSU_FREQUENCY_MIN, VSU_FREQUENCY_MAX),
        });
    };

    const findNoteByFrequency = (): void => {
        const frequency = channel?.frequency ?? 0;
        const notesList = Object.keys(NOTES);
        for (let i = 0; i < notesList.length; i++) {
            const n = notesList[i];
            const noteFrequency = NOTES[n];
            if (noteFrequency > 0) {
                if (frequency === noteFrequency) {
                    return setNote(n);
                } else if (frequency > noteFrequency) {
                    return setNote(`${n}+`);
                }
            }
        }

        return setNote('');
    };

    useEffect(() => {
        findNoteByFrequency();
    }, [channel?.frequency]);

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
            {nls.localizeByDefault('Enabled')}
        </label>
        {channel?.enabled &&
            <HContainer gap={25} wrap='wrap'>
                {!isNoiseChannel && <>
                    <VContainer>
                        {nls.localize('vuengine/vsuSandbox/waveForm', 'WaveForm')}
                        <WaveformSelect
                            value={channel?.waveform}
                            setValue={setWaveform}
                            waveforms={waveForms}
                        />
                    </VContainer>
                </>}
                {isNoiseChannel &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/vsuSandbox/tap', 'Tap')}
                        </label>
                        <select
                            className="theia-select"
                            value={channel?.tap ?? 0}
                            onChange={e => setTap(parseInt(e.target.value))}
                        >
                            {VSU_NOISE_TAP.map((tl, i) =>
                                <option value={i}>{tl[0]}</option>
                            )}
                        </select>
                    </VContainer>
                }
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
                        <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
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
                        <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
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
                        style={{ width: 110 }}
                        type='number'
                        min={VSU_FREQUENCY_MIN}
                        max={VSU_FREQUENCY_MAX}
                        value={channel?.frequency ?? 0}
                        onChange={e => setFrequency(parseInt(e.target.value))}
                        onFocus={() => setPianoChannel(index)}
                        onBlur={() => setPianoChannel(0)}
                    />
                    <HContainer>
                        {!isNoiseChannel && <>
                            <div>
                                {Math.round(frequencyToHertz(channel?.frequency ?? 0) * 100) / 100} Hz
                            </div>
                            <div style={{ flexGrow: 1, textAlign: 'right' }}>
                                {note}
                            </div>
                        </>
                        }
                        {isNoiseChannel &&
                            `${Math.round(noiseFrequencyToHertz(channel?.frequency ?? 0) * 100) / 100} Hz`
                        }
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/vsuSandbox/interval', 'Interval')}
                    </label>
                    <HContainer gap={15} wrap='wrap'>
                        <label>
                            <input
                                type="checkbox"
                                checked={channel?.interval?.enabled ?? false}
                                onChange={toggleIntervalEnabled}
                            />
                            {nls.localizeByDefault('Enabled')}
                        </label>
                        {channel?.interval?.enabled &&
                            <VContainer>
                                <label>
                                    {nls.localize('vuengine/vsuSandbox/length', 'Length')}
                                </label>
                                <select
                                    className="theia-select"
                                    value={channel?.interval?.value ?? 0}
                                    onChange={e => setInterval(parseInt(e.target.value))}
                                >
                                    {VSU_INTERVAL_VALUES.map((intv, i) =>
                                        <option value={i}>{intv} ms</option>
                                    )}
                                </select>
                            </VContainer>
                        }
                    </HContainer>
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
                                {nls.localizeByDefault('Enabled')}
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
                                            value: VsuEnvelopeDirection.Grow,
                                        }, {
                                            label: 'Decay',
                                            value: VsuEnvelopeDirection.Decay,
                                        }]}
                                        defaultValue={channel?.envelope?.direction ?? true}
                                        onChange={options => setEnvelopeDirection(options[0].value as VsuEnvelopeDirection)}
                                        allowBlank
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
                                        {VSU_ENVELOPE_STEP_TIME_VALUES.map((st, i) =>
                                            <option value={i}>{st} ms</option>
                                        )}
                                    </select>
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/vsuSandbox/initialValue', 'Initial Value')}
                                    </label>
                                    <input
                                        className='theia-input'
                                        style={{ width: 72 }}
                                        type='number'
                                        min={VSU_ENVELOPE_INITIAL_VALUE_MIN}
                                        max={VSU_ENVELOPE_INITIAL_VALUE_MAX}
                                        value={channel?.envelope?.initialValue ?? 15}
                                        onChange={e => setEnvelopeInitialValue(parseInt(e.target.value))}
                                    />
                                </VContainer>
                            </>
                        }
                    </HContainer>
                </VContainer>
                {supportSweepAndModulation &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/vsuSandbox/sweepModulation', ' Sweep / Modulation')}
                        </label>
                        <HContainer gap={15} wrap='wrap'>
                            <VContainer>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={channel?.sweepMod?.enabled ?? false}
                                        onChange={toggleSweepModulationEnabled}
                                    />
                                    {nls.localizeByDefault('Enabled')}
                                </label>
                                {channel?.sweepMod?.enabled &&
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={channel?.sweepMod?.repeat ?? false}
                                            onChange={toggleSweepModulationRepeat}
                                        />
                                        {nls.localizeByDefault('Repeat')}
                                    </label>
                                }
                            </VContainer>
                            {channel?.sweepMod?.enabled &&
                                <>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/vsuSandbox/type', 'Type')}
                                        </label>
                                        <RadioSelect
                                            options={[{
                                                label: 'Modulation',
                                                value: VsuSweepModulationFunction.Modulation,
                                            }, {
                                                label: 'Sweep',
                                                value: VsuSweepModulationFunction.Sweep,
                                            }]}
                                            defaultValue={channel?.sweepMod?.function ?? VsuSweepModulationFunction.Sweep}
                                            onChange={options => setSweepModulationFunction(options[0].value as VsuSweepModulationFunction)}
                                            allowBlank
                                        />
                                    </VContainer>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/vsuSandbox/clockFrequency', 'Clock Frequency')}
                                        </label>
                                        <select
                                            className="theia-select"
                                            value={channel?.sweepMod?.frequency ?? 0}
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
                                            min={VSU_SWEEP_MODULATION_INTERVAL_MIN}
                                            max={VSU_SWEEP_MODULATION_INTERVAL_MAX}
                                            value={channel?.sweepMod?.interval ?? 0}
                                            onChange={e => setSweepModulationInterval(parseInt(e.target.value))}
                                        />
                                    </VContainer>
                                    {channel?.sweepMod?.function === VsuSweepModulationFunction.Sweep &&
                                        <>
                                            <VContainer>
                                                <label>
                                                    {nls.localize('vuengine/vsuSandbox/sweep', 'Sweep')}
                                                </label>
                                                <RadioSelect
                                                    options={[{
                                                        label: 'Up',
                                                        value: VsuSweepDirection.Up,
                                                    }, {
                                                        label: 'Down',
                                                        value: VsuSweepDirection.Down,
                                                    }]}
                                                    defaultValue={channel?.sweepMod?.direction ?? true}
                                                    onChange={options => setSweepDirection(options[0].value as VsuSweepDirection)}
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
                                                    min={VSU_SWEEP_MODULATION_SHIFT_MIN}
                                                    max={VSU_SWEEP_MODULATION_SHIFT_MAX}
                                                    value={channel?.sweepMod?.shift ?? 0}
                                                    onChange={e => setSweepModulationShift(parseInt(e.target.value))}
                                                />
                                            </VContainer>
                                        </>
                                    }
                                </>
                            }
                        </HContainer>
                    </VContainer>
                }
            </HContainer>
        }
    </VContainer >;
}
