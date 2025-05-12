import React from 'react';
import styled from 'styled-components';
import { PIANO_ROLL_KEY_WIDTH, PIANO_ROLL_NOTE_HEIGHT } from '../SoundEditorTypes';

export const StyledPianoKey = styled.div`
    align-items: center;
    background-color: #eee;
    border-bottom: 0px solid rgba(0, 0, 0, .5);
    box-sizing: border-box;
    color: #666;
    cursor: pointer;
    display: flex;
    font-size: 9px;
    left: 0;
    line-height: 6px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: ${PIANO_ROLL_KEY_WIDTH}px;
    padding-left: 3px;
    position: sticky;
    width: ${PIANO_ROLL_KEY_WIDTH}px;
    z-index: 300;

    &.sharpNote {
        background-color: #eee !important;
        color: rgba(0, 0, 0, .5);

        &:after {
            background: #111;
            border-top-right-radius: 2px;
            border-bottom-right-radius: 2px;
            content: "";
            height: 100%;
            position: absolute;
            left: 0;
            width: 75%;
        }
    }

    &:hover,
    &.sharpNote:hover:after {
        background: var(--theia-button-background);
        color: var(--theia-button-foreground)
    }

    &:nth-child(12n) {
        border-bottom-width: 1px;
    }

    &:nth-child(84) {
        border-bottom-width: 0;
    }
`;

export const StyledPianoRollKeyName = styled.div`
    display: none;
    z-index: 1;

    ${StyledPianoKey}:nth-child(12n) &,
    ${StyledPianoKey}:hover & {
        display: block;
    }
`;

interface PianoRollKeyProps {
    noteId: number
    note: string
    playNote: (note: number) => void
}

export default function PianoRollKey(props: PianoRollKeyProps): React.JSX.Element {
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

    return <StyledPianoKey
        className={classNames.join(' ')}
        onClick={onClick}
        onMouseDown={onMouse}
        onMouseOver={onMouse}
    >
        <StyledPianoRollKeyName>
            {note}
        </StyledPianoRollKeyName>
    </StyledPianoKey>;
};
