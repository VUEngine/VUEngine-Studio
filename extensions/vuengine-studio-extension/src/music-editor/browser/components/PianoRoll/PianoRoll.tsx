import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';

interface PianoRollProps {
    pattern: PatternConfig
    currentNote: number
    currentStep: number
    playing: boolean
    bar: number
    stateApi: MusicEditorStateApi
}

export default function PianoRoll(props: PianoRollProps): JSX.Element {
    const { currentNote, currentStep, pattern, playing, bar, stateApi } = props;

    const classNames = ['pianoRoll'];
    if (playing) {
        classNames.push(`step-${currentStep}`);
    }

    return <div className={classNames.join(' ')}>
        {/* <PianoRollHeader
            pattern={pattern}
            stateApi={stateApi}
        />*/}
        <PianoRollEditor
            pattern={pattern}
            bar={bar}
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
