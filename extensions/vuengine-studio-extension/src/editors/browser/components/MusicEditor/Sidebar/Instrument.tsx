import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useMemo, useState } from 'react';
import { WithContributor, WithFileUri } from 'src/project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import BasicSelect from '../../Common/Base/BasicSelect';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import { clamp } from '../../Common/Utils';
import {
    VSU_ENVELOPE_INITIAL_VALUE_MAX,
    VSU_ENVELOPE_INITIAL_VALUE_MIN,
    VSU_ENVELOPE_STEP_TIME_MAX,
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_ENVELOPE_STEP_TIME_VALUES,
    VSU_INTERVAL_VALUES,
    VSU_NOISE_TAP,
    VSU_SWEEP_MODULATION_FREQUENCY_MAX,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MAX,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MAX,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction,
} from '../../VsuEmulator/VsuEmulatorTypes';
import { WaveFormData } from '../../WaveFormEditor/WaveFormEditorTypes';
import { INPUT_BLOCKING_COMMANDS } from '../MusicEditor';
import { InstrumentConfig, MusicEditorChannelType, NOTES, SongData } from '../MusicEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

const ENVELOPE_PREVIEW_SIZE = 272;

interface InstrumentProps {
    songData: SongData
    currentInstrument: number
    setInstruments: (instruments: InstrumentConfig[]) => void
    setWaveformDialogOpen: Dispatch<SetStateAction<number>>
    setModulationDataDialogOpen: Dispatch<SetStateAction<number>>
    playing: boolean
    testing: boolean
    setTesting: Dispatch<SetStateAction<boolean>>
    setTestingDuration: Dispatch<SetStateAction<number>>
    setTestingNote: Dispatch<SetStateAction<number>>
    setTestingInstrument: Dispatch<SetStateAction<number>>
    setTestingChannel: Dispatch<SetStateAction<number>>
}

