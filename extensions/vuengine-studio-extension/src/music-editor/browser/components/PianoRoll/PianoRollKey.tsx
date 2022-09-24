import React from 'react';

interface PianoRollKeyProps {
    note: string
}

export default function PianoRollKey(props: PianoRollKeyProps): JSX.Element {
    const { note } = props;

    const classNames = ['pianoRollKey'];
    if (note.includes('#')) {
        classNames.push('sharpNote');
    }

    return <div className={classNames.join(' ')}>
        {note}
    </div>;
}
