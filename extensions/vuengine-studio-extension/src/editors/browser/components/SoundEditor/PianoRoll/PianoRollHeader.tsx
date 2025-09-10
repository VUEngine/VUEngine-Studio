import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import {
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
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number, createNew?: boolean) => void
    pianoRollScrollWindow: ScrollWindow
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        // playRangeStart, setPlayRangeStart,
        // playRangeEnd, setPlayRangeEnd,
        currentSequenceIndex,
        setCurrentPlayerPosition,
        pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
    } = props;

    return <MetaLine
        style={{
            borderTopWidth: 0,
            paddingLeft: PIANO_ROLL_KEY_WIDTH + 2,
            top: 0,
        }}
    >
        <PianoRollHeaderGrid
            soundData={soundData}
            currentTrackId={currentTrackId}
            currentPatternId={currentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            setCurrentPlayerPosition={setCurrentPlayerPosition}
            pianoRollNoteWidth={pianoRollNoteWidth}
            setPatternAtCursorPosition={setPatternAtCursorPosition}
            pianoRollScrollWindow={pianoRollScrollWindow}
        />
    </MetaLine>;
};
