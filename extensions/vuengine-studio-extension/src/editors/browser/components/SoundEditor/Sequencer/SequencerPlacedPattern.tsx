import { deepClone } from '@theia/core';
import React, { Dispatch, SetStateAction, SyntheticEvent, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { getPatternName } from '../SoundEditor';
import {
    PatternConfig,
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
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    noteSnapping: boolean
    cancelPatternDrag: boolean
    setCancelPatternDrag: Dispatch<SetStateAction<boolean>>
    sequencerPatternHeight: number
    sequencerNoteWidth: number
    setPatternSizes: (patterns: { [patternId: string]: number }) => void
    removePatternsFromSequence: (patterns: string[]) => void
    stepsPerBar: number
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
        setPatternDialogOpen,
        noteSnapping,
        cancelPatternDrag, setCancelPatternDrag,
        sequencerPatternHeight, sequencerNoteWidth,
        setPatternSizes,
        removePatternsFromSequence,
        stepsPerBar,
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

    const topDragBound = () => {
        const topBound = SEQUENCER_GRID_METER_HEIGHT;

        let topMostTrackDifference = 0;
        const topMostTrackId = selectedPatterns
            .map(spId => parseInt(spId.split('-')[0]))
            .filter(spId => spId < trackId)
            .sort()[0];
        if (topMostTrackId !== undefined) {
            topMostTrackDifference = (trackId - topMostTrackId) * sequencerPatternHeight;
        }

        return topBound + topMostTrackDifference;
    };

    const rightDragBound = () => {
        const rightBound = soundData.size * sequencerNoteWidth;
        let rightMostPatternSize = pattern.size;

        let rightMostPatternDifference = 0;
        const rightMostPattern = selectedPatterns
            .filter(sp => parseInt(sp.split('-')[1]) > sequenceIndex)
            .sort().pop();
        if (rightMostPattern !== undefined) {
            const rightMostPatternTrackId = parseInt(rightMostPattern.split('-')[0]);
            const rightMostPatternSequenceIndex = parseInt(rightMostPattern.split('-')[1]);
            rightMostPatternDifference = (rightMostPatternSequenceIndex - sequenceIndex) * sequencerNoteWidth;
            if (soundData.tracks[rightMostPatternTrackId]) {
                const t = soundData.tracks[rightMostPatternTrackId];
                const pId = t.sequence[rightMostPatternSequenceIndex];
                const p = soundData.patterns[pId];
                if (p) {
                    rightMostPatternSize = p.size;
                }
            }
        }

        const rightMostPatternWidth = rightMostPatternSize * sequencerNoteWidth;

        return rightBound - rightMostPatternDifference - rightMostPatternWidth;
    };

    const bottomDragBound = () => {
        const bottomBound = SEQUENCER_GRID_METER_HEIGHT + (soundData.tracks.length - 1) * sequencerPatternHeight;

        let bottomMostTrackDifference = 0;
        const bottomMostTrackId = selectedPatterns
            .map(spId => parseInt(spId.split('-')[0]))
            .filter(spId => spId > trackId)
            .sort().pop();
        if (bottomMostTrackId !== undefined) {
            bottomMostTrackDifference = (bottomMostTrackId - trackId) * sequencerPatternHeight;
        }

        return bottomBound - bottomMostTrackDifference;
    };

    const leftDragBound = () => {
        const leftBound = 0;

        let leftMostPatternDifference = 0;
        const leftMostPatternSi = selectedPatterns
            .map(spId => parseInt(spId.split('-')[1]))
            .filter(sp => sp < sequenceIndex)
            .sort()[0];
        if (leftMostPatternSi !== undefined) {
            leftMostPatternDifference = (sequenceIndex - leftMostPatternSi) * sequencerNoteWidth;
        }

        return leftBound + leftMostPatternDifference;
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.ceil(data.size.width / sequencerNoteWidth);

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
        const newSequenceIndex = Math.floor(data.x / sequencerNoteWidth);
        if (newTrackId === trackId && newSequenceIndex === sequenceIndex) {
            return;
        }

        const newTrackDifference = newTrackId - trackId;
        const newSequenceIndexDifference = newSequenceIndex - sequenceIndex;

        const updatedTracks = deepClone(soundData.tracks);
        const newSelectedPatterns: string[] = [];

        // delete previous patterns
        delete updatedTracks[trackId].sequence[sequenceIndex];
        selectedPatterns.forEach(identifier => {
            const tId = parseInt(identifier.split('-')[0]);
            const si = parseInt(identifier.split('-')[1]);
            if (updatedTracks[tId].sequence[si]) {
                delete updatedTracks[tId].sequence[si];
            }
        });

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
            setSelectedPatterns([...selectedPatterns, identifier]);
        } else if (tool === SoundEditorTool.EDIT && e.button === 0) {
            setCurrentSequenceIndex(trackId, sequenceIndex);
            if (selectedPatterns.length <= 1) {
                setSelectedPatterns([identifier]);
            }
        }
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
        setPatternDialogOpen(true);
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            grid={[
                noteSnapping
                    ? stepsPerBar * sequencerNoteWidth
                    : sequencerNoteWidth,
                sequencerPatternHeight
            ]}
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
                        grid: [
                            noteSnapping
                                ? stepsPerBar * sequencerNoteWidth
                                : sequencerNoteWidth,
                            sequencerPatternHeight
                        ]
                    }}
                    axis="x"
                    minConstraints={[
                        noteSnapping
                            ? stepsPerBar * sequencerNoteWidth
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
