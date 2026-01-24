import React, { Dispatch, SetStateAction, SyntheticEvent, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { getPatternName } from '../SoundEditor';
import {
    PatternConfig,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_GRID_WIDTH,
    SEQUENCER_RESOLUTION,
    SoundData
} from '../SoundEditorTypes';
import { deepClone } from '@theia/core';

const StyledPattern = styled.div`
    box-sizing: border-box;
    cursor: move;
    opacity: 0;
    outline: 1px solid;
    overflow: hidden;
    position: absolute;
    z-index: 21;

    &:hover {
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
    sequenceIndex: number
    pattern: PatternConfig
    selectedPatterns: string[]
    setSelectedPatterns: Dispatch<SetStateAction<string[]>>
    trackId: number
    patternId: string
    currentTrackId: number
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    setPatternSizes: (patterns: { [patternId: string]: number }) => void
}

export default function SequencerPlacedPattern(props: SequencerPlacedPatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        sequenceIndex,
        trackId,
        pattern, patternId,
        selectedPatterns, setSelectedPatterns,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setPatternDialogOpen,
        sequencerPatternHeight, sequencerPatternWidth,
        setPatternSizes,
    } = props;
    const [isDragging, setIsDragging] = useState(false);
    const [patternDragDelta, setPatternDragDelta] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const nodeRef = useRef(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    const isCurrent = currentTrackId === trackId && currentPatternId === patternId;

    const classNames = ['placedPattern'];
    if (currentTrackId === trackId && currentSequenceIndex === sequenceIndex) {
        classNames.push('current selected');
    } else if (isCurrent) {
        classNames.push('current');
    }

    const patternName = getPatternName(soundData, patternId);
    const width = pattern.size / SEQUENCER_RESOLUTION * sequencerPatternWidth - SEQUENCER_GRID_WIDTH * 2;

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.ceil(data.size.width / sequencerPatternWidth * SEQUENCER_RESOLUTION);

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
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        e.stopPropagation();
        setPatternDragDelta({ x: 0, y: 0 });
        setIsDragging(false);

        const newTrackId = Math.ceil((data.y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
        const newSequenceIndex = Math.floor((data.x) / sequencerPatternWidth * SEQUENCER_RESOLUTION);
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
        if (e.buttons === 0 || e.buttons === 2) {
            setCurrentSequenceIndex(trackId, sequenceIndex);
        }
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
        setPatternDialogOpen(true);
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            grid={[sequencerPatternWidth / SEQUENCER_RESOLUTION, sequencerPatternHeight]}
            handle=".placedPattern"
            cancel=".react-resizable-handle"
            onStart={onDragStart}
            onDrag={onDrag}
            onStop={onDragStop}
            position={{
                x: sequenceIndex / SEQUENCER_RESOLUTION * sequencerPatternWidth,
                y: SEQUENCER_GRID_METER_HEIGHT + trackId * sequencerPatternHeight,
            }}
            bounds={{
                bottom: SEQUENCER_GRID_METER_HEIGHT + (soundData.tracks.length - 1) * sequencerPatternHeight,
                left: 0,
                right: (songLength - pattern.size / SEQUENCER_RESOLUTION) * sequencerPatternWidth,
                top: SEQUENCER_GRID_METER_HEIGHT,
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
                        grid: [sequencerPatternWidth / SEQUENCER_RESOLUTION, sequencerPatternHeight]
                    }}
                    axis="x"
                    minConstraints={[sequencerPatternWidth / SEQUENCER_RESOLUTION, sequencerPatternHeight]}
                    maxConstraints={[sequencerPatternWidth * songLength, sequencerPatternHeight]}
                    resizeHandles={['e']}
                    onResizeStop={onResize}
                />
            </StyledPattern>
        </Draggable>
    );
}
