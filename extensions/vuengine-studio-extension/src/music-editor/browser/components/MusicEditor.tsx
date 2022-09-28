import React from 'react';
import { Instrument, Song, StepType, Track } from 'reactronica';
import { ChannelConfig, MusicEditorStateApi, Notes } from '../ves-music-editor-types';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import Sidebar from './Sidebar/Sidebar';
import * as Tone from 'tone';

interface MusicEditorProps {
    name: string
    channels: ChannelConfig[]
    currentChannel: number
    currentPattern: number
    currentNote: number
    bar: number
    speed: number
    volume: number
    songNotes: (string | undefined)[][]
    sidebarTab: number
    defaultPatternSize: number
    stateApi: MusicEditorStateApi
}

interface MusicEditorState {
    playing: boolean
    recording: boolean
    currentStep: number
}

export default class MusicEditor extends React.Component<MusicEditorProps, MusicEditorState> {
    constructor(props: MusicEditorProps) {
        super(props);
        this.state = {
            playing: false,
            recording: false,
            currentStep: 0
        };
    }

    playNote(note: number): void {
        if (!this.state.playing) {
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(Notes[note], '16n');
        }
    }

    render(): JSX.Element {
        /* setTimeout(() => {
            this.setState({ currentStep: this.state.currentStep + 1 });
        }, 500);*/

        const {
            name, bar, speed, volume,
            channels, songNotes,
            defaultPatternSize,
            sidebarTab, currentChannel, currentPattern, currentNote,
            stateApi,
        } = this.props;

        return <div className='musicEditor'>
            <Song isPlaying={this.state.playing} bpm={speed} volume={volume}>
                {songNotes.map((channelNotes, index) => (
                    <Track
                        key={`track-${index}`}
                        steps={channelNotes as StepType[]}
                        volume={volume}
                        pan={0}
                        onStepPlay={(s, i) => this.setState({ currentStep: i })}
                    >
                        <Instrument polyphony={1} type='synth' />
                    </Track>
                ))}
            </Song>
            <div className='editor'>
                <div className='toolbar'>
                    <button
                        className='theia-button secondary large playButton'
                        title={this.state.playing ? 'Play' : 'Stop'}
                        onClick={() => {
                            this.setState({ playing: !this.state.playing });
                            this.setState({ currentStep: 0 });
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
                        title='Configure Input Devices'
                    >
                        <i className='fa fa-keyboard-o' />
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
                        channels={channels}
                        currentChannel={currentChannel}
                        currentPattern={currentPattern}
                        playing={this.state.playing}
                        currentStep={this.state.currentStep}
                        stateApi={stateApi}
                    />
                </div>
                {currentPattern > -1 && <PianoRoll
                    playing={this.state.playing}
                    channel={channels[currentChannel]}
                    currentChannel={currentChannel}
                    currentPattern={currentPattern}
                    currentNote={currentNote}
                    currentStep={this.state.currentStep}
                    bar={bar}
                    stateApi={stateApi}
                    playNote={this.playNote.bind(this)}
                />}
            </div>
            <Sidebar
                name={name}
                volume={volume}
                speed={speed}
                bar={bar}
                defaultPatternSize={defaultPatternSize}
                channel={channels[currentChannel]}
                pattern={channels[currentChannel].patterns[currentPattern]}
                currentChannel={currentChannel}
                currentPattern={currentPattern}
                currentNote={currentNote}
                tab={sidebarTab}
                stateApi={stateApi}
            />
        </div >;
    }
}
