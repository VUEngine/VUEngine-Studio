import React, { Dispatch, RefObject, SetStateAction } from 'react';
import styled from 'styled-components';
import StepIndicator, { StepIndicatorPosition } from '../Sequencer/StepIndicator';
import {
    DEFAULT_BARS_PER_PATTERN,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SoundData,
    SoundEditorTool
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

const CurrentlyPlacingRange = styled.div`
    border: 1px dashed var(--theia-focusBorder);
    border-bottom-width: 0;
    box-sizing: border-box;
    height: ${PIANO_ROLL_GRID_METER_HEIGHT / 2}px;
    position: absolute;
    top: 0;
`;

interface PianoRollHeaderProps {
    soundData: SoundData
    tool: SoundEditorTool
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
    setPatternAtCursorPosition: (cursor?: number, size?: number) => void
    pianoRollScrollWindow: ScrollWindow
    pianoRollRef: RefObject<HTMLDivElement>
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    rangeDragStartStep: number
    setRangeDragStartStep: Dispatch<SetStateAction<number>>
    rangeDragEndStep: number
    setRangeDragEndStep: Dispatch<SetStateAction<number>>
    effectsPanelHidden: boolean
    sequencerNoteWidth: number
    sequencerPatternHeight: number
    stepsPerBar: number
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        tool,
        currentTrackId, currentPatternId, currentSequenceIndex,
        currentPlayerPosition, setCurrentPlayerPosition,
        setForcePlayerRomRebuild,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        pianoRollNoteWidth, pianoRollNoteHeight,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        pianoRollRef,
        setPatternDialogOpen,
        rangeDragStartStep, setRangeDragStartStep,
        rangeDragEndStep, setRangeDragEndStep,
        effectsPanelHidden,
        sequencerNoteWidth, sequencerPatternHeight,
        stepsPerBar,
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
                        ? stepsPerBar * DEFAULT_BARS_PER_PATTERN
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
            sequencerNoteWidth={sequencerNoteWidth}
            pianoRollScrollWindow={pianoRollScrollWindow}
        />
        <PianoRollHeaderGrid
            soundData={soundData}
            tool={tool}
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
            pianoRollRef={pianoRollRef}
            setPatternDialogOpen={setPatternDialogOpen}
            rangeDragStartStep={rangeDragStartStep}
            setRangeDragStartStep={setRangeDragStartStep}
            rangeDragEndStep={rangeDragEndStep}
            setRangeDragEndStep={setRangeDragEndStep}
            stepsPerBar={stepsPerBar}
        />
    </MetaLine>;
};
