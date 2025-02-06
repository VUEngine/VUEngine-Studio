import { FadersHorizontal, GearSix, Guitar, Keyboard } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import ModulationData from '../VsuSandbox/ModulationData';
import { MusicEditorCommands } from './MusicEditorCommands';
import MusicEditorToolbar from './MusicEditorToolbar';
import {
    BAR_PATTERN_LENGTH_MULT_MAP,
    ChannelConfig,
    EventsMap,
    InstrumentConfig,
    MusicEditorMode,
    MusicEditorTool,
    MusicEvent,
    NOTES,
    PatternConfig,
    SINGLE_NOTE_TESTING_DURATION,
    SongData
} from './MusicEditorTypes';
import MusicPlayer from './MusicPlayer';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import Channel from './Sidebar/Channel';
import CurrentTick from './Sidebar/CurrentTick';
import ImportExport from './Sidebar/ImportExport';
import InputDevices from './Sidebar/InputDevices';
import Instruments from './Sidebar/Instruments';
import Pattern from './Sidebar/Pattern';
import Song from './Sidebar/Song';
import Tracker from './Tracker/Tracker';
import WaveformSelect from './WaveformSelect';

interface MusicEditorProps {
    songData: SongData
    updateSongData: (songData: SongData) => void
}

export const INPUT_BLOCKING_COMMANDS = [
    MusicEditorCommands.PLAY_PAUSE.id,
    MusicEditorCommands.STOP.id,
    MusicEditorCommands.TOOL_PENCIL.id,
    MusicEditorCommands.TOOL_ERASER.id,
    MusicEditorCommands.TOOL_MARQUEE.id,
];

