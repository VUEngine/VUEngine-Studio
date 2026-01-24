import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { ScaleControls } from '../PianoRoll/PianoRoll';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SEQUENCER_ADD_TRACK_BUTTON_HEIGHT,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_PATTERN_HEIGHT_DEFAULT,
    SEQUENCER_PATTERN_HEIGHT_MAX,
    SEQUENCER_PATTERN_HEIGHT_MIN,
    SEQUENCER_PATTERN_WIDTH_DEFAULT,
    SEQUENCER_PATTERN_WIDTH_MAX,
    SEQUENCER_PATTERN_WIDTH_MIN,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEditorMarqueeMode,
    SoundEditorTool,
    TrackSettings
} from '../SoundEditorTypes';
import SequencerGrid from './SequencerGrid';
import SequencerPlacedPattern from './SequencerPlacedPattern';
import StepIndicator, { StepIndicatorPosition } from './StepIndicator';
import TrackHeader from './TrackHeader';

const StyledSequencerContainer = styled.div`
    display: flex;
    margin: 0 var(--padding);
    overflow: hidden;
    position: relative;
    user-select: none;
`;

const StyledSequencerGridContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: scroll;
    position: relative;
`;

export const StyledTrackHeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    left: 0;
`;

const StyledTracksHeader = styled.div`
    background-color: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .6);
    border-right: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    min-height: ${SEQUENCER_GRID_METER_HEIGHT}px;
    position: relative;
    z-index: 10;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .6);
        border-right-color: rgba(0, 0, 0, .6);
    }
`;

const StyledAddTrackButton = styled.button`
    align-items: center;
    background-color: var(--theia-editor-background);
    border: 1px solid var(--theia-dropdown-border);
    box-sizing: border-box;
    color: var(--theia-dropdown-border);
    cursor: pointer;
    display: flex;
    justify-content: center;
    margin-top: 3px;
    min-height: ${SEQUENCER_ADD_TRACK_BUTTON_HEIGHT}px !important;
    width: ${PIANO_ROLL_KEY_WIDTH + 1}px;

    &:hover {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }

    i {
        font-size: 12px !important;
    }
`;

interface SequencerProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    tool: SoundEditorTool
    marqueeMode: SoundEditorMarqueeMode
    currentTrackId: number
    setCurrentTrackId: Dispatch<SetStateAction<number>>
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    currentPlayerPosition: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    selectedPatterns: string[]
    setSelectedPatterns: Dispatch<SetStateAction<string[]>>
    toggleTrackMuted: (trackId: number) => void
    toggleTrackSolo: (trackId: number) => void
    toggleTrackSeeThrough: (trackId: number) => void
    removeTrack: (trackId: number) => void
    addPattern: (trackId: number, bar: number, size?: number) => void
    setPatternSize: (patternId: string, size: number) => void
    setEditTrackDialogOpen: Dispatch<SetStateAction<boolean>>
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    effectsPanelHidden: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    sequencerPatternHeight: number
    setSequencerPatternHeight: Dispatch<SetStateAction<number>>
    sequencerPatternWidth: number
    setSequencerPatternWidth: Dispatch<SetStateAction<number>>
    pianoRollScrollWindow: ScrollWindow
    removePatternsFromSequence: (patterns: string[]) => void
    trackSettings: TrackSettings[]
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    rangeDragStartStep: number
    setRangeDragStartStep: Dispatch<SetStateAction<number>>
    rangeDragEndStep: number
    setRangeDragEndStep: Dispatch<SetStateAction<number>>
    setForcePlayerRomRebuild: Dispatch<SetStateAction<number>>
}

