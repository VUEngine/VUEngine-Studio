import React, { useState } from 'react';
import { Instrument, Song, Track } from 'reactronica';
import { ChannelConfig, CurrentPattern, HIGHEST_NOTE, LOWEST_NOTE, MusicEditorStateApi, PatternConfig } from '../ves-music-editor-types';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';

interface MusicEditorProps {
    channels: ChannelConfig[]
    patterns: PatternConfig[]
    currentPattern: CurrentPattern
    playing: boolean
    recording: boolean
    bar: number
    speed: number
    maxSpeed: number
    minSpeed: number
    volume: number
    maxVolume: number
    minVolume: number
    stateApi: MusicEditorStateApi
}

export default function MusicEditor(props: MusicEditorProps): JSX.Element {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    /* setTimeout(() => {
        setCurrentStep(currentStep === 64 ? 0 : currentStep + 1);
    }, 100); */

    const {
        bar,
        channels, patterns,
        currentPattern,
        playing, recording,
        speed, maxSpeed, minSpeed,
        volume, maxVolume, minVolume,
        stateApi
    } = props;

    let currentlyEditedPattern: PatternConfig | false = false;
    patterns.forEach(pattern => {
        if (pattern.channel === currentPattern.channel && pattern.id === currentPattern.id) {
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
                    onClick={() => stateApi.setPlaying(!playing)}
                >
                    <i className={`fa fa-${playing ? 'stop' : 'play'}`} />
                </button>
                <button
                    className={`theia-button ${recording ? 'primary' : 'secondary'} large recordButton`}
                    onClick={() => stateApi.setRecording(!recording)}
                >
                    <i className='fa fa-circle' />
                </button>
                BPM:
                <input
                    className='theia-input'
                    type='number'
                    value={speed}
                    max={maxSpeed}
                    min={minSpeed}
                    step={10}
                    onChange={e => stateApi.setSpeed(parseInt(e.target.value))}
                />
                Volume:
                <input
                    className='theia-input'
                    type='number'
                    value={volume}
                    max={maxVolume}
                    min={minVolume}
                    step={10}
                    onChange={e => stateApi.setVolume(parseInt(e.target.value))}
                />
                Bar:
                <input
                    className='theia-input'
                    type='number'
                    value={bar}
                    max={8}
                    min={4}
                    step={1}
                    onChange={e => stateApi.setBar(parseInt(e.target.value))}
                />
            </div>
            <div>
                <Sequencer
                    channels={channels}
                    patterns={patterns}
                    currentPattern={currentPattern}
                    playing={playing}
                    currentStep={currentStep}
                    lowestNote={LOWEST_NOTE}
                    highestNote={HIGHEST_NOTE}
                    stateApi={stateApi}
                />
            </div>
            {currentlyEditedPattern && <PianoRoll
                playing={playing}
                pattern={currentlyEditedPattern}
                currentStep={currentStep}
                lowestNote={LOWEST_NOTE}
                highestNote={HIGHEST_NOTE}
                rowHighlight={bar}
                stateApi={stateApi}
            />}
        </div>
        <div
            className={`sidebarToggle${sidebarCollapsed ? ' collapsed' : ''}`}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className={`sidebar${sidebarCollapsed ? 'collapsed' : ''}`}>
            Sidebar
        </div>
    </div>;
}
