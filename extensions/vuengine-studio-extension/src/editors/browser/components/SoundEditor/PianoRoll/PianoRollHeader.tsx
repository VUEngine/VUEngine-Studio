import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import {
    DEFAULT_PLAY_RANGE_SIZE,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SoundData
} from '../SoundEditorTypes';
import PianoRollHeaderGrid from './PianoRollHeaderGrid';
import StepIndicator, { StepIndicatorPosition } from '../Sequencer/StepIndicator';

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
    border-left: 1px solid rgba(255, 255, 255, .6);
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
    currentPlayerPosition: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    setForcePlayerRomRebuild: Dispatch<SetStateAction<number>>
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    pianoRollNoteWidth: number
    pianoRollNoteHeight: number
    setPatternAtCursorPosition: (cursor?: number, size?: number) => Promise<boolean>
    pianoRollScrollWindow: ScrollWindow
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    removePatternFromSequence: (trackId: number, step: number) => void
    rangeDragStartStep: number
    setRangeDragStartStep: Dispatch<SetStateAction<number>>
    rangeDragEndStep: number
    setRangeDragEndStep: Dispatch<SetStateAction<number>>
    effectsPanelHidden: boolean
    sequencerPatternWidth: number
    sequencerPatternHeight: number
}

const CurrentlyPlacingRange = styled.div`
    border: 1px dashed var(--theia-focusBorder);
    border-bottom-width: 0;
    box-sizing: border-box;
    height: ${PIANO_ROLL_GRID_METER_HEIGHT / 2}px;
    position: absolute;
    top: 0;
`;

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId, currentPatternId, currentSequenceIndex,
        currentPlayerPosition, setCurrentPlayerPosition,
        setForcePlayerRomRebuild,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        pianoRollNoteWidth, pianoRollNoteHeight,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        setPatternDialogOpen,
        removePatternFromSequence,
        rangeDragStartStep, setRangeDragStartStep,
        rangeDragEndStep, setRangeDragEndStep,
        effectsPanelHidden,
        sequencerPatternWidth, sequencerPatternHeight,
    } = props;

    return <MetaLine
        style={{
            borderTopWidth: 0,
            paddingLeft: PIANO_ROLL_KEY_WIDTH + 2,
            top: 0,
        }}
    >
        {rangeDragStartStep > -1 &&
            <CurrentlyPlacingRange
                style={{
                    left: PIANO_ROLL_KEY_WIDTH + 2 + Math.min(rangeDragStartStep, rangeDragEndStep) * pianoRollNoteWidth - pianoRollScrollWindow.x,
                    width: pianoRollNoteWidth * (rangeDragStartStep === rangeDragEndStep
                        ? DEFAULT_PLAY_RANGE_SIZE
                        : (Math.abs(rangeDragStartStep - rangeDragEndStep) + 1)),
                }}
            />
        }
        <StepIndicator
            soundData={soundData}
            currentPlayerPosition={currentPlayerPosition}
            position={StepIndicatorPosition.PIANO_ROLL_HEADER}
            hidden={currentPlayerPosition === -1}
            effectsPanelHidden={effectsPanelHidden}
            pianoRollNoteHeight={pianoRollNoteHeight}
            pianoRollNoteWidth={pianoRollNoteWidth}
            sequencerPatternHeight={sequencerPatternHeight}
            sequencerPatternWidth={sequencerPatternWidth}
            pianoRollScrollWindow={pianoRollScrollWindow}
        />
        <PianoRollHeaderGrid
            soundData={soundData}
            currentTrackId={currentTrackId}
            currentPatternId={currentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            setCurrentPlayerPosition={setCurrentPlayerPosition}
            setForcePlayerRomRebuild={setForcePlayerRomRebuild}
            playRangeStart={playRangeStart}
            setPlayRangeStart={setPlayRangeStart}
            playRangeEnd={playRangeEnd}
            setPlayRangeEnd={setPlayRangeEnd}
            pianoRollNoteWidth={pianoRollNoteWidth}
            setPatternAtCursorPosition={setPatternAtCursorPosition}
            pianoRollScrollWindow={pianoRollScrollWindow}
            setPatternDialogOpen={setPatternDialogOpen}
            removePatternFromSequence={removePatternFromSequence}
            rangeDragStartStep={rangeDragStartStep}
            setRangeDragStartStep={setRangeDragStartStep}
            rangeDragEndStep={rangeDragEndStep}
            setRangeDragEndStep={setRangeDragEndStep}
        />
    </MetaLine>;
};
