import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { PIANO_ROLL_GRID_METER_HEIGHT, PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT, PIANO_ROLL_KEY_WIDTH, SoundData } from '../SoundEditorTypes';
import PianoRollHeaderGrid from './PianoRollHeaderGrid';

export const MetaLine = styled.div`
    background: var(--theia-editor-background);
    border-top: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    left: 0;
    position: sticky;
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

const StyledToggleButton = styled.button`
    align-items: center;
    background-color: transparent;
    border: none;
    color: var(--theia-editor-foreground);
    cursor: pointer;
    display: flex;
    font-size: 10px;
    justify-content: center;
    min-height: ${PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 2}px !important;
    outline-offset: -1px;
    width: 50%;

    &:hover {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }
`;

interface PianoRollHeaderProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    sequencerHidden: boolean
    setSequencerHidden: Dispatch<SetStateAction<boolean>>
    eventListHidden: boolean,
    setEventListHidden: Dispatch<SetStateAction<boolean>>
    pianoRollNoteWidth: number
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        // currentPatternId,
        // playRangeStart, setPlayRangeStart,
        // playRangeEnd, setPlayRangeEnd,
        setCurrentPlayerPosition,
        sequencerHidden, setSequencerHidden,
        eventListHidden, setEventListHidden,
        pianoRollNoteWidth,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    return <MetaLine
        style={{
            borderTopWidth: 0,
            top: 0,
        }}
    >
        <MetaLineHeader
            style={{ minHeight: 18 }}
        >
            <StyledToggleButton
                onClick={() => setEventListHidden(prev => !prev)}
                title={`${SoundEditorCommands.TOGGLE_EVENT_LIST_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(
                    SoundEditorCommands.TOGGLE_EVENT_LIST_VISIBILITY.id,
                    true
                )}`}
            >
                <i className="codicon codicon-list-unordered" />
                <i className={eventListHidden ? 'codicon codicon-chevron-right' : 'codicon codicon-chevron-left'} />
            </StyledToggleButton>
            <StyledToggleButton
                onClick={() => setSequencerHidden(prev => !prev)}
                title={`${SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(
                    SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id,
                    true
                )}`}
            >
                <i className="codicon codicon-layers" />
                <i className={sequencerHidden ? 'codicon codicon-chevron-down' : 'codicon codicon-chevron-up'} />
            </StyledToggleButton>
        </MetaLineHeader>
        <PianoRollHeaderGrid
            soundData={soundData}
            currentTrackId={currentTrackId}
            setCurrentPlayerPosition={setCurrentPlayerPosition}
            pianoRollNoteWidth={pianoRollNoteWidth}
        />
    </MetaLine>;
};
