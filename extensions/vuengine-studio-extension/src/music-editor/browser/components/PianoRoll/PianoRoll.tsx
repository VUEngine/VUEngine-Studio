import React from 'react';
import { ChannelConfig, MusicEditorStateApi } from '../types';
import StepIndicator from '../Sequencer/StepIndicator';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';

interface PianoRollProps {
    channel: ChannelConfig
    currentChannel: number
    currentPattern: number
    currentNote: number
    currentStep: number
    playing: boolean
    bar: number
    stateApi: MusicEditorStateApi
    playNote: (note: number) => void
    setCurrentNote: (id: number) => void
}

export default function PianoRoll(props: PianoRollProps): JSX.Element {
    const { currentNote, currentStep, currentChannel, currentPattern, channel, playing, bar, stateApi, playNote, setCurrentNote } = props;
    const pattern = channel.patterns[currentPattern];

    const classNames = ['pianoRoll'];
    classNames.push(`size-${pattern.size}`);

    let currentPatternStep = -1;
    if (channel.id === currentChannel) {
        let patternStartStep = 0;
        channel.sequence.forEach((patternId, index) => {
            const patternSize = channel.patterns[patternId].size;
            const patternEndStep = patternStartStep + patternSize;
            if (patternId === currentPattern && currentStep >= patternStartStep && currentStep < patternEndStep) {
                currentPatternStep = currentStep - patternStartStep;
                return;
            }
            patternStartStep += patternSize;
        });
    }

    return <div className={classNames.join(' ')}>
        {<StepIndicator
            currentStep={currentPatternStep}
            pianoRollSize={pattern.size}
            hidden={!playing || currentPatternStep === -1}
        />}
        {/* <PianoRollHeader
            pattern={pattern}
            stateApi={stateApi}
        />*/}
        <PianoRollEditor
            bar={bar}
            currentNote={currentNote}
            pattern={pattern}
            stateApi={stateApi}
            playNote={playNote}
            setCurrentNote={setCurrentNote}
        />
        <NoteProperties
            bar={bar}
            pattern={pattern}
            currentNote={currentNote}
            stateApi={stateApi}
            setCurrentNote={setCurrentNote}
        />
    </div>;
}
