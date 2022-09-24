import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';

interface PianoRollRowProps {
    note: string
    noteId: number
    pattern: PatternConfig
    rowHighlight: number
    stateApi: MusicEditorStateApi
}

export default function PianoRollRow(props: PianoRollRowProps): JSX.Element {
    const { note, noteId, pattern, rowHighlight, stateApi } = props;

    const classNames = ['pianoRollRow'];
    if (note.startsWith('C') && note.length === 2) {
        classNames.push('cNote');
    }

    return <div className={classNames.join(' ')}>
        <PianoRollKey note={note} />
        {[...Array(pattern.size)].map((x, index) => (
            <PianoRollNote
                key={`pianoroll-row-${index}-note-${note}`}
                channel={pattern.channel}
                pattern={pattern.id}
                index={index}
                note={noteId}
                rowHighlight={rowHighlight}
                set={pattern.notes[index] === noteId}
                stateApi={stateApi}
            />
        ))}
    </div>;
}
