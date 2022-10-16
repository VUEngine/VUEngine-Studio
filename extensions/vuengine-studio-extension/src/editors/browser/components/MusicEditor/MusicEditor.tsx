import React from 'react';
import * as Tone from 'tone';
import { ChannelConfig, Notes, PatternConfig, SongData } from './MusicEditorTypes';
import MusicPlayer from './MusicPlayer';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import Sidebar from './Sidebar/Sidebar';

interface MusicEditorProps {
    songData: SongData
    updateSongData: (songData: SongData) => void
}

interface MusicEditorState {
    playing: boolean
    recording: boolean
    currentStep: number
    currentChannel: number
    currentPattern: number
    currentNote: number
    sidebarTab: number,
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
            sidebarTab: 0,
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
    };

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
    };

    playNote(note: number): void {
        if (!this.state.playing) {
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(Notes[note], '16n');
        }
    }

    setCurrentChannel(id: number): void {
        this.setState({
            currentChannel: id,
            currentPattern: this.props.songData.channels[id].sequence[0] ?? -1,
            currentNote: -1,
            sidebarTab: 0,
        });
    };

    setCurrentPattern(channel: number, pattern: number): void {
        this.setState({
            currentChannel: channel,
            currentPattern: pattern,
            currentNote: -1,
            sidebarTab: 0,
        });
    };

    setCurrentNote(id: number): void {
        this.setState({
            currentNote: id,
            sidebarTab: 1,
        });
    };

    toggleChannelMuted(channelId: number): void {
        this.setChannel(this.state.currentChannel, {
            muted: !this.props.songData.channels[channelId].muted,
            solo: false
        });
    };

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
    };

    toggleChannelCollapsed(channelId: number): void {
        this.setChannel(channelId, {
            collapsed: !this.props.songData.channels[channelId].collapsed,
            solo: this.props.songData.channels[channelId].solo = false,
        });
    };

    setChannelVolume(volume: number): void {
        this.setChannel(this.state.currentChannel, {
            volume: volume,
        });
    };

    setChannelInstrument(instrument: number): void {
        this.setChannel(this.state.currentChannel, {
            instrument: instrument,
        });
    };

    setNote(index: number, note: number | undefined): void {
        const updatedNotes = [...this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].notes];
        updatedNotes[index] = note;
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            notes: updatedNotes
        });
    };

    setVolumeL(index: number, volume: number | undefined): void {
        const updatedVolume = [...this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].volumeL];
        updatedVolume[index] = volume;
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            volumeL: updatedVolume
        });
    };

    setVolumeR(index: number, volume: number | undefined): void {
        const updatedVolume = [...this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].volumeR];
        updatedVolume[index] = volume;
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            volumeR: updatedVolume
        });
    };

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
    };

    removeFromSequence(channelId: number, index: number): void {
        this.setChannel(channelId, {
            sequence: [
                ...this.props.songData.channels[channelId].sequence.slice(0, index),
                ...this.props.songData.channels[channelId].sequence.slice(index + 1)
            ],
        });
    };

    moveSequencePattern(channelId: number, from: number, to: number): void {
        const sequence = [...this.props.songData.channels[channelId].sequence];
        const removedPattern = sequence.splice(from, 1).pop();
        sequence.splice(to > from ? to - 1 : to, 0, removedPattern!);
        this.setChannel(channelId, {
            sequence: sequence
        });
    };

    setPatternSize(size: number): void {
        this.setPattern(this.state.currentChannel, this.state.currentPattern, {
            size: size,
        });
    };

    setSidebarTab(tab: number): void {
        this.setState({
            sidebarTab: tab,
        });
    };

    setSongData(songData: Partial<SongData>): void {
        this.props.updateSongData({ ...this.props.songData, ...songData });
    };

    render(): JSX.Element {
        const soloChannel = this.props.songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

        let songLength = 0;
        const songNotes: (string | undefined)[][] = [];
        this.props.songData.channels.forEach(channel => {
            const channelNotes: (string | undefined)[] = [];
            let step = 0;
            channel.sequence.forEach(patternId => {
                const pattern = this.props.songData.channels[channel.id].patterns[patternId];
                [...Array(pattern.size)].forEach((s, i) => {
                    channelNotes[step + i] = (pattern.notes[i] !== undefined
                        && !channel.muted
                        && !(soloChannel > -1 && soloChannel !== channel.id))
                        ? Notes[pattern.notes[i]!]
                        : undefined;
                });
                step += pattern.size;
            });
            if (channelNotes.length) {
                if (channelNotes.length > songLength) {
                    songLength = channelNotes.length;
                }
                songNotes.push(channelNotes);
            }
        });

        return <div className='musicEditor'>
            <MusicPlayer
                currentStep={this.state.currentStep}
                playing={this.state.playing}
                speed={60000 / this.props.songData.speed}
                notes={songNotes}
                increaseCurrentStep={() => this.setState({
                    currentStep: this.state.currentStep + 1 >= songLength
                        ? 0
                        : this.state.currentStep + 1
                })}
            />
            <div className='editor'>
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
                        onClick={() => this.setState({ recording: !this.state.recording })}
                    >
                        <i className='fa fa-circle' />
                    </button>
                    <button
                        className={'theia-button secondary large'}
                        title='Save'
                    >
                        <i className='fa fa-save' />
                    </button>
                    <button
                        className={'theia-button secondary large'}
                        title='Import'
                    >
                        <i className='fa fa-download' />
                    </button>
                    <button
                        className={'theia-button secondary large'}
                        title='Export'
                    >
                        <i className='fa fa-upload' />
                    </button>
                </div>
                <div>
                    <Sequencer
                        channels={this.props.songData.channels}
                        currentChannel={this.state.currentChannel}
                        currentPattern={this.state.currentPattern}
                        playing={this.state.playing}
                        currentStep={this.state.currentStep}
                        instruments={this.props.songData.instruments}
                        setCurrentChannel={this.setCurrentChannel.bind(this)}
                        setCurrentPattern={this.setCurrentPattern.bind(this)}
                        toggleChannelMuted={this.toggleChannelMuted.bind(this)}
                        toggleChannelSolo={this.toggleChannelSolo.bind(this)}
                        toggleChannelCollapsed={this.toggleChannelCollapsed.bind(this)}
                        removeFromSequence={this.removeFromSequence.bind(this)}
                        moveSequencePattern={this.moveSequencePattern.bind(this)}
                        addToSequence={this.addToSequence.bind(this)}
                    />
                </div>
                {this.state.currentPattern > -1 && <PianoRoll
                    playing={this.state.playing}
                    channel={this.props.songData.channels[this.state.currentChannel]}
                    currentChannel={this.state.currentChannel}
                    currentPattern={this.state.currentPattern}
                    currentNote={this.state.currentNote}
                    currentStep={this.state.currentStep}
                    bar={this.props.songData.bar}
                    playNote={this.playNote.bind(this)}
                    setCurrentNote={this.setCurrentNote.bind(this)}
                    setNote={this.setNote.bind(this)}
                />}
            </div>
            <Sidebar
                name={this.props.songData.name}
                volume={this.props.songData.volume}
                speed={this.props.songData.speed}
                bar={this.props.songData.bar}
                defaultPatternSize={this.props.songData.defaultPatternSize}
                channel={this.props.songData.channels[this.state.currentChannel]}
                pattern={this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern]}
                currentChannel={this.state.currentChannel}
                currentPattern={this.state.currentPattern}
                currentNote={this.state.currentNote}
                tab={this.state.sidebarTab}
                instruments={this.props.songData.instruments}
                setCurrentChannel={this.setCurrentChannel.bind(this)}
                setCurrentPattern={this.setCurrentPattern.bind(this)}
                toggleChannelMuted={this.toggleChannelMuted.bind(this)}
                toggleChannelSolo={this.toggleChannelSolo.bind(this)}
                toggleChannelCollapsed={this.toggleChannelCollapsed.bind(this)}
                setSidebarTab={this.setSidebarTab.bind(this)}
                setChannelVolume={this.setChannelVolume.bind(this)}
                setChannelInstrument={this.setChannelInstrument.bind(this)}
                setPatternSize={this.setPatternSize.bind(this)}
                setNote={this.setNote.bind(this)}
                setVolumeL={this.setVolumeL.bind(this)}
                setVolumeR={this.setVolumeR.bind(this)}
                setSongData={this.setSongData.bind(this)}
            />
        </div >;
    }
}
