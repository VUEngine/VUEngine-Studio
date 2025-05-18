import React, { Dispatch, SetStateAction, SyntheticEvent, useEffect, useMemo } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    TrackConfig,
    NOTE_RESOLUTION,
    NOTES_SPECTRUM,
    PatternConfig,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_GRID_WIDTH,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
} from '../SoundEditorTypes';

const StyledPattern = styled.div`
    background-color: var(--theia-secondaryButton-background);
    box-sizing: border-box;
    cursor: move;
    overflow: hidden;
    position: absolute;
    z-index: 10;

    &:hover,
    &.current {
        outline: 1px solid var(--theia-focusBorder);
        z-index: 11;
    }
        
    &.selected {
        border-radius: 1px;
        outline: 3px solid var(--theia-focusBorder);
        z-index: 11;
    }

    &.dragging {
        border: 1px solid var(--theia-focusBorder);
        cursor: grabbing;
        outline: 0;
    }

    canvas {
        box-sizing: border-box;
    }

    .react-resizable-handle {
        border-left: 1px solid rgba(255, 255, 255, .5);
        bottom: 3px;
        cursor: col-resize;
        position: absolute;
        right: 0;
        top: 3px;
        width: 2px;
        z-index: 10;
    }
`;

const StyledPatternName = styled.div`
    display: flex;
    font-size: 9px;
    height: 100%;
    overflow: hidden;
    padding: 0 3px;
    position: relative;
    text-overflow: ellipsis;
    white-space: nowrap;
    z-index: 1;
`;

interface PatternProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    patternIndex: number
    step: number
    pattern: PatternConfig
    trackId: number
    patternId: string
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    sequencerPatternHeight: number
    sequencerPatternWidth: number
}

