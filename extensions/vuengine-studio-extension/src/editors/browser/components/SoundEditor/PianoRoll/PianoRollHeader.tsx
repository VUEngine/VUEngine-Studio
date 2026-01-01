import React, { Dispatch, SetStateAction, useState } from 'react';
import styled from 'styled-components';
import {
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SoundData
} from '../SoundEditorTypes';
import PianoRollHeaderGrid from './PianoRollHeaderGrid';

export const MetaLine = styled.div`
    background: var(--theia-editor-background);
    border-top: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    cursor: crosshair;
    display: flex;
    flex-direction: row;
    left: 0;
    position: sticky;
    top: 0;
    z-index: 200;

    body.theia-light &,
    body.theia-hc & {
        border-top-color: rgba(0, 0, 0, .6);
    }
`;

export const MetaLineHeader = styled.div`
    background: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .6);
    border-right: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    display: flex;
    max-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    min-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    overflow: hidden;
    z-index: 10;

    body.theia-light &,
    body.theia-hc & {
        border-color: rgba(0, 0, 0, .6);
    }
`;

interface PianoRollHeaderProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number) => Promise<boolean>
    pianoRollScrollWindow: ScrollWindow
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    removePatternFromSequence: (trackId: number, step: number) => void
}

const CurrentlyPlacingRange = styled.div`
    border: 1px dashed var(--theia-focusBorder);
    border-bottom-width: 0;
    box-sizing: border-box;
    height: ${PIANO_ROLL_GRID_METER_HEIGHT / 2}px;
    position: absolute;
    top: 0;
`;

export default function PianoRollHeaderPianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId, currentPatternId, currentSequenceIndex,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        setPatternDialogOpen,
        removePatternFromSequence,
    } = props;
    const [dragStartStep, setDragStartStep] = useState<number>(-1);
    const [dragEndStep, setDragEndStep] = useState<number>(-1);

    return <MetaLine
        style={{
            borderTopWidth: 0,
            paddingLeft: PIANO_ROLL_KEY_WIDTH + 2,
            top: 0,
        }}
    >
        {dragStartStep > -1 &&
            <CurrentlyPlacingRange
                style={{
                    left: PIANO_ROLL_KEY_WIDTH + 2 + Math.min(dragStartStep, dragEndStep) * pianoRollNoteWidth - pianoRollScrollWindow.x,
                    width: pianoRollNoteWidth * (Math.abs(dragStartStep - dragEndStep) + 1),
                }}
            />
        }
        <PianoRollHeaderGrid
            soundData={soundData}
            currentTrackId={currentTrackId}
            currentPatternId={currentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            playRangeStart={playRangeStart}
            setPlayRangeStart={setPlayRangeStart}
            playRangeEnd={playRangeEnd}
            setPlayRangeEnd={setPlayRangeEnd}
            pianoRollNoteWidth={pianoRollNoteWidth}
            setPatternAtCursorPosition={setPatternAtCursorPosition}
            pianoRollScrollWindow={pianoRollScrollWindow}
            setPatternDialogOpen={setPatternDialogOpen}
            removePatternFromSequence={removePatternFromSequence}
            dragStartStep={dragStartStep}
            setDragStartStep={setDragStartStep}
            dragEndStep={dragEndStep}
            setDragEndStep={setDragEndStep}
        />
    </MetaLine>;
};
