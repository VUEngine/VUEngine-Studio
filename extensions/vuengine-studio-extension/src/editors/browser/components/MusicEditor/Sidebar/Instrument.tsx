import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import RadioSelect from '../../Common/Base/RadioSelect';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/Base/VContainer';
import {
    VSU_ENVELOPE_INITIAL_VALUE_MAX,
    VSU_ENVELOPE_INITIAL_VALUE_MIN,
    VSU_ENVELOPE_STEP_TIME_MAX,
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_ENVELOPE_STEP_TIME_VALUES,
    VSU_INTERVAL_VALUES,
    VSU_NOISE_TAP_LOCATIONS,
    VSU_SWEEP_MODULATION_FREQUENCY_MAX,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MAX,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MAX,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
} from '../../VsuEmulator/VsuEmulatorTypes';
import WaveformSelect from '../../VsuSandbox/WaveformSelect';
import { INPUT_BLOCKING_COMMANDS } from '../MusicEditor';
import { InstrumentConfig, MusicEditorInstrumentType, SongData } from '../MusicEditorTypes';
import { InputWithActionButton } from './Instruments';

interface InstrumentProps {
    songData: SongData
    currentInstrument: number
    setInstruments: (instruments: InstrumentConfig[]) => void
    setSidebarTab: Dispatch<SetStateAction<number>>
    setModulationDataDialogOpen: Dispatch<SetStateAction<number>>
}