export default function Sequencer(props: SequencerProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        tool, marqueeMode,
        currentTrackId, setCurrentTrackId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentPlayerPosition, setCurrentPlayerPosition,
        selectedPatterns, setSelectedPatterns,
        toggleTrackMuted,
        toggleTrackSolo,
        toggleTrackSeeThrough,
        removeTrack,
        addPattern, setPatternSize,
        setEditTrackDialogOpen, setPatternDialogOpen,
        effectsPanelHidden,
        pianoRollNoteHeight, pianoRollNoteWidth,
        sequencerPatternHeight, setSequencerPatternHeight,
        sequencerPatternWidth, setSequencerPatternWidth,
        pianoRollScrollWindow,
        removePatternsFromSequence,
        trackSettings,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        rangeDragStartStep, setRangeDragStartStep,
        rangeDragEndStep, setRangeDragEndStep,
        setForcePlayerRomRebuild,
    } = props;
    const { services, onCommandExecute } = useContext(EditorsContext) as EditorsContextType;
    const [patternDragTrackId, setPatternDragTrackId] = useState<number>(-1);
    const [patternDragStartStep, setPatternDragStartStep] = useState<number>(-1);
    const [patternDragEndStep, setPatternDragEndStep] = useState<number>(-1);
    const [sequencerScrollWindow, setSequencerScrollWindow] = useState<ScrollWindow>({ x: 0, y: 0, w: 0, h: 0 });
    const sequencerContainerRef = useRef<HTMLDivElement>(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    const width = songLength * sequencerPatternWidth;

    const soloTrack = useMemo(() => {
        let st = -1;
        soundData.tracks.forEach((t, i) => {
            if (trackSettings[i] !== undefined && trackSettings[i].solo) {
                st = i;
            }
        });
        return st;
    }, [
        soundData.tracks,
        trackSettings,
    ]);

    const mapVerticalToHorizontalScroll = (e: React.WheelEvent): void => {
        if (e.deltaY === 0) {
            return;
        }
        e.currentTarget.scrollTo({
            left: e.currentTarget.scrollLeft + e.deltaY
        });
    };

    const getScrollWindowCoords = () => {
        if (!sequencerContainerRef.current) {
            return;
        }

        setSequencerScrollWindow({
            x: sequencerContainerRef.current.scrollLeft,
            y: sequencerContainerRef.current.scrollTop,
            w: sequencerContainerRef.current.offsetWidth,
            h: sequencerContainerRef.current.offsetHeight,
        });
    };

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
                let newPatternWidth = Math.round(sequencerPatternWidth - (e.deltaX / 8));

                if (newPatternWidth > SEQUENCER_PATTERN_WIDTH_MAX) {
                    newPatternWidth = SEQUENCER_PATTERN_WIDTH_MAX;
                } else if (newPatternWidth < SEQUENCER_PATTERN_WIDTH_MIN) {
                    newPatternWidth = SEQUENCER_PATTERN_WIDTH_MIN;
                }

                setSequencerPatternWidth(newPatternWidth);
            } else {
                let newPatternHeight = Math.round(sequencerPatternHeight - (e.deltaY / 4));

                if (newPatternHeight > SEQUENCER_PATTERN_HEIGHT_MAX) {
                    newPatternHeight = SEQUENCER_PATTERN_HEIGHT_MAX;
                } else if (newPatternHeight < SEQUENCER_PATTERN_HEIGHT_MIN) {
                    newPatternHeight = SEQUENCER_PATTERN_HEIGHT_MIN;
                }

                setSequencerPatternHeight(newPatternHeight);
            }

            e.stopPropagation();
        }
    };

    const onMouseOut = (e: React.MouseEvent<HTMLElement>) => {
        setPatternDragTrackId(-1);
        setPatternDragStartStep(-1);
        setPatternDragEndStep(-1);
    };

    const commandListener = (commandId: string): void => {
        if (soundData.tracks.length === 0) {
            return;
        }
        switch (commandId) {
            case SoundEditorCommands.SELECT_TRACK_1.id:
                if (soundData.tracks.length > 0) {
                    setCurrentTrackId(0);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_2.id:
                if (soundData.tracks.length > 1) {
                    setCurrentTrackId(1);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_3.id:
                if (soundData.tracks.length > 2) {
                    setCurrentTrackId(2);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_4.id:
                if (soundData.tracks.length > 3) {
                    setCurrentTrackId(3);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_5.id:
                if (soundData.tracks.length > 4) {
                    setCurrentTrackId(4);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_6.id:
                if (soundData.tracks.length > 5) {
                    setCurrentTrackId(5);
                }
                break;
            case SoundEditorCommands.SELECT_NEXT_TRACK.id:
                if (soundData.tracks.length > 0 && currentTrackId < soundData.tracks.length - 1) {
                    setCurrentTrackId(currentTrackId + 1);
                }
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_TRACK.id:
                if (soundData.tracks.length > 0 && currentTrackId > 0) {
                    setCurrentTrackId(currentTrackId - 1);
                }
                break;
            case SoundEditorCommands.SELECT_NEXT_SEQUENCE_INDEX.id:
                // TODO
                /*
                if (currentSequenceIndex < soundData.channels[currentTrackId].sequence.length - 1) {
                    setCurrentSequenceIndex(currentTrackId, currentSequenceIndex + 1);
                }
                */
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_SEQUENCE_INDEX.id:
                // TODO
                /*
                if (currentSequenceIndex > 0) {
                    setCurrentSequenceIndex(currentTrackId, currentSequenceIndex - 1);
                }
                */
                break;
            case SoundEditorCommands.REMOVE_SELECTED_NOTES_OR_PATTERNS.id:
                removePatternsFromSequence(selectedPatterns);
                break;
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_REDUCE.id:
                setSequencerPatternHeight(prev =>
                    prev > SEQUENCER_PATTERN_HEIGHT_MIN ? prev - 2 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_INCREASE.id:
                setSequencerPatternHeight(prev =>
                    prev < SEQUENCER_PATTERN_HEIGHT_MAX ? prev + 2 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_RESET.id:
                setSequencerPatternHeight(SEQUENCER_PATTERN_HEIGHT_DEFAULT);
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_REDUCE.id:
                setSequencerPatternWidth(prev =>
                    prev > SEQUENCER_PATTERN_WIDTH_MIN ? prev - 2 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE.id:
                setSequencerPatternWidth(prev =>
                    prev < SEQUENCER_PATTERN_WIDTH_MAX ? prev + 2 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET.id:
                setSequencerPatternWidth(SEQUENCER_PATTERN_WIDTH_DEFAULT);
                break;
        }
    };

    useEffect(() => {
        getScrollWindowCoords();
    }, [
        songLength,
        sequencerPatternWidth,
    ]);

    useEffect(() => {
        if (!sequencerContainerRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => getScrollWindowCoords());
        resizeObserver.observe(sequencerContainerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, [
        currentTrackId,
        currentSequenceIndex,
        selectedPatterns,
        soundData,
    ]);

    return <StyledSequencerContainer
        style={{
            minHeight: sequencerPatternHeight * soundData.tracks.length + SEQUENCER_GRID_METER_HEIGHT +
                (soundData.tracks.length < VSU_NUMBER_OF_CHANNELS ? SEQUENCER_ADD_TRACK_BUTTON_HEIGHT + 3 : 10),
        }}
        onWheel={onWheel}
        onMouseOut={onMouseOut}
    >
        <ScaleControls className="vertical">
            <button
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_REDUCE.id)}
                title={`${SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_REDUCE.label}${services.vesCommonService.getKeybindingLabel(
                    SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_REDUCE.id,
                    true
                )}`}
            >
                <i className="codicon codicon-chrome-minimize" />
            </button>
            <button
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_RESET.id)}
                title={`${SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_RESET.label}${services.vesCommonService.getKeybindingLabel(
                    SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_RESET.id,
                    true
                )}`}
            >
                <i className="codicon codicon-circle-large" />
            </button>
            <button
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_INCREASE.id)}
                title={`${SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_INCREASE.label}${services.vesCommonService.getKeybindingLabel(
                    SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_INCREASE.id,
                    true
                )}`}
            >
                <i className="codicon codicon-plus" />
            </button>
        </ScaleControls>
        <ScaleControls>
            <button
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_REDUCE.id)}
                title={`${SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_REDUCE.label}${services.vesCommonService.getKeybindingLabel(
                    SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_REDUCE.id,
                    true
                )}`}
            >
                <i className="codicon codicon-chrome-minimize" />
            </button>
            <button
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET.id)}
                title={`${SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET.label}${services.vesCommonService.getKeybindingLabel(
                    SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET.id,
                    true
                )}`}
            >
                <i className="codicon codicon-circle-large" />
            </button>
            <button
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE.id)}
                title={`${SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE.label}${services.vesCommonService.getKeybindingLabel(
                    SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE.id,
                    true
                )}`}
            >
                <i className="codicon codicon-plus" />
            </button>
        </ScaleControls>
        <StyledTrackHeaderContainer>
            <StyledTracksHeader>
            </StyledTracksHeader>
            {soundData.tracks.map((track, index) =>
                <TrackHeader
                    key={index}
                    soundData={soundData}
                    tool={tool}
                    track={track}
                    trackId={index}
                    currentTrackId={currentTrackId}
                    removeTrack={removeTrack}
                    setCurrentTrackId={setCurrentTrackId}
                    toggleTrackMuted={toggleTrackMuted}
                    toggleTrackSolo={toggleTrackSolo}
                    toggleTrackSeeThrough={toggleTrackSeeThrough}
                    otherSolo={soloTrack > -1 && soloTrack !== index}
                    setEditTrackDialogOpen={setEditTrackDialogOpen}
                    sequencerPatternHeight={sequencerPatternHeight}
                    trackSettings={trackSettings}
                />
            )}
            {soundData.tracks.length < VSU_NUMBER_OF_CHANNELS &&
                <StyledAddTrackButton
                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_TRACK.id)}
                    title={`${SoundEditorCommands.ADD_TRACK.label}${services.vesCommonService.getKeybindingLabel(
                        SoundEditorCommands.ADD_TRACK.id,
                        true
                    )}`}
                >
                    <i className='codicon codicon-plus' />
                </StyledAddTrackButton>
            }
        </StyledTrackHeaderContainer>
        <StyledSequencerGridContainer
            ref={sequencerContainerRef}
            onWheel={mapVerticalToHorizontalScroll}
            onScroll={getScrollWindowCoords}
        >
            <div
                style={{
                    width: width,
                }}
            />
            <StepIndicator
                soundData={soundData}
                currentPlayerPosition={currentPlayerPosition}
                position={StepIndicatorPosition.SEQUENCER}
                hidden={currentPlayerPosition === -1}
                effectsPanelHidden={effectsPanelHidden}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
                sequencerPatternHeight={sequencerPatternHeight}
                sequencerPatternWidth={sequencerPatternWidth}
            />
            <SequencerGrid
                soundData={soundData}
                tool={tool}
                marqueeMode={marqueeMode}
                currentTrackId={currentTrackId}
                currentPatternId={currentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                setCurrentSequenceIndex={setCurrentSequenceIndex}
                selectedPatterns={selectedPatterns}
                setSelectedPatterns={setSelectedPatterns}
                addPattern={addPattern}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
                sequencerPatternHeight={sequencerPatternHeight}
                sequencerPatternWidth={sequencerPatternWidth}
                patternDragTrackId={patternDragTrackId}
                setPatternDragTrackId={setPatternDragTrackId}
                patternDragStartStep={patternDragStartStep}
                setPatternDragStartStep={setPatternDragStartStep}
                patternDragEndStep={patternDragEndStep}
                setPatternDragEndStep={setPatternDragEndStep}
                sequencerScrollWindow={sequencerScrollWindow}
                rangeDragStartStep={rangeDragStartStep}
                setRangeDragStartStep={setRangeDragStartStep}
                rangeDragEndStep={rangeDragEndStep}
                setRangeDragEndStep={setRangeDragEndStep}
                setCurrentPlayerPosition={setCurrentPlayerPosition}
                setForcePlayerRomRebuild={setForcePlayerRomRebuild}
                trackSettings={trackSettings}
                soloTrack={soloTrack}
                setPatternDialogOpen={setPatternDialogOpen}
                sequencerContainerRef={sequencerContainerRef}
                pianoRollScrollWindow={pianoRollScrollWindow}
                pianoRollNoteWidth={pianoRollNoteWidth}
                removePatternsFromSequence={removePatternsFromSequence}
            />
            {tool === SoundEditorTool.EDIT && soundData.patterns[currentPatternId] &&
                <SequencerPlacedPattern
                    soundData={soundData}
                    updateSoundData={updateSoundData}
                    step={currentSequenceIndex}
                    trackId={currentTrackId}
                    pattern={soundData.patterns[currentPatternId]}
                    patternId={currentPatternId}
                    currentTrackId={currentTrackId}
                    currentPatternId={currentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setCurrentPatternId={setCurrentPatternId}
                    setPatternDialogOpen={setPatternDialogOpen}
                    sequencerPatternHeight={sequencerPatternHeight}
                    sequencerPatternWidth={sequencerPatternWidth}
                    setPatternSize={setPatternSize}
                />
            }
        </StyledSequencerGridContainer>
    </StyledSequencerContainer>;
}