export default function Instrument(props: InstrumentProps): React.JSX.Element {
    const { disableCommands, enableCommands, services } = useContext(EditorsContext) as EditorsContextType;
    const {
        songData,
        currentInstrument,
        setInstruments,
        setWaveformDialogOpen, setModulationDataDialogOpen,
        playing,
        testing, setTesting, setTestingDuration, setTestingChannel, setTestingNote, setTestingInstrument,
    } = props;
    const [instrumentTestingNote, setInstrumentTestingNote] = useState<number>(59); // C4

    const instrument = songData.instruments[currentInstrument];

    // TODO: why does changing the frequency have no effect on channel 5?
    const startTesting = () => {
        setTesting(true);
        setTestingDuration(0);
        setTestingNote(Object.values(NOTES)[instrumentTestingNote]);
        setTestingInstrument(currentInstrument);
        updateTestingChannel(instrument.type);
    };

    const updateTestingChannel = (type: MusicEditorChannelType) => {
        setTestingChannel(type === MusicEditorChannelType.NOISE
            ? 5
            : type === MusicEditorChannelType.SWEEPMOD
                ? 4
                : 0
        );
    };

    const stopTesting = () => {
        setTesting(false);
    };

    const setName = (name: string) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            name,
        };

        setInstruments(updatedInstruments);
    };

    const setType = (type: MusicEditorChannelType) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            type,
        };

        setInstruments(updatedInstruments);
        if (testing) {
            updateTestingChannel(type);
        }
    };

    /*
    const setWaveform = (waveform: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            waveform,
        };

        setInstruments(updatedInstruments);
    };
    */

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

    const setEnvelopeDirection = (direction: VsuEnvelopeDirection) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument.envelope,
                direction,
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

    const setSweepModulationFunction = (fnc: VsuSweepModulationFunction) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument.sweepMod,
                function: fnc,
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

    const setSweepDirection = (direction: VsuSweepDirection) => {
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

    const setTap = (tap: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            tap,
        };

        setInstruments(updatedInstruments);
    };

    const waveform = services.vesProjectService.getProjectDataItemById(instrument.waveform, 'WaveForm') as WaveFormData & WithFileUri & WithContributor;

    const envelopePreviewData = useMemo(() => {
        let result: number[] = [];

        if (instrument.envelope.direction === VsuEnvelopeDirection.Decay && instrument.envelope.initialValue === 0) {
            result = [...Array(ENVELOPE_PREVIEW_SIZE)].map(v => 0);
        } else if (instrument.envelope.direction === VsuEnvelopeDirection.Grow && instrument.envelope.initialValue === 15) {
            result = [...Array(ENVELOPE_PREVIEW_SIZE)].map(v => 15);
        } else if (instrument.envelope.enabled) {
            const endVolume = instrument.envelope.direction === VsuEnvelopeDirection.Grow ? 15 : 0;
            const numberOfSteps = instrument.envelope.direction === VsuEnvelopeDirection.Grow ? 15 - instrument.envelope.initialValue : instrument.envelope.initialValue;
            const cycleDuration = (instrument.envelope.stepTime + 1) * numberOfSteps;
            const stepDecrease = instrument.envelope.initialValue / cycleDuration;
            const stepIncrease = numberOfSteps / cycleDuration;
            for (let index = 0; index < ENVELOPE_PREVIEW_SIZE; index++) {
                if (index >= cycleDuration && !instrument.envelope.repeat) {
                    result[index] = endVolume;
                } else {
                    const decayStepDelta = (index % cycleDuration) * stepDecrease;
                    const growStepDelta = (index % cycleDuration) * stepIncrease;
                    result[index] = instrument.envelope.direction === VsuEnvelopeDirection.Grow
                        ? instrument.envelope.initialValue + growStepDelta
                        : instrument.envelope.initialValue - decayStepDelta;
                }
            }
        }

        return result;
    }, [
        instrument.envelope.enabled,
        instrument.envelope.initialValue,
        instrument.envelope.direction,
        instrument.envelope.repeat,
        instrument.envelope.stepTime,
    ]);

    return <VContainer gap={15}>
        <hr />
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
                    value: MusicEditorChannelType.WAVE,
                }, {

                    label: nls.localize('vuengine/musicEditor/waveAndSweepMod', 'Wave + Sweep / Mod.'),
                    value: MusicEditorChannelType.SWEEPMOD,
                }, {
                    label: nls.localize('vuengine/musicEditor/noise', 'Noise'),
                    value: MusicEditorChannelType.NOISE,
                }]}
                defaultValue={instrument.type}
                onChange={options => setType(options[0].value as MusicEditorChannelType)}
                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/volume', 'Volume')}
            </label>
            <HContainer alignItems="center">
                <div style={{ minWidth: 10, width: 10 }}>
                    L
                </div>
                <Range
                    value={instrument.volume.left}
                    max={15}
                    min={0}
                    setValue={(v: number) => setVolume('left', v)}
                    commandsToDisable={INPUT_BLOCKING_COMMANDS}
                    width="100%"
                />
            </HContainer>
            <HContainer alignItems="center">
                <div style={{ minWidth: 10, width: 10 }}>
                    R
                </div>
                <Range
                    value={instrument.volume.right}
                    max={15}
                    min={0}
                    setValue={(v: number) => setVolume('right', v)}
                    commandsToDisable={INPUT_BLOCKING_COMMANDS}
                    width="100%"
                />
            </HContainer>
        </VContainer>
        {
            instrument.type !== MusicEditorChannelType.NOISE &&
            <VContainer>
                <label>
                    {nls.localize('vuengine/musicEditor/waveform', 'Waveform')}
                </label>
                <HContainer gap={10}>
                    <NumberArrayPreview
                        active={true}
                        height={64}
                        width={64}
                        maximum={64}
                        data={waveform ? waveform.values : [...Array(32)].map(v => 0)}
                        onClick={() => setWaveformDialogOpen(currentInstrument)}
                    />
                    <VContainer gap={0}>
                        {waveform
                            ? <>
                                <div>
                                    {waveform._fileUri.path.name}
                                </div>
                                {/*
                                <div className='lightLabel'>
                                    {waveform._contributor}
                                </div>
                                */}
                            </>
                            : <>
                                <div>
                                    {nls.localize('vuengine/musicEditor/none', 'None')}
                                </div>
                                <div className='lightLabel'>
                                    {nls.localize('vuengine/musicEditor/clickToSelect', 'Click to select')}
                                </div>
                            </>
                        }
                    </VContainer>
                </HContainer>
            </VContainer>
        }
        {
            instrument.type === MusicEditorChannelType.NOISE &&
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/musicEditor/tap', 'Tap')}
                    tooltip={nls.localize(
                        'vuengine/musicEditor/tapDescription',
                        'Specifies the bit within the shift register to use as the feedback source in noise generation. ' +
                        'Different bits will produce pseudorandom bit sequences of different lengths before the sequences repeat.'
                    )}
                />
                <BasicSelect
                    options={Object.keys(VSU_NOISE_TAP).map((tl, i) => ({
                        label: `${nls.localize('vuengine/musicEditor/bit', 'Bit')} ${VSU_NOISE_TAP[i][0]}, ` +
                            `${nls.localize('vuengine/musicEditor/sequenceLength', 'Sequence Length')}: ${VSU_NOISE_TAP[i][1]}`,
                        value: i,
                    }))}
                    value={instrument.tap}
                    onChange={e => setTap(parseInt(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
        }
        <hr />
        <HContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/musicEditor/interval', 'Interval')}
                    tooltip={
                        nls.localize('vuengine/musicEditor/intervalDescription',
                            'Interval, when enabled, specifies how long sound should be generated before automatically being shut off. '
                        )}
                />
                <VContainer gap={15}>
                    <label>
                        <input
                            type="checkbox"
                            checked={instrument.interval?.enabled}
                            onChange={toggleIntervalEnabled}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        {nls.localizeByDefault('Enabled')}
                    </label>
                </VContainer>
            </VContainer>
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
                            <option key={i} value={i}>{intv} ms</option>
                        )}
                    </select>
                </VContainer>
            }
        </HContainer>
        <hr />
        <VContainer gap={15}>
            <HContainer gap={15}>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/musicEditor/envelope', 'Envelope')}
                        tooltip={
                            nls.localize('vuengine/musicEditor/envelopeDescription',
                                'The envelope acts like a master volume setting independent from the stereo levels. ' +
                                'It can be configured to grow or decay automatically over time, and optionally reload ' +
                                'a pre-configured value and repeat the grow/decay process. '
                            )}
                    />
                    <label>
                        <input
                            type="checkbox"
                            checked={instrument.envelope.enabled}
                            onChange={toggleEnvelopeEnabled}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        {nls.localizeByDefault('Enabled')}
                    </label>
                    {instrument.envelope.enabled &&
                        <label>
                            <input
                                type="checkbox"
                                checked={instrument.envelope.repeat}
                                onChange={toggleEnvelopeRepeat}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                            Repeat
                        </label>
                    }
                </VContainer>
                {instrument.envelope.enabled &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/musicEditor/type', 'Type')}
                        </label>
                        <RadioSelect
                            options={[{
                                label: 'Grow',
                                value: VsuEnvelopeDirection.Grow,
                            }, {
                                label: 'Decay',
                                value: VsuEnvelopeDirection.Decay,
                            }]}
                            defaultValue={instrument.envelope.direction}
                            onChange={options => setEnvelopeDirection(options[0].value as VsuEnvelopeDirection)}
                            allowBlank
                        />
                    </VContainer>
                }
            </HContainer>
            <VContainer>
                <HContainer gap={15}>
                    {instrument.envelope.enabled &&
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
                                    <option key={i} value={i}>{st} ms</option>
                                )}
                            </select>
                        </VContainer>
                    }
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/musicEditor/initialVolume', 'Initial Volume')}
                        </label>
                        <Range
                            value={instrument.envelope.initialValue}
                            max={VSU_ENVELOPE_INITIAL_VALUE_MAX}
                            min={VSU_ENVELOPE_INITIAL_VALUE_MIN}
                            setValue={setEnvelopeInitialValue}
                            commandsToDisable={INPUT_BLOCKING_COMMANDS}
                        />
                    </VContainer>
                </HContainer>
                {instrument.envelope.enabled &&
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/musicEditor/preview', 'Preview')}
                        // subLabel={nls.localize('vuengine/musicEditor/volumeOverTime', 'Volume over time')}
                        />
                        <NumberArrayPreview
                            active={true}
                            height={48}
                            width={ENVELOPE_PREVIEW_SIZE}
                            maximum={15}
                            data={envelopePreviewData}
                        />
                    </VContainer>
                }
            </VContainer>
        </VContainer>
        {
            instrument.type === MusicEditorChannelType.SWEEPMOD &&
            <>
                <HContainer gap={15}>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/musicEditor/sweepMod', 'Sweep / Mod.')}
                            tooltip={<>
                                {nls.localize('vuengine/musicEditor/sweepModDescription',
                                    'The VSU\'s channel 5 has, in addition to all of the features of channels 1-4, ' +
                                    'support for frequency sweep and modulation functions, which will modify the current frequency value over time.'
                                )}
                                <br /><br />
                                <b>{nls.localize('vuengine/musicEditor/sweep', 'Sweep')}</b>{': '}
                                {nls.localize(
                                    'vuengine/musicEditor/sweepDescription',
                                    'The sweep function produces a new frequency value relative to the current frequency value. ' +
                                    'The new frequency value is calculated by shifting the current frequency value right by a ' +
                                    'specified number of bits, then adding or subtracting the result to or from the current frequency ' +
                                    'value. This results in a sliding pitch on the logarithmic scale, as though along octaves. '
                                )}
                                <br /><br />
                                <b>{nls.localize('vuengine/musicEditor/modulation', 'Modulation')}</b>{': '}
                                {nls.localize(
                                    'vuengine/musicEditor/modulationDescription',
                                    'The modulation function produces a new frequency value by reading modulation values from VSU memory. ' +
                                    'Each frequency modification frame, a new frequency value is calculated by reading a modulation value ' +
                                    'and adding it to the most recent frequency value written to the frequency registers. ' +
                                    'After processing all 32 modulation values, frequency modification processing can either stop or continue ' +
                                    'from the first modulation value. '
                                )}
                            </>}
                        />
                        <label>
                            <input
                                type="checkbox"
                                checked={instrument.sweepMod.enabled}
                                onChange={toggleSweepModulationEnabled}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                            {nls.localizeByDefault('Enabled')}
                        </label>
                        {instrument.sweepMod.enabled &&
                            <label>
                                <input
                                    type="checkbox"
                                    checked={instrument.sweepMod.repeat}
                                    onChange={toggleSweepModulationRepeat}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                                {nls.localizeByDefault('Repeat')}
                            </label>
                        }
                    </VContainer>
                    {instrument.sweepMod.enabled &&
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/musicEditor/type', 'Type')}
                            </label>
                            <RadioSelect
                                options={[{
                                    label: 'Sweep',
                                    value: VsuSweepModulationFunction.Sweep,
                                }, {
                                    label: 'Modulation',
                                    value: VsuSweepModulationFunction.Modulation,
                                }]}
                                defaultValue={instrument.sweepMod.function}
                                onChange={options => setSweepModulationFunction(options[0].value as VsuSweepModulationFunction)}
                                allowBlank
                            />
                        </VContainer>
                    }
                </HContainer>
                <VContainer gap={15}>
                    {instrument.sweepMod.enabled &&
                        <>
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
                            {instrument.sweepMod.function === VsuSweepModulationFunction.Sweep &&
                                <HContainer gap={15}>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/musicEditor/sweep', 'Sweep')}
                                        </label>
                                        <RadioSelect
                                            options={[{
                                                label: 'Up',
                                                value: VsuSweepDirection.Up,
                                            }, {
                                                label: 'Down',
                                                value: VsuSweepDirection.Down,
                                            }]}
                                            defaultValue={instrument.sweepMod.direction}
                                            onChange={options => setSweepDirection(options[0].value as VsuSweepDirection)}
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
                            {instrument.sweepMod.function === VsuSweepModulationFunction.Modulation &&
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/musicEditor/modulationData', 'Modulation Data')}
                                    </label>
                                    <NumberArrayPreview
                                        active={true}
                                        maximum={256}
                                        height={64}
                                        width={64}
                                        data={instrument.modulationData}
                                        onClick={() => setModulationDataDialogOpen(currentInstrument)}
                                    />
                                </VContainer>
                            }
                        </>
                    }
                </VContainer>
            </>
        }
        <hr />
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/try', 'Try')}
            </label>
            <InputWithAction>
                <BasicSelect
                    options={Object.keys(NOTES).map((n, i) => ({
                        label: n,
                        value: i,
                    }))}
                    value={instrumentTestingNote}
                    onChange={e => {
                        const noteId = parseInt(e.currentTarget.value);
                        setTestingNote(Object.values(NOTES)[noteId]);
                        setInstrumentTestingNote(noteId);
                    }}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
                <InputWithActionButton
                    className={`theia-button ${testing ? 'primary' : 'secondary'}`}
                    title={nls.localize('vuengine/musicEditor/try', 'Try')}
                    onClick={() => testing ? stopTesting() : startTesting()}
                    disabled={playing}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    {testing
                        ? <i className='fa fa-stop' />
                        : <i className='fa fa-play' />
                    }
                </InputWithActionButton>
            </InputWithAction>
        </VContainer>
    </VContainer >;
}
