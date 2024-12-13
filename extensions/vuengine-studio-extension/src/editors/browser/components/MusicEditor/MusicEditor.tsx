import { FadersHorizontal, GearSix, Guitar, Keyboard } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import ModulationData from '../VsuSandbox/ModulationData';
import WaveformWithPresets from '../VsuSandbox/WaveformWithPresets';
import { MusicEditorCommands } from './MusicEditorCommands';
import MusicEditorToolbar from './MusicEditorToolbar';
import {
    BAR_PATTERN_LENGTH_MULT_MAP,
    ChannelConfig,
    InstrumentConfig,
    MusicEditorMode,
    MusicEditorTool,
    NOTES,
    PatternConfig,
    SongData,
    SongNote
} from './MusicEditorTypes';
import MusicPlayer from './MusicPlayer';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import Channel from './Sidebar/Channel';
import CurrentNote from './Sidebar/CurrentNote';
import ImportExport from './Sidebar/ImportExport';
import InputDevices from './Sidebar/InputDevices';
import Instruments from './Sidebar/Instruments';
import Pattern from './Sidebar/Pattern';
import Song from './Sidebar/Song';
import Waveforms from './Sidebar/Waveforms';
import Tracker from './Tracker/Tracker';

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
    const [tool, setTool] = useState<MusicEditorTool>(MusicEditorTool.DEFAULT);
    const [editorMode, setEditorMode] = useState<MusicEditorMode>(MusicEditorMode.PIANOROLL);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [currentChannelId, setCurrentChannelId] = useState<number>(0);
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<number>(0);
    const [currentNote, setCurrentNote] = useState<number>(-1);
    const [currentInstrument, setCurrentInstrument] = useState<number>(0);
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [song, setSong] = useState<(SongNote | undefined)[][]>([]);
    const [songLength, setSongLength] = useState<number>(0);
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
            /*
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(Notes[note], '16n');
            */
        }
    };

    const updateCurrentChannelId = (id: number): void => {
        setCurrentChannelId(id);
        setCurrentPatternId(songData.channels[id].sequence[0] ?? -1);
        setCurrentNote(-1);
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
        setSidebarTab(0);
    };

    const updateCurrentSequenceIndex = (channel: number, sequenceIndex: number): void => {
        setCurrentChannelId(channel);
        setCurrentSequenceIndex(sequenceIndex);
        setCurrentPatternId(songData.channels[channel].sequence[sequenceIndex]);
        setCurrentNote(-1);
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
        setSidebarTab(0);
    };

    const updateCurrentPatternId = (channel: number, pattern: number): void => {
        setCurrentChannelId(channel);
        setCurrentPatternId(pattern);
        setCurrentNote(-1);
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
        setSidebarTab(0);
    };

    const updateCurrentNote = (note: number): void => {
        setSidebarTab(0);
        setCurrentNote(note);
    };

    const toggleEditorMode = (): void => {
        setEditorMode(editorMode === MusicEditorMode.PIANOROLL ? MusicEditorMode.TRACKER : MusicEditorMode.PIANOROLL);
    };

    const togglePlaying = (): void => {
        if (currentStep === -1) {
            setCurrentStep(playRangeStart);
        }
        setPlaying(!playing);
    };

    const stopPlaying = (): void => {
        setCurrentStep(-1);
        setPlaying(false);
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

    const setNote = (index: number, note: number | undefined): void => {
        const updatedNotes = [...songData.channels[currentChannelId].patterns[currentPatternId].notes];
        updatedNotes[index] = note;
        setPattern(currentChannelId, currentPatternId, {
            notes: updatedNotes
        });
    };

    const setInstruments = (instruments: InstrumentConfig[]): void => {
        updateSongData({ ...songData, instruments });
    };

    const setWaveform = (value: number[]): void => {
        const updatedWaveforms = [...songData.waveforms];
        updatedWaveforms[waveformDialogOpen] = value;

        updateSongData({ ...songData, waveforms: updatedWaveforms });
    };

    const setInstrumentModulationData = (modulationData: number[]) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            modulationData,
        };

        setInstruments(updatedInstruments);
    };

    const computeSong = (): void => {
        const soloChannel = songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

        let newSongLength = 0;
        const newSong: (SongNote | undefined)[][] = [];

        songData.channels.forEach(channel => {
            const channelNotes: (SongNote | undefined)[] = [];
            let step = 0;
            channel.sequence.forEach(patternId => {
                const pattern = songData.channels[channel.id].patterns[patternId];
                const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;
                [...Array(patternSize)].forEach((s, i) => {
                    channelNotes[step + i] = (!channel.muted && !(soloChannel > -1 && soloChannel !== channel.id))
                        ? {
                            note: pattern.notes[i] !== undefined ? Object.keys(NOTES)[pattern.notes[i]!] : undefined,
                            volumeL: (typeof pattern.volumeL[i] === 'number')
                                ? 20 * Math.log10((pattern.volumeL[i]! / 100) ** 2) // convert to decibels
                                : undefined,
                            volumeR: (typeof pattern.volumeR[i] === 'number') ? pattern.volumeL[i] : undefined,
                        }
                        : undefined;
                });
                step += patternSize;
            });
            if (channelNotes.length) {
                if (channelNotes.length > newSongLength) {
                    newSongLength = channelNotes.length;
                }
                newSong.push(channelNotes);
            }
        });

        setSong(newSong);
        setSongLength(newSongLength);
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
        computeSong();
    }, [
        songData
    ]);

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
                currentStep={currentStep}
                playing={playing}
                speed={60000 / songData.speed}
                song={song}
                increaseCurrentStep={() => {
                    const nextStep = currentStep + 1;
                    const startNoteIndex = playRangeStart > -1
                        ? currentPatternNoteOffset + playRangeStart
                        : 0;
                    const endNoteIndex = playRangeEnd > -1
                        ? currentPatternNoteOffset + playRangeEnd
                        : songLength;
                    if (nextStep > endNoteIndex) {
                        if (songData.loop) {
                            setCurrentStep(startNoteIndex);
                        } else {
                            setCurrentStep(-1);
                            setPlaying(false);
                        }
                    } else {
                        setCurrentStep(nextStep);
                    }
                }}
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
                            currentNote={currentNote}
                            setCurrentNote={updateCurrentNote}
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
                            title={nls.localize('vuengine/musicEditor/selected', 'Selected')}
                            style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                        >
                            <FadersHorizontal size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/musicEditor/instruments', 'Instruments')}
                            style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                        >
                            <Guitar size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/musicEditor/inputDevices', 'Input Devices')}
                            style={{ display: 'flex', flexGrow: 1, height: 26, justifyContent: 'center', marginRight: 0 }}
                        >
                            <Keyboard size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/musicEditor/settings', 'Settings')}
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
                            <CurrentNote
                                songData={songData}
                                currentChannelId={currentChannelId}
                                currentPatternId={currentPatternId}
                                setCurrentPatternId={updateCurrentPatternId}
                                currentNote={currentNote}
                                setNote={updateNote}
                                setPattern={setPattern}
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
                                setSidebarTab={setSidebarTab}
                                setModulationDataDialogOpen={setModulationDataDialogOpen}
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
                            <Waveforms
                                songData={songData}
                                setWaveformDialogOpen={setWaveformDialogOpen}
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
                title={nls.localize('vuengine/musicEditor/editWaveform', 'Edit Waveform')
                }
                height='100%'
                width='100%'
            >
                <WaveformWithPresets
                    value={songData.waveforms[Math.max(0, waveformDialogOpen)]}
                    setValue={setWaveform}
                />
            </PopUpDialog>
            <PopUpDialog
                open={modulationDataDialogOpen > -1}
                onClose={() => setModulationDataDialogOpen(-1)}
                onOk={() => setModulationDataDialogOpen(-1)}
                title={nls.localize('vuengine/musicEditor/editModulationData', 'Edit Modulation Data')}
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
