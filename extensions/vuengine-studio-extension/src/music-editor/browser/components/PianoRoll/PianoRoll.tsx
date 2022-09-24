import React from 'react';
import { MusicEditorStateApi, Notes, PatternConfig } from '../../ves-music-editor-types';
import PianoRollRow from './PianoRollRow';

interface PianoRollProps {
    pattern: PatternConfig
    currentStep: number
    lowestNote: number
    highestNote: number
    playing: boolean
    rowHighlight: number
    stateApi: MusicEditorStateApi
}

export default function PianoRoll(props: PianoRollProps): JSX.Element {
    const { currentStep, lowestNote, highestNote, pattern, playing, rowHighlight, stateApi } = props;

    const classNames = ['pianoRoll'];
    if (playing) {
        classNames.push(`step-${currentStep}`);
    }

    return <div className={classNames.join(' ')}>
        {Notes.map((note, index) =>
            index <= lowestNote &&
            index >= highestNote && <PianoRollRow
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
                pattern={pattern}
                rowHighlight={rowHighlight}
                stateApi={stateApi}
            />)}
    </div>;
}
