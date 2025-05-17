import { nls, QuickPickItem, QuickPickOptions, QuickPickSeparator } from '@theia/core';
import { nanoid } from 'nanoid';
import React, { useContext, useEffect, useState } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import EmptyContainer from '../Common/EmptyContainer';
import { sortObjectByKeys } from '../Common/Utils';
import ModulationData from '../VsuSandbox/ModulationData';
import Emulator from './Emulator/Emulator';
import CurrentChannel from './Other/CurrentChannel';
import CurrentPattern from './Other/CurrentPattern';
import ImportExport from './Other/ImportExport';
import Instruments from './Other/Instruments';
import Song from './Other/Song';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import { SoundEditorCommands } from './SoundEditorCommands';
import SoundEditorToolbar from './SoundEditorToolbar';
import {
    BAR_NOTE_RESOLUTION,
    ChannelConfig,
    DEFAULT_NEW_NOTE_DURATION,
    EventsMap,
    InstrumentMap,
    NOTES,
    PatternConfig,
    SINGLE_NOTE_TESTING_DURATION,
    SoundData,
    SoundEditorChannelType,
    SoundEditorTool,
    SoundEvent,
    SUB_NOTE_RESOLUTION
} from './SoundEditorTypes';
import WaveformSelect from './WaveformSelect';

const NEW_PATTERN_ID = '+';

interface SoundEditorProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
}

