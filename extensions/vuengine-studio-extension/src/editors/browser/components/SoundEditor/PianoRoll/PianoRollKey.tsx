import React, { MouseEvent } from 'react';
import styled from 'styled-components';
import { NOTE_PLAY_STOP_DELAY, NOTES_LABELS, PIANO_ROLL_KEY_WIDTH } from '../SoundEditorTypes';

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

    &.cNote {
        border-bottom-width: 1px;
    }

    &.last {
        border-bottom-width: 0;
    }
`;

export const StyledPianoRollKeyName = styled.div`
    display: none;
    z-index: 1;

    ${StyledPianoKey}.cNote &,
    ${StyledPianoKey}:hover & {
        display: block;
    }
`;

interface PianoRollKeyProps {
    noteId: number
    note: string
    playNote: (note: string, instrumentId?: string) => void
    pianoRollNoteHeight: number
}

export default function PianoRollKey(props: PianoRollKeyProps): React.JSX.Element {
    const { noteId, note, playNote, pianoRollNoteHeight } = props;

    const classNames = [];
    if (note.includes('#')) {
        classNames.push('sharpNote');
    }
    if (note.startsWith('C') && note.length === 2) {
        classNames.push('cNote');
    }
    if (noteId === NOTES_LABELS.length - 1) {
        classNames.push('last');
    }

    const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        playNote(note);
    };

    const onMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
        if (e.buttons > 0) {
            playNote(note);
        }
    };

    const onMouseUp = (e: MouseEvent<HTMLDivElement>) => {
        setTimeout(() => playNote(''), NOTE_PLAY_STOP_DELAY);
    };

    return <StyledPianoKey
        className={classNames.join(' ')}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseUp={onMouseUp}
        style={{
            minHeight: pianoRollNoteHeight,
            maxHeight: pianoRollNoteHeight,
        }}
    >
        <StyledPianoRollKeyName>
            {note}
        </StyledPianoRollKeyName>
    </StyledPianoKey>;
};
