import { CommonCommands } from '@theia/core/lib/browser';
import React from 'react';
import { EditorsContextType } from '../../ves-editors-types';
import { ChannelConfig, InstrumentConfig, MusicEditorContext, MusicEditorState, Notes, PatternConfig, SongData, SongNote } from './MusicEditorTypes';
import MusicPlayer from './MusicPlayer';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import Channel from './Sidebar/Channel';
import Input from './Sidebar/Input';
import Instruments from './Sidebar/Instruments';
import Note from './Sidebar/Note';
import Song from './Sidebar/Song';
import Waveforms from './Sidebar/Waveforms';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { nls } from '@theia/core';

interface MusicEditorProps {
    songData: SongData
    updateSongData: (songData: SongData) => void
    context: EditorsContextType
}

export default class MusicEditor extends React.Component<MusicEditorProps, MusicEditorState> {
    constructor(props: MusicEditorProps) {
        super(props);
        this.state = {
            playing: false,
            recording: false,
            currentStep: 0,
            currentChannel: 0,
            currentPattern: 0,
            currentNote: -1,
            currentInstrument: 0,
            song: [],
            songLength: 0,
        };
    }

    setChannel(channelId: number, channel: Partial<ChannelConfig>): void {
        this.setSongData({
            channels: [
                ...this.props.songData.channels.slice(0, channelId),
                {
                    ...this.props.songData.channels[channelId],
                    ...channel
                },
                ...this.props.songData.channels.slice(channelId + 1)
            ]
        });
    }

    setPattern(channelId: number, patternId: number, pattern: Partial<PatternConfig>): void {
        this.setChannel(channelId, {
            patterns: [
                ...this.props.songData.channels[channelId].patterns.slice(0, patternId),
                {
                    ...this.props.songData.channels[channelId].patterns[patternId],
                    ...pattern
                },
                ...this.props.songData.channels[channelId].patterns.slice(patternId + 1)
            ]
        });
    }

    playNote(note: number): void {
        if (!this.state.playing) {
            /*
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(Notes[note], '16n');
            */
        }
    }

    setCurrentChannel(id: number): void {
        this.setState({
            currentChannel: id,
            currentPattern: this.props.songData.channels[id].sequence[0] ?? -1,
            currentNote: -1,
        });
    }

    setCurrentPattern(channel: number, pattern: number): void {
        this.setState({
            currentChannel: channel,
            currentPattern: pattern,
            currentNote: -1,
        });
    }

    setCurrentNote(id: number): void {
        this.setState({
            currentNote: id,
        });
    }

    setCurrentInstrument(id: number): void {
        this.setState({
            currentInstrument: id,
        });
    }

    toggleChannelMuted(channelId: number): void {
        this.setChannel(this.state.currentChannel, {
            muted: !this.props.songData.channels[channelId].muted,
            solo: false
        });
    }

    toggleChannelSolo(channelId: number): void {
        this.setSongData({
            channels: this.props.songData.channels.map((channel, index) => (index === channelId ? {
                ...channel,
                solo: !channel.solo,
                muted: false,
            } : {
                ...channel,
                collapsed: false,
            }))
        });
    }

    toggleChannelCollapsed(channelId: number): void {
        this.setChannel(channelId, {
            collapsed: !this.props.songData.channels[channelId].collapsed,
            solo: this.props.songData.channels[channelId].solo = false,
        });
    }

    setChannelVolume(volume: number): void {
        this.setChannel(this.state.currentChannel, {
            volume: volume,
        });
    }

    setChannelInstrument(instrument: number): void {
        this.setChannel(this.state.currentChannel, {
            instrument: instrument,
        });
    }

