import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import {
    NOTE_RESOLUTION,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_GRID_WIDTH,
    SEQUENCER_RESOLUTION,
} from '../SoundEditorTypes';

const StyledPattern = styled.div`
    box-sizing: border-box;
    cursor: pointer;
    height: ${PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT}px;
    padding: 1px 3px;
    position: absolute;
    z-index: 1;
`;

interface PianoRollHeaderPlacedPatternProps {
    current: boolean
    step: number
    currentTrackId: number
    left: number
    patternSize: number
    patternId: string
    patternName: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    pianoRollNoteWidth: number
    removePatternFromSequence: (trackId: number, step: number) => void
}

export default function PianoRollHeaderPlacedPattern(props: PianoRollHeaderPlacedPatternProps): React.JSX.Element {
    const {
        step,
        left,
        current,
        currentTrackId,
        setCurrentPatternId,
        patternSize, patternId, patternName,
        pianoRollNoteWidth,
        setCurrentSequenceIndex,
        setPatternDialogOpen,
        removePatternFromSequence,
    } = props;

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        setCurrentPatternId(currentTrackId, patternId);
        setCurrentSequenceIndex(currentTrackId, step);
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
        setPatternDialogOpen(true);
    };

    const onContextMenu = (e: React.MouseEvent<HTMLElement>) => {
        removePatternFromSequence(currentTrackId, step);
    };

    return (
        <StyledPattern
            style={{
                backgroundColor: current ? 'var(--theia-focusBorder)' : 'var(--theia-secondaryButton-background)',
                color: current ? '#fff' : 'var(--theia-secondaryButton-foreground)',
                left,
                top: PIANO_ROLL_GRID_METER_HEIGHT - 1,
                width: patternSize / SEQUENCER_RESOLUTION * NOTE_RESOLUTION * pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH,
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
        >
            {patternName}
        </StyledPattern>
    );
}
