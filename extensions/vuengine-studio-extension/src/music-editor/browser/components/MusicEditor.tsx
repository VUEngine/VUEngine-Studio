import React from 'react';
import {
    ChannelConfig,
    MAX_SPEED,
    MIN_SPEED,
    MusicEditorStateApi,
    Notes,
    PatternConfig,
    SongData,
} from './types';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import Sidebar from './Sidebar/Sidebar';
import * as Tone from 'tone';
import MusicPlayer from './MusicPlayer';

interface MusicEditorProps {
    songData: SongData
    setSongData: (songData: SongData) => void
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

    playNote(note: number): void {
        if (!this.state.playing) {
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(Notes[note], '16n');
        }
    }

    setName(name: string): void {
        this.props.setSongData({
            ...this.props.songData,
            name: name,
        });
    };

    setBar(bar: number): void {
        this.props.setSongData({
            ...this.props.songData,
            bar: bar,
        });
    };

    setSpeed(speed: number): void {
        if (speed <= MAX_SPEED && speed >= MIN_SPEED) {
            this.props.setSongData({
                ...this.props.songData,
                speed: speed,
            });
        }
    };

    setVolume(volume: number): void {
        if (volume <= 100 && volume >= 0) {
            this.props.setSongData({
                ...this.props.songData,
                volume: volume,
            });
        }
    };

    setDefaultPatternSize(size: number): void {
        this.props.setSongData({
            ...this.props.songData,
            defaultPatternSize: size,
        });
    };

    setCurrentChannel(id: number): void {
        this.setState({
            currentStep: 0,
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
        this.props.songData.channels[channelId].muted = !this.props.songData.channels[channelId].muted;
        this.props.songData.channels[channelId].solo = false;
        this.props.setSongData(this.props.songData);
    };

    toggleChannelSolo(channelId: number): void {
        this.props.songData.channels.forEach((channel, index) => {
            if (index === channelId) {
                channel.solo = !channel.solo;
                channel.muted = false;
            } else {
                channel.solo = false;
            }
        });
        this.props.setSongData(this.props.songData);
    };

    toggleChannelCollapsed(channelId: number): void {
        this.props.songData.channels[channelId].collapsed = !this.props.songData.channels[channelId].collapsed;
        this.props.songData.channels[channelId].solo = false;
        this.props.setSongData(this.props.songData);
    };

    render(): JSX.Element {
        const {
        } = this.props;

        const stateApi: MusicEditorStateApi = {
            setChannels: (channels: ChannelConfig[]): void => {
                this.props.setSongData({
                    ...this.props.songData,
                    channels: channels,
                });
            },

            setChannelVolume: (volume: number): void => {
                this.props.songData.channels[this.state.currentChannel].volume = volume;
                this.props.setSongData(this.props.songData);
            },

            setPatterns: (channelId: number, patterns: PatternConfig[]): void => {
                this.props.songData.channels[channelId].patterns = patterns;
                this.props.setSongData(this.props.songData);
            },

            setNote: (noteIndex: number, note: number | undefined): void => {
                this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].notes[noteIndex] = note;
                this.props.setSongData(this.props.songData);
            },

            setVolumeL: (noteIndex: number, volume: number | undefined): void => {
                this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].volumeL[noteIndex] = volume;
                this.props.setSongData(this.props.songData);
            },

            setVolumeR: (noteIndex: number, volume: number | undefined): void => {
                this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].volumeR[noteIndex] = volume;
                this.props.setSongData(this.props.songData);
            },

            addToSequence: (channelId: number, patternId: number): void => {
                this.props.songData.channels[channelId].sequence.push(patternId);

                const largestPatternId = this.props.songData.channels[channelId].patterns.length - 1;
                if (patternId > largestPatternId) {
                    this.props.songData.channels[channelId].patterns.push({
                        size: this.props.songData.defaultPatternSize,
                        notes: [],
                        volumeL: [],
                        volumeR: [],
                        effects: [],
                    });
                }

                this.props.setSongData(this.props.songData);
                this.setState({
                    currentChannel: channelId,
                    currentPattern: patternId,
                });
            },

            removeFromSequence: (channelId: number, index: number): void => {
                this.props.songData.channels[channelId].sequence.splice(index, 1);
                this.props.setSongData(this.props.songData);
            },

            moveSequencePattern: (channelId: number, from: number, to: number): void => {
                const sequence = this.props.songData.channels[channelId].sequence;
                const removedPattern = sequence.splice(from, 1).pop();
                sequence.splice(to > from ? to - 1 : to, 0, removedPattern!);
                this.props.setSongData(this.props.songData);
            },

            setPatternSize: (size: number): void => {
                this.props.songData.channels[this.state.currentChannel].patterns[this.state.currentPattern].size = size;
                this.props.setSongData(this.props.songData);
            },

            setSidebarTab: (tab: number): void => {
                this.setState({
                    sidebarTab: tab,
                });
            },
        };

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
                        stateApi={stateApi}
                        setCurrentChannel={this.setCurrentChannel.bind(this)}
                        setCurrentPattern={this.setCurrentPattern.bind(this)}
                        toggleChannelMuted={this.toggleChannelMuted.bind(this)}
                        toggleChannelSolo={this.toggleChannelSolo.bind(this)}
                        toggleChannelCollapsed={this.toggleChannelCollapsed.bind(this)}
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
                    stateApi={stateApi}
                    playNote={this.playNote.bind(this)}
                    setCurrentNote={this.setCurrentNote.bind(this)}
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
                setName={this.setName.bind(this)}
                setBar={this.setBar.bind(this)}
                setSpeed={this.setSpeed.bind(this)}
                setVolume={this.setVolume.bind(this)}
                setDefaultPatternSize={this.setDefaultPatternSize.bind(this)}
                setCurrentChannel={this.setCurrentChannel.bind(this)}
                setCurrentPattern={this.setCurrentPattern.bind(this)}
                toggleChannelMuted={this.toggleChannelMuted.bind(this)}
                toggleChannelSolo={this.toggleChannelSolo.bind(this)}
                toggleChannelCollapsed={this.toggleChannelCollapsed.bind(this)}
                stateApi={stateApi}
            />
        </div >;
    }
}
