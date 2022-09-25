import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, MusicEditorStateApi, Notes, PatternConfig } from '../../ves-music-editor-types';
import PianoRollRow from './PianoRollRow';

interface PianoRollEditorProps {
    pattern: PatternConfig
    bar: number
    stateApi: MusicEditorStateApi
}

export default function PianoRollEditor(props: PianoRollEditorProps): JSX.Element {
    const { pattern, bar, stateApi } = props;

    const classNames = ['pianoRollEditor'];

    return <div className={classNames.join(' ')}>
        {Notes.map((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE && <PianoRollRow
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
                pattern={pattern}
                bar={bar}
                stateApi={stateApi}
            />)}
    </div>;
}
