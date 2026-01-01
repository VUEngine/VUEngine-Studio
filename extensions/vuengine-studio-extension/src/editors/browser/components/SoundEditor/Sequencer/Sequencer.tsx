import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { ScaleControls } from '../PianoRoll/PianoRoll';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    NOTE_RESOLUTION,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SEQUENCER_ADD_TRACK_BUTTON_HEIGHT,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_PATTERN_HEIGHT_MAX,
    SEQUENCER_PATTERN_HEIGHT_MIN,
    SEQUENCER_PATTERN_WIDTH_MAX,
    SEQUENCER_PATTERN_WIDTH_MIN,
    SEQUENCER_RESOLUTION,
    SoundData,
    TrackSettings
} from '../SoundEditorTypes';
import LoopIndicator from './LoopIndicator';
import SequencerGrid from './SequencerGrid';
import SequencerPlacedPattern from './SequencerPlacedPattern';
import StepIndicator from './StepIndicator';
import TrackHeader from './TrackHeader';

export const StyledSequencerContainer = styled.div`
    display: flex;
    margin: 0 var(--padding);
    overflow: hidden;
    position: relative;
    user-select: none;
`;

export const StyledSequencerGridContainer = styled.div`
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
    left: 0;
    margin-top: 2px;
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

const StyledScrollWindow = styled.div`
    background-color: rgba(255, 255, 255, .1);
    position: absolute;
    top: 0;
    z-index: 0;

    body.theia-light &,
    body.theia-hc & {
        background-color: rgba(0, 0, 0, .1);
    }
`;

const StyledCurrentlyPlacingPattern = styled.div`
    border: 1px dashed var(--theia-focusBorder);
    box-sizing: border-box;
    position: absolute;
