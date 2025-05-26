import { Copy, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useMemo } from 'react';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import PaletteColorSelect, { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { clamp, nanoid } from '../../Common/Utils';
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
import { getInstrumentName } from '../SoundEditor';
import { INPUT_BLOCKING_COMMANDS, InstrumentMap, SoundData, WAVEFORM_MAX } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

const ENVELOPE_PREVIEW_SIZE = 272;

interface InstrumentProps {
    soundData: SoundData
    currentInstrumentId: string
    setCurrentInstrumentId: Dispatch<SetStateAction<string>>
    setInstruments: (instruments: InstrumentMap) => void
    setWaveformDialogOpen: Dispatch<SetStateAction<string>>
    setModulationDataDialogOpen: Dispatch<SetStateAction<string>>
    playing: boolean
    testing: boolean
    setTesting: Dispatch<SetStateAction<boolean>>
    setTestingDuration: Dispatch<SetStateAction<number>>
    setTestingNote: Dispatch<SetStateAction<number>>
    setTestingInstrument: Dispatch<SetStateAction<string>>
    setTestingTrack: Dispatch<SetStateAction<number>>
    emulatorInitialized: boolean
}

export default function Instrument(props: InstrumentProps): React.JSX.Element {
    const {
        soundData,
        currentInstrumentId, setCurrentInstrumentId,
        setInstruments,
        setWaveformDialogOpen, setModulationDataDialogOpen,
        /*
        playing,
        testing, setTesting, setTestingDuration, setTestingTrack, setTestingNote, setTestingInstrument,
        emulatorInitialized,
        */
    } = props;

    const instrument = soundData.instruments[currentInstrumentId];

    const setName = (name: string) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            name,
        };

        setInstruments(updatedInstruments);
    };

    const setColor = (color: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            color,
        };

        setInstruments(updatedInstruments);
    };

    /*
    const setWaveform = (waveform: number) => {
        const updatedInstruments = {...soundData.instruments};
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            waveform,
        };

        setInstruments(updatedInstruments);
    };
    */

    const setStereoLevel = (side: 'left' | 'right', value: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            volume: {
                ...updatedInstruments[currentInstrumentId].volume,
                [side]: value,
            },
        };

        setInstruments(updatedInstruments);
    };

    const updateInterval = (interval: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            interval: {
                ...instrument?.interval,
                enabled: interval !== 0,
                value: clamp(interval - 1, 0, VSU_INTERVAL_VALUES.length - 1),
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleEnvelopeRepeat = () => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            envelope: {
                ...instrument?.envelope,
                repeat: !instrument?.envelope.repeat,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeType = (type: -1 | VsuEnvelopeDirection) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            envelope: {
                ...instrument?.envelope,
                enabled: type !== -1,
                direction: type === -1 ? VsuEnvelopeDirection.Decay : type as VsuEnvelopeDirection,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeStepTime = (stepTime: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            envelope: {
                ...instrument?.envelope,
                stepTime: clamp(stepTime, VSU_ENVELOPE_STEP_TIME_MIN, VSU_ENVELOPE_STEP_TIME_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeInitialValue = (initialValue: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            envelope: {
                ...instrument?.envelope,
                initialValue: clamp(initialValue, VSU_ENVELOPE_INITIAL_VALUE_MIN, VSU_ENVELOPE_INITIAL_VALUE_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleSweepModulationRepeat = () => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                repeat: !instrument?.sweepMod.repeat,
            },
        };

        setInstruments(updatedInstruments);
    };

    const updateSweepModulationFunction = (fnc: -1 | VsuSweepModulationFunction) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                enabled: fnc !== -1,
                function: fnc === -1 ? VsuSweepModulationFunction.Sweep : fnc,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationFrequency = (frequency: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                frequency: clamp(frequency, VSU_SWEEP_MODULATION_FREQUENCY_MIN, VSU_SWEEP_MODULATION_FREQUENCY_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationInterval = (interval: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                interval: clamp(interval, VSU_SWEEP_MODULATION_INTERVAL_MIN, VSU_SWEEP_MODULATION_INTERVAL_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepDirection = (direction: VsuSweepDirection) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                direction,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationShift = (shift: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                shift: clamp(shift, VSU_SWEEP_MODULATION_SHIFT_MIN, VSU_SWEEP_MODULATION_SHIFT_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setTap = (tap: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            tap,
        };

        setInstruments(updatedInstruments);
    };

    const cloneInstrument = async () => {
        const newId = nanoid();
        setInstruments({
            ...soundData.instruments,
            [newId]: {
                ...instrument,
                name: `${instrument.name} ${nls.localize('vuengine/general/copy', 'copy')}`,
            },
        });
        setCurrentInstrumentId(newId);
    };

    const removeCurrentInstrument = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/deleteInstrumentQuestion', 'Delete Instrument?'),
            msg: nls.localize(
                'vuengine/editors/sound/areYouSureYouWantToDelete',
                'Are you sure you want to delete {0}?',
                getInstrumentName(soundData, currentInstrumentId)
            ),
        });
        const remove = await dialog.open();
        if (remove) {
            const updatedInstruments = { ...soundData.instruments };
            delete updatedInstruments[currentInstrumentId];

            setCurrentInstrumentId((Object.keys(soundData.instruments) ?? [''])[0]);
            // TODO: update references in tracks

            setInstruments(updatedInstruments);
        }
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
        ? <VContainer gap={20} grow={1} overflow='auto' style={{ padding: 1 }}>
            <VContainer>
                <label>
                    {nls.localizeByDefault('Name')}
                </label>
                <InputWithAction>
                    <Input
                        value={instrument?.name}
                        setValue={setName}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localize('vuengine/editors/sound/clone', 'Clone')}
                        onClick={cloneInstrument}
                        disabled={!instrument}
                    >
                        <Copy size={16} />
                    </InputWithActionButton>
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localizeByDefault('Remove')}
                        onClick={removeCurrentInstrument}
                        disabled={!instrument}
                    >
                        <Trash size={16} />
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>
            <HContainer gap={40}>
                <VContainer gap={20} grow={1}>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/sound/volume', 'Volume')}
                        </label>
                        <Range
                            value={instrument?.envelope.initialValue}
                            max={VSU_ENVELOPE_INITIAL_VALUE_MAX}
                            min={VSU_ENVELOPE_INITIAL_VALUE_MIN}
                            setValue={setEnvelopeInitialValue}
                            commandsToDisable={INPUT_BLOCKING_COMMANDS}
                        />
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/sound/stereoLevels', 'Stereo Levels')}
                        </label>
                        <HContainer alignItems="center">
                            <div style={{ minWidth: 10, width: 10 }}>
                                L
                            </div>
                            <Range
                                value={instrument?.volume.left}
                                max={15}
                                min={0}
                                setValue={(v: number) => setStereoLevel('left', v)}
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
                                setValue={(v: number) => setStereoLevel('right', v)}
                                commandsToDisable={INPUT_BLOCKING_COMMANDS}
                                width="100%"
                            />
                        </HContainer>
                    </VContainer>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/editors/sound/noteDuration', 'Note Duration')}
                            tooltip={nls.localize(
                                'vuengine/editors/sound/noteDurationDescription',
                                'Specifies how long the current note should play before automatically being shut off. \
These are the durations that are natively supported by the Virtual Boy\'s sound chip. \
Longer durations can be achieved by manually manipulating the track volume.'
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
                    <VContainer gap={10}>
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
                        {instrument?.envelope.enabled &&
                            <>
                                <HContainer gap={20}>
                                    <VContainer grow={1}>
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
                                        />
                                    </VContainer>
                                </HContainer>
                                <VContainer>
                                    <InfoLabel
                                        label={nls.localizeByDefault('Preview')}
                                    // subLabel={nls.localize('vuengine/editors/sound/volumeOverTime', 'Volume over time')}
                                    />
                                    { /* TODO: switch to canvas */}
                                    <NumberArrayPreview
                                        active={true}
                                        color={COLOR_PALETTE[instrument.color ?? DEFAULT_COLOR_INDEX]}
                                        height={48}
                                        width={ENVELOPE_PREVIEW_SIZE}
                                        maximum={15}
                                        data={envelopePreviewData}
                                    />
                                </VContainer>
                            </>
                        }
                    </VContainer>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/editors/sound/tap', 'Tap')}
                            subLabel={nls.localize('vuengine/editors/sound/onlyRelevantOnNoiseTrack', 'Only relevant on noise track')}
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
                            menuPlacement='top'
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                    </VContainer>
                </VContainer>
                <VContainer gap={20} grow={1}>
                    <HContainer gap={80}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/editors/sound/waveform', 'Waveform')}
                                <div className="lightLabel">
                                    {nls.localize('vuengine/editors/sound/onlyRelevantOnWaveTracks', 'Only relevant on wave tracks')}
                                </div>
                            </label>
                            <VContainer>
                                { /* TODO: switch to canvas */}
                                <NumberArrayPreview
                                    active={true}
                                    color={COLOR_PALETTE[instrument.color ?? DEFAULT_COLOR_INDEX]}
                                    height={WAVEFORM_MAX * 2}
                                    width={WAVEFORM_MAX * 2}
                                    maximum={WAVEFORM_MAX}
                                    data={soundData.instruments[currentInstrumentId].waveform}
                                    onClick={() => setWaveformDialogOpen(currentInstrumentId)}
                                />
                            </VContainer>
                        </VContainer>
                        <VContainer grow={1}>
                            <label>
                                {nls.localize('vuengine/editors/sound/color', 'Color')}
                            </label>
                            <PaletteColorSelect
                                color={instrument.color}
                                updateColor={setColor}
                            />
                        </VContainer>
                    </HContainer>
                    <VContainer gap={10}>
                        <VContainer>
                            <InfoLabel
                                label={nls.localizeByDefault('Mode')}
                                subLabel={nls.localize('vuengine/editors/sound/onlyRelevantOnSweepModulationTrack', 'Only relevant on Sweep/Modulation track')}
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
                        {
                            instrument?.sweepMod.enabled &&
                            <VContainer gap={10}>
                                <HContainer gap={20}>
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
                                        />
                                    </VContainer>
                                </HContainer>
                                {instrument?.sweepMod.function === VsuSweepModulationFunction.Sweep &&
                                    <HContainer gap={20}>
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
                                        { /* TODO: switch to canvas */}
                                        <NumberArrayPreview
                                            active={true}
                                            color={COLOR_PALETTE[instrument.color ?? DEFAULT_COLOR_INDEX]}
                                            maximum={255}
                                            height={127}
                                            width={127}
                                            data={instrument?.modulationData}
                                            onClick={() => setModulationDataDialogOpen(currentInstrumentId)}
                                        />
                                    </VContainer>
                                }
                            </VContainer>
                        }
                    </VContainer>
                </VContainer>
            </HContainer>
        </VContainer>
        : <div className="lightLabel">
            {nls.localize(
                'vuengine/editors/sound/selectInstrumentToEdit',
                'Select an instrument to edit'
            )}
        </div>
    );
}
