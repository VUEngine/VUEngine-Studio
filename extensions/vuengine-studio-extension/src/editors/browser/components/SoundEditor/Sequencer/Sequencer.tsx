import { deepClone } from '@theia/core';
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
    SoundData,
    SoundEditorMarqueeMode,
    SoundEditorTool,
    SUB_NOTE_RESOLUTION,
    TrackSettings
} from '../SoundEditorTypes';
import SequencerGrid from './SequencerGrid';
import SequencerPlacedPattern from './SequencerPlacedPattern';
import StepIndicator, { StepIndicatorPosition } from './StepIndicator';
import TrackHeader from './TrackHeader';

type PatternClipboard = Record<string, string>;

const StyledSequencerContainer = styled.div`
    align-self: start;
    box-sizing: border-box;
    display: flex;
    margin: 0 var(--padding);
    max-width: calc(100% - var(--padding) * 2);
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
    setCurrentTrackId: (id: number) => void
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    currentPlayerPosition: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    selectedPatterns: string[]
    setSelectedPatterns: (sn: string[]) => void
    toggleTrackMuted: (trackId: number) => void
    toggleTrackSolo: (trackId: number) => void
    toggleTrackSeeThrough: (trackId: number) => void
    removeTrack: (trackId: number) => void
    addPattern: (trackId: number, bar: number, size?: number) => void
    setPatternSizes: (patterns: { [patternId: string]: number }) => void
    editCurrentTrack: () => void
    editCurrentPattern: () => void
    noteSnapping: boolean
    effectsPanelHidden: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    sequencerPatternHeight: number
    setSequencerPatternHeight: Dispatch<SetStateAction<number>>
    sequencerNoteWidth: number
    setSequencerNoteWidth: Dispatch<SetStateAction<number>>
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
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
    stepsPerNote: number
    stepsPerBar: number
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
        addPattern, setPatternSizes,
        editCurrentTrack, editCurrentPattern,
        noteSnapping,
        effectsPanelHidden,
        pianoRollNoteHeight, pianoRollNoteWidth,
        sequencerPatternHeight, setSequencerPatternHeight,
        sequencerNoteWidth, setSequencerNoteWidth,
        pianoRollScrollWindow,
        removePatternsFromSequence,
        trackSettings,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        rangeDragStartStep, setRangeDragStartStep,
        rangeDragEndStep, setRangeDragEndStep,
        setForcePlayerRomRebuild,
        noteCursor, setNoteCursor,
        stepsPerNote, stepsPerBar,
    } = props;
    const { services, onCommandExecute } = useContext(EditorsContext) as EditorsContextType;
    const [patternDragTrackId, setPatternDragTrackId] = useState<number>(-1);
    const [patternDragStartStep, setPatternDragStartStep] = useState<number>(-1);
    const [patternDragEndStep, setPatternDragEndStep] = useState<number>(-1);
    const [sequencerScrollWindow, setSequencerScrollWindow] = useState<ScrollWindow>({ x: 0, y: 0, w: 0, h: 0 });
    const [cancelPatternDrag, setCancelPatternDrag] = useState<boolean>(false);
    const [patternClipboard, setPatternClipboard] = useState<PatternClipboard>({});
    const sequencerContainerRef = useRef<HTMLDivElement>(null);
    const sequencerGridContainerRef = useRef<HTMLDivElement>(null);

    const width = soundData.size * sequencerNoteWidth;

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
        if (e.deltaY === 0 || e.ctrlKey || e.metaKey) {
            return;
        }
        e.currentTarget.scrollTo({
            left: e.currentTarget.scrollLeft + e.deltaY
        });
    };

    const getScrollWindowCoords = () => {
        if (!sequencerGridContainerRef.current) {
            return;
        }

        setSequencerScrollWindow({
            x: sequencerGridContainerRef.current.scrollLeft,
            y: sequencerGridContainerRef.current.scrollTop,
            w: sequencerGridContainerRef.current.offsetWidth,
            h: sequencerGridContainerRef.current.offsetHeight,
        });
    };

    // I am just here to prevent scrolling while resizing with the below event
    const onWheelNative = (e: WheelEvent): void => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
        }
    };

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey || e.metaKey) {
            if (e.altKey) {
                let newPatternHeight = Math.round(sequencerPatternHeight - (e.deltaY / 8));

                if (newPatternHeight > SEQUENCER_PATTERN_HEIGHT_MAX) {
                    newPatternHeight = SEQUENCER_PATTERN_HEIGHT_MAX;
                } else if (newPatternHeight < SEQUENCER_PATTERN_HEIGHT_MIN) {
                    newPatternHeight = SEQUENCER_PATTERN_HEIGHT_MIN;
                }

                setSequencerPatternHeight(newPatternHeight);
            } else {
                let newPatternWidth = Math.round(sequencerNoteWidth - (e.deltaY / 64));

                if (newPatternWidth > SEQUENCER_PATTERN_WIDTH_MAX) {
                    newPatternWidth = SEQUENCER_PATTERN_WIDTH_MAX;
                } else if (newPatternWidth < SEQUENCER_PATTERN_WIDTH_MIN) {
                    newPatternWidth = SEQUENCER_PATTERN_WIDTH_MIN;
                }

                setSequencerNoteWidth(newPatternWidth);
            }

            e.stopPropagation();
        }
    };

    const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
        setPatternDragTrackId(-1);
        setPatternDragStartStep(-1);
        setPatternDragEndStep(-1);
        setCancelPatternDrag(true);
    };

    const onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        setCancelPatternDrag(false);
    };

    const removeSelectedPatterns = () => {
        const patternsToDelete: Record<number, number[]> = {};
        selectedPatterns.forEach(identifier => {
            const tId = parseInt(identifier.split('-')[0]);
            const si = parseInt(identifier.split('-')[1]);
            if (patternsToDelete[tId] === undefined) {
                patternsToDelete[tId] = [];
            }
            patternsToDelete[tId].push(si);
        });

        setSelectedPatterns([]);
        updateSoundData({
            ...soundData,
            tracks: soundData.tracks.map((t, tId) => ({
                ...t,
                sequence: Object.fromEntries(Object.entries(t.sequence).filter(([si, pId]) =>
                    patternsToDelete[tId] === undefined || !patternsToDelete[tId].includes(parseInt(si))
                ))
            }))
        });
    };

    const copySelectedPatterns = (): void => {
        const patterns: PatternClipboard = {};
        selectedPatterns.forEach(identifier => {
            const tId = parseInt(identifier.split('-')[0]);
            const si = parseInt(identifier.split('-')[1]);
            if (soundData.tracks[tId] !== undefined && soundData.tracks[tId].sequence[si] !== undefined) {
                patterns[identifier] = soundData.tracks[tId].sequence[si];
            }
        });

        setPatternClipboard(patterns);
    };

    const cutSelectedPatterns = (): void => {
        copySelectedPatterns();
        removeSelectedPatterns();
    };

    const pastePatterns = (): void => {
        let smallestSequenceIndex = -1;
        Object.keys(patternClipboard).forEach(identifier => {
            const si = parseInt(identifier.split('-')[1]);
            if (smallestSequenceIndex === -1 || si < smallestSequenceIndex) {
                smallestSequenceIndex = si;
            }
        });

        const patternIdMap: Record<string, string> = {};
        Object.keys(patternClipboard).forEach(identifier => {
            const tId = parseInt(identifier.split('-')[0]);
            const si = parseInt(identifier.split('-')[1]);
            patternIdMap[identifier] = patternClipboard[identifier];
        });

        const updatedTracks = deepClone(soundData.tracks);
        const noteCursorStep = noteCursor / SUB_NOTE_RESOLUTION;
        Object.keys(patternClipboard).forEach(identifier => {
            const tId = parseInt(identifier.split('-')[0]);
            const si = parseInt(identifier.split('-')[1]);
            const adjustedSequenceIndex = noteCursorStep + si - smallestSequenceIndex;
            if (adjustedSequenceIndex < soundData.size) {
                updatedTracks[tId].sequence[adjustedSequenceIndex] = patternIdMap[identifier];
            }
        });

        updateSoundData({
            ...soundData,
            tracks: updatedTracks,
        });
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
            case SoundEditorCommands.SELECT_NEXT_PATTERN.id:
                const followingPatterns = Object.keys(soundData.tracks[currentTrackId].sequence)
                    .map(si => parseInt(si))
                    .filter(si => si > currentSequenceIndex);
                if (followingPatterns.length) {
                    setCurrentSequenceIndex(currentTrackId, Math.min(...followingPatterns));
                }
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_PATTERN.id:
                const previousPatterns = Object.keys(soundData.tracks[currentTrackId].sequence)
                    .map(si => parseInt(si))
                    .filter(si => si < currentSequenceIndex);
                if (previousPatterns.length) {
                    setCurrentSequenceIndex(currentTrackId, Math.max(...previousPatterns));
                }
                break;
            case SoundEditorCommands.COPY_SELECTION.id:
                copySelectedPatterns();
                break;
            case SoundEditorCommands.CUT_SELECTION.id:
                cutSelectedPatterns();
                break;
            case SoundEditorCommands.PASTE_SELECTION.id:
                pastePatterns();
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
                setSequencerNoteWidth(prev =>
                    prev > SEQUENCER_PATTERN_WIDTH_MIN ? prev - .25 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE.id:
                setSequencerNoteWidth(prev =>
                    prev < SEQUENCER_PATTERN_WIDTH_MAX ? prev + .25 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET.id:
                setSequencerNoteWidth(SEQUENCER_PATTERN_WIDTH_DEFAULT);
                break;
        }
    };

    useEffect(() => {
        getScrollWindowCoords();
    }, [
        soundData.size,
        sequencerNoteWidth,
    ]);

    useEffect(() => {
        sequencerContainerRef.current?.addEventListener('wheel', onWheelNative, { passive: false });

        if (!sequencerGridContainerRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => getScrollWindowCoords());
        resizeObserver.observe(sequencerGridContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            sequencerContainerRef.current?.removeEventListener('wheel', onWheelNative);
        };
    }, []);

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, [
        currentTrackId,
        currentSequenceIndex,
        selectedPatterns,
        patternClipboard,
        noteCursor,
        soundData,
    ]);

    return <StyledSequencerContainer
        style={{
            minHeight: sequencerPatternHeight * soundData.tracks.length + SEQUENCER_GRID_METER_HEIGHT +
                (soundData.tracks.length < VSU_NUMBER_OF_CHANNELS ? SEQUENCER_ADD_TRACK_BUTTON_HEIGHT + 3 : 10),
        }}
        ref={sequencerContainerRef}
        onWheel={onWheel}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
                    editCurrentTrack={editCurrentTrack}
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
            ref={sequencerGridContainerRef}
            onWheel={mapVerticalToHorizontalScroll}
            onScroll={getScrollWindowCoords}
        >
            <div style={{ width: width }} />
            <StepIndicator
                soundData={soundData}
                currentPlayerPosition={currentPlayerPosition}
                position={StepIndicatorPosition.SEQUENCER}
                hidden={currentPlayerPosition === -1}
                effectsPanelHidden={effectsPanelHidden}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
                sequencerPatternHeight={sequencerPatternHeight}
                sequencerNoteWidth={sequencerNoteWidth}
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
                sequencerNoteWidth={sequencerNoteWidth}
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
                editCurrentPattern={editCurrentPattern}
                sequencerContainerRef={sequencerGridContainerRef}
                pianoRollScrollWindow={pianoRollScrollWindow}
                pianoRollNoteWidth={pianoRollNoteWidth}
                removePatternsFromSequence={removePatternsFromSequence}
                noteSnapping={noteSnapping}
                noteCursor={noteCursor}
                setNoteCursor={setNoteCursor}
                stepsPerNote={stepsPerNote}
                stepsPerBar={stepsPerBar}
            />
            {tool === SoundEditorTool.EDIT && soundData.patterns[currentPatternId] &&
                <SequencerPlacedPattern
                    soundData={soundData}
                    updateSoundData={updateSoundData}
                    tool={tool}
                    sequenceIndex={currentSequenceIndex}
                    trackId={currentTrackId}
                    pattern={soundData.patterns[currentPatternId]}
                    patternId={currentPatternId}
                    selectedPatterns={selectedPatterns}
                    setSelectedPatterns={setSelectedPatterns}
                    currentTrackId={currentTrackId}
                    currentPatternId={currentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setCurrentPatternId={setCurrentPatternId}
                    editCurrentPattern={editCurrentPattern}
                    noteSnapping={noteSnapping}
                    cancelPatternDrag={cancelPatternDrag}
                    setCancelPatternDrag={setCancelPatternDrag}
                    sequencerPatternHeight={sequencerPatternHeight}
                    sequencerNoteWidth={sequencerNoteWidth}
                    setPatternSizes={setPatternSizes}
                    removePatternsFromSequence={removePatternsFromSequence}
                    stepsPerBar={stepsPerBar}
                />
            }
        </StyledSequencerGridContainer>
    </StyledSequencerContainer>;
}
