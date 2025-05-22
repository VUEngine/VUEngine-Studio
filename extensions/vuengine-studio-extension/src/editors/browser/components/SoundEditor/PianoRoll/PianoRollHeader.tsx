import React, { Dispatch, SetStateAction, useContext, useMemo } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    NOTE_RESOLUTION,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_RESOLUTION,
    SoundData
} from '../SoundEditorTypes';
import PianoRollHeaderGrid from './PianoRollHeaderGrid';
import PianoRollHeaderPlacedPattern from './PianoRollHeaderPlacedPattern';

export const MetaLine = styled.div`
    background: var(--theia-editor-background);
    border-top: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    cursor: crosshair;
    display: flex;
    flex-direction: row;
    position: sticky;
    top: 0;
    width: fit-content;
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
    left: 0;
    max-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    min-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    overflow: hidden;
    position: sticky;
    z-index: 10;

    body.theia-light &,
    body.theia-hc & {
        border-color: rgba(0, 0, 0, .6);
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
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
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
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    removePatternFromSequence: (trackId: number, step: number) => void
    setPatternAtCursorPosition: (cursor?: number, size?: number, createNew?: boolean) => void
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        // playRangeStart, setPlayRangeStart,
        // playRangeEnd, setPlayRangeEnd,
        currentSequenceIndex, setCurrentSequenceIndex,
        setCurrentPlayerPosition,
        sequencerHidden, setSequencerHidden,
        eventListHidden, setEventListHidden,
        pianoRollNoteWidth,
        setPatternDialogOpen,
        removePatternFromSequence,
        setPatternAtCursorPosition,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const placedPatterns = useMemo(() => {
        const patterns: React.JSX.Element[] = [];

        const track = soundData.tracks[currentTrackId];

        Object.keys(track.sequence).forEach(key => {
            const step = parseInt(key);
            const patternId = track.sequence[step];
            const pattern = soundData.patterns[patternId];
            if (!pattern) {
                return;
            }
            const xOffset = PIANO_ROLL_KEY_WIDTH + 2 + step * NOTE_RESOLUTION * pianoRollNoteWidth / SEQUENCER_RESOLUTION;
            const isSelected = patternId === currentPatternId && step === currentSequenceIndex;
            patterns.push(<PianoRollHeaderPlacedPattern
                soundData={soundData}
                step={step}
                patternId={patternId}
                patternSize={pattern.size}
                current={isSelected}
                currentTrackId={currentTrackId}
                left={xOffset}
                pianoRollNoteWidth={pianoRollNoteWidth}
                setCurrentPatternId={setCurrentPatternId}
                removePatternFromSequence={removePatternFromSequence}
                setCurrentSequenceIndex={setCurrentSequenceIndex}
                setPatternDialogOpen={setPatternDialogOpen}
            />);
        });

        return patterns;
    }, [
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        pianoRollNoteWidth,
    ]);

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
        {placedPatterns}
        <PianoRollHeaderGrid
            soundData={soundData}
            currentTrackId={currentTrackId}
            currentPatternId={currentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            setCurrentPlayerPosition={setCurrentPlayerPosition}
            pianoRollNoteWidth={pianoRollNoteWidth}
            setPatternAtCursorPosition={setPatternAtCursorPosition}
        />
    </MetaLine>;
};
