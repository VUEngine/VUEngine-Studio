import React from 'react';
import { MusicEditorStateApi, PatternConfig, PatternSwitchStep } from '../../ves-music-editor-types';
import StepIndicator from '../Sequencer/StepIndicator';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';

interface PianoRollProps {
    pattern: PatternConfig
    patternMap: PatternSwitchStep[]
    currentNote: number
    currentStep: number
    playing: boolean
    bar: number
    stateApi: MusicEditorStateApi
}

export default function PianoRoll(props: PianoRollProps): JSX.Element {
    const { patternMap, currentNote, currentStep, pattern, playing, bar, stateApi } = props;

    const classNames = ['pianoRoll'];

    let currentPatternStep = -1;
    let count = 0;
    patternMap.forEach((step, index) => {
        count += step.step;
        if (currentStep >= step.step &&
            (!patternMap[index + 1] || currentStep < patternMap[index + 1].step) &&
            step.pattern === pattern.id) {
            currentPatternStep = currentStep - count;
            return;
        }
    });

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
        />
        <NoteProperties
            bar={bar}
            pattern={pattern}
            currentNote={currentNote}
            stateApi={stateApi}
        />
    </div>;
}
