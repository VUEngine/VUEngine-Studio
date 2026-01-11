import React, { Dispatch, MouseEvent, SetStateAction } from 'react';
import styled from 'styled-components';
import { getPatternName } from '../SoundEditor';
import {
    NOTE_RESOLUTION,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_GRID_WIDTH,
    SEQUENCER_RESOLUTION,
    SoundData,
} from '../SoundEditorTypes';

const StyledPattern = styled.div`
    background-color: var(--theia-secondaryButton-background);
    box-sizing: border-box;
    color: var(--theia-secondaryButton-foreground);
    cursor: pointer;
    height: ${PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT}px;
    margin-bottom: -16px;
    outline-offset: -1px;
    padding: 1px 3px;
    position: sticky;
    top: ${PIANO_ROLL_GRID_METER_HEIGHT - 1}px;
    z-index: 201;

    &.selected {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }

    &.current {
        outline: 1px solid var(--theia-focusBorder);
    }
`;

interface PianoRollHeaderPlacedPatternProps {
    soundData: SoundData
    selected: boolean
    current: boolean
    step: number
    currentTrackId: number
    left: number
    patternSize: number
    patternId: string
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    pianoRollNoteWidth: number
    removePatternFromSequence: (trackId: number, step: number) => void
}

export default function PianoRollHeaderPlacedPattern(props: PianoRollHeaderPlacedPatternProps): React.JSX.Element {
    const {
        soundData,
        step,
        left,
        selected, current,
        currentTrackId,
        patternSize, patternId,
        pianoRollNoteWidth,
        setCurrentSequenceIndex,
        setPatternDialogOpen,
        removePatternFromSequence,
    } = props;

    const classNames = [];
    if (selected) {
        classNames.push('selected');
    }
    if (current) {
        classNames.push('current');
    }

    const onClick = (e: MouseEvent<HTMLDivElement>) => {
        setCurrentSequenceIndex(currentTrackId, step);
    };

    const onDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
        setPatternDialogOpen(true);
    };

    const onContextMenu = (e: MouseEvent<HTMLDivElement>) => {
        removePatternFromSequence(currentTrackId, step);
    };

    return (
        <StyledPattern
            className={classNames.join(' ')}
            style={{
                translate: `${left}px 0`,
                width: patternSize / SEQUENCER_RESOLUTION * NOTE_RESOLUTION * pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH,
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
        >
            {getPatternName(soundData, patternId)}
        </StyledPattern>
    );
}