export default function Instrument(props: InstrumentProps): React.JSX.Element {
    const {
        songData,
        currentInstrument,
        setInstruments,
        setSidebarTab,
        setModulationDataDialogOpen,
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

    const setType = (type: MusicEditorInstrumentType) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            type,
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

    const setVolume = (side: 'left' | 'right', value: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            volume: {
                ...updatedInstruments[currentInstrument].volume,
                [side]: value,
            },
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
                enabled: !instrument.envelope.enabled,
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
                repeat: !instrument.envelope.repeat,
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
                enabled: !instrument.sweepMod.enabled,
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
                repeat: !instrument.sweepMod.repeat,
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

    const setTapLocation = (tapLocation: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            tapLocation,
        };

        setInstruments(updatedInstruments);
    };

    return <VContainer gap={15}>
        <HContainer gap={15}>
            <VContainer grow={1}>
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
                    {nls.localize('vuengine/musicEditor/type', 'Type')}
                </label>
                <RadioSelect
                    options={[{
                        label: nls.localize('vuengine/musicEditor/wave', 'Wave'),
                        value: MusicEditorInstrumentType.WAVE,
                    }, {
                        label: nls.localize('vuengine/musicEditor/noise', 'Noise'),
                        value: MusicEditorInstrumentType.NOISE,
                    }]}
                    defaultValue={instrument.type}
                    onChange={options => setType(options[0].value as MusicEditorInstrumentType)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/volume', 'Volume')}
            </label>
            <HContainer alignItems="center">
                <div style={{ minWidth: 10, width: 10 }}>
                    L
                </div>
                <input
                    type="range"
                    value={instrument.volume.left ?? 15}
                    max={15}
                    min={0}
                    step={1}
                    onChange={e => setVolume('left', parseInt(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    {instrument.volume.left ?? 15}
                </div>
            </HContainer>
            <HContainer alignItems="center">
                <div style={{ minWidth: 10, width: 10 }}>
                    R
                </div>
                <input
                    type="range"
                    value={instrument.volume.right ?? 15}
                    max={15}
                    min={0}
                    step={1}
                    onChange={e => setVolume('right', parseInt(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    {instrument.volume.right ?? 15}
                </div>
            </HContainer>
        </VContainer>
        {instrument.type === MusicEditorInstrumentType.WAVE &&
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
        }
        {instrument.type === MusicEditorInstrumentType.NOISE &&
            <VContainer>
                <label>
                    {nls.localize('vuengine/musicEditor/tapLocation', 'Tap Location')}
                </label>
                <select
                    className="theia-select"
                    value={instrument.tapLocation}
                    onChange={e => setTapLocation(parseInt(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    {VSU_NOISE_TAP_LOCATIONS.map((tl, i) =>
                        <option value={i}>{tl}</option>
                    )}
                </select>
            </VContainer>
        }
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/interval', 'Interval')}
            </label>
            <VContainer gap={15}>
                <label>
                    <input
                        type="checkbox"
                        checked={instrument.interval?.enabled}
                        onChange={toggleIntervalEnabled}
                    />
                    {nls.localizeByDefault('Enabled')}
                </label>
                {instrument.interval?.enabled &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/musicEditor/length', 'Length')}
                        </label>
                        <select
                            className="theia-select"
                            value={instrument.interval?.value

                            }
                            onChange={e => setInterval(parseInt(e.target.value))}
                        >
                            {VSU_INTERVAL_VALUES.map((intv, i) =>
                                <option value={i}>{intv} ms</option>
                            )}
                        </select>
                    </VContainer>
                }
            </VContainer>
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/envelope', 'Envelope')}
            </label>
            <VContainer gap={15}>
                <VContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={instrument.envelope.enabled}
                            onChange={toggleEnvelopeEnabled}
                        />
                        {nls.localizeByDefault('Enabled')}
                    </label>
                    {instrument.envelope.enabled &&
                        <label>
                            <input
                                type="checkbox"
                                checked={instrument.envelope.repeat}
                                onChange={toggleEnvelopeRepeat}
                            />
                            Repeat
                        </label>
                    }
                </VContainer>
                {instrument.envelope.enabled &&
                    <>
                        <HContainer gap={15}>
                            <VContainer>
                                <label>
                                    {nls.localize('vuengine/musicEditor/type', 'Type')}
                                </label>
                                <RadioSelect
                                    options={[{
                                        label: 'Grow',
                                        value: true,
                                    }, {
                                        label: 'Decay',
                                        value: false,
                                    }]}
                                    defaultValue={instrument.envelope.direction}
                                    onChange={options => setEnvelopeDecay(options[0].value as boolean)}
                                    allowBlank
                                />
                            </VContainer>
                            <VContainer>
                                <label>
                                    {nls.localize('vuengine/musicEditor/stepTime', 'Step Time')}
                                </label>
                                <select
                                    className="theia-select"
                                    value={instrument.envelope.stepTime

                                    }
                                    onChange={e => setEnvelopeStepTime(parseInt(e.target.value))}
                                >
                                    {VSU_ENVELOPE_STEP_TIME_VALUES.map((st, i) =>
                                        <option value={i}>{st} ms</option>
                                    )}
                                </select>
                            </VContainer>
                        </HContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/musicEditor/initialVolume', 'Initial Volume')}
                            </label>
                            <HContainer alignItems="center">
                                <input
                                    type="range"
                                    min={VSU_ENVELOPE_INITIAL_VALUE_MIN}
                                    max={VSU_ENVELOPE_INITIAL_VALUE_MAX}
                                    value={instrument.envelope.initialValue}
                                    onChange={e => setEnvelopeInitialValue(parseInt(e.target.value))}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                                    {instrument.envelope.initialValue}
                                </div>
                            </HContainer>
                        </VContainer>
                    </>
                }
            </VContainer>
        </VContainer>
        {instrument.type === MusicEditorInstrumentType.WAVE &&
            <VContainer>
                <label>
                    {nls.localize('vuengine/musicEditor/sweepModulation', 'Sweep / Modulation')}{' '}
                    <span className="lightLabel">
                        {nls.localize('vuengine/musicEditor/channel5Only', 'Channel 5 Only')}
                    </span>
                </label>
                <VContainer gap={15}>
                    <VContainer>
                        <label>
                            <input
                                type="checkbox"
                                checked={instrument.sweepMod.enabled}
                                onChange={toggleSweepModulationEnabled}
                            />
                            {nls.localizeByDefault('Enabled')}
                        </label>
                        {instrument.sweepMod.enabled &&
                            <label>
                                <input
                                    type="checkbox"
                                    checked={instrument.sweepMod.repeat}
                                    onChange={toggleSweepModulationRepeat}
                                />
                                {nls.localizeByDefault('Repeat')}
                            </label>
                        }
                    </VContainer>
                    {instrument.sweepMod.enabled &&
                        <>
                            <VContainer>
                                <label>
                                    {nls.localize('vuengine/musicEditor/type', 'Type')}
                                </label>
                                <RadioSelect
                                    options={[{
                                        label: 'Modulation',
                                        value: true,
                                    }, {
                                        label: 'Sweep',
                                        value: false,
                                    }]}
                                    defaultValue={instrument.sweepMod.function}
                                    onChange={options => setSweepModulationFunction(options[0].value as boolean)}
                                    allowBlank
                                />
                            </VContainer>
                            <HContainer gap={15}>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/musicEditor/clockFrequency', 'Clock Frequency')}
                                    </label>
                                    <select
                                        className="theia-select"
                                        value={instrument.sweepMod.frequency

                                        }
                                        onChange={e => setSweepModulationFrequency(parseInt(e.target.value))}
                                    >
                                        <option value="0">0.96 ms</option>
                                        <option value="1">7.68 ms</option>
                                    </select>
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/musicEditor/interval', 'Interval')}
                                    </label>
                                    <input
                                        className='theia-input'
                                        style={{ width: 72 }}
                                        type='number'
                                        min={VSU_SWEEP_MODULATION_INTERVAL_MIN}
                                        max={VSU_SWEEP_MODULATION_INTERVAL_MAX}
                                        value={instrument.sweepMod.interval

                                        }
                                        onChange={e => setSweepModulationInterval(parseInt(e.target.value))}
                                    />
                                </VContainer>
                            </HContainer>
                            {!instrument.sweepMod.function &&
                                <HContainer gap={15}>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/musicEditor/sweep', 'Sweep')}
                                        </label>
                                        <RadioSelect
                                            options={[{
                                                label: 'Up',
                                                value: true,
                                            }, {
                                                label: 'Down',
                                                value: false,
                                            }]}
                                            defaultValue={instrument.sweepMod.direction}
                                            onChange={options => setSweepModulationDirection(options[0].value as boolean)}
                                            allowBlank
                                        />
                                    </VContainer>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/musicEditor/shiftAmount', 'Shift Amount')}
                                        </label>
                                        <input
                                            className='theia-input'
                                            style={{ width: 72 }}
                                            type='number'
                                            min={VSU_SWEEP_MODULATION_SHIFT_MIN}
                                            max={VSU_SWEEP_MODULATION_SHIFT_MAX}
                                            value={instrument.sweepMod.shift

                                            }
                                            onChange={e => setSweepModulationShift(parseInt(e.target.value))}
                                        />
                                    </VContainer>
                                </HContainer>
                            }
                            {instrument.sweepMod.function &&
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/musicEditor/modulationData', 'Modulation Data')}{' '}
                                        <span className="lightLabel">
                                            {nls.localize('vuengine/musicEditor/clickToEdit', 'Click To Edit')}
                                        </span>
                                    </label>
                                    <NumberArrayPreview
                                        active={true}
                                        maximum={256}
                                        data={instrument.modulationData}
                                        onClick={() => setModulationDataDialogOpen(currentInstrument)}
                                    />
                                </VContainer>
                            }
                        </>
                    }
                </VContainer>
            </VContainer>
        }
    </VContainer>;
}