export default function PlacedPattern(props: PatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        patternIndex,
        step,
        trackId,
        pattern, patternId,
        currentTrackId, currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setTrack,
        setPatternDialogOpen,
        sequencerPatternHeight, sequencerPatternWidth,
    } = props;
    const isCurrent = currentTrackId === trackId && currentPatternId === patternId;
    const track = soundData.tracks[trackId];
    const instrument = soundData.instruments[track.instrument];
    const noteColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];
    // TODO: color _each note_ by instrument instead of whole track

    const classNames = ['placedPattern'];
    if (currentTrackId === trackId && currentSequenceIndex === step) {
        classNames.push('current selected');
    } else if (isCurrent) {
        classNames.push('current');
    }

    const patternNoteWidth = sequencerPatternWidth / NOTE_RESOLUTION;
    const patternName = pattern.name.length ? pattern.name : (patternIndex + 1).toString();
    const width = pattern.size * sequencerPatternWidth - SEQUENCER_GRID_WIDTH;

    const patternPixels: number[][][] = useMemo(() => {
        const result: number[][] = [[]];

        const placePixel = (x: number, y: number) => {
            for (let k = 0; k < patternNoteWidth; k++) {
                const xPos = Math.round(x * patternNoteWidth + k);
                result[y][xPos] = 1;
                if (result[y - 1]) {
                    result[y - 1][xPos] = 1;
                }
                if (result[y + 1]) {
                    result[y + 1][xPos] = 1;
                }
            }
        };

        // init array
        const emptyLine = [...Array(width)].map(v => 0);
        [...Array(sequencerPatternHeight)].map(v => result.push([...emptyLine]));

        // find set notes
        Object.keys(pattern.events).forEach((key: string) => {
            const s = parseInt(key);
            const event = pattern.events[s];
            const note = event[SoundEvent.Note];
            if (note !== undefined) {
                const duration = event[SoundEvent.Duration]
                    ? Math.floor(event[SoundEvent.Duration] / SUB_NOTE_RESOLUTION)
                    : 1;
                const startXPosition = Math.floor(s / SUB_NOTE_RESOLUTION);
                const noteYPosition = Math.round(sequencerPatternHeight / NOTES_SPECTRUM * note);
                for (let k = 0; k < duration; k++) {
                    placePixel(startXPosition + k, noteYPosition);
                }
            }
        });

        return [result];
    }, [
        pattern.events,
        sequencerPatternHeight,
        sequencerPatternWidth,
    ]);

    const removeFromSequence = (cId: number, i: number): void => {
        const updatedSequence = { ...soundData.tracks[cId].sequence };
        delete (updatedSequence[i]);
        setTrack(cId, {
            sequence: updatedSequence,
        });
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.REMOVE_CURRENT_PATTERN.id:
                removeFromSequence(currentTrackId, step);
                break;
        }
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.floor(data.size.width / sequencerPatternWidth);
        updateSoundData({
            ...soundData,
            patterns: {
                ...soundData.patterns,
                [patternId]: {
                    ...soundData.patterns[patternId],
                    size: newSize
                },
            },
        });
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        const newTrackId = Math.ceil((data.y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
        const newBar = Math.floor((data.x - PIANO_ROLL_KEY_WIDTH) / sequencerPatternWidth);
        if (newTrackId === trackId && newBar === step) {
            return;
        }

        const updatedTracks = [
            ...soundData.tracks.slice(0, newTrackId),
            {
                ...soundData.tracks[newTrackId],
                sequence: {
                    ...soundData.tracks[newTrackId].sequence,
                    [newBar]: soundData.tracks[trackId].sequence[step],
                },
            },
            ...soundData.tracks.slice(newTrackId + 1)
        ];
        delete (updatedTracks[trackId].sequence[step]);

        updateSoundData({
            ...soundData,
            tracks: updatedTracks,
        });
        setCurrentSequenceIndex(newTrackId, newBar);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 0) {
            setCurrentSequenceIndex(trackId, step);
        } else if (e.buttons === 2) {
            removeFromSequence(trackId, step);
        }
    };

    const onDblClick = (e: React.MouseEvent<HTMLElement>) => {
        setPatternDialogOpen(true);
    };

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

    return (
        <Draggable
            grid={[sequencerPatternWidth, sequencerPatternHeight]}
            handle=".placedPattern"
            cancel=".react-resizable-handle"
            onStop={onDragStop}
            position={{
                x: 2 + PIANO_ROLL_KEY_WIDTH + step * sequencerPatternWidth,
                y: SEQUENCER_GRID_METER_HEIGHT + trackId * sequencerPatternHeight,
            }}
            bounds={{
                bottom: SEQUENCER_GRID_METER_HEIGHT + (soundData.tracks.length - 1) * sequencerPatternHeight,
                left: PIANO_ROLL_KEY_WIDTH,
                right: PIANO_ROLL_KEY_WIDTH + soundData.size * sequencerPatternWidth - pattern.size * sequencerPatternWidth,
                top: SEQUENCER_GRID_METER_HEIGHT,
            }}
        >
            <StyledPattern
                className={classNames.join(' ')}
                data-channel={trackId}
                data-position={step}
                onClick={onClick}
                onContextMenu={onClick}
                onDoubleClick={onDblClick}
                title={patternName}
                style={{
                    height: sequencerPatternHeight - SEQUENCER_GRID_WIDTH,
                }}
            >
                <ResizableBox
                    width={width}
                    draggableOpts={{
                        grid: [sequencerPatternWidth, sequencerPatternHeight]
                    }}
                    axis="x"
                    minConstraints={[sequencerPatternWidth, sequencerPatternHeight]}
                    maxConstraints={[sequencerPatternWidth * soundData.size, sequencerPatternHeight]}
                    resizeHandles={trackId === currentTrackId ? ['e'] : []}
                    onResizeStop={onResize}
                >
                    <>
                        <CanvasImage
                            height={sequencerPatternHeight - 1}
                            palette={'00000000'}
                            pixelData={patternPixels}
                            colorOverride={noteColor}
                            width={width}
                            displayMode={DisplayMode.Mono}
                            colorMode={ColorMode.Default}
                            style={{
                                height: sequencerPatternHeight,
                                left: 0,
                                position: 'absolute',
                                top: 0,
                                width: width,
                            }}
                        />
                        <StyledPatternName>
                            {patternName}
                        </StyledPatternName>
                    </>
                </ResizableBox>
            </StyledPattern>
        </Draggable>
    );
}
