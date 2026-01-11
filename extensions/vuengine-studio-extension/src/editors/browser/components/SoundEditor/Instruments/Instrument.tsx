import { Copy, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useMemo } from 'react';
import styled from 'styled-components';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import { COLOR_PALETTE } from '../../Common/PaletteColorSelect';
import { clamp, nanoid } from '../../Common/Utils';
import {
    VSU_ENVELOPE_INITIAL_VALUE_MAX,
    VSU_ENVELOPE_INITIAL_VALUE_MIN,
    VSU_ENVELOPE_STEP_TIME_MAX,
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_ENVELOPE_STEP_TIME_VALUES,
    VSU_INTERVAL_MAX,
    VSU_INTERVAL_MIN,
    VSU_INTERVAL_VALUES,
    VSU_NOISE_TAP,
    VSU_SWEEP_MODULATION_FREQUENCY_MAX,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_MAX,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_VALUES,
    VSU_SWEEP_MODULATION_INTERVAL_VALUES_PER_FREQUENCY,
    VSU_SWEEP_MODULATION_SHIFT_MAX,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction
} from '../Emulator/VsuTypes';
import { getInstrumentName } from '../SoundEditor';
import {
    InstrumentMap,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TRACK_TYPE_LABELS,
    WAVEFORM_MAX
} from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

const ColoredDiv = styled.div`
    cursor: pointer;
    height: 26px;
    width: 96px;
`;

const ENVELOPE_PREVIEW_SIZE = 272;

interface InstrumentProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    instrumentId: string
    setInstrumentId: Dispatch<SetStateAction<string>>
    setInstruments: (instruments: InstrumentMap) => void
    setWaveformDialogOpen: Dispatch<SetStateAction<string>>
    setModulationDataDialogOpen: Dispatch<SetStateAction<string>>
    setInstrumentColorDialogOpen: Dispatch<SetStateAction<string>>
}