    setNote(index: number, note: number | undefined): void {
        const updatedNotes = [...this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].notes];
        updatedNotes[index] = note;
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            notes: updatedNotes
        });
    }

    setVolumeL(index: number, volume: number | undefined): void {
        const updatedVolume = [...this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].volumeL];
        updatedVolume[index] = volume;
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            volumeL: updatedVolume
        });
    }

    setVolumeR(index: number, volume: number | undefined): void {
        const updatedVolume = [...this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].volumeR];
        updatedVolume[index] = volume;
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            volumeR: updatedVolume
        });
    }

    addToSequence(channelId: number, patternId: number): void {
        const updatedChannel = {
            ...this.props.songData.channels[channelId],
            sequence: [
                ...this.props.songData.channels[channelId].sequence,
                patternId
            ],
        };

        const largestPatternId = this.props.songData.channels[channelId].patterns.length - 1;
        if (patternId > largestPatternId) {
            updatedChannel.patterns.push({
                name: '',
                size: this.props.songData.defaultPatternSize,
                notes: [],
                volumeL: [],
                volumeR: [],
                effects: [],
            });
        }

        this.setChannel(channelId, updatedChannel);
        this.setState({
            currentChannel: channelId,
            currentPattern: patternId,
        });
    }

    removeFromSequence(channelId: number, index: number): void {
        this.setChannel(channelId, {
            sequence: [
                ...this.props.songData.channels[channelId].sequence.slice(0, index),
                ...this.props.songData.channels[channelId].sequence.slice(index + 1)
            ],
        });
    }

    moveSequencePattern(channelId: number, from: number, to: number): void {
        const sequence = [...this.props.songData.channels[channelId].sequence];
        const removedPattern = sequence.splice(from, 1).pop();
        sequence.splice(to > from ? to - 1 : to, 0, removedPattern!);
        this.setChannel(channelId, {
            sequence: sequence
        });
    }

    setPatternName(name: string): void {
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            name: name,
        });
    }

    setPatternSize(size: number): void {
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            size: size,
        });
    }

    setSongData(songData: Partial<SongData>): void {
        this.props.updateSongData({ ...this.props.songData, ...songData });
        this.computeSong();
    }

    setInstruments(i: InstrumentConfig[]): void {
        this.setSongData({ instruments: i });
    }

    getChannelName(i: number): string {
        switch (i) {
            default:
            case 0:
            case 1:
            case 2:
            case 3:
                return `Wave ${i + 1}`;
            case 4:
                return 'Sweep';
            case 5:
                return 'Noise';
        }
    }

    protected computeSong(): void {
        const soloChannel = this.props.songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

        let songLength = 0;
        const song: (SongNote | undefined)[][] = [];

        this.props.songData.channels.forEach(channel => {
            const channelNotes: (SongNote | undefined)[] = [];
            let step = 0;
            channel.sequence.forEach(patternId => {
                const pattern = this.props.songData.channels[channel.id].patterns[patternId];
                [...Array(pattern.size)].forEach((s, i) => {
                    channelNotes[step + i] = (!channel.muted && !(soloChannel > -1 && soloChannel !== channel.id))
                        ? {
                            note: pattern.notes[i] !== undefined ? Notes[pattern.notes[i]!] : undefined,
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
                if (channelNotes.length > songLength) {
                    songLength = channelNotes.length;
                }
                song.push(channelNotes);
            }
        });

        this.setState({ song, songLength });
    }

    async componentDidMount(): Promise<void> {
        this.computeSong();
    }

    render(): React.JSX.Element {
        const { services } = this.props.context;

        return <div className='musicEditor'>
            <MusicPlayer
                currentStep={this.state.currentStep}
                playing={this.state.playing}
                speed={60000 / this.props.songData.speed}
                song={this.state.song}
                increaseCurrentStep={() => this.setState({
                    currentStep: this.state.currentStep + 1 >= this.state.songLength
                        ? 0
                        : this.state.currentStep + 1
                })}
            />

            <div className='toolbar'>
                <button
                    className='theia-button secondary large playButton'
                    title={this.state.playing ? 'Play' : 'Stop'}
                    onClick={() => {
                        this.setState({
                            currentStep: 0,
                            playing: !this.state.playing,
                        });
                    }}
                >
                    <i className={`fa fa-${this.state.playing ? 'stop' : 'play'}`} />
                </button>
                <div className='currentStep'>
                    {this.state.currentStep}
                </div>
                <button
                    className={`theia-button ${this.state.recording ? 'primary' : 'secondary'} large recordButton`}
                    title='Recording Mode'
                    disabled={true}
                    onClick={() => this.setState({ recording: !this.state.recording })}
                >
                    <i className='fa fa-circle' />
                </button>
                <button
                    className={'theia-button secondary large'}
                    title='Save'
                    onClick={() => services.commandService.executeCommand(CommonCommands.SAVE.id)}
                >
                    <i className='fa fa-save' />
                </button>
                <button
                    className={'theia-button secondary large'}
                    title='Import'
                    disabled={true}
                >
                    <i className='fa fa-download' />
                </button>
                <button
                    className={'theia-button secondary large'}
                    title='Export'
                    disabled={true}
                >
                    <i className='fa fa-upload' />
                </button>
            </div>
            <MusicEditorContext.Provider value={{
                state: this.state,
                songData: this.props.songData,
                setState: this.setState.bind(this),
                setSongData: this.setSongData.bind(this),
                setChannel: this.setChannel.bind(this),
                setPattern: this.setPattern.bind(this),
                playNote: this.playNote.bind(this),
                setCurrentChannel: this.setCurrentChannel.bind(this),
                setCurrentPattern: this.setCurrentPattern.bind(this),
                setCurrentNote: this.setCurrentNote.bind(this),
                setCurrentInstrument: this.setCurrentInstrument.bind(this),
                toggleChannelMuted: this.toggleChannelMuted.bind(this),
                toggleChannelSolo: this.toggleChannelSolo.bind(this),
                toggleChannelCollapsed: this.toggleChannelCollapsed.bind(this),
                setChannelVolume: this.setChannelVolume.bind(this),
                setChannelInstrument: this.setChannelInstrument.bind(this),
                setNote: this.setNote.bind(this),
                setVolumeL: this.setVolumeL.bind(this),
                setVolumeR: this.setVolumeR.bind(this),
                addToSequence: this.addToSequence.bind(this),
                removeFromSequence: this.removeFromSequence.bind(this),
                moveSequencePattern: this.moveSequencePattern.bind(this),
                setPatternName: this.setPatternName.bind(this),
                setPatternSize: this.setPatternSize.bind(this),
                setInstruments: this.setInstruments.bind(this),
                getChannelName: this.getChannelName.bind(this),
            }}>
                <HContainer gap={20}>
                    <VContainer gap={15} grow={1}>
                        <Tabs style={{ height: 330 }}>
                            <TabList>
                                <Tab>
                                    {nls.localize('vuengine/musicEditor/sequencer', 'Sequencer')}
                                </Tab>
                                <Tab>
                                    {nls.localize('vuengine/musicEditor/instruments', 'Instruments')}
                                </Tab>
                                <Tab>
                                    {nls.localize('vuengine/musicEditor/waveforms', 'Waveforms')}
                                </Tab>
                            </TabList>

                            <TabPanel>
                                <MusicEditorContext.Consumer>
                                    {context =>
                                        <Sequencer />
                                    }
                                </MusicEditorContext.Consumer>
                            </TabPanel>
                            <TabPanel>
                                <MusicEditorContext.Consumer>
                                    {context =>
                                        <Instruments />
                                    }
                                </MusicEditorContext.Consumer>
                            </TabPanel>
                            <TabPanel>
                                <MusicEditorContext.Consumer>
                                    {context =>
                                        <Waveforms />
                                    }
                                </MusicEditorContext.Consumer>
                            </TabPanel>
                        </Tabs>

                        <Tabs style={{ flexGrow: 1 }}>
                            <TabList>
                                <Tab>
                                    {nls.localize('vuengine/musicEditor/pianoRoll', 'Piano Roll')}
                                </Tab>
                            </TabList>

                            <TabPanel>
                                <MusicEditorContext.Consumer>
                                    {context =>
                                        <PianoRoll />
                                    }
                                </MusicEditorContext.Consumer>
                            </TabPanel>
                        </Tabs>
                    </VContainer>
                    <VContainer gap={15} style={{ width: 250 }}>
                        <Tabs>
                            <TabList>
                                <Tab>
                                    {nls.localize('vuengine/musicEditor/song', 'Song')}
                                </Tab>
                                <Tab>
                                    {nls.localize('vuengine/musicEditor/channel', 'Channel')}
                                </Tab>
                                <Tab>
                                    {nls.localize('vuengine/musicEditor/note', 'Note')}
                                </Tab>
                                <Tab>
                                    {nls.localize('vuengine/musicEditor/input', 'Input')}
                                </Tab>
                            </TabList>

                            <TabPanel>
                                <MusicEditorContext.Consumer>
                                    {context =>
                                        <Song />
                                    }
                                </MusicEditorContext.Consumer>
                            </TabPanel>
                            <TabPanel>
                                <MusicEditorContext.Consumer>
                                    {context =>
                                        <Channel />
                                    }
                                </MusicEditorContext.Consumer>
                            </TabPanel>
                            <TabPanel>
                                <MusicEditorContext.Consumer>
                                    {context =>
                                        <Note />
                                    }
                                </MusicEditorContext.Consumer>
                            </TabPanel>
                            <TabPanel>
                                <MusicEditorContext.Consumer>
                                    {context =>
                                        <Input />
                                    }
                                </MusicEditorContext.Consumer>
                            </TabPanel>
                        </Tabs>
                    </VContainer>
                </HContainer>
            </MusicEditorContext.Provider>
        </div>;
    }
}
