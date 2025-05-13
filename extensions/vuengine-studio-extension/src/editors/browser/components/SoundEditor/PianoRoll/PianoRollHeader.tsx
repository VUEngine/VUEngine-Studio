import React, { Dispatch, SetStateAction } from 'react';
import { PIANO_ROLL_KEY_WIDTH, SoundData } from '../SoundEditorTypes';
import PianoRollHeaderGrid from './PianoRollHeaderGrid';
import styled from 'styled-components';

export const MetaLine = styled.div`
    background: var(--theia-editor-background);
    border-top: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    left: 0;
    position: sticky;
    transition: all .2s;
    z-index: 200;

    body.theia-light &,
    body.theia-hc & {
        border-top-color: rgba(0, 0, 0, .6);
    }
`;

export const MetaLineHeader = styled.div`
    background: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .4);
    border-right: 1px solid rgba(255, 255, 255, .4);
    border-top: 1px solid transparent;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    left: 0;
    max-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    min-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    overflow: hidden;
    position: sticky;
    z-index: 10;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .4);
        border-right-color: rgba(0, 0, 0, .4);
    }
`;

interface PianoRollHeaderProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    currentPatternNoteOffset: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setCurrentStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        // currentChannelId,
        // currentPatternId,
        currentPatternNoteOffset,
        // playRangeStart, setPlayRangeStart,
        // playRangeEnd, setPlayRangeEnd,
        setCurrentStep,
    } = props;

    return <MetaLine
        style={{
            borderTopWidth: 0,
            top: 0,
        }}
    >
        <MetaLineHeader
            style={{ minHeight: 18 }}
        >
        </MetaLineHeader>
        <PianoRollHeaderGrid
            soundData={soundData}
            currentPatternNoteOffset={currentPatternNoteOffset}
            setCurrentStep={setCurrentStep}
        />
    </MetaLine>;
};
