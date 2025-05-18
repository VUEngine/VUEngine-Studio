import { nls } from '@theia/core';
import React, { useEffect, useState } from 'react';
import HContainer from '../Common/Base/HContainer';
import RadioSelect from '../Common/Base/RadioSelect';
import Range from '../Common/Base/Range';
import VContainer from '../Common/Base/VContainer';
import { clamp } from '../Common/Utils';
import { INPUT_BLOCKING_COMMANDS, NOTES } from '../SoundEditor/SoundEditorTypes';
import WaveformSelect from './WaveformSelect';
import AdvancedSelect from '../Common/Base/AdvancedSelect';
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
} from '../SoundEditor/Emulator/VsuTypes';

interface ChannelProps {
    index: number
    supportSweepAndModulation: boolean
    isNoiseChannel: boolean
    channel: VsuChannelData
    setTrack: (channel: VsuChannelData) => void
    waveForms: number[][]
    setPianoChannel: (trackId: number) => void
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const { index, supportSweepAndModulation, isNoiseChannel, channel, setTrack, waveForms, setPianoChannel } = props;
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
        setTrack({
            ...channel,
            enabled: !channel?.enabled,
        });
    };

    const setWaveform = (waveform: number) => {
        setTrack({
            ...channel,
            waveform,
        });
    };

    const toggleIntervalEnabled = () => {
        setTrack({
            ...channel,
            interval: {
                ...channel?.interval,
                enabled: !channel?.interval?.enabled,
            },
        });
    };

    const setTap = (tap: number) => {
        setTrack({
            ...channel,
            tap,
        });
    };

    const setInterval = (interval: number) => {
        setTrack({
            ...channel,
            interval: {
                ...channel?.interval,
                value: clamp(interval, 0, 31),
            },
        });
    };

    const toggleEnvelopeEnabled = () => {
        setTrack({
            ...channel,
            envelope: {
                ...channel?.envelope,
                enabled: !channel?.envelope?.enabled,
            },
        });
    };

    const toggleEnvelopeRepeat = () => {
        setTrack({
            ...channel,
            envelope: {
                ...channel?.envelope,
                repeat: !channel?.envelope?.repeat,
            },
        });
    };

    const setEnvelopeDirection = (direction: VsuEnvelopeDirection) => {
        setTrack({
            ...channel,
            envelope: {
                ...channel?.envelope,
                direction,
            },
        });
    };

    const setEnvelopeStepTime = (stepTime: number) => {
        setTrack({
            ...channel,
            envelope: {
                ...channel?.envelope,
                stepTime: clamp(stepTime, VSU_ENVELOPE_STEP_TIME_MIN, VSU_ENVELOPE_STEP_TIME_MAX),
            },
        });
    };

    const setEnvelopeInitialValue = (initialValue: number) => {
        setTrack({
            ...channel,
            envelope: {
                ...channel?.envelope,
                initialValue: clamp(initialValue, VSU_ENVELOPE_INITIAL_VALUE_MIN, VSU_ENVELOPE_INITIAL_VALUE_MAX),
            },
        });
    };

    const toggleSweepModulationEnabled = () => {
        setTrack({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                enabled: !channel?.sweepMod?.enabled,
            },
        });
    };

    const toggleSweepModulationRepeat = () => {
        setTrack({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                repeat: !channel?.sweepMod?.repeat,
            },
        });
    };

    const setSweepModulationFunction = (fnc: VsuSweepModulationFunction) => {
        setTrack({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                function: fnc,
            },
        });
    };

    const setSweepModulationFrequency = (frequency: number) => {
        setTrack({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                frequency: clamp(frequency, VSU_SWEEP_MODULATION_FREQUENCY_MIN, VSU_SWEEP_MODULATION_FREQUENCY_MAX),
            },
        });
    };

    const setSweepModulationInterval = (interval: number) => {
        setTrack({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                interval: clamp(interval, VSU_SWEEP_MODULATION_INTERVAL_MIN, VSU_SWEEP_MODULATION_INTERVAL_MAX),
            },
        });
    };

    const setSweepDirection = (direction: VsuSweepDirection) => {
        setTrack({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                direction,
            },
        });
    };

    const setSweepModulationShift = (shift: number) => {
        setTrack({
            ...channel,
            sweepMod: {
                ...channel?.sweepMod,
                shift: clamp(shift, VSU_SWEEP_MODULATION_SHIFT_MIN, VSU_SWEEP_MODULATION_SHIFT_MAX),
            },
        });
    };

    const setStereoLevel = (side: 'left' | 'right', value: number) => {
        setTrack({
            ...channel,
            stereoLevels: {
                ...channel?.stereoLevels,
                [side]: value,
            }
        });
    };

    const setFrequency = (frequency: number): void => {
        setTrack({
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
            {nls.localize('vuengine/editors/vsuSandbox/channel', 'Channel')} {index}
            {isNoiseChannel &&
                ` (${nls.localize('vuengine/editors/vsuSandbox/noise', 'Noise')})`
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
                        {nls.localize('vuengine/editors/vsuSandbox/waveForm', 'WaveForm')}
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
                            {nls.localize('vuengine/editors/vsuSandbox/tap', 'Tap')}
                        </label>
                        <AdvancedSelect
                            options={VSU_NOISE_TAP.map((tl, i) => ({
                                label: tl[0].toString(),
                                value: i.toString()
                            }))}
                            defaultValue={channel?.tap?.toString() ?? '0'}
                            onChange={options => setTap(parseInt(options[0]))}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                    </VContainer>
                }
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/vsuSandbox/stereoLevels', 'Stereo Levels')}
                    </label>
                    <HContainer alignItems='center'>
                        <div style={{ minWidth: 10, width: 10 }}>
                            L
                        </div>
                        <Range
                            value={channel?.stereoLevels?.left}
                            max={15}
                            min={0}
                            setValue={(v: number) => setStereoLevel('left', v)}
                        />
                    </HContainer>
                    <HContainer alignItems='center'>
                        <div style={{ minWidth: 10, width: 10 }}>
                            R
                        </div>
                        <Range
                            value={channel?.stereoLevels?.right}
                            max={15}
                            min={0}
                            setValue={(v: number) => setStereoLevel('right', v)}
                        />
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/vsuSandbox/frequency', 'Frequency')}
                    </label>
                    <input
                        className='theia-input'
                        style={{ width: 110 }}
                        type='number'
                        min={VSU_FREQUENCY_MIN}
                        max={VSU_FREQUENCY_MAX}
                        value={channel?.frequency ?? 0}
                        onChange={e => setFrequency(e.target.value === '' ? 0 : parseInt(e.target.value))}
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
                        {nls.localize('vuengine/editors/vsuSandbox/interval', 'Interval')}
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
                                    {nls.localize('vuengine/editors/vsuSandbox/length', 'Length')}
                                </label>
                                <AdvancedSelect
                                    options={VSU_INTERVAL_VALUES.map((intv, i) => ({
                                        label: `${intv} ms`,
                                        value: i.toString(),
                                    }))}
                                    defaultValue={channel?.interval?.value?.toString() ?? '0'}
                                    onChange={options => setInterval(parseInt(options[0]))}
                                    commands={INPUT_BLOCKING_COMMANDS}
                                />
                            </VContainer>
                        }
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/vsuSandbox/envelope', 'Envelope')}
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
                                        {nls.localizeByDefault('Type')}
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
                                        {nls.localize('vuengine/editors/vsuSandbox/stepTime', 'Step Time')}
                                    </label>
                                    <AdvancedSelect
                                        options={VSU_ENVELOPE_STEP_TIME_VALUES.map((intv, i) => ({
                                            label: `${intv} ms`,
                                            value: i.toString(),
                                        }))}
                                        defaultValue={channel?.envelope?.stepTime?.toString() ?? '0'}
                                        onChange={options => setEnvelopeStepTime(parseInt(options[0]))}
                                        commands={INPUT_BLOCKING_COMMANDS}
                                    />
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/editors/vsuSandbox/initialValue', 'Initial Value')}
                                    </label>
                                    <input
                                        className='theia-input'
                                        style={{ width: 72 }}
                                        type='number'
                                        min={VSU_ENVELOPE_INITIAL_VALUE_MIN}
                                        max={VSU_ENVELOPE_INITIAL_VALUE_MAX}
                                        value={channel?.envelope?.initialValue ?? 15}
                                        onChange={e => setEnvelopeInitialValue(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    />
                                </VContainer>
                            </>
                        }
                    </HContainer>
                </VContainer>
                {supportSweepAndModulation &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/vsuSandbox/sweepModulation', ' Sweep / Modulation')}
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
                                        {nls.localize('vuengine/editors/sound/repeat', 'Repeat')}
                                    </label>
                                }
                            </VContainer>
                            {channel?.sweepMod?.enabled &&
                                <>
                                    <VContainer>
                                        <label>
                                            {nls.localizeByDefault('Type')}
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
                                            {nls.localize('vuengine/editors/vsuSandbox/clockFrequency', 'Clock Frequency')}
                                        </label>
                                        <AdvancedSelect
                                            options={[{
                                                label: '0.96 ms',
                                                value: '0',
                                            }, {
                                                label: '7.68 ms',
                                                value: '1',
                                            }]}
                                            defaultValue={channel?.sweepMod?.frequency?.toString() ?? '0'}
                                            onChange={options => setSweepModulationFrequency(parseInt(options[0]))}
                                            commands={INPUT_BLOCKING_COMMANDS}
                                        />
                                    </VContainer>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/editors/vsuSandbox/interval', 'Interval')}
                                        </label>
                                        <input
                                            className='theia-input'
                                            style={{ width: 72 }}
                                            type='number'
                                            min={VSU_SWEEP_MODULATION_INTERVAL_MIN}
                                            max={VSU_SWEEP_MODULATION_INTERVAL_MAX}
                                            value={channel?.sweepMod?.interval ?? 0}
                                            onChange={e => setSweepModulationInterval(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                        />
                                    </VContainer>
                                    {channel?.sweepMod?.function === VsuSweepModulationFunction.Sweep &&
                                        <>
                                            <VContainer>
                                                <label>
                                                    {nls.localize('vuengine/editors/vsuSandbox/sweep', 'Sweep')}
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
                                                    {nls.localize('vuengine/editors/vsuSandbox/shiftAmount', 'Shift Amount')}
                                                </label>
                                                <input
                                                    className='theia-input'
                                                    style={{ width: 72 }}
                                                    type='number'
                                                    min={VSU_SWEEP_MODULATION_SHIFT_MIN}
                                                    max={VSU_SWEEP_MODULATION_SHIFT_MAX}
                                                    value={channel?.sweepMod?.shift ?? 0}
                                                    onChange={e => setSweepModulationShift(e.target.value === '' ? 0 : parseInt(e.target.value))}
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