export default function Instrument(props: InstrumentProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        instrumentId, setInstrumentId,
        setInstruments,
        setWaveformDialogOpen, setModulationDataDialogOpen, setInstrumentColorDialogOpen,
    } = props;

    const instrument = soundData.instruments[instrumentId];

    const setName = (name: string) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            name,
        };

        setInstruments(updatedInstruments);
    };

    const setType = (type: SoundEditorTrackType) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            type,
        };

        setInstruments(updatedInstruments);
    };

    const setStereoLevel = (side: 'left' | 'right', value: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            volume: {
                ...updatedInstruments[instrumentId].volume,
                [side]: value,
            },
        };

        setInstruments(updatedInstruments);
    };

    const updateInterval = (interval: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            interval: {
                ...instrument?.interval,
                enabled: interval !== 0,
                value: clamp(interval - 1, VSU_INTERVAL_MIN, VSU_INTERVAL_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleEnvelopeRepeat = () => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            envelope: {
                ...instrument?.envelope,
                repeat: !instrument?.envelope.repeat,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeType = (type: -1 | VsuEnvelopeDirection) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
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
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            envelope: {
                ...instrument?.envelope,
                stepTime: clamp(stepTime, VSU_ENVELOPE_STEP_TIME_MIN, VSU_ENVELOPE_STEP_TIME_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setEnvelopeInitialValue = (initialValue: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            envelope: {
                ...instrument?.envelope,
                initialValue: clamp(initialValue, VSU_ENVELOPE_INITIAL_VALUE_MIN, VSU_ENVELOPE_INITIAL_VALUE_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const toggleSweepModulationRepeat = () => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                repeat: !instrument?.sweepMod.repeat,
            },
        };

        setInstruments(updatedInstruments);
    };

    const updateSweepModulationFunction = (fnc: -1 | VsuSweepModulationFunction) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                enabled: fnc !== -1,
                function: fnc === -1 ? VsuSweepModulationFunction.Sweep : fnc,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationInterval = (interval: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                frequency: interval >= VSU_SWEEP_MODULATION_INTERVAL_VALUES_PER_FREQUENCY ? 1 : 0,
                interval: clamp(
                    (interval % VSU_SWEEP_MODULATION_INTERVAL_VALUES_PER_FREQUENCY) + 1,
                    VSU_SWEEP_MODULATION_INTERVAL_MIN,
                    VSU_SWEEP_MODULATION_INTERVAL_MAX
                ),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepDirection = (direction: VsuSweepDirection) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                direction,
            },
        };

        setInstruments(updatedInstruments);
    };

    const setSweepModulationShift = (shift: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            sweepMod: {
                ...instrument?.sweepMod,
                shift: clamp(shift, VSU_SWEEP_MODULATION_SHIFT_MIN, VSU_SWEEP_MODULATION_SHIFT_MAX),
            },
        };

        setInstruments(updatedInstruments);
    };

    const setTap = (tap: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
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
                name: `${getInstrumentName(soundData, instrumentId)} ${nls.localize('vuengine/general/copy', 'copy')}`,
            },
        });
        setInstrumentId(newId);
    };

    const removeCurrentInstrument = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/deleteInstrumentQuestion', 'Delete Instrument?'),
            msg: nls.localize(
                'vuengine/editors/sound/areYouSureYouWantToDelete',
                'Are you sure you want to delete {0}?',
                getInstrumentName(soundData, instrumentId)
            ),
        });
        const remove = await dialog.open();
        if (remove) {
            const updatedInstruments = { ...soundData.instruments };
            delete updatedInstruments[instrumentId];

            // remove references in tracks
            const updatedTracks = [
                ...soundData.tracks.map(track => ({
                    ...track,
                    instrument: track.instrument === instrumentId ? '' : track.instrument
                }))
            ];

            // remove references in pattern events
            const updatedPatterns = { ...soundData.patterns };
            Object.keys(soundData.patterns).forEach(patternId => {
                Object.keys(soundData.patterns[patternId].events).forEach(eventStep => {
                    if (soundData.patterns[patternId].events[parseInt(eventStep)][SoundEvent.Instrument] === instrumentId) {
                        delete updatedPatterns[patternId].events[parseInt(eventStep)][SoundEvent.Instrument];
                        if (Object.keys(updatedPatterns[patternId].events[parseInt(eventStep)]).length === 0) {
                            delete updatedPatterns[patternId].events[parseInt(eventStep)];
                        }
                    }
                });
            });

            updateSoundData({
                ...soundData,
                instruments: updatedInstruments,
                patterns: updatedPatterns,
                tracks: updatedTracks,
            });

            const firstInstrumentId = Object.keys(soundData.instruments)[0] ?? TRACK_DEFAULT_INSTRUMENT_ID;
            setInstrumentId(firstInstrumentId);
        }
    };

    const envelopePreviewData = useMemo(() => {
        const result: number[] = [];

        if (instrument?.envelope.enabled) {
            const endVolume = instrument?.envelope.direction === VsuEnvelopeDirection.Grow ? 15 : 0;
            const numberOfStepsPerCycle = instrument?.envelope.direction === VsuEnvelopeDirection.Grow
                ? 15 - instrument?.envelope.initialValue
                : instrument?.envelope.initialValue;
            const cycleDuration = (instrument?.envelope.stepTime + 1) * numberOfStepsPerCycle;
            const stepDecrease = instrument?.envelope.initialValue / cycleDuration;
            const stepIncrease = numberOfStepsPerCycle / cycleDuration;
            const cutOff = instrument?.interval.enabled
                ? (instrument?.interval.value + 1) / 4
                : ENVELOPE_PREVIEW_SIZE;

            for (let index = 0; index < ENVELOPE_PREVIEW_SIZE; index++) {
                if (index > cutOff) {
                    result[index] = 0;
                } else if (index >= cycleDuration && !instrument?.envelope.repeat) {
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
        instrument?.interval.enabled,
        instrument?.interval.value,
        instrument?.envelope.enabled,
        instrument?.envelope.initialValue,
        instrument?.envelope.direction,
        instrument?.envelope.repeat,
        instrument?.envelope.stepTime,
    ]);

    const clampedModulationFrequency = useMemo(() => clamp(
        instrument?.sweepMod.frequency ?? VSU_SWEEP_MODULATION_FREQUENCY_MIN,
        VSU_SWEEP_MODULATION_FREQUENCY_MIN,
        VSU_SWEEP_MODULATION_FREQUENCY_MAX
    ), [
        instrument?.sweepMod.frequency,
    ]);

    const clampedModulationInterval = useMemo(() => clamp(
        instrument?.sweepMod.interval ?? VSU_SWEEP_MODULATION_INTERVAL_MIN,
        VSU_SWEEP_MODULATION_INTERVAL_MIN,
        VSU_SWEEP_MODULATION_INTERVAL_MAX
    ), [
        instrument?.sweepMod.interval,
    ]);

    return (instrument !== undefined
        ? <VContainer gap={20} grow={1} overflow='hidden'>
            <HContainer gap={20}>
                <VContainer grow={1}>
                    <label>
                        {nls.localizeByDefault('Name')}
                    </label>
                    <InputWithAction>
                        <Input
                            value={instrument?.name}
                            setValue={setName}
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
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/type', 'Type')}
                    </label>
                    <AdvancedSelect
                        options={[{
                            value: SoundEditorTrackType.WAVE,
                            label: TRACK_TYPE_LABELS[SoundEditorTrackType.WAVE],
                        }, {
                            value: SoundEditorTrackType.SWEEPMOD,
                            label: TRACK_TYPE_LABELS[SoundEditorTrackType.SWEEPMOD],
                        }, {
                            value: SoundEditorTrackType.NOISE,
                            label: TRACK_TYPE_LABELS[SoundEditorTrackType.NOISE],
                        }]}
                        defaultValue={instrument.type}
                        onChange={options => setType(options[0] as SoundEditorTrackType)}
                        width={180}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/color', 'Color')}
                    </label>
                    <ColoredDiv
                        style={{
                            backgroundColor: COLOR_PALETTE[instrument.color]
                        }}
                        onClick={() => setInstrumentColorDialogOpen(instrumentId)}
                    />
                </VContainer>
            </HContainer>
            <HContainer gap={40} grow={1} wrap='wrap' overflow='auto'>
                <VContainer gap={20} style={{ minWidth: 260 }}>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/sound/initialVolume', 'Initial Volume')}
                        </label>
                        <Range
                            value={instrument?.envelope.initialValue}
                            max={VSU_ENVELOPE_INITIAL_VALUE_MAX}
                            min={VSU_ENVELOPE_INITIAL_VALUE_MIN}
                            setValue={setEnvelopeInitialValue}
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
                            max={VSU_INTERVAL_MAX + 1}
                            min={VSU_INTERVAL_MIN}
                            setValue={updateInterval}
                            selectWidth={96}
                        />
                    </VContainer>
                </VContainer>
                <VContainer gap={20} style={{ minWidth: 324 }}>
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
                                        <InfoLabel
                                            label={nls.localize('vuengine/editors/sound/envelopeInterval', 'Interval')}
                                            tooltip={nls.localize(
                                                'vuengine/editors/sound/envelopeIntervalDescription',
                                                'Defines for how long each volume level lasts before being modified by the envelope.'
                                            )}
                                        />
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
                                    <Checkbox
                                        label={nls.localize('vuengine/editors/sound/repeat', 'Repeat')}
                                        checked={instrument?.envelope.repeat}
                                        setChecked={toggleEnvelopeRepeat}
                                    />
                                </HContainer>
                                <VContainer>
                                    <InfoLabel
                                        label={nls.localizeByDefault('Preview')}
                                        subLabel={nls.localize('vuengine/editors/sound/volumeOverTime', 'Volume over time')}
                                    />
                                    { /* TODO: switch to canvas */}
                                    <NumberArrayPreview
                                        active={true}
                                        height={48}
                                        width={ENVELOPE_PREVIEW_SIZE}
                                        maximum={15}
                                        data={envelopePreviewData}
                                    />
                                </VContainer>
                            </>
                        }
                    </VContainer>
                    {instrument.type === SoundEditorTrackType.SWEEPMOD &&
                        <VContainer gap={10}>
                            <VContainer>
                                <InfoLabel
                                    label={nls.localize('vuengine/editors/sound/sweepModulation', 'Sweep/Modulation')}
                                    // subLabel={nls.localize('vuengine/editors/sound/onlyRelevantOnSweepModulationTrack', 'Only relevant on Sweep/Modulation track')}
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
                                    <VContainer grow={1}>
                                        <InfoLabel
                                            label={nls.localize('vuengine/editors/sound/modulationInterval', 'Interval')}
                                            tooltip={nls.localize(
                                                'vuengine/editors/sound/modulationIntervalDescription',
                                                'Defines for how long each frequency level lasts before being modified.'
                                            )}
                                        />
                                        <Range
                                            value={clampedModulationFrequency === 1
                                                ? clampedModulationInterval - 1 + VSU_SWEEP_MODULATION_INTERVAL_VALUES_PER_FREQUENCY
                                                : clampedModulationInterval - 1
                                            }
                                            setValue={setSweepModulationInterval}
                                            min={0}
                                            max={VSU_SWEEP_MODULATION_INTERVAL_VALUES.length - 1}
                                            options={VSU_SWEEP_MODULATION_INTERVAL_VALUES.map((interval, index) => ({
                                                value: index,
                                                label: `${interval} ms`,
                                            }))}
                                            selectWidth={88}
                                        />
                                    </VContainer>
                                    {instrument?.sweepMod.function === VsuSweepModulationFunction.Sweep &&
                                        <HContainer gap={20}>
                                            <VContainer>
                                                <label>
                                                    {nls.localize('vuengine/editors/sound/direction', 'Direction')}
                                                </label>
                                                <RadioSelect
                                                    options={[{
                                                        label: nls.localize('vuengine/editors/sound/sweepDirectionUp', 'Up'),
                                                        value: VsuSweepDirection.Up,
                                                    }, {
                                                        label: nls.localize('vuengine/editors/sound/sweepDirectionDown', 'Down'),
                                                        value: VsuSweepDirection.Down,
                                                    }]}
                                                    defaultValue={instrument?.sweepMod.direction}
                                                    onChange={options => setSweepDirection(options[0].value as VsuSweepDirection)}
                                                    allowBlank
                                                />
                                            </VContainer>
                                            <VContainer grow={1}>
                                                <label>
                                                    {nls.localize('vuengine/editors/sound/shiftAmount', 'Shift Amount')}
                                                </label>
                                                <Range
                                                    min={VSU_SWEEP_MODULATION_SHIFT_MIN}
                                                    max={VSU_SWEEP_MODULATION_SHIFT_MAX}
                                                    value={VSU_SWEEP_MODULATION_SHIFT_MAX - instrument?.sweepMod.shift}
                                                    setValue={v => setSweepModulationShift(VSU_SWEEP_MODULATION_SHIFT_MAX - v)}
                                                    options={[...Array(VSU_SWEEP_MODULATION_SHIFT_MAX - VSU_SWEEP_MODULATION_SHIFT_MIN + 1)].map((x, i) => ({
                                                        value: i,
                                                        label: `${i + 1}`,
                                                    }))}
                                                />
                                            </VContainer>
                                        </HContainer>
                                    }
                                    {instrument?.sweepMod.function === VsuSweepModulationFunction.Modulation &&
                                        <HContainer gap={20}>
                                            <VContainer>
                                                <InfoLabel
                                                    label={nls.localize('vuengine/editors/sound/modulationData', 'Modulation Data')}
                                                />
                                                { /* TODO: switch to canvas */}
                                                <NumberArrayPreview
                                                    active={true}
                                                    maximum={255}
                                                    height={127}
                                                    width={255}
                                                    data={instrument?.modulationData}
                                                    onClick={() => setModulationDataDialogOpen(instrumentId)}
                                                />
                                            </VContainer>
                                            <Checkbox
                                                label={nls.localize('vuengine/editors/sound/repeat', 'Repeat')}
                                                checked={instrument?.sweepMod.repeat}
                                                setChecked={toggleSweepModulationRepeat}
                                            />
                                        </HContainer>
                                    }
                                </VContainer>
                            }
                        </VContainer>
                    }

                    {instrument.type === SoundEditorTrackType.NOISE &&
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/editors/sound/tapLocation', 'Tap Location')}
                                // subLabel={nls.localize('vuengine/editors/sound/onlyRelevantOnNoiseTrack', 'Only relevant on noise track')}
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
                                width={240}
                            />
                        </VContainer>
                    }
                </VContainer>
                {instrument.type !== SoundEditorTrackType.NOISE &&
                    <VContainer gap={20} style={{ minWidth: 260 }}>
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/editors/sound/waveform', 'Waveform')}
                            // subLabel={nls.localize('vuengine/editors/sound/onlyRelevantOnWaveTracks', 'Only relevant on wave tracks')}
                            />
                            <VContainer>
                                { /* TODO: switch to canvas */}
                                <NumberArrayPreview
                                    active={true}
                                    height={WAVEFORM_MAX * 2}
                                    width={WAVEFORM_MAX * 4}
                                    maximum={WAVEFORM_MAX}
                                    data={soundData.instruments[instrumentId].waveform}
                                    onClick={() => setWaveformDialogOpen(instrumentId)}
                                />
                            </VContainer>
                        </VContainer>
                    </VContainer>
                }
            </HContainer>
        </VContainer >
        : <div className="lightLabel">
            {nls.localize(
                'vuengine/editors/sound/selectInstrumentToEdit',
                'Select an instrument to edit'
            )}
        </div>
    );
}
