import { deepClone } from '@theia/core';
import React, { Dispatch, SetStateAction, SyntheticEvent, useEffect, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { getBarsLength, getNearestBarStartColumn, getNextBarStartColumn, getTimeSignatureSegments } from '../Other/timeSignature';
import { getPatternName } from '../SoundEditor';
import {
    PatternConfig,
    SequenceMap,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_GRID_WIDTH,
    SoundData,
    SoundEditorTool
} from '../SoundEditorTypes';

const StyledPattern = styled.div`
    box-sizing: border-box;
    cursor: move;
    opacity: 0;
    outline: 1px solid;
    overflow: hidden;
    position: absolute;
    z-index: 21;

    &:hover,
    &.react-draggable-dragging:not(.cancelPatternDrag) {
        opacity: 1;
    }

    canvas.hasMarquee + & {
        display: none;
    }

    canvas {
        box-sizing: border-box;
    }

    .react-resizable-handle-e {
        border-left: 1px solid;
        bottom: 0;
        cursor: col-resize;
        opacity: .7;
        position: absolute;
        right: 0;
        top: 0;
        width: 4px;
        z-index: 10;
    }

    &.react-draggable-dragging {
        .react-resizable-handle {
            display: none;
        } 
    }
`;

interface SequencerPlacedPatternProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    tool: SoundEditorTool
    sequenceIndex: number
    pattern: PatternConfig
    selectedPatterns: string[]
    setSelectedPatterns: (sn: string[]) => void
    trackId: number
    patternId: string
    currentTrackId: number
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    editCurrentPattern: () => void
    noteSnapping: boolean
    cancelPatternDrag: boolean
    setCancelPatternDrag: Dispatch<SetStateAction<boolean>>
    sequencerPatternHeight: number
    sequencerNoteWidth: number
    setPatternSizes: (patterns: { [patternId: string]: number }) => void
    removePatternsFromSequence: (patterns: string[]) => void
}

