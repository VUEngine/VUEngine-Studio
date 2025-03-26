import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useMemo, useState } from 'react';
import { WithContributor, WithFileUri } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
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
    VSU_SWEEP_MODULATION_FREQUENCY_VALUES,
    VSU_SWEEP_MODULATION_INTERVAL_MAX,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_MAX,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction,
} from '../Emulator/VsuTypes';
import { WaveFormData } from '../../WaveFormEditor/WaveFormEditorTypes';
import { INPUT_BLOCKING_COMMANDS } from '../SoundEditor';
import { InstrumentConfig, SoundEditorChannelType, NOTES, SoundData } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

const ENVELOPE_PREVIEW_SIZE = 272;

interface InstrumentProps {
    songData: SoundData
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
    emulatorInitialized: boolean
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
        emulatorInitialized,
    } = props;
    const [instrumentTestingNote, setInstrumentTestingNote] = useState<number>(59); // C4

    const instrument = songData.instruments[currentInstrument];

    const startTesting = () => {
        setTesting(true);
        setTestingDuration(0);
        setTestingNote(Object.values(NOTES)[instrumentTestingNote]);
        setTestingInstrument(currentInstrument);
        updateTestingChannel(instrument?.type);
    };

    const updateTestingChannel = (type: SoundEditorChannelType) => {
        setTestingChannel(type === SoundEditorChannelType.NOISE
            ? 5
            : type === SoundEditorChannelType.SWEEPMOD
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

    const setType = (type: SoundEditorChannelType) => {
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

    const updateInterval = (interval: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            interval: {
                ...instrument?.interval,
                enabled: interval !== 0,
                value: clamp(interval - 1, 0, VSU_INTERVAL_VALUES.length - 1),
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleEnvelopeRepeat = () => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument?.envelope,
                repeat: !instrument?.envelope.repeat,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeType = (type: -1 | VsuEnvelopeDirection) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument?.envelope,
                enabled: type !== -1,
                direction: type === -1 ? VsuEnvelopeDirection.Decay : type as VsuEnvelopeDirection,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeStepTime = (stepTime: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            envelope: {
                ...instrument?.envelope,
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
                ...instrument?.envelope,
                initialValue: clamp(initialValue, VSU_ENVELOPE_INITIAL_VALUE_MIN, VSU_ENVELOPE_INITIAL_VALUE_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleSweepModulationRepeat = () => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument?.sweepMod,
                repeat: !instrument?.sweepMod.repeat,
            },
        };

        setInstruments(updatedInstruments);
    };

    const updateSweepModulationFunction = (fnc: -1 | VsuSweepModulationFunction) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument?.sweepMod,
                enabled: fnc !== -1,
                function: fnc === -1 ? VsuSweepModulationFunction.Sweep : fnc,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationFrequency = (frequency: number) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            sweepMod: {
                ...instrument?.sweepMod,
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
                ...instrument?.sweepMod,
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
                ...instrument?.sweepMod,
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
                ...instrument?.sweepMod,
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

    const waveform = instrument !== undefined
        ? services.vesProjectService.getProjectDataItemById(instrument?.waveform, 'WaveForm') as WaveFormData & WithFileUri & WithContributor
        : {
            values: [],
        };

    const envelopePreviewData = useMemo(() => {
        let result: number[] = [];

        if (instrument?.envelope.direction === VsuEnvelopeDirection.Decay && instrument?.envelope.initialValue === 0) {
            result = [...Array(ENVELOPE_PREVIEW_SIZE)].map(v => 0);
        } else if (instrument?.envelope.direction === VsuEnvelopeDirection.Grow && instrument?.envelope.initialValue === 15) {
            result = [...Array(ENVELOPE_PREVIEW_SIZE)].map(v => 15);
        } else if (instrument?.envelope.enabled) {
            const endVolume = instrument?.envelope.direction === VsuEnvelopeDirection.Grow ? 15 : 0;
            const numberOfSteps = instrument?.envelope.direction === VsuEnvelopeDirection.Grow ? 15 - instrument?.envelope.initialValue : instrument?.envelope.initialValue;
            const cycleDuration = (instrument?.envelope.stepTime + 1) * numberOfSteps;
            const stepDecrease = instrument?.envelope.initialValue / cycleDuration;
            const stepIncrease = numberOfSteps / cycleDuration;
            for (let index = 0; index < ENVELOPE_PREVIEW_SIZE; index++) {
                if (index >= cycleDuration && !instrument?.envelope.repeat) {
                    result[index] = endVolume;
                } else {
                    const decayStepDelta = (index % cycleDuration) * stepDecrease;
                    const growStepDelta = (index % cycleDuration) * stepIncrease;
                    result[index] = instrument?.envelope.direction === VsuEnvelopeDirection.Grow
                        ? instrument?.envelope.initialValue + growStepDelta
                        : instrument?.envelope.initialValue - decayStepDelta;
                }
            }
        }

        return result;
    }, [
        instrument?.envelope.enabled,
        instrument?.envelope.initialValue,
        instrument?.envelope.direction,
        instrument?.envelope.repeat,
        instrument?.envelope.stepTime,
    ]);

    return (instrument !== undefined
        ? <VContainer gap={15}>
            <HContainer gap={15}>
                <VContainer grow={1}>
                    <label>
                        {nls.localizeByDefault('Name')}
                    </label>
                    <input
                        className='theia-input'
                        value={instrument?.name}
                        onChange={e => setName(e.target.value)}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localizeByDefault('Type')}
                    </label>
                    <AdvancedSelect
                        options={[{
                            label: nls.localize('vuengine/editors/sound/wave', 'Wave'),
                            value: SoundEditorChannelType.WAVE,
                        }, {

                            label: nls.localize('vuengine/editors/sound/sweepMod', 'Sweep / Mod.'),
                            value: SoundEditorChannelType.SWEEPMOD,
                        }, {
                            label: nls.localize('vuengine/editors/sound/noise', 'Noise'),
                            value: SoundEditorChannelType.NOISE,
                        }]}
                        defaultValue={instrument?.type}
                        onChange={options => setType(options[0] as SoundEditorChannelType)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={96}
                    />
                </VContainer>
            </HContainer>
            <HContainer gap={15}>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/volume', 'Volume')}
                    </label>
                    <HContainer alignItems="center">
                        <div style={{ minWidth: 10, width: 10 }}>
                            L
                        </div>
                        <Range
                            value={instrument?.volume.left}
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
                            value={instrument?.volume.right}
                            max={15}
                            min={0}
                            setValue={(v: number) => setVolume('right', v)}
                            commandsToDisable={INPUT_BLOCKING_COMMANDS}
                            width="100%"
                        />
                    </HContainer>
                </VContainer>
                {
                    instrument?.type !== SoundEditorChannelType.NOISE &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/sound/waveform', 'Waveform')}
                        </label>
                        <VContainer>
                            <NumberArrayPreview
                                active={true}
                                height={52}
                                width={64}
                                maximum={64}
                                data={waveform ? waveform.values : [...Array(32)].map(v => 0)}
                                onClick={() => setWaveformDialogOpen(currentInstrument)}
                            />
                            {!waveform &&
                                <div className='lightLabel' style={{ margin: '-42px auto 0' }}>
                                    {nls.localize('vuengine/editors/sound/none', 'None')}
                                </div>
                            }
                        </VContainer>
                    </VContainer>
                }
            </HContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/sound/noteDuration', 'Note Duration')}
                    tooltip={nls.localize(
                        'vuengine/editors/sound/noteDurationDescription',
                        'Specifies how long the current note should play before automatically being shut off. \
This are the durations that are natively supported by the Virtual Boy\'s sound chip. \
Longer durations can be achieved with the "Note Cut" effect.'
                    )}
                />
                <Range
                    value={instrument?.interval?.enabled ? instrument?.interval?.value + 1 : 0}
                    options={[
                        {
                            value: 0,
                            label: 'Unlimited',
                        },
                        ...VSU_INTERVAL_VALUES.map((o, i) => ({
                            value: i + 1,
                            label: `${o.toString()} ms`,
                        })),
                    ]}
                    max={VSU_INTERVAL_VALUES.length}
                    min={0}
                    setValue={updateInterval}
                    commandsToDisable={INPUT_BLOCKING_COMMANDS}
                    selectWidth={96}
                />
            </VContainer>
            {
                instrument?.type === SoundEditorChannelType.NOISE &&
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/sound/tap', 'Tap')}
                        tooltip={nls.localize(
                            'vuengine/editors/sound/tapDescription',
                            'Specifies the bit within the shift register to use as the feedback source in noise generation. \
Different bits will produce pseudorandom bit sequences of different lengths before the sequences repeat.'
                        )}
                    />
                    <AdvancedSelect
                        options={Object.keys(VSU_NOISE_TAP).map((tl, i) => ({
                            label: `${nls.localize('vuengine/editors/sound/bit', 'Bit')} ${VSU_NOISE_TAP[i][0]}, ` +
                                `${nls.localize('vuengine/editors/sound/sequenceLength', 'Sequence Length')}: ${VSU_NOISE_TAP[i][1]}`,
                            value: i.toString(),
                        }))}
                        defaultValue={instrument?.tap?.toString()}
                        onChange={options => setTap(parseInt(options[0]))}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                </VContainer>
            }
            <hr />
            <VContainer gap={15}>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/sound/envelope', 'Envelope')}
                        tooltip={nls.localize(
                            'vuengine/editors/sound/envelopeDescription',
                            'The envelope acts like a master volume setting independent from the stereo levels. \
It can be configured to grow or decay automatically over time, and optionally reload \
a pre-configured value and repeat the grow/decay process. '
                        )}
                    />
                    <RadioSelect
                        options={[{
                            label: nls.localize('vuengine/editors/sound/off', 'Off'),
                            value: -1,
                        }, {
                            label: nls.localize('vuengine/editors/sound/envelopeGrow', 'Grow'),
                            value: VsuEnvelopeDirection.Grow,
                        }, {
                            label: nls.localize('vuengine/editors/sound/envelopeDecay', 'Decay'),
                            value: VsuEnvelopeDirection.Decay,
                        }]}
                        defaultValue={instrument?.envelope.enabled ? instrument?.envelope.direction : -1}
                        onChange={options => setEnvelopeType(options[0].value as -1 | VsuEnvelopeDirection)}
                        allowBlank
                    />
                </VContainer>
                <VContainer gap={15}>
                    {instrument?.envelope.enabled &&
                        <HContainer gap={15}>
                            <VContainer>
                                <label>
                                    {nls.localize('vuengine/editors/sound/interval', 'Interval')}
                                </label>
                                <Range
                                    value={instrument?.envelope.stepTime}
                                    setValue={setEnvelopeStepTime}
                                    min={0}
                                    max={VSU_ENVELOPE_STEP_TIME_VALUES.length - 1}
                                    options={VSU_ENVELOPE_STEP_TIME_VALUES.map((st, i) => ({
                                        value: i,
                                        label: `${st} ms`,
                                    }))}
                                    selectWidth={80}
                                />
                            </VContainer>
                            <VContainer>
                                <label>
                                    {nls.localize('vuengine/editors/sound/repeat', 'Repeat')}
                                </label>
                                <input
                                    type="checkbox"
                                    checked={instrument?.envelope.repeat}
                                    onChange={toggleEnvelopeRepeat}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                            </VContainer>
                        </HContainer>
                    }
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/sound/initialVolume', 'Initial Volume')}
                        </label>
                        <Range
                            value={instrument?.envelope.initialValue}
                            max={VSU_ENVELOPE_INITIAL_VALUE_MAX}
                            min={VSU_ENVELOPE_INITIAL_VALUE_MIN}
                            setValue={setEnvelopeInitialValue}
                            commandsToDisable={INPUT_BLOCKING_COMMANDS}
                        />
                    </VContainer>
                    {instrument?.envelope.enabled &&
                        <VContainer>
                            <InfoLabel
                                label={nls.localizeByDefault('Preview')}
                            // subLabel={nls.localize('vuengine/editors/sound/volumeOverTime', 'Volume over time')}
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
                instrument?.type === SoundEditorChannelType.SWEEPMOD &&
                <>
                    <hr />
                    <VContainer>
                        <InfoLabel
                            label={nls.localizeByDefault('Mode')}
                            tooltip={<>
                                {nls.localize('vuengine/editors/sound/sweepModDescription',
                                    "The VSU's channel 5 has, in addition to all of the features of channels 1-4, \
support for frequency sweep and modulation functions, which will modify the current frequency value over time."
                                )}
                                <br /><br />
                                <b>{nls.localize('vuengine/editors/sound/sweep', 'Sweep')}</b>{': '}
                                {nls.localize(
                                    'vuengine/editors/sound/sweepDescription',
                                    'The sweep function produces a new frequency value relative to the current frequency value. \
The new frequency value is calculated by shifting the current frequency value right by a \
specified number of bits, then adding or subtracting the result to or from the current frequency \
value. This results in a sliding pitch on the logarithmic scale, as though along octaves. '
                                )}
                                <br /><br />
                                <b>{nls.localize('vuengine/editors/sound/modulation', 'Modulation')}</b>{': '}
                                {nls.localize(
                                    'vuengine/editors/sound/modulationDescription',
                                    'The modulation function produces a new frequency value by reading modulation values from VSU memory. \
Each frequency modification frame, a new frequency value is calculated by reading a modulation value \
and adding it to the most recent frequency value written to the frequency registers. \
After processing all 32 modulation values, frequency modification processing can either stop or continue \
from the first modulation value. '
                                )}
                            </>}
                        />
                        <RadioSelect
                            options={[{
                                label: nls.localize('vuengine/editors/sound/off', 'Off'),
                                value: -1,
                            }, {
                                label: nls.localize('vuengine/editors/sound/sweep', 'Sweep'),
                                value: VsuSweepModulationFunction.Sweep,
                            }, {
                                label: nls.localize('vuengine/editors/sound/modulation', 'Modulation'),
                                value: VsuSweepModulationFunction.Modulation,
                            }]}
                            defaultValue={instrument?.sweepMod.enabled ? instrument?.sweepMod.function : -1}
                            onChange={options => updateSweepModulationFunction(options[0].value as -1 | VsuSweepModulationFunction)}
                            allowBlank
                        />
                    </VContainer>
                    {instrument?.sweepMod.enabled &&
                        <>
                            <HContainer gap={15}>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/editors/sound/clockFrequency', 'Clock Frequency')}
                                    </label>
                                    <RadioSelect
                                        options={VSU_SWEEP_MODULATION_FREQUENCY_VALUES.map((v, i) => ({
                                            label: `${v} ms`,
                                            value: i,
                                        }))}
                                        defaultValue={instrument?.sweepMod.frequency}
                                        onChange={options => setSweepModulationFrequency(options[0].value as number)}
                                        allowBlank
                                    />
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/editors/sound/interval', 'Interval')}
                                    </label>
                                    <input
                                        className='theia-input'
                                        style={{ width: 48 }}
                                        type='number'
                                        min={VSU_SWEEP_MODULATION_INTERVAL_MIN}
                                        max={VSU_SWEEP_MODULATION_INTERVAL_MAX}
                                        value={instrument?.sweepMod.interval}
                                        onChange={e => setSweepModulationInterval(
                                            e.target.value === ''
                                                ? VSU_SWEEP_MODULATION_INTERVAL_MIN
                                                : clamp(parseInt(e.target.value), VSU_SWEEP_MODULATION_INTERVAL_MIN, VSU_SWEEP_MODULATION_INTERVAL_MAX)
                                        )}
                                    />
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/editors/sound/repeat', 'Repeat')}
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={instrument?.sweepMod.repeat}
                                        onChange={toggleSweepModulationRepeat}
                                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                    />
                                </VContainer>
                            </HContainer>
                            {instrument?.sweepMod.function === VsuSweepModulationFunction.Sweep &&
                                <HContainer gap={15}>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/editors/sound/direction', 'Direction')}
                                        </label>
                                        <RadioSelect
                                            options={[{
                                                label: 'Up',
                                                value: VsuSweepDirection.Up,
                                            }, {
                                                label: 'Down',
                                                value: VsuSweepDirection.Down,
                                            }]}
                                            defaultValue={instrument?.sweepMod.direction}
                                            onChange={options => setSweepDirection(options[0].value as VsuSweepDirection)}
                                            allowBlank
                                        />
                                    </VContainer>
                                    <VContainer>
                                        <label>
                                            {nls.localize('vuengine/editors/sound/shiftAmount', 'Shift Amount')}
                                        </label>
                                        <Range
                                            min={VSU_SWEEP_MODULATION_SHIFT_MIN}
                                            max={VSU_SWEEP_MODULATION_SHIFT_MAX}
                                            value={instrument?.sweepMod.shift}
                                            setValue={setSweepModulationShift}
                                            commandsToDisable={INPUT_BLOCKING_COMMANDS}
                                        />
                                    </VContainer>
                                </HContainer>
                            }
                            {instrument?.sweepMod.function === VsuSweepModulationFunction.Modulation &&
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/editors/sound/modulationData', 'Modulation Data')}
                                    </label>
                                    <NumberArrayPreview
                                        active={true}
                                        maximum={256}
                                        height={64}
                                        width={64}
                                        data={instrument?.modulationData}
                                        onClick={() => setModulationDataDialogOpen(currentInstrument)}
                                    />
                                </VContainer>
                            }
                        </>
                    }
                </>
            }
            <hr />
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/try', 'Try')}
                </label>
                <InputWithAction>
                    <AdvancedSelect
                        options={Object.keys(NOTES).map((n, i) => ({
                            label: n,
                            value: i.toString(),
                        }))}
                        defaultValue={instrumentTestingNote.toString()}
                        onChange={options => {
                            const noteId = parseInt(options[0]);
                            setTestingNote(Object.values(NOTES)[noteId]);
                            setInstrumentTestingNote(noteId);
                        }}
                        menuPlacement="top"
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className={`theia-button ${testing ? 'primary' : 'secondary'}`}
                        title={nls.localize('vuengine/editors/sound/try', 'Try')}
                        onClick={() => testing ? stopTesting() : startTesting()}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        disabled={!emulatorInitialized || playing}
                    >
                        {testing
                            ? <i className='fa fa-stop' />
                            : <i className='fa fa-play' />
                        }
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>
        </VContainer>
        : <></>
    );
}
