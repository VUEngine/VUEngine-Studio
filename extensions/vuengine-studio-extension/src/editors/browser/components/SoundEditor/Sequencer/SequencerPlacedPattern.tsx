import React, { Dispatch, SetStateAction, SyntheticEvent, useRef } from 'react';
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

    .react-resizable-handle {
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
    step: number
    pattern: PatternConfig
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
    setPatternSize: (patternId: string, size: number) => void
}

export default function SequencerPlacedPattern(props: SequencerPlacedPatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        step,
        trackId,
        pattern, patternId,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setPatternDialogOpen,
        sequencerPatternHeight, sequencerPatternWidth,
        setPatternSize,
    } = props;
    const nodeRef = useRef(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    const isCurrent = currentTrackId === trackId && currentPatternId === patternId;

    const classNames = ['placedPattern'];
    if (currentTrackId === trackId && currentSequenceIndex === step) {
        classNames.push('current selected');
    } else if (isCurrent) {
        classNames.push('current');
    }

    const patternName = getPatternName(soundData, patternId);
    const width = pattern.size / SEQUENCER_RESOLUTION * sequencerPatternWidth - SEQUENCER_GRID_WIDTH * 2;

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.ceil(data.size.width / sequencerPatternWidth * SEQUENCER_RESOLUTION);
        setPatternSize(patternId, newSize);
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        const newTrackId = Math.ceil((data.y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
        const newBar = Math.floor((data.x) / sequencerPatternWidth * SEQUENCER_RESOLUTION);
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
        setCurrentPatternId(newTrackId, patternId);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 0 || e.buttons === 2) {
            setCurrentSequenceIndex(trackId, step);
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
            onStop={onDragStop}
            position={{
                x: step / SEQUENCER_RESOLUTION * sequencerPatternWidth,
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
                data-position={step}
                onClick={onClick}
                onContextMenu={onClick}
                onDoubleClick={onDoubleClick}
                title={patternName}
                style={{
                    height: sequencerPatternHeight - SEQUENCER_GRID_WIDTH,
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