export default function SequencerPlacedPattern(props: SequencerPlacedPatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        tool,
        sequenceIndex,
        trackId,
        pattern, patternId,
        selectedPatterns, setSelectedPatterns,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        editCurrentPattern,
        noteSnapping,
        cancelPatternDrag, setCancelPatternDrag,
        sequencerPatternHeight, sequencerNoteWidth,
        setPatternSizes,
        removePatternsFromSequence,
    } = props;
    const [isDragging, setIsDragging] = useState(false);
    const [patternDragDelta, setPatternDragDelta] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const nodeRef = useRef(null);

    const isCurrent = currentTrackId === trackId && currentPatternId === patternId;

    const classNames = ['placedPattern'];
    if (currentTrackId === trackId && currentSequenceIndex === sequenceIndex) {
        classNames.push('current selected');
    } else if (isCurrent) {
        classNames.push('current');
    }
    if (cancelPatternDrag) {
        classNames.push('cancelPatternDrag');
    }

    const patternName = getPatternName(soundData, patternId);
    const width = pattern.size * sequencerNoteWidth - SEQUENCER_GRID_WIDTH * 2;

    // the selected patterns limit how far the dragged one can move, as they move along
    const selectedTrackIds = () => selectedPatterns.map(spId => parseInt(spId.split('-')[0]));

    const topDragBound = () => {
        const topMostTrackId = Math.min(trackId, ...selectedTrackIds());

        return SEQUENCER_GRID_METER_HEIGHT + (trackId - topMostTrackId) * sequencerPatternHeight;
    };

    const rightDragBound = () => {
        // the column at which the selected pattern which reaches furthest to the right ends
        let rightMostEnd = sequenceIndex + pattern.size;
        selectedPatterns.forEach(identifier => {
            const tId = parseInt(identifier.split('-')[0]);
            const si = parseInt(identifier.split('-')[1]);
            const p = soundData.patterns[soundData.tracks[tId]?.sequence[si]];
            if (p) {
                rightMostEnd = Math.max(rightMostEnd, si + p.size);
            }
        });

        return (soundData.size - (rightMostEnd - sequenceIndex)) * sequencerNoteWidth;
    };

    const bottomDragBound = () => {
        const bottomMostTrackId = Math.max(trackId, ...selectedTrackIds());

        return SEQUENCER_GRID_METER_HEIGHT + (soundData.tracks.length - 1 - (bottomMostTrackId - trackId)) * sequencerPatternHeight;
    };

    const leftDragBound = () => {
        const leftMostSequenceIndex = Math.min(sequenceIndex, ...selectedPatterns.map(spId => parseInt(spId.split('-')[1])));

        return (sequenceIndex - leftMostSequenceIndex) * sequencerNoteWidth;
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        let newSize = Math.ceil(data.size.width / sequencerNoteWidth);
        // with note snapping, the pattern ends at the closest bar start, but spans at least one bar
        if (noteSnapping) {
            const timeSignatureSegments = getTimeSignatureSegments(soundData);
            let end = getNearestBarStartColumn(timeSignatureSegments, sequenceIndex + newSize);
            if (end <= sequenceIndex) {
                end = getNextBarStartColumn(timeSignatureSegments, sequenceIndex);
            }
            newSize = end - sequenceIndex;
        }

        const patterns: { [patternId: string]: number } = {
            [patternId]: newSize
        };

        const sizeDelta = newSize - pattern.size;
        selectedPatterns.forEach(identifier => {
            const tId = parseInt(identifier.split('-')[0]);
            const si = parseInt(identifier.split('-')[1]);
            const t = soundData.tracks[tId];
            const pId = t?.sequence[si];
            const p = soundData.patterns[pId];
            if (!p) {
                return;
            }
            patterns[pId] = Math.max(1, p.size + sizeDelta);
        });

        setPatternSizes(patterns);
    };

    const onDrag = (e: DraggableEvent, data: DraggableData) => {
        setPatternDragDelta(prev => ({
            x: prev.x + data.deltaX,
            y: prev.y + data.deltaY
        }));

        e.stopPropagation();
    };

    const onDragStart = (e: DraggableEvent, data: DraggableData) => {
        setIsDragging(true);
        setCancelPatternDrag(false);
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        e.stopPropagation();
        setPatternDragDelta({ x: 0, y: 0 });
        setIsDragging(false);

        if (cancelPatternDrag || (patternDragDelta.x === 0 && patternDragDelta.y === 0)) {
            setCancelPatternDrag(false);
            return;
        }

        const newTrackId = Math.ceil((data.y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
        // with note snapping, the pattern moves to the closest bar start, according to the time signature there
        const newSequenceIndex = noteSnapping
            ? getNearestBarStartColumn(getTimeSignatureSegments(soundData), Math.round(data.x / sequencerNoteWidth))
            : Math.floor(data.x / sequencerNoteWidth);
        if (newTrackId === trackId && newSequenceIndex === sequenceIndex) {
            return;
        }

        const newTrackDifference = newTrackId - trackId;
        const newSequenceIndexDifference = newSequenceIndex - sequenceIndex;

        // filter out previous patterns
        const updatedTracks = deepClone(soundData.tracks).map((t, index) => {
            const updatedSequence: SequenceMap = {};
            Object.keys(t.sequence).forEach(s => {
                const sInt = parseInt(s);
                let keep = true;

                if (trackId === index && sequenceIndex === sInt) {
                    keep = false;
                }

                selectedPatterns.forEach(identifier => {
                    const tId = parseInt(identifier.split('-')[0]);
                    const si = parseInt(identifier.split('-')[1]);
                    if (tId === index && si === sInt) {
                        keep = false;
                    }
                });

                if (keep) {
                    updatedSequence[sInt] = t.sequence[sInt];
                }
            });

            return {
                ...t,
                sequence: updatedSequence
            };
        });

        const newSelectedPatterns: string[] = [];

        // set updated pattern sequence indexes
        updatedTracks[newTrackId].sequence[newSequenceIndex] = soundData.tracks[trackId].sequence[sequenceIndex];
        newSelectedPatterns.push(`${newTrackId}-${newSequenceIndex}`);
        selectedPatterns.forEach(identifier => {
            const tId = parseInt(identifier.split('-')[0]);
            const si = parseInt(identifier.split('-')[1]);
            updatedTracks[tId + newTrackDifference].sequence[si + newSequenceIndexDifference] =
                soundData.tracks[tId].sequence[si];
            newSelectedPatterns.push(`${tId + newTrackDifference}-${si + newSequenceIndexDifference}`);
        });

        updateSoundData({
            ...soundData,
            tracks: updatedTracks,
        });

        setSelectedPatterns(newSelectedPatterns);
        setCurrentSequenceIndex(newTrackId, newSequenceIndex);
        setCurrentPatternId(newTrackId, patternId);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        const identifier = `${trackId}-${sequenceIndex}`;
        if (tool === SoundEditorTool.ERASER && e.button === 0 || (e.metaKey || e.ctrlKey || e.altKey) && e.button === 2) {
            removePatternsFromSequence([`${trackId}-${sequenceIndex}`]);
            setSelectedPatterns([...deepClone(selectedPatterns), identifier]);
        } else if (tool === SoundEditorTool.EDIT && e.button === 0) {
            setCurrentSequenceIndex(trackId, sequenceIndex);
            if (selectedPatterns.length <= 1) {

                setSelectedPatterns([identifier]);
            }
        }
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
        editCurrentPattern();
    };

    const onKeyDown = (e: KeyboardEvent): void => {
        if (isDragging && !e.repeat && e.code === 'Escape') {
            setCancelPatternDrag(true);
            setPatternDragDelta({ x: 0, y: 0 });
            setIsDragging(false);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isDragging]);

    return (
        <Draggable
            nodeRef={nodeRef}
            grid={[sequencerNoteWidth, sequencerPatternHeight]}
            handle=".placedPattern"
            cancel=".react-resizable-handle"
            onStart={onDragStart}
            onDrag={onDrag}
            onStop={onDragStop}
            position={{
                x: sequenceIndex * sequencerNoteWidth,
                y: SEQUENCER_GRID_METER_HEIGHT + trackId * sequencerPatternHeight,
            }}
            bounds={{
                bottom: bottomDragBound(),
                left: leftDragBound(),
                right: rightDragBound(),
                top: topDragBound(),
            }}
        >
            <StyledPattern
                ref={nodeRef}
                className={classNames.join(' ')}
                data-channel={trackId}
                data-position={sequenceIndex}
                onClick={onClick}
                onContextMenu={onClick}
                onDoubleClick={onDoubleClick}
                title={patternName}
                style={{
                    height: sequencerPatternHeight - SEQUENCER_GRID_WIDTH,
                    translate: !isDragging
                        ? `${patternDragDelta.x}px ${patternDragDelta.y}px`
                        : undefined
                }}
            >
                <ResizableBox
                    width={width}
                    draggableOpts={{
                        grid: [sequencerNoteWidth, sequencerPatternHeight]
                    }}
                    axis="x"
                    minConstraints={[
                        noteSnapping
                            ? getBarsLength(getTimeSignatureSegments(soundData), sequenceIndex, 1) * sequencerNoteWidth
                            : sequencerNoteWidth,
                        sequencerPatternHeight
                    ]}
                    maxConstraints={[sequencerNoteWidth * soundData.size, sequencerPatternHeight]}
                    resizeHandles={['e']}
                    onResizeStop={onResize}
                />
            </StyledPattern>
        </Draggable>
    );
}