export default function MusicEditor(props: MusicEditorProps): React.JSX.Element {
    const { songData, updateSongData } = props;
    const { enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [playing, setPlaying] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>(false);
    const [testingDuration, setTestingDuration] = useState<number>(0);
    const [testingNote, setTestingNote] = useState<number>(0);
    const [testingInstrument, setTestingInstrument] = useState<number>(0);
    const [testingChannel, setTestingChannel] = useState<number>(0);
    const [tool, setTool] = useState<MusicEditorTool>(MusicEditorTool.DEFAULT);
    const [editorMode, setEditorMode] = useState<MusicEditorMode>(MusicEditorMode.PIANOROLL);
    const [playbackElapsedTime, setPlaybackElapsedTime] = useState<number>(0);
    const [totalLength, setTotalLength] = useState<number>(0);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [currentChannelId, setCurrentChannelId] = useState<number>(0);
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<number>(0);
    const [currentTick, setCurrentTick] = useState<number>(0);
    const [currentInstrument, setCurrentInstrument] = useState<number>(0);
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [sidebarTab, setSidebarTab] = useState<number>(0);
    const [waveformDialogOpen, setWaveformDialogOpen] = useState<number>(-1);
    const [modulationDataDialogOpen, setModulationDataDialogOpen] = useState<number>(-1);
    const [lastSetNoteId, setLastSetNoteId] = useState<number>(-1);

    const updateNote = (index: number, note: number | undefined) => {
        setLastSetNoteId(index);
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

    const toggleEditorMode = (): void => {
        setEditorMode(editorMode === MusicEditorMode.PIANOROLL ? MusicEditorMode.TRACKER : MusicEditorMode.PIANOROLL);
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

    const toggleChannelSolo = (channelId: number): void => {
        updateSongData({
            ...songData,
            channels: songData.channels.map((channel, index) => (index === channelId ? {
                ...channel,
                solo: !channel.solo,
                muted: false,
            } : {
                ...channel,
                collapsed: false,
            }))
        });
    };

    const updateEvents = (index: number, event: MusicEvent, value: any): void => {
        value = isNaN(value) ? undefined : value;
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

    const setNote = (index: number, note: number | undefined): void =>
        updateEvents(index, MusicEvent.Note, note);

    const setInstruments = (instruments: InstrumentConfig[]): void => {
        updateSongData({ ...songData, instruments });
    };

    const setInstrumentWaveForm = (waveform: string) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            waveform,
        };

        setInstruments(updatedInstruments);
    };

    const setInstrumentModulationData = (modulationData: number[]) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            modulationData,
        };

        setInstruments(updatedInstruments);
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case MusicEditorCommands.PLAY_PAUSE.id:
                togglePlaying();
                break;
            case MusicEditorCommands.STOP.id:
                stopPlaying();
                break;
            case MusicEditorCommands.TOOL_PENCIL.id:
                setTool(MusicEditorTool.DEFAULT);
                break;
            case MusicEditorCommands.TOOL_ERASER.id:
                setTool(MusicEditorTool.ERASER);
                break;
            case MusicEditorCommands.TOOL_MARQUEE.id:
                // setTool(MusicEditorTool.MARQUEE);
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
                const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;
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
            ...Object.values(MusicEditorCommands).map(c => c.id)
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
        <HContainer className="musicEditor" overflow="hidden" style={{ padding: 0 }}>
            <MusicPlayer
                songData={songData}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                playing={playing}
                setPlaying={setPlaying}
                testing={testing}
                setTesting={setTesting}
                testingNote={testingNote}
                testingDuration={testingDuration}
                testingInstrument={testingInstrument}
                testingChannel={testingChannel}
                playRangeStart={playRangeStart}
                playRangeEnd={playRangeEnd}
                currentPatternNoteOffset={currentPatternNoteOffset}
                playbackElapsedTime={playbackElapsedTime}
                setPlaybackElapsedTime={setPlaybackElapsedTime}
                totalLength={totalLength}
                setTotalLength={setTotalLength}
            />
            <VContainer gap={0} grow={1} overflow="hidden">
                <MusicEditorToolbar
                    currentStep={currentStep}
                    playing={playing}
                    editorMode={editorMode}
                    toggleEditorMode={toggleEditorMode}
                    togglePlaying={togglePlaying}
                    stopPlaying={stopPlaying}
                    tool={tool}
                    setTool={setTool}
                    playbackElapsedTime={playbackElapsedTime}
                    totalLength={totalLength}
                    speed={songData.speed}
                />
                {editorMode === MusicEditorMode.TRACKER
                    ? <Tracker />
                    : <>
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
                            setChannel={setChannel}
                        />
                        <PianoRoll
                            songData={songData}
                            currentStep={currentStep}
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
                            tool={tool}
                            lastSetNoteId={lastSetNoteId}
                            setLastSetNoteId={setLastSetNoteId}
                        />
                    </>
                }
            </VContainer>
            <VContainer gap={15} overflow="auto" style={{ maxWidth: 300, minWidth: 300 }}>
                <Tabs
                    selectedIndex={sidebarTab}
                    onSelect={index => setSidebarTab(index)}
                >
                    <TabList style={{ display: 'flex', padding: 'var(--padding) var(--padding) 0 var(--padding)' }}>
                        <Tab
                            title={nls.localize('vuengine/editors/music/selected', 'Selected')}
                            style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                        >
                            <FadersHorizontal size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/editors/music/instruments', 'Instruments')}
                            style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                        >
                            <Guitar size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/editors/music/inputDevices', 'Input Devices')}
                            style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                        >
                            <Keyboard size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/editors/music/settings', 'Settings')}
                            style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                        >
                            <GearSix size={20} />
                        </Tab>
                    </TabList>
                    <TabPanel>
                        <VContainer gap={15} style={{ padding: '0 var(--padding) var(--padding) var(--padding)' }}>
                            <Channel
                                songData={songData}
                                currentChannelId={currentChannelId}
                                setCurrentChannelId={setCurrentChannelId}
                                setChannel={setChannel}
                                toggleChannelMuted={toggleChannelMuted}
                                toggleChannelSolo={toggleChannelSolo}
                                setCurrentInstrument={setCurrentInstrument}
                                setSidebarTab={setSidebarTab}
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
                            <CurrentTick
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
                            />
                        </VContainer>
                    </TabPanel>
                    <TabPanel>
                        <VContainer gap={15} style={{ padding: '0 var(--padding) var(--padding) var(--padding)' }}>
                            <InputDevices />
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
                open={waveformDialogOpen > -1}
                onClose={() => setWaveformDialogOpen(-1)}
                onOk={() => setWaveformDialogOpen(-1)}
                title={nls.localize('vuengine/editors/music/selectWaveform', 'Select Waveform')
                }
                height='100%'
                width='100%'
            >
                <WaveformSelect
                    value={songData.instruments[Math.max(0, waveformDialogOpen)].waveform}
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
                open={modulationDataDialogOpen > -1}
                onClose={() => setModulationDataDialogOpen(-1)}
                onOk={() => setModulationDataDialogOpen(-1)}
                title={nls.localize('vuengine/editors/music/editModulationData', 'Edit Modulation Data')}
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
        </HContainer >
    );
}
