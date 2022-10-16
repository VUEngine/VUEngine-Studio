import React from 'react';

interface PianoRollKeyProps {
    noteId: number
    note: string
    playNote: (note: number) => void
}

export default function PianoRollKey(props: PianoRollKeyProps): JSX.Element {
    const { noteId, note, playNote } = props;

    const classNames = ['pianoRollKey'];
    if (note.includes('#')) {
        classNames.push('sharpNote');
    }

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        playNote(noteId);
        e.preventDefault();
    };

    const onMouse = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 1) {
            playNote(noteId);
        }
        e.preventDefault();
    };

    return <div
        className={classNames.join(' ')}
        onClick={onClick}
        onMouseDown={onMouse}
        onMouseOver={onMouse}
    >
        <div>{note}</div>
    </div>;
}
