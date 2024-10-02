import React, { memo } from 'react';
import { StyledPianoRollKey, StyledPianoRollKeyName } from './StyledComponents';

interface PianoRollKeyProps {
    noteId: number
    note: string
    playNote: (note: number) => void
}

export default memo(function PianoRollKey(props: PianoRollKeyProps): React.JSX.Element {
    const { noteId, note, playNote } = props;

    const classNames = [];
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

    return <StyledPianoRollKey
        className={classNames.join(' ')}
        onClick={onClick}
        onMouseDown={onMouse}
        onMouseOver={onMouse}
    >
        <StyledPianoRollKeyName>
            {note}
        </StyledPianoRollKeyName>
    </StyledPianoRollKey>;
}, (oldProps, newProps) => true);
