import React, { useContext } from 'react';
import { MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';

interface PianoRollRowProps {
    note: string
    noteId: number
}

export default function PianoRollRow(props: PianoRollRowProps): React.JSX.Element {
    const { state, songData, playNote } = useContext(MusicEditorContext) as MusicEditorContextType;
    const { note, noteId } = props;

    const channel = songData.channels[state.currentChannel];
    const pattern = channel.patterns[state.currentPattern];

    const classNames = ['pianoRollRow'];
    if (note.startsWith('C') && note.length === 2) {
        classNames.push('cNote');
    }

    return <div className={classNames.join(' ')}>
        <PianoRollKey
            noteId={noteId}
            note={note}
            playNote={playNote}
        />
        {[...Array(pattern.size)].map((x, index) => (
            <PianoRollNote
                key={`pianoroll-row-${index}-note-${note}`}
                index={index}
                noteId={noteId}
                current={state.currentNote === index}
                set={pattern.notes[index] === noteId}
            />
        ))}
    </div>;
}