`;

interface SequencerProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentTrackId: number
    setCurrentTrackId: Dispatch<SetStateAction<number>>
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    currentPlayerPosition: number
    toggleTrackMuted: (trackId: number) => void
    toggleTrackSolo: (trackId: number) => void
    toggleTrackSeeThrough: (trackId: number) => void
    removeTrack: (trackId: number) => void
    addPattern: (trackId: number, bar: number, size?: number) => Promise<boolean>
    setPatternSize: (patternId: string, size: number) => void
    setTrackDialogOpen: Dispatch<SetStateAction<boolean>>
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    effectsPanelHidden: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    sequencerPatternHeight: number
    setSequencerPatternHeight: Dispatch<SetStateAction<number>>
    sequencerPatternWidth: number
    setSequencerPatternWidth: Dispatch<SetStateAction<number>>
    pianoRollScrollWindow: ScrollWindow
    removePatternFromSequence: (trackId: number, step: number) => void
    trackSettings: TrackSettings[]
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
}

export default function Sequencer(props: SequencerProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentTrackId, setCurrentTrackId,
        currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentPlayerPosition,
        toggleTrackMuted,
        toggleTrackSolo,
        toggleTrackSeeThrough,
        removeTrack,
        addPattern, setPatternSize,
        setTrackDialogOpen, setPatternDialogOpen,
        effectsPanelHidden,
        pianoRollNoteHeight, pianoRollNoteWidth,
        sequencerPatternHeight, setSequencerPatternHeight,
        sequencerPatternWidth, setSequencerPatternWidth,
        pianoRollScrollWindow,
        removePatternFromSequence,
        trackSettings,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [dragStartTrackId, setDragStartTrackId] = useState<number>(-1);
    const [dragStartStep, setDragStartStep] = useState<number>(-1);
    const [dragEndStep, setDragEndStep] = useState<number>(-1);
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
        setDragStartTrackId(-1);
        setDragStartStep(-1);
        setDragEndStep(-1);
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
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
                if (currentTrackId < soundData.tracks.length - 1) {
                    setCurrentTrackId(currentTrackId + 1);
                }
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_TRACK.id:
                if (currentTrackId > 0) {
                    setCurrentTrackId(currentTrackId - 1);
                }
                break;
            case SoundEditorCommands.SELECT_NEXT_SEQUENCE_INDEX.id:
                /*
                if (currentSequenceIndex < soundData.channels[currentTrackId].sequence.length - 1) {
                    setCurrentSequenceIndex(currentTrackId, currentSequenceIndex + 1);
                }
                */
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_SEQUENCE_INDEX.id:
                /*
                if (currentSequenceIndex > 0) {
                    setCurrentSequenceIndex(currentTrackId, currentSequenceIndex - 1);
                }
                */
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
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        currentTrackId,
        currentSequenceIndex,
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
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_REDUCE.id)}>
                <i className="codicon codicon-chrome-minimize" />
            </button>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_RESET.id)}>
                <i className="codicon codicon-circle-large" />
            </button>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_INCREASE.id)}>
                <i className="codicon codicon-plus" />
            </button>
        </ScaleControls>
        <ScaleControls>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_REDUCE.id)}>
                <i className="codicon codicon-chrome-minimize" />
            </button>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET.id)}>
                <i className="codicon codicon-circle-large" />
            </button>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE.id)}>
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
                    track={track}
                    trackId={index}
                    currentTrackId={currentTrackId}
                    removeTrack={removeTrack}
                    setCurrentTrackId={setCurrentTrackId}
                    toggleTrackMuted={toggleTrackMuted}
                    toggleTrackSolo={toggleTrackSolo}
                    toggleTrackSeeThrough={toggleTrackSeeThrough}
                    otherSolo={soloTrack > -1 && soloTrack !== index}
                    setTrackDialogOpen={setTrackDialogOpen}
                    sequencerPatternHeight={sequencerPatternHeight}
                    trackSettings={trackSettings}
                />
            )}
            {soundData.tracks.length < VSU_NUMBER_OF_CHANNELS &&
                <StyledAddTrackButton
                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_TRACK.id)}
                    title={nls.localizeByDefault('Add')}
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
                isPianoRoll={false}
                hidden={currentPlayerPosition === -1}
                effectsPanelHidden={effectsPanelHidden}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
                sequencerPatternHeight={sequencerPatternHeight}
                sequencerPatternWidth={sequencerPatternWidth}
            />
            <LoopIndicator
                position={soundData.loopPoint}
                hidden={!soundData.loop || soundData.loopPoint === 0}
                sequencerPatternWidth={sequencerPatternWidth}
            />
            <SequencerGrid
                soundData={soundData}
                currentTrackId={currentTrackId}
                addPattern={addPattern}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
                sequencerPatternHeight={sequencerPatternHeight}
                sequencerPatternWidth={sequencerPatternWidth}
                dragStartTrackId={dragStartTrackId}
                dragStartStep={dragStartStep}
                dragEndStep={dragEndStep}
                setDragStartTrackId={setDragStartTrackId}
                setDragStartStep={setDragStartStep}
                setDragEndStep={setDragEndStep}
                sequencerScrollWindow={sequencerScrollWindow}
            />
            <StyledScrollWindow
                style={{
                    bottom: soundData.tracks.length === VSU_NUMBER_OF_CHANNELS ? 0 : 8,
                    left: sequencerPatternWidth / pianoRollNoteWidth / NOTE_RESOLUTION * pianoRollScrollWindow.x,
                    width: Math.min(
                        sequencerPatternWidth / pianoRollNoteWidth / NOTE_RESOLUTION * pianoRollScrollWindow.w,
                        // cap to song size as maximum width
                        soundData.size * sequencerPatternWidth / SEQUENCER_RESOLUTION
                    ),
                }}
            />
            {dragStartTrackId > -1 &&
                <StyledCurrentlyPlacingPattern
                    style={{
                        height: sequencerPatternHeight,
                        left: Math.min(dragStartStep, dragEndStep) * sequencerPatternWidth / SEQUENCER_RESOLUTION,
                        top: SEQUENCER_GRID_METER_HEIGHT + dragStartTrackId * sequencerPatternHeight,
                        width: sequencerPatternWidth * (Math.abs(dragStartStep - dragEndStep) + 1) / SEQUENCER_RESOLUTION,
                    }}
                />
            }
            {soundData.tracks.map((track, index) =>
                Object.keys(track.sequence).map(key => {
                    const step = parseInt(key);
                    const patternId = track.sequence[step];
                    const pattern = soundData.patterns[patternId];
                    if (!pattern) {
                        return;
                    }
                    return <SequencerPlacedPattern
                        key={`${index}-${step}`}
                        soundData={soundData}
                        updateSoundData={updateSoundData}
                        step={step}
                        trackId={index}
                        pattern={pattern}
                        patternId={patternId}
                        currentTrackId={currentTrackId}
                        currentPatternId={currentPatternId}
                        currentSequenceIndex={currentSequenceIndex}
                        setCurrentSequenceIndex={setCurrentSequenceIndex}
                        setPatternDialogOpen={setPatternDialogOpen}
                        sequencerPatternHeight={sequencerPatternHeight}
                        sequencerPatternWidth={sequencerPatternWidth}
                        setPatternSize={setPatternSize}
                        removePatternFromSequence={removePatternFromSequence}
                    />;
                })
            )}
        </StyledSequencerGridContainer>
    </StyledSequencerContainer>;
}
