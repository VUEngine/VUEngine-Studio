import { FadersHorizontal, Guitar, MusicNote } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import ModulationData from '../VsuSandbox/ModulationData';
import Emulator from './Emulator/Emulator';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import Channel from './Sidebar/Channel';
import CurrentPatternStep from './Sidebar/CurrentPatternStep';
import ImportExport from './Sidebar/ImportExport';
import Instruments from './Sidebar/Instruments';
import Pattern from './Sidebar/Pattern';
import Song from './Sidebar/Song';
import { SoundEditorCommands } from './SoundEditorCommands';
import SoundEditorToolbar from './SoundEditorToolbar';
import {
    ChannelConfig,
    EventsMap,
    InstrumentMap,
    NOTE_RESOLUTION,
    NOTES,
    PatternConfig,
    SINGLE_NOTE_TESTING_DURATION,
    SoundData,
    SoundEditorTool,
    SoundEvent
} from './SoundEditorTypes';
import WaveformSelect from './WaveformSelect';

export const StyledSidebarHideToggle = styled.button`
    background-color: transparent;
    border: 0;
    box-shadow: 5px 0 0 var(--theia-editor-background) inset, 6px 0 0 inset;
    color: var(--theia-dropdown-border);
    cursor: pointer;
    font-size: 9px;
    margin: 10px 0;
    max-width: 12px;
    min-width: 12px !important;
    padding: 0;

    i {
        background-color: var(--theia-editor-background);
        padding: var(--theia-ui-padding) 0;
    }

    &:hover {
        background-color: var(--theia-focusBorder);
        border-radius: 2px;
        box-shadow: none;
        color: #fff;

        i {
            background-color: transparent;
        }
    }
`;

interface SoundEditorProps {
    songData: SoundData
    updateSongData: (songData: SoundData) => void
}

