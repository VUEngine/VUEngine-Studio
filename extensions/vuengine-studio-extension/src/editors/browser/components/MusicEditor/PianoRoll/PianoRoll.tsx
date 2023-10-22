import React, { useContext } from 'react';
import { MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';
import StepIndicator from '../Sequencer/StepIndicator';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';

export default function PianoRoll(): React.JSX.Element {
    const { state, songData } = useContext(MusicEditorContext) as MusicEditorContextType;

    const channel = songData.channels[state.currentChannel];
    const pattern = channel.patterns[state.currentPattern];

    if (state.currentPattern === -1) {
        return <div>
            Select a pattern to edit
        </div>;
    }

    const classNames = ['pianoRoll'];
    classNames.push(`size-${pattern.size}`);

    let currentPatternStep = -1;
    if (channel.id === state.currentChannel) {
        let patternStartStep = 0;
        channel.sequence.forEach((patternId, index) => {
            const patternSize = channel.patterns[patternId].size;
            const patternEndStep = patternStartStep + patternSize;
            if (patternId === state.currentPattern && state.currentStep >= patternStartStep && state.currentStep < patternEndStep) {
                currentPatternStep = state.currentStep - patternStartStep;
                return;
            }
            patternStartStep += patternSize;
        });
    }

    return <div className={classNames.join(' ')}>
        {<StepIndicator
            currentStep={currentPatternStep}
            pianoRollSize={pattern.size}
            hidden={!state.playing || currentPatternStep === -1}
        />}
        {/* <PianoRollHeader/> */}
        <PianoRollEditor />
        <NoteProperties />
    </div>;
}
