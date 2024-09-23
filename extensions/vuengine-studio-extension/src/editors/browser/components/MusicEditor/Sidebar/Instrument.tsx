import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import RadioSelect from '../../Common/RadioSelect';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import {
    VSU_ENVELOPE_INITIAL_VALUE_MAX,
    VSU_ENVELOPE_INITIAL_VALUE_MIN,
    VSU_ENVELOPE_STEP_TIME_MAX,
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_ENVELOPE_STEP_TIME_VALUES,
    VSU_INTERVAL_VALUES,
    VSU_SWEEP_MODULATION_FREQUENCY_MAX,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MAX,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MAX,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
} from '../../VsuEmulator/VsuEmulatorTypes';
import WaveformSelect from '../../VsuSandbox/WaveformSelect';
import { INPUT_BLOCKING_COMMANDS } from '../MusicEditor';
import { InstrumentConfig, SongData } from '../MusicEditorTypes';
import { InputWithActionButton } from './Instruments';

interface InstrumentProps {
    songData: SongData
    currentInstrument: number
    setInstruments: (instruments: InstrumentConfig[]) => void
    setSidebarTab: Dispatch<SetStateAction<number>>
}

export default function Instrument(props: InstrumentProps): React.JSX.Element {
    const {
        songData,
        currentInstrument,
        setInstruments,
        setSidebarTab,
    } = props;
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

    const instrument = songData.instruments[currentInstrument];

    const setName = (name: string) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            name,
        };

        setInstruments(updatedInstruments);
    };

    const setWaveform = (waveform: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            waveform,
        };

        setInstruments(updatedInstruments);
    };

    const toggleIntervalEnabled = () => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            interval: {
                ...instrument.interval,
                enabled: !instrument.interval?.enabled,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setInterval = (interval: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            interval: {
                ...instrument.interval,
                value: clamp(interval, 0, 31),
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleEnvelopeEnabled = () => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument.envelope,
                enabled: !instrument.envelope?.enabled,
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleEnvelopeRepeat = () => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument.envelope,
                repeat: !instrument.envelope?.repeat,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeDecay = (decay: boolean) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument.envelope,
                direction: decay,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeStepTime = (stepTime: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument.envelope,
                stepTime: clamp(stepTime, VSU_ENVELOPE_STEP_TIME_MIN, VSU_ENVELOPE_STEP_TIME_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeInitialValue = (initialValue: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument.envelope,
                initialValue: clamp(initialValue, VSU_ENVELOPE_INITIAL_VALUE_MIN, VSU_ENVELOPE_INITIAL_VALUE_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleSweepModulationEnabled = () => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument.sweepMod,
                enabled: !instrument.sweepMod?.enabled,
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleSweepModulationRepeat = () => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument.sweepMod,
                repeat: !instrument.sweepMod?.repeat,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationFunction = (modulation: boolean) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument.sweepMod,
                function: modulation,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationFrequency = (frequency: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument.sweepMod,
                frequency: clamp(frequency, VSU_SWEEP_MODULATION_FREQUENCY_MIN, VSU_SWEEP_MODULATION_FREQUENCY_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationInterval = (interval: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument.sweepMod,
                interval: clamp(interval, VSU_SWEEP_MODULATION_INTERVAL_MIN, VSU_SWEEP_MODULATION_INTERVAL_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationDirection = (direction: boolean) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument.sweepMod,
                direction,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationShift = (shift: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument.sweepMod,
                shift: clamp(shift, VSU_SWEEP_MODULATION_SHIFT_MIN, VSU_SWEEP_MODULATION_SHIFT_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    return <VContainer gap={15}>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/name', 'Name')}
            </label>
            <input
                className='theia-input'
                value={instrument.name}
                onChange={e => setName(e.target.value)}
                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/waveform', 'Waveform')}
            </label>
            <HContainer alignItems='end' gap={10}>
                <WaveformSelect
                    value={instrument.waveform}
                    setValue={setWaveform}
                    waveforms={songData.waveforms}
                />
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localize('vuengine/musicEditor/editWaveforms', 'Edit Waveforms')}
                    onClick={() => setSidebarTab(3)}
                >
                    <i className='codicon codicon-settings-gear' />
                </InputWithActionButton>
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
                        checked={instrument.interval?.enabled ?? false}
                        onChange={toggleIntervalEnabled}
                    />
                    Enabled
                </label>
                {instrument.interval?.enabled &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/vsuSandbox/length', 'Length')}
                        </label>
                        <select
                            className="theia-select"
                            value={instrument.interval?.value ?? 0}
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
                            checked={instrument.envelope?.enabled ?? false}
                            onChange={toggleEnvelopeEnabled}
                        />
                        Enabled
                    </label>
                    {instrument.envelope?.enabled &&
                        <label>
                            <input
                                type="checkbox"
                                checked={instrument.envelope?.repeat ?? false}
                                onChange={toggleEnvelopeRepeat}
                            />
                            Repeat
                        </label>
                    }
                </VContainer>
                {instrument.envelope?.enabled &&
                    <>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/vsuSandbox/type', 'Type')}
                            </label>
                            <RadioSelect
                                options={[{
                                    label: 'Grow',
                                    value: true,
                                }, {
                                    label: 'Decay',
                                    value: false,
                                }]}
                                defaultValue={instrument.envelope?.direction ?? true}
                                onChange={options => setEnvelopeDecay(options[0].value as boolean)}
                                allowBlank
                            />
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/vsuSandbox/stepTime', 'Step Time')}
                            </label>
                            <select
                                className="theia-select"
                                value={instrument.envelope?.stepTime ?? 0}
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
                                value={instrument.envelope?.initialValue ?? 15}
                                onChange={e => setEnvelopeInitialValue(parseInt(e.target.value))}
                            />
                        </VContainer>
                    </>
                }
            </HContainer>
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/vsuSandbox/sweepModulation', 'Sweep / Modulation')}
            </label>
            <HContainer gap={15} wrap='wrap'>
                <VContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={instrument.sweepMod?.enabled ?? false}
                            onChange={toggleSweepModulationEnabled}
                        />
                        Enabled
                    </label>
                    {instrument.sweepMod?.enabled &&
                        <label>
                            <input
                                type="checkbox"
                                checked={instrument.sweepMod?.repeat ?? false}
                                onChange={toggleSweepModulationRepeat}
                            />
                            Repeat
                        </label>
                    }
                </VContainer>
                {instrument.sweepMod?.enabled &&
                    <>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/vsuSandbox/type', 'Type')}
                            </label>
                            <RadioSelect
                                options={[{
                                    label: 'Modulation',
                                    value: true,
                                }, {
                                    label: 'Sweep',
                                    value: false,
                                }]}
                                defaultValue={instrument.sweepMod?.function ?? true}
                                onChange={options => setSweepModulationFunction(options[0].value as boolean)}
                                allowBlank
                            />
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/vsuSandbox/clockFrequency', 'Clock Frequency')}
                            </label>
                            <select
                                className="theia-select"
                                value={instrument.sweepMod?.frequency ?? 0}
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
                                value={instrument.sweepMod?.interval ?? 0}
                                onChange={e => setSweepModulationInterval(parseInt(e.target.value))}
                            />
                        </VContainer>
                        {!instrument.sweepMod?.function &&
                            <>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/vsuSandbox/sweep', 'Sweep')}
                                    </label>
                                    <RadioSelect
                                        options={[{
                                            label: 'Up',
                                            value: true,
                                        }, {
                                            label: 'Down',
                                            value: false,
                                        }]}
                                        defaultValue={instrument.sweepMod?.direction ?? true}
                                        onChange={options => setSweepModulationDirection(options[0].value as boolean)}
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
                                        value={instrument.sweepMod?.shift ?? 0}
                                        onChange={e => setSweepModulationShift(parseInt(e.target.value))}
                                    />
                                </VContainer>
                            </>
                        }
                    </>
                }
            </HContainer>
        </VContainer>
    </VContainer>;
}
