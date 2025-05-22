import React, { Dispatch, SetStateAction, SyntheticEvent, useEffect, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { getPatternName } from '../SoundEditor';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    NOTE_RESOLUTION,
    NOTES_LABELS,
    NOTES_SPECTRUM,
    PatternConfig,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_GRID_WIDTH,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';

const StyledPattern = styled.div`
    background-color: var(--theia-secondaryButton-background);
    box-sizing: border-box;
    cursor: move;
    outline-offset: -1px;
    overflow: hidden;
    position: absolute;
    z-index: 10;

    &:hover,
    &.current {
        outline: 1px solid var(--theia-focusBorder);
    }
        
    &.selected {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }

    canvas {
        box-sizing: border-box;
    }

    .react-resizable-handle {
        border-left: 1px solid;
        bottom: 0;
        cursor: col-resize;
        opacity: .3;
        position: absolute;
        right: 0;
        top: 0;
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

interface SequencerPlacedPatternProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    step: number
    pattern: PatternConfig
    trackId: number
    patternId: string
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    setPatternSize: (patternId: string, size: number) => void
    removePatternFromSequence: (trackId: number, step: number) => void
}

export default function SequencerPlacedPattern(props: SequencerPlacedPatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        step,
        trackId,
        pattern, patternId,
        currentTrackId, currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setPatternDialogOpen,
        sequencerPatternHeight, sequencerPatternWidth,
        setPatternSize,
        removePatternFromSequence,
    } = props;
    const [patternPixels, setPatternPixels] = useState<number[][][]>([]);
    const [colorOverrides, setColorOverrides] = useState<string[][]>([]);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    const isCurrent = currentTrackId === trackId && currentPatternId === patternId;
    const track = soundData.tracks[trackId];
    const trackDefaultInstrument = soundData.instruments[track.instrument];
    const defaultColor = COLOR_PALETTE[trackDefaultInstrument?.color ?? DEFAULT_COLOR_INDEX];

    const classNames = ['placedPattern'];
    if (currentTrackId === trackId && currentSequenceIndex === step) {
        classNames.push('current selected');
    } else if (isCurrent) {
        classNames.push('current');
    }

    const patternNoteWidth = sequencerPatternWidth / NOTE_RESOLUTION;
    const patternName = getPatternName(soundData, patternId);
    const width = pattern.size / SEQUENCER_RESOLUTION * sequencerPatternWidth - SEQUENCER_GRID_WIDTH;
    const widthCeil = Math.ceil(width);

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.REMOVE_CURRENT_PATTERN.id:
                removePatternFromSequence(currentTrackId, step);
                break;
        }
    };
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
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 0) {
            setCurrentSequenceIndex(trackId, step);
        } else if (e.buttons === 2) {
            removePatternFromSequence(trackId, step);
        }
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
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

    useEffect(() => {
        const pixels: number[][] = [];
        const colors: string[][] = [];

        // init arrays
        const emptyPixelLine = [...Array(widthCeil)].map(v => 0);
        const emptyColorLine = [...Array(widthCeil)].map(v => '');
        [...Array(sequencerPatternHeight)].map(v => {
            pixels.push([...emptyPixelLine]);
            colors.push([...emptyColorLine]);
        });

        const placePixel = (x: number, y: number, color: string) => {
            if (pixels[y] === undefined) {
                pixels[y] = [];
                colors[y] = [];
            }
            for (let k = 0; k < patternNoteWidth; k++) {
                const xPos = Math.round(x * patternNoteWidth + k);
                pixels[y][xPos] = 1;
                colors[y][xPos] = color;
                if (pixels[y - 1]) {
                    pixels[y - 1][xPos] = 1;
                    colors[y - 1][xPos] = color;
                }
                if (pixels[y + 1]) {
                    pixels[y + 1][xPos] = 1;
                    colors[y + 1][xPos] = color;
                }
            }
        };

        // find set notes
        Object.keys(pattern.events).forEach((key: string) => {
            const s = parseInt(key);
            const event = pattern.events[s];
            const noteLabel = event[SoundEvent.Note];
            const instrumentId = event[SoundEvent.Instrument];
            const color = instrumentId
                ? COLOR_PALETTE[soundData.instruments[instrumentId].color ?? DEFAULT_COLOR_INDEX]
                : defaultColor;
            if (noteLabel !== '') {
                const noteId = NOTES_LABELS.indexOf(noteLabel);
                const duration = event[SoundEvent.Duration]
                    ? Math.floor(event[SoundEvent.Duration] / SUB_NOTE_RESOLUTION)
                    : 1;
                const startXPosition = Math.floor(s / SUB_NOTE_RESOLUTION);
                const noteYPosition = Math.round(sequencerPatternHeight / NOTES_SPECTRUM * noteId);
                for (let k = 0; k < duration; k++) {
                    placePixel(startXPosition + k, noteYPosition, color);
                }
            }
        });

        setPatternPixels([pixels]);
        setColorOverrides(colors);
    }, [
        track.instrument,
        soundData.instruments[track.instrument],
        pattern.events,
        sequencerPatternHeight,
        sequencerPatternWidth,
    ]);

    return (
        <Draggable
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
                    resizeHandles={trackId === currentTrackId ? ['e'] : []}
                    onResizeStop={onResize}
                >
                    <>
                        <CanvasImage
                            height={sequencerPatternHeight - 1}
                            palette={'00000000'}
                            pixelData={patternPixels}
                            colorOverride={colorOverrides}
                            width={widthCeil}
                            displayMode={DisplayMode.Mono}
                            colorMode={ColorMode.Default}
                            style={{
                                height: sequencerPatternHeight,
                                left: 0,
                                position: 'absolute',
                                top: 0,
                                width: widthCeil,
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