export default function SoundEditor(props: SoundEditorProps): React.JSX.Element {
    const { songData, updateSongData } = props;
    const { enableCommands, services } = useContext(EditorsContext) as EditorsContextType;
    const [emulatorInitialized, setEmulatorInitialized] = useState<boolean>(false);
    const [sidebarHidden, setSidebarHidden] = useState<boolean>(false);
    const [sequencerHidden, setSequencerHidden] = useState<boolean>(false);
    const [playing, setPlaying] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>(false);
    const [testingDuration, setTestingDuration] = useState<number>(0);
    const [testingNote, setTestingNote] = useState<number>(0);
    const [testingInstrument, setTestingInstrument] = useState<string>('');
    const [testingChannel, setTestingChannel] = useState<number>(0);
    const [tool, setTool] = useState<SoundEditorTool>(SoundEditorTool.DEFAULT);
    const [newNoteDuration, setNewNoteDuration] = useState<number>(4);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [currentChannelId, setCurrentChannelId] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<number>(songData.channels[0].sequence[0]);
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(0);
    const [currentTick, setCurrentTick] = useState<number>(0);
    const [currentInstrument, setCurrentInstrument] = useState<string>('');
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [sidebarTab, setSidebarTab] = useState<number>(0);
    const [waveformDialogOpen, setWaveformDialogOpen] = useState<string>('');
    const [modulationDataDialogOpen, setModulationDataDialogOpen] = useState<string>('');

    const updateNote = (index: number, note: number | undefined) => {
        setNote(index, note);
    };

    const updatePlayRangeStart = (value: number) => {
        if (currentStep > -1) {
            setCurrentStep(value);
        }
        setPlayRangeStart(value);
    };

    const setChannel = (channelId: number, channel: Partial<ChannelConfig>): void => {
        updateSongData({
            ...songData,
            channels: [
                ...songData.channels.slice(0, channelId),
                {
                    ...songData.channels[channelId],
                    ...channel
                },
                ...songData.channels.slice(channelId + 1)
            ]
        });
    };

    const setPattern = (channelId: number, patternId: number, pattern: Partial<PatternConfig>): void => {
        setChannel(channelId, {
            patterns: [
                ...songData.channels[channelId].patterns.slice(0, patternId),
                {
                    ...songData.channels[channelId].patterns[patternId],
                    ...pattern
                },
                ...songData.channels[channelId].patterns.slice(patternId + 1)
            ]
        });
    };

    const playNote = (note: number): void => {
        if (!playing) {
            setTesting(true);
            setTestingNote(Object.values(NOTES)[note]);
            setTestingChannel(currentChannelId);
            setTestingInstrument(songData.channels[currentChannelId].instrument);
            setTestingDuration(SINGLE_NOTE_TESTING_DURATION);
        }
    };

    const updateCurrentChannelId = (id: number): void => {
        setCurrentChannelId(id);
        setCurrentPatternId(songData.channels[id].sequence[0] ?? -1);
        setCurrentTick(songData.channels[id].sequence.length ? 0 : -1);
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
        setSidebarTab(0);
    };

    const updateCurrentSequenceIndex = (channel: number, sequenceIndex: number): void => {
        setCurrentChannelId(channel);
        setCurrentSequenceIndex(sequenceIndex);
        setCurrentPatternId(songData.channels[channel].sequence[sequenceIndex]);
        setCurrentTick(0);
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
        setSidebarTab(0);
    };

    const updateCurrentPatternId = (channel: number, pattern: number): void => {
        setCurrentChannelId(channel);
        setCurrentPatternId(pattern);
        setCurrentTick(0);
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
        setSidebarTab(0);
    };

    const updateCurrentTick = (note: number): void => {
        setSidebarTab(0);
        setCurrentTick(note);
    };

    const togglePlaying = (): void => {
        if (currentStep === -1) {
            setCurrentStep(playRangeStart);
        }
        setPlaying(!playing);
        setTesting(false);
    };

    const stopPlaying = (): void => {
        setPlaying(false);
        setCurrentStep(-1);
    };

    const toggleChannelMuted = (channelId: number): void => {
        setChannel(channelId, {
            muted: !songData.channels[channelId].muted,
            solo: false
        });
    };

    const toggleChannelSeeThrough = (channelId: number): void => {
        setChannel(channelId, {
            seeThrough: !songData.channels[channelId].seeThrough,
        });
    };

    const toggleChannelSolo = (channelId: number): void => {
        updateSongData({
            ...songData,
            channels: songData.channels.map((channel, index) => (index === channelId ? {
                ...channel,
                solo: !channel.solo,
                muted: false,
            } : {
                ...channel,
                solo: false,
            }))
        });
    };

    const updateEvents = (index: number, event: SoundEvent, value: any): void => {
        const updatedEvents: EventsMap = {
            ...songData.channels[currentChannelId].patterns[currentPatternId].events,
            [index]: {
                ...songData.channels[currentChannelId].patterns[currentPatternId].events[index] ?? {},
                [event]: value,
            },
        };
        if (value === undefined) {
            delete updatedEvents[index][event];
            if (Object.keys(updatedEvents[index]).length === 0) {
                delete updatedEvents[index];
            }
        }

        setPattern(currentChannelId, currentPatternId, {
            events: updatedEvents
        });
    };

    const setNote = (step: number, note?: number): void => {
        const updatedEvents: EventsMap = {
            ...songData.channels[currentChannelId].patterns[currentPatternId].events,
        };

        if (note === undefined) {
            // remove note and duration events
            delete updatedEvents[step][SoundEvent.Note];
            if (updatedEvents[step][SoundEvent.Duration] !== undefined) {
                delete updatedEvents[step][SoundEvent.Duration];
            }
            if (Object.keys(updatedEvents[step]).length === 0) {
                delete updatedEvents[step];
            }
        } else {
            const events = songData.channels[currentChannelId].patterns[currentPatternId].events;
            const eventKeys = Object.keys(events);
            let stop = false;

            // set note & duration
            if (updatedEvents[step] === undefined) {
                updatedEvents[step] = {};

                let cappedDuration = 0;
                if (newNoteDuration > 1) {
                    // cap note's duration
                    stop = false;
                    eventKeys.forEach(key => {
                        const nextEventStep = parseInt(key);
                        const event = events[nextEventStep];
                        if (!stop && nextEventStep > step &&
                            event[SoundEvent.Note] !== undefined
                        ) {
                            stop = true;
                            cappedDuration = Math.min(newNoteDuration, nextEventStep - step);
                        }
                    });
                    if (cappedDuration === 0) {
                        const currentChannel = songData.channels[currentChannelId];
                        const currentPattern = currentChannel.patterns[currentPatternId];
                        cappedDuration = Math.min(newNoteDuration, currentPattern.size * NOTE_RESOLUTION - step);
                    }
                }
                updatedEvents[step][SoundEvent.Duration] = cappedDuration;
            }
            updatedEvents[step][SoundEvent.Note] = note;

            // cap previous note's duration
            stop = false;
            eventKeys.reverse().forEach(key => {
                const prevEventStep = parseInt(key);
                const event = events[prevEventStep];
                if (!stop && prevEventStep < step &&
                    event[SoundEvent.Note] !== undefined &&
                    event[SoundEvent.Duration] !== undefined
                ) {
                    stop = true;
                    if (event[SoundEvent.Duration] + prevEventStep >= step) {
                        updatedEvents[prevEventStep][SoundEvent.Duration] = step - prevEventStep;
                    }
                }
            });
        }

        setPattern(currentChannelId, currentPatternId, {
            events: updatedEvents
        });
    };

    const setInstruments = (instruments: InstrumentMap): void => {
        updateSongData({ ...songData, instruments });
    };

    const setInstrumentWaveForm = (waveform: string) => {
        const updatedInstruments = { ...songData.instruments };
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            waveform,
        };

        setInstruments(updatedInstruments);
    };

    const setInstrumentModulationData = (modulationData: number[]) => {
        const updatedInstruments = { ...songData.instruments };
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            modulationData,
        };

        setInstruments(updatedInstruments);
    };

    const editInstrument = (instrument: string): void => {
        setCurrentInstrument(instrument);
        setSidebarTab(1);
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
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
            case SoundEditorCommands.ADD_EFFECT.id:
                // TODO
                break;
            case SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id:
                setSequencerHidden(prev => !prev);
                break;
            case SoundEditorCommands.TOGGLE_SIDEBAR_VISIBILITY.id:
                setSidebarHidden(prev => !prev);
                break;
        }
    };

    // the starting note index of the current pattern
    const currentPatternNoteOffset = useMemo(() => {
        let result = 0;
        const currentChannel = songData.channels[currentChannelId];
        currentChannel.sequence.forEach((s, sequenceIndex) => {
            if (currentSequenceIndex > sequenceIndex) {
                const pattern = currentChannel.patterns[s];
                const patternSize = pattern.size * NOTE_RESOLUTION;
                result += patternSize;
            }
        });

        return result;
    }, [
        songData.channels,
        currentChannelId,
        currentSequenceIndex,
    ]);

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
    ]);

    return (
        <HContainer className="musicEditor" gap={0} overflow="hidden" style={{ padding: 0 }}>
            <Emulator
                playing={playing}
                setEmulatorInitialized={setEmulatorInitialized}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                songData={songData}
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
                <SoundEditorToolbar
                    currentStep={currentStep}
                    playing={playing}
                    togglePlaying={togglePlaying}
                    stopPlaying={stopPlaying}
                    tool={tool}
                    setTool={setTool}
                    emulatorInitialized={emulatorInitialized}
                />
                <Sequencer
                    songData={songData}
                    currentStep={currentStep}
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
                    sequencerHidden={sequencerHidden}
                    setSequencerHidden={setSequencerHidden}
                />
                <PianoRoll
                    songData={songData}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    currentTick={currentTick}
                    setCurrentTick={updateCurrentTick}
                    currentPatternId={currentPatternId}
                    currentPatternNoteOffset={currentPatternNoteOffset}
                    currentChannelId={currentChannelId}
                    currentSequenceIndex={currentSequenceIndex}
                    playRangeStart={playRangeStart}
                    setPlayRangeStart={updatePlayRangeStart}
                    playRangeEnd={playRangeEnd}
                    setPlayRangeEnd={setPlayRangeEnd}
                    playNote={playNote}
                    setNote={updateNote}
                    newNoteDuration={newNoteDuration}
                    setNewNoteDuration={setNewNoteDuration}
                />
            </VContainer>
            <StyledSidebarHideToggle
                onClick={() => setSidebarHidden(prev => !prev)}
                title={`${SoundEditorCommands.TOGGLE_SIDEBAR_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOGGLE_SIDEBAR_VISIBILITY.id, true)
                    }`}
            >
                <i className={sidebarHidden ? 'fa fa-chevron-left' : 'fa fa-chevron-right'} />
            </StyledSidebarHideToggle>
            {!sidebarHidden &&
                <>
                    <VContainer gap={15} overflow="auto" style={{ maxWidth: 300, minWidth: 300 }}>
                        <Tabs
                            selectedIndex={sidebarTab}
                            onSelect={index => setSidebarTab(index)}
                        >
                            <TabList style={{ display: 'flex', padding: 'var(--padding) var(--padding) 0 var(--padding)' }}>
                                <Tab
                                    title={nls.localize('vuengine/editors/sound/selected', 'Selected')}
                                    style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                                >
                                    <MusicNote size={20} />
                                </Tab>
                                <Tab
                                    title={nls.localize('vuengine/editors/sound/instruments', 'Instruments')}
                                    style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                                >
                                    <Guitar size={20} />
                                </Tab>
                                <Tab
                                    title={nls.localize('vuengine/editors/sound/settings', 'Settings')}
                                    style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                                >
                                    <FadersHorizontal size={20} />
                                </Tab>
                            </TabList>
                            <TabPanel>
                                <VContainer gap={15} style={{ padding: '0 var(--padding) var(--padding) var(--padding)' }}>
                                    <Channel
                                        songData={songData}
                                        currentChannelId={currentChannelId}
                                        setCurrentChannelId={setCurrentChannelId}
                                        setChannel={setChannel}
                                        editInstrument={editInstrument}
                                    />
                                    <hr />
                                    <Pattern
                                        songData={songData}
                                        currentChannelId={currentChannelId}
                                        currentPatternId={currentPatternId}
                                        setCurrentPatternId={updateCurrentPatternId}
                                        setPattern={setPattern}
                                    />
                                    <hr />
                                    <CurrentPatternStep
                                        songData={songData}
                                        currentChannelId={currentChannelId}
                                        currentPatternId={currentPatternId}
                                        setCurrentPatternId={updateCurrentPatternId}
                                        currentTick={currentTick}
                                        setCurrentTick={setCurrentTick}
                                        updateEvents={updateEvents}
                                        playing={playing}
                                        testing={testing}
                                        setTesting={setTesting}
                                        setTestingDuration={setTestingDuration}
                                        setTestingNote={setTestingNote}
                                        setTestingInstrument={setTestingInstrument}
                                        setTestingChannel={setTestingChannel}
                                        emulatorInitialized={emulatorInitialized}
                                        editInstrument={editInstrument}
                                    />
                                </VContainer>
                            </TabPanel>
                            <TabPanel>
                                <VContainer gap={15} style={{ padding: '0 var(--padding) var(--padding) var(--padding)' }}>
                                    <Instruments
                                        songData={songData}
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
                                </VContainer>
                            </TabPanel>
                            <TabPanel>
                                <VContainer gap={15} style={{ padding: '0 var(--padding) var(--padding) var(--padding)' }}>
                                    <Song
                                        songData={songData}
                                        updateSongData={updateSongData}
                                    />
                                    <hr />
                                    <ImportExport />
                                </VContainer>
                            </TabPanel>
                        </Tabs>
                    </VContainer>
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
                            value={songData.instruments[waveformDialogOpen]?.waveform ?? 0}
                            setValue={setInstrumentWaveForm}
                        />
                        {/*
                        <WaveformWithPresets
                            value={songData.waveforms[Math.max(0, waveformDialogOpen)]}
                            setValue={setWaveform}
                        />
                        */}
                    </PopUpDialog>
                    <PopUpDialog
                        open={modulationDataDialogOpen !== ''}
                        onClose={() => setModulationDataDialogOpen('')}
                        onOk={() => setModulationDataDialogOpen('')}
                        title={nls.localize('vuengine/editors/sound/editModulationData', 'Edit Modulation Data')}
                        height='100%'
                        width='100%'
                    >
                        {songData.instruments[modulationDataDialogOpen] &&
                            <ModulationData
                                value={songData.instruments[modulationDataDialogOpen].modulationData}
                                setValue={setInstrumentModulationData}
                            />
                        }
                    </PopUpDialog>
                </>
            }
        </HContainer>
    );
}