export default function SoundEditor(props: SoundEditorProps): React.JSX.Element {
    const { soundData, updateSoundData } = props;
    const { services, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [emulatorInitialized, setEmulatorInitialized] = useState<boolean>(false);
    const [sequencerHidden, setSequencerHidden] = useState<boolean>(false);
    const [effectsPanelHidden, setEffectsPanelHidden] = useState<boolean>(true);
    const [playing, setPlaying] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>(false);
    const [testingDuration, setTestingDuration] = useState<number>(0);
    const [testingNote, setTestingNote] = useState<number>(0);
    const [testingInstrument, setTestingInstrument] = useState<string>('');
    const [testingChannel, setTestingChannel] = useState<number>(0);
    const [tool, setTool] = useState<SoundEditorTool>(SoundEditorTool.DEFAULT);
    const [newNoteDuration, setNewNoteDuration] = useState<number>(DEFAULT_NEW_NOTE_DURATION * SUB_NOTE_RESOLUTION);
    const [currentPlayerPosition, setCurrentPlayerPosition] = useState<number>(-1);
    const [currentChannelId, setCurrentChannelId] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<string>(soundData.channels[0]
        ? Object.values(soundData.channels[0].sequence)[0] ?? '' : '');
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(soundData.channels[0]
        ? parseInt(Object.keys(soundData.channels[0].sequence)[0]) ?? -1 : -1);
    const [noteCursor, setNoteCursor] = useState<number>(0);
    const [currentInstrument, setCurrentInstrument] = useState<string>('');
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [tab, setTab] = useState<number>(0);
    const [noteSnapping, setNoteSnapping] = useState<boolean>(true);
    const [channelDialogOpen, setChannelDialogOpen] = useState<boolean>(false);
    const [patternDialogOpen, setPatternDialogOpen] = useState<boolean>(false);
    const [waveformDialogOpen, setWaveformDialogOpen] = useState<string>('');
    const [modulationDataDialogOpen, setModulationDataDialogOpen] = useState<string>('');

    const updatePlayRangeStart = (value: number) => {
        if (currentPlayerPosition > -1) {
            setCurrentPlayerPosition(value);
        }
        setPlayRangeStart(value);
    };

    const setChannel = (channelId: number, channel: Partial<ChannelConfig>): void => {
        updateSoundData({
            ...soundData,
            channels: [
                ...soundData.channels.slice(0, channelId),
                {
                    ...soundData.channels[channelId],
                    ...channel
                },
                ...soundData.channels.slice(channelId + 1)
            ]
        });
    };

    const setPattern = (patternId: string, pattern: Partial<PatternConfig>): void => {
        const updatedPatterns = {
            ...soundData.patterns,
            [patternId]: {
                ...soundData.patterns[patternId],
                ...pattern
            },
        };
        updateSoundData({
            ...soundData,
            patterns: updatedPatterns,
        });
    };

    const playNote = (note: number): void => {
        if (!playing) {
            setTesting(true);
            setTestingNote(Object.values(NOTES)[note]);
            setTestingChannel(currentChannelId);
            setTestingInstrument(soundData.channels[currentChannelId].instrument);
            setTestingDuration(SINGLE_NOTE_TESTING_DURATION);
        }
    };

    const updateCurrentChannelId = (id: number): void => {
        setCurrentChannelId(id);
        setCurrentPatternId(Object.values(soundData.channels[id].sequence)[0] ?? '');
        setCurrentSequenceIndex(parseInt(Object.keys(soundData.channels[id].sequence)[0]) ?? -1);
    };

    const updateCurrentSequenceIndex = (channel: number, sequenceIndex: number): void => {
        setCurrentChannelId(channel);
        setCurrentSequenceIndex(sequenceIndex);
        setCurrentPatternId(soundData.channels[channel].sequence[sequenceIndex]);
    };

    const updateCurrentPatternId = (channelId: number, patternId: string): void => {
        setCurrentChannelId(channelId);
        setCurrentPatternId(patternId);
    };

    const showChannelTypeSelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/sound/addChannel', 'Add Channel'),
            placeholder: nls.localize('vuengine/editors/sound/selectChannelTypeToAdd', 'Select a channel type to add...'),
        };
        const items: (QuickPickItem | QuickPickSeparator)[] = [];

        if (soundData.channels.filter(c => c.type === SoundEditorChannelType.WAVE).length < 4) {
            items.push({
                id: SoundEditorChannelType.WAVE,
                label: nls.localize('vuengine/editors/sound/wave', 'Wave'),
            });
        }
        if (soundData.channels.filter(c => c.type === SoundEditorChannelType.SWEEPMOD).length === 0) {
            items.push({
                id: SoundEditorChannelType.SWEEPMOD,
                label: nls.localize('vuengine/editors/sound/waveSm', 'Wave + Sweep/Modulation'),
            });
        }
        if (soundData.channels.filter(c => c.type === SoundEditorChannelType.NOISE).length === 0) {
            items.push({
                id: SoundEditorChannelType.NOISE,
                label: nls.localize('vuengine/editors/sound/noise', 'Noise'),
            });
        }

        return services.quickPickService.show(
            items,
            quickPickOptions
        );
    };

    const addChannel = async (): Promise<void> => {
        const channelType = await showChannelTypeSelection();
        if (channelType && channelType.id) {
            doAddChannel(channelType.id as SoundEditorChannelType);
        }
    };

    const doAddChannel = async (channelType: SoundEditorChannelType): Promise<void> => {
        const type = services.vesProjectService.getProjectDataType('Sound');
        if (!type) {
            return;
        }
        const schema = await window.electronVesCore.dereferenceJsonSchema(type.schema);
        if (!schema?.properties?.channels?.items) {
            return;
        }
        const newChannelData = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.channels?.items);
        if (!newChannelData) {
            return;
        }
        const newChannelConfig = {
            ...newChannelData,
            type: channelType
        } as ChannelConfig;

        const updatedChannels: ChannelConfig[] = [
            ...soundData.channels,
            newChannelConfig,

        ].sort((a, b) => b.type.localeCompare(a.type));
        updateSoundData({
            ...soundData,
            channels: updatedChannels,
        });
    };

    const togglePlaying = (): void => {
        if (currentPlayerPosition === -1) {
            setCurrentPlayerPosition(playRangeStart);
        }
        setPlaying(!playing);
        setTesting(false);
    };

    const stopPlaying = (): void => {
        setPlaying(false);
        setCurrentPlayerPosition(-1);
    };

    const toggleChannelMuted = (channelId: number): void => {
        setChannel(channelId, {
            muted: !soundData.channels[channelId].muted,
            solo: false
        });
    };

    const toggleChannelSeeThrough = (channelId: number): void => {
        setChannel(channelId, {
            seeThrough: !soundData.channels[channelId].seeThrough,
        });
    };

    const toggleChannelSolo = (channelId: number): void => {
        updateSoundData({
            ...soundData,
            channels: soundData.channels.map((channel, index) => (index === channelId ? {
                ...channel,
                solo: !channel.solo,
                muted: false,
            } : {
                ...channel,
                solo: false,
            }))
        });
    };

    const setNote = (step: number, note?: number, prevStep?: number): void => {
        const currentPattern = soundData.patterns[currentPatternId];
        const currentPatternEvents = currentPattern.events;

        if (currentPattern === undefined) {
            return;
        }

        const updatedEvents: EventsMap = {
            ...currentPattern.events,
            [step]: {
                ...(currentPattern.events[prevStep ?? step] ?? {}),
                [SoundEvent.Note]: note,
            }
        };

        const removeNoteFromEvents = (stepToRemove: number) => {
            delete updatedEvents[stepToRemove][SoundEvent.Note];
            if (updatedEvents[stepToRemove][SoundEvent.Duration] !== undefined) {
                delete updatedEvents[stepToRemove][SoundEvent.Duration];
            }
            if (Object.keys(updatedEvents[stepToRemove]).length === 0) {
                delete updatedEvents[stepToRemove];
            }
        };

        if (note === undefined) {
            removeNoteFromEvents(step);
        } else {
            const eventKeys = Object.keys(currentPatternEvents);
            let stop = false;

            // remove previous note if it was moved from another step
            if (prevStep !== undefined && prevStep !== step) {
                removeNoteFromEvents(prevStep);
            }

            // cap note's duration
            if (updatedEvents[step][SoundEvent.Duration] === undefined) {
                let cappedDuration = 0;
                stop = false;
                eventKeys.forEach(key => {
                    const nextEventStep = parseInt(key);
                    const event = currentPatternEvents[nextEventStep];
                    if (!stop && nextEventStep > step && event[SoundEvent.Note] !== undefined) {
                        stop = true;
                        cappedDuration = Math.min(newNoteDuration, nextEventStep - step);
                    }
                });
                if (cappedDuration === 0) {
                    cappedDuration = Math.min(newNoteDuration, currentPattern.size * BAR_NOTE_RESOLUTION - step);
                }

                updatedEvents[step][SoundEvent.Duration] = cappedDuration;
            }

            // cap previous note's duration
            stop = false;
            eventKeys.reverse().forEach(key => {
                const prevEventStep = parseInt(key);
                const prevEvent = currentPatternEvents[prevEventStep];
                if (!stop && prevEventStep < step &&
                    prevEvent[SoundEvent.Note] !== undefined &&
                    prevEvent[SoundEvent.Duration] !== undefined
                ) {
                    stop = true;
                    if (prevEvent[SoundEvent.Duration] + prevEventStep >= step) {
                        updatedEvents[prevEventStep][SoundEvent.Duration] = step - prevEventStep;
                    }
                }
            });

            // ensure clean key order
            updatedEvents[step] = sortObjectByKeys(updatedEvents[step]);
        }

        setPattern(currentPatternId, {
            events: updatedEvents,
        });
    };

    const setNoteEvent = (step: number, event: SoundEvent, value?: any): void => {
        const currentPattern = soundData.patterns[currentPatternId];

        if (currentPattern === undefined) {
            return;
        }

        const updatedEvents: EventsMap = {
            ...currentPattern.events,
            [step]: {
                ...(currentPattern.events[step] ?? {})
            }
        };

        if (value === undefined) {
            delete (updatedEvents[step][event]);
        } else {
            updatedEvents[step][event] = value;
        }

        // TODO: remove step, if empty

        setPattern(currentPatternId, {
            events: updatedEvents,
        });
    };

    const setInstruments = (instruments: InstrumentMap): void => {
        updateSoundData({ ...soundData, instruments });
    };

    const setInstrumentWaveForm = (waveform: string) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            waveform,
        };

        setInstruments(updatedInstruments);
    };

    const setInstrumentModulationData = (modulationData: number[]) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            modulationData,
        };

        setInstruments(updatedInstruments);
    };

    const editInstrument = (instrument: string): void => {
        setChannelDialogOpen(false);
        setCurrentInstrument(instrument);
        setTab(1);
    };

    const addPatternToSequence = async (channelId: number, step: number, patternId: string): Promise<void> => {
        const channel = soundData.channels[channelId];
        // create if it's a new pattern
        if (patternId === NEW_PATTERN_ID) {
            const newPatternId = nanoid();
            const type = services.vesProjectService.getProjectDataType('Sound');
            const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
            // @ts-ignore
            const newPattern = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.patterns?.additionalProperties);

            const updatedChannels = [...soundData.channels];
            updatedChannels[channelId].sequence = {
                ...channel.sequence,
                [step.toString()]: newPatternId,
            };

            updateSoundData({
                ...soundData,
                channels: updatedChannels,
                patterns: {
                    ...soundData.patterns,
                    [newPatternId]: {
                        ...newPattern,
                        size: 4,
                    }
                }
            });
            updateCurrentPatternId(channelId, newPatternId);
        } else {
            setChannel(channelId, {
                ...channel,
                sequence: {
                    ...channel.sequence,
                    [step.toString()]: patternId,
                },
            });
            updateCurrentPatternId(channelId, patternId);
        }
    };

    const showPatternSelection = async (channelId: number): Promise<QuickPickItem | undefined> =>
        services.quickPickService.show(
            [
                {
                    id: NEW_PATTERN_ID,
                    label: nls.localize('vuengine/editors/sound/newPattern', 'New Pattern'),
                },
                ...Object.keys(soundData.patterns).map((p, i) => ({
                    id: p,
                    label: soundData.patterns[p].name.length
                        ? soundData.patterns[p].name
                        : (i + 1).toString(),
                })),
            ],
            {
                title: nls.localize('vuengine/editors/sound/addPattern', 'Add Pattern'),
                placeholder: nls.localize('vuengine/editors/sound/selectPatternToAdd', 'Select a pattern to add...'),
            }
        );

    const addPattern = async (channelId: number, bar: number): Promise<void> => {
        const patternToAdd = await showPatternSelection(channelId);
        if (patternToAdd && patternToAdd.id) {
            addPatternToSequence(channelId, bar, patternToAdd.id);
        }
    };

    const sequencerTabCommand = SoundEditorCommands.SHOW_SEQUENCER_VIEW;
    const instrumentsTabCommand = SoundEditorCommands.SHOW_INSTRUMENTS_VIEW;
    const settingsTabCommand = SoundEditorCommands.SHOW_SETTINGS_VIEW;

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case sequencerTabCommand.id:
                setTab(0);
                break;
            case instrumentsTabCommand.id:
                setTab(1);
                break;
            case settingsTabCommand.id:
                setTab(2);
                break;
            case SoundEditorCommands.ADD_CHANNEL.id:
                addChannel();
                break;
            case SoundEditorCommands.PLAY_PAUSE.id:
                togglePlaying();
                break;
            case SoundEditorCommands.STOP.id:
                stopPlaying();
                break;
            case SoundEditorCommands.TOOL_PENCIL.id:
                setTool(SoundEditorTool.DEFAULT);
                break;
            case SoundEditorCommands.TOOL_MARQUEE.id:
                // setTool(SoundEditorTool.MARQUEE);
                break;
            case SoundEditorCommands.ADD_NOTE.id:
                // TODO
                break;
            case SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id:
                setNoteSnapping(prev => !prev);
                break;
            case SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id:
                setSequencerHidden(prev => !prev);
                break;
            case SoundEditorCommands.ADD_PATTERN.id:
                // TODO
                break;
        }
    };

    useEffect(() => {
        enableCommands([
            ...Object.values(SoundEditorCommands).map(c => c.id)
        ]);
    }, []);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        playing,
        setPlaying,
        soundData.channels,
    ]);

    return (
        <HContainer className="musicEditor" gap={0} overflow="hidden" style={{ padding: 0 }}>
            <Emulator
                playing={playing}
                setEmulatorInitialized={setEmulatorInitialized}
                currentPlayerPosition={currentPlayerPosition}
                setCurrentPlayerPosition={setCurrentPlayerPosition}
                soundData={soundData}
                setPlaying={setPlaying}
                testing={testing}
                setTesting={setTesting}
                testingNote={testingNote}
                testingDuration={testingDuration}
                testingInstrument={testingInstrument}
                testingChannel={testingChannel}
                playRangeStart={playRangeStart}
                playRangeEnd={playRangeEnd}
            />
            <VContainer gap={0} grow={1} overflow="hidden">

                <HContainer justifyContent='space-between'>
                    <SoundEditorToolbar
                        soundData={soundData}
                        tab={tab}
                        currentPlayerPosition={currentPlayerPosition}
                        playing={playing}
                        tool={tool}
                        emulatorInitialized={emulatorInitialized}
                        noteSnapping={noteSnapping}
                        newNoteDuration={newNoteDuration}
                        setNewNoteDuration={setNewNoteDuration}
                    />
                </HContainer>
                {tab === 0 &&
                    <>
                        {soundData.channels.length === 0
                            ? <EmptyContainer
                                title={nls.localize('vuengine/editors/sound/songIsEmpty', 'This song is empty')}
                                description={nls.localize(
                                    'vuengine/editors/sound/clickBelowToAddFirstChannel',
                                    'Click below to add the first channel',
                                )}
                                onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_CHANNEL.id)}
                            />
                            : <>
                                <Sequencer
                                    soundData={soundData}
                                    updateSoundData={updateSoundData}
                                    currentPlayerPosition={currentPlayerPosition}
                                    currentPatternId={currentPatternId}
                                    setCurrentPatternId={updateCurrentPatternId}
                                    currentChannelId={currentChannelId}
                                    setCurrentChannelId={updateCurrentChannelId}
                                    currentSequenceIndex={currentSequenceIndex}
                                    setCurrentSequenceIndex={updateCurrentSequenceIndex}
                                    toggleChannelMuted={toggleChannelMuted}
                                    toggleChannelSolo={toggleChannelSolo}
                                    toggleChannelSeeThrough={toggleChannelSeeThrough}
                                    setChannel={setChannel}
                                    addPattern={addPattern}
                                    setChannelDialogOpen={setChannelDialogOpen}
                                    setPatternDialogOpen={setPatternDialogOpen}
                                    sequencerHidden={sequencerHidden}
                                    effectsPanelHidden={effectsPanelHidden}
                                />
                                <PianoRoll
                                    soundData={soundData}
                                    currentPlayerPosition={currentPlayerPosition}
                                    setCurrentPlayerPosition={setCurrentPlayerPosition}
                                    noteCursor={noteCursor}
                                    setNoteCursor={setNoteCursor}
                                    currentPatternId={currentPatternId}
                                    setCurrentPatternId={updateCurrentPatternId}
                                    currentChannelId={currentChannelId}
                                    currentSequenceIndex={currentSequenceIndex}
                                    setCurrentSequenceIndex={updateCurrentSequenceIndex}
                                    playRangeStart={playRangeStart}
                                    setPlayRangeStart={updatePlayRangeStart}
                                    playRangeEnd={playRangeEnd}
                                    setPlayRangeEnd={setPlayRangeEnd}
                                    playNote={playNote}
                                    setNote={setNote}
                                    setNoteEvent={setNoteEvent}
                                    addPattern={addPattern}
                                    sequencerHidden={sequencerHidden}
                                    setSequencerHidden={setSequencerHidden}
                                    effectsPanelHidden={effectsPanelHidden}
                                    setEffectsPanelHidden={setEffectsPanelHidden}
                                    noteSnapping={noteSnapping}
                                />
                            </>}
                    </>
                }
                {tab === 1 &&
                    <Instruments
                        soundData={soundData}
                        currentInstrument={currentInstrument}
                        setCurrentInstrument={setCurrentInstrument}
                        setInstruments={setInstruments}
                        setWaveformDialogOpen={setWaveformDialogOpen}
                        setModulationDataDialogOpen={setModulationDataDialogOpen}
                        playing={playing}
                        testing={testing}
                        setTesting={setTesting}
                        setTestingDuration={setTestingDuration}
                        setTestingNote={setTestingNote}
                        setTestingInstrument={setTestingInstrument}
                        setTestingChannel={setTestingChannel}
                        emulatorInitialized={emulatorInitialized}
                    />
                }
                {tab === 2 &&
                    <VContainer gap={15} style={{ padding: '0 var(--padding) var(--padding) var(--padding)' }}>
                        <Song
                            soundData={soundData}
                            updateSoundData={updateSoundData}
                        />
                        <hr />
                        <ImportExport />
                    </VContainer>
                }
            </VContainer >
            {channelDialogOpen &&
                <PopUpDialog
                    open={channelDialogOpen}
                    onClose={() => setChannelDialogOpen(false)}
                    onOk={() => setChannelDialogOpen(false)}
                    title={nls.localize('vuengine/editors/sound/editChannel', 'Edit Channel')
                    }
                    height='260px'
                    width='320px'
                >
                    <CurrentChannel
                        soundData={soundData}
                        currentChannelId={currentChannelId}
                        setCurrentChannelId={setCurrentChannelId}
                        setCurrentPatternId={setCurrentPatternId}
                        setChannel={setChannel}
                        editInstrument={editInstrument}
                    />
                </PopUpDialog>
            }
            {patternDialogOpen &&
                <PopUpDialog
                    open={patternDialogOpen}
                    onClose={() => setPatternDialogOpen(false)}
                    onOk={() => setPatternDialogOpen(false)}
                    title={nls.localize('vuengine/editors/sound/editPattern', 'Edit Pattern')
                    }
                    height='320px'
                    width='320px'
                >
                    <CurrentPattern
                        soundData={soundData}
                        currentChannelId={currentChannelId}
                        currentPatternId={currentPatternId}
                        setCurrentPatternId={updateCurrentPatternId}
                        setPattern={setPattern}
                    />
                </PopUpDialog>
            }
            {waveformDialogOpen !== '' &&
                <PopUpDialog
                    open={waveformDialogOpen !== ''}
                    onClose={() => setWaveformDialogOpen('')}
                    onOk={() => setWaveformDialogOpen('')}
                    title={nls.localize('vuengine/editors/sound/selectWaveform', 'Select Waveform')
                    }
                    height='100%'
                    width='100%'
                >
                    <WaveformSelect
                        value={soundData.instruments[waveformDialogOpen]?.waveform ?? 0}
                        setValue={setInstrumentWaveForm}
                    />
                    {/*
                <WaveformWithPresets
                    value={soundData.waveforms[Math.max(0, waveformDialogOpen)]}
                    setValue={setWaveform}
                />
                */}
                </PopUpDialog>
            }
            {modulationDataDialogOpen !== '' &&
                <PopUpDialog
                    open={modulationDataDialogOpen !== ''}
                    onClose={() => setModulationDataDialogOpen('')}
                    onOk={() => setModulationDataDialogOpen('')}
                    title={nls.localize('vuengine/editors/sound/editModulationData', 'Edit Modulation Data')}
                    height='100%'
                    width='100%'
                >
                    {soundData.instruments[modulationDataDialogOpen] &&
                        <ModulationData
                            value={soundData.instruments[modulationDataDialogOpen].modulationData}
                            setValue={setInstrumentModulationData}
                        />
                    }
                </PopUpDialog>
            }
        </HContainer >
    );
}
