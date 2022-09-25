import React, { useState } from 'react';
import { Instrument, Song, Track } from 'reactronica';
import { ChannelConfig, MusicEditorStateApi, PatternConfig } from '../ves-music-editor-types';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import Sidebar from './Sidebar/Sidebar';

interface MusicEditorProps {
    name: string
    channels: ChannelConfig[]
    patterns: PatternConfig[]
    currentChannel: number
    currentPattern: number
    currentNote: number
    playing: boolean
    recording: boolean
    bar: number
    speed: number
    volume: number
    stateApi: MusicEditorStateApi
}

export default function MusicEditor(props: MusicEditorProps): JSX.Element {
    const [currentStep, setCurrentStep] = useState(0);

    /* setTimeout(() => {
        setCurrentStep(currentStep === 64 ? 0 : currentStep + 1);
    }, 100); */

    const {
        name, bar, speed, volume,
        channels, patterns,
        currentChannel, currentPattern, currentNote,
        playing, recording,
        stateApi
    } = props;

    let currentlyEditedPattern: PatternConfig | false = false;
    patterns.forEach(pattern => {
        if (pattern.channel === currentChannel && pattern.id === currentPattern) {
            currentlyEditedPattern = pattern;
        }
    });

    return <div className='musicEditor'>
        <Song isPlaying={playing} bpm={speed} volume={volume}>
            <Track
                steps={['A3', 'A4', 'A4', 'A4']}
                volume={volume}
                pan={0}
                onStepPlay={(step, index) => setCurrentStep(index)}
            >
                <Instrument
                    polyphony={1}
                    type='synth'
                />
            </Track>
        </Song>
        <div className='editor'>
            <div className='toolbar'>
                <button
                    className='theia-button secondary large playButton'
                    title={playing ? 'Play' : 'Stop'}
                    onClick={() => stateApi.setPlaying(!playing)}
                >
                    <i className={`fa fa-${playing ? 'stop' : 'play'}`} />
                </button>
                <button
                    className={`theia-button ${recording ? 'primary' : 'secondary'} large recordButton`}
                    title='Recording Mode'
                    onClick={() => stateApi.setRecording(!recording)}
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
                    patterns={patterns}
                    currentChannel={currentChannel}
                    currentPattern={currentPattern}
                    playing={playing}
                    currentStep={currentStep}
                    stateApi={stateApi}
                />
            </div>
            {currentlyEditedPattern && <PianoRoll
                playing={playing}
                pattern={currentlyEditedPattern}
                currentNote={currentNote}
                currentStep={currentStep}
                bar={bar}
                stateApi={stateApi}
            />}
        </div>
        <Sidebar
            name={name}
            volume={volume}
            speed={speed}
            bar={bar}
            pattern={currentlyEditedPattern}
            currentChannel={currentChannel}
            currentPattern={currentPattern}
            currentNote={currentNote}
            stateApi={stateApi}
        />
    </div>;
}
