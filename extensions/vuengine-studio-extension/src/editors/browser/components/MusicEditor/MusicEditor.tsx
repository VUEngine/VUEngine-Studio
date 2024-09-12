import { ChartScatter, FadersHorizontal, GearSix, Guitar, Keyboard } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useEffect, useMemo, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { EDITORS_COMMANDS } from '../../ves-editors-commands';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import MusicEditorToolbar from './MusicEditorToolbar';
import { ChannelConfig, InstrumentConfig, NOTES, PatternConfig, SongData, SongNote } from './MusicEditorTypes';
import MusicPlayer from './MusicPlayer';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import Channel from './Sidebar/Channel';
import ImportExport from './Sidebar/ImportExport';
import InputDevices from './Sidebar/InputDevices';
import Instruments from './Sidebar/Instruments';
import Note from './Sidebar/Note';
import Pattern from './Sidebar/Pattern';
import Patterns from './Sidebar/Patterns';
import Song from './Sidebar/Song';

interface MusicEditorProps {
    songData: SongData
    updateSongData: (songData: SongData) => void
}

export default function MusicEditor(props: MusicEditorProps): React.JSX.Element {
    const { songData, updateSongData } = props;
    const [playing, setPlaying] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [currentChannelId, setCurrentChannelId] = useState<number>(0);
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<number>(0);
    const [currentNote, setCurrentNote] = useState<number>(-1);
    const [currentInstrument, setCurrentInstrument] = useState<number>(0);
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [song, setSong] = useState<(SongNote | undefined)[][]>([]);
    const [songLength, setSongLength] = useState<number>(0);

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
    };

    const updateCurrentSequenceIndex = (channel: number, sequenceIndex: number): void => {
        setCurrentChannelId(channel);
        setCurrentSequenceIndex(sequenceIndex);
        setCurrentPatternId(songData.channels[channel].sequence[sequenceIndex]);
        setCurrentNote(-1);
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
    };

    const updateCurrentPatternId = (channel: number, pattern: number): void => {
        setCurrentChannelId(channel);
        setCurrentPatternId(pattern);
        setCurrentNote(-1);
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
    };

    const togglePlaying = (): void => {
        setCurrentStep(playRangeStart > -1 ? currentPatternNoteOffset + playRangeStart : 0);
        setPlaying(!playing);
    };

    const toggleChannelMuted = (channelId: number): void => {
        setChannel(currentChannelId, {
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

    const getChannelName = (i: number): string => {
        switch (i) {
            case 0:
            case 1:
            case 2:
            case 3:
                return `Wave ${i + 1}`;
            case 4:
                return 'Sweep';
            case 5:
                return 'Noise';
            default:
                return '-';
        }
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
                [...Array(pattern.size)].forEach((s, i) => {
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
                step += pattern.size;
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
            case EDITORS_COMMANDS.MusicEditor.commands.playPause.id:
                togglePlaying();
                break;
        }
    };

    // the starting note index of the current pattern
    const currentPatternNoteOffset = useMemo(() => {
        let result = 0;
        const currentChannel = songData.channels[currentChannelId];
        currentChannel.sequence.forEach((s, sequenceIndex) => {
            if (currentSequenceIndex > sequenceIndex) {
                result += currentChannel.patterns[s].size;
            }
        });

        return result;
    }, [
        songData.channels,
        currentChannelId,
        currentSequenceIndex,
    ]);

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
        <HContainer className='musicEditor' gap={20} overflow='hidden'>
            <MusicPlayer
                currentStep={currentStep}
                playing={playing}
                speed={60000 / songData.speed}
                song={song}
                increaseCurrentStep={() => {
                    const startNoteIndex = playRangeStart > -1
                        ? currentPatternNoteOffset + playRangeStart
                        : 0;
                    const endNoteIndex = playRangeEnd > -1
                        ? currentPatternNoteOffset + playRangeEnd
                        : songLength;
                    setCurrentStep(currentStep + 1 > endNoteIndex
                        ? startNoteIndex
                        : currentStep + 1);
                }}
            />
            <VContainer gap={10} grow={1}>
                <MusicEditorToolbar
                    currentStep={currentStep}
                    playing={playing}
                    togglePlaying={togglePlaying}
                />
                <Sequencer
                    songData={songData}
                    currentStep={currentStep}
                    playing={playing}
                    currentPatternId={currentPatternId}
                    setCurrentPatternId={updateCurrentPatternId}
                    currentChannelId={currentChannelId}
                    setCurrentChannelId={updateCurrentChannelId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={updateCurrentSequenceIndex}
                    getChannelName={getChannelName}
                    toggleChannelMuted={toggleChannelMuted}
                    toggleChannelSolo={toggleChannelSolo}
                    setChannel={setChannel}
                />
                <PianoRoll
                    songData={songData}
                    currentStep={currentStep}
                    playing={playing}
                    currentNote={currentNote}
                    setCurrentNote={setCurrentNote}
                    currentPatternId={currentPatternId}
                    currentPatternNoteOffset={currentPatternNoteOffset}
                    currentChannelId={currentChannelId}
                    currentSequenceIndex={currentSequenceIndex}
                    getChannelName={getChannelName}
                    playRangeStart={playRangeStart}
                    setPlayRangeStart={setPlayRangeStart}
                    playRangeEnd={playRangeEnd}
                    setPlayRangeEnd={setPlayRangeEnd}
                    playNote={playNote}
                    setNote={setNote}
                />
            </VContainer>
            <VContainer gap={15} overflow='auto' style={{ maxWidth: 250, minWidth: 250 }}>
                <Tabs>
                    <TabList>
                        <Tab
                            title={nls.localize('vuengine/musicEditor/selected', 'Selected')}
                        >
                            <FadersHorizontal size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/musicEditor/instruments', 'Instruments')}
                        >
                            <Guitar size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/musicEditor/patterns', 'Patterns')}
                        >
                            <ChartScatter size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/musicEditor/inputDevices', 'Input Devices')}
                        >
                            <Keyboard size={20} />
                        </Tab>
                        <Tab
                            title={nls.localize('vuengine/musicEditor/settings', 'Settings')}
                        >
                            <GearSix size={20} />
                        </Tab>
                    </TabList>
                    <TabPanel>
                        <VContainer gap={15}>
                            <Channel
                                songData={songData}
                                currentChannelId={currentChannelId}
                                setCurrentChannelId={setCurrentChannelId}
                                getChannelName={getChannelName}
                                setChannel={setChannel}
                                toggleChannelMuted={toggleChannelMuted}
                                toggleChannelSolo={toggleChannelSolo}
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
                            <Note
                                songData={songData}
                                currentChannelId={currentChannelId}
                                currentPatternId={currentPatternId}
                                setCurrentPatternId={updateCurrentPatternId}
                                currentNote={currentNote}
                                setNote={setNote}
                                setPattern={setPattern}
                            />
                        </VContainer>
                    </TabPanel>
                    <TabPanel>
                        <Instruments
                            songData={songData}
                            currentInstrument={currentInstrument}
                            setCurrentInstrument={setCurrentInstrument}
                            setInstruments={setInstruments}
                        />
                    </TabPanel>
                    <TabPanel>
                        <Patterns />
                    </TabPanel>
                    <TabPanel>
                        <InputDevices />
                    </TabPanel>
                    <TabPanel>
                        <VContainer gap={15}>
                            <Song
                                songData={songData}
                                setSongData={updateSongData}
                            />
                            <hr />
                            <ImportExport />
                        </VContainer>
                    </TabPanel>
                </Tabs>
            </VContainer>
        </HContainer>
    );
}
