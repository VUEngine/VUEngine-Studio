import React, { Dispatch, MouseEvent, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import { getFoundPatternSequenceIndex, getPatternName, getToolModeCursor } from '../SoundEditor';
import {
    DEFAULT_PLAY_RANGE_SIZE,
    NOTE_RESOLUTION,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_GRID_WIDTH,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEditorTool,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';

const StyledPianoRollHeaderGridContainer = styled.div`
    height: ${PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT}px;
    position: relative;
`;

interface PianoRollHeaderGridProps {
    soundData: SoundData
    tool: SoundEditorTool
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    setForcePlayerRomRebuild: Dispatch<SetStateAction<number>>
    pianoRollNoteWidth: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setPatternAtCursorPosition: (cursor?: number, size?: number) => void
    pianoRollScrollWindow: ScrollWindow
    pianoRollRef: RefObject<HTMLDivElement>
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    rangeDragStartStep: number
    setRangeDragStartStep: Dispatch<SetStateAction<number>>
    rangeDragEndStep: number
    setRangeDragEndStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollHeaderGrid(props: PianoRollHeaderGridProps): React.JSX.Element {
    const {
        soundData,
        tool,
        currentTrackId, currentPatternId, currentSequenceIndex,
        setCurrentPlayerPosition,
        setForcePlayerRomRebuild,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        pianoRollRef,
        setPatternDialogOpen,
        rangeDragStartStep, setRangeDragStartStep,
        rangeDragEndStep, setRangeDragEndStep,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
    const [isDragScrolling, setIsDragScrolling] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    const height = PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT;
    const width = Math.min(
        pianoRollScrollWindow.w,
        songLength * NOTE_RESOLUTION * pianoRollNoteWidth
    );

    const draw = (): void => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        scaleCanvasAccountForDpi(canvas, context, width, height);

        const c = currentThemeType === 'light' ? 0 : 255;

        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .4)`;
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .4)`;
        context.lineWidth = 1;
        context.font = '10px monospace';

        // vertical lines
        for (let x = 0; x < songLength; x++) {
            const offsetElement = x * NOTE_RESOLUTION * pianoRollNoteWidth;
            if (offsetElement < pianoRollScrollWindow.x) {
                continue;
            }
            if (offsetElement > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                break;
            }
            const offset = offsetElement - 0.5 - pianoRollScrollWindow.x;
            context.beginPath();
            context.moveTo(offset, 0);
            context.lineTo(offset, height);
            context.stroke();

            // meter numbers
            context.fillText(x.toString(), offset + 4, 12);
        }

        // middle line
        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .2)`;
        context.beginPath();
        context.moveTo(0, PIANO_ROLL_GRID_METER_HEIGHT - 0.5);
        context.lineTo(width, PIANO_ROLL_GRID_METER_HEIGHT - 0.5);
        context.stroke();

        // play range
        if (playRangeStart > -1 && playRangeEnd > -1) {
            context.strokeStyle = services.colorRegistry.getCurrentColor('focusBorder')!;
            context.fillStyle = context.strokeStyle;
            const leftOffset = playRangeStart * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5;
            const rightOffset = playRangeEnd * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5;

            context.beginPath();
            context.moveTo(leftOffset, 0.5);
            context.lineTo(rightOffset, 0.5);
            context.stroke();

            context.beginPath();
            context.moveTo(leftOffset, 0.5);
            context.lineTo(leftOffset, 0.5 + PIANO_ROLL_GRID_METER_HEIGHT / 2);
            context.lineTo(leftOffset + PIANO_ROLL_GRID_METER_HEIGHT / 2, 0.5);
            context.fill();

            context.beginPath();
            context.moveTo(rightOffset, 0.5);
            context.lineTo(rightOffset, 0.5 + PIANO_ROLL_GRID_METER_HEIGHT / 2);
            context.lineTo(rightOffset - PIANO_ROLL_GRID_METER_HEIGHT / 2, 0.5);
            context.fill();
        }

        // patterns
        const patternBackground = services.colorRegistry.getCurrentColor('secondaryButton.background')!;
        const patternForeground = services.colorRegistry.getCurrentColor('editor.foreground')!;
        const patternBackgroundHighlight = services.colorRegistry.getCurrentColor('focusBorder')!;
        const patternForegroundHighlight = '#fff';
        const track = soundData.tracks[currentTrackId];
        Object.keys(track.sequence).forEach(key => {
            const step = parseInt(key);
            const patternId = track.sequence[step];
            const pattern = soundData.patterns[patternId];
            if (!pattern) {
                return;
            }

            const patternX = step * SEQUENCER_RESOLUTION * pianoRollNoteWidth + 0.5;
            const patternWidth = pattern.size * SEQUENCER_RESOLUTION * pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH - 0.5;

            if (pianoRollScrollWindow.x > patternX + patternWidth || patternX > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                return;
            }

            const patternxOffset = patternX - pianoRollScrollWindow.x + 0.5;
            const isSelected = patternId === currentPatternId && step === currentSequenceIndex;
            context.fillStyle = isSelected ? patternBackgroundHighlight : patternBackground;
            context.fillRect(
                patternxOffset,
                PIANO_ROLL_GRID_METER_HEIGHT,
                patternWidth,
                PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - PIANO_ROLL_GRID_WIDTH,
            );
            context.fillStyle = isSelected ? patternForegroundHighlight : patternForeground;
            context.fillText(getPatternName(soundData, patternId), patternxOffset + 4, PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 6);
        });

        // bottom line
        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .6)`;
        context.beginPath();
        context.moveTo(0, PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 0.5);
        context.lineTo(width, PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 0.5);
        context.stroke();
    };

    const resetPlayRange = () => {
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
    };

    const resetRangeDrag = () => {
        setRangeDragStartStep(-1);
        setRangeDragEndStep(-1);
    };

    const handleMouseDownPlayRange = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0 && tool === SoundEditorTool.EDIT) {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;

            if (y < PIANO_ROLL_GRID_METER_HEIGHT) {
                const x = e.clientX - rect.left + pianoRollScrollWindow.x;
                const step = Math.floor(x / pianoRollNoteWidth);
                if (e.button === 0) {
                    setRangeDragStartStep(step);
                    setRangeDragEndStep(step);
                    resetPlayRange();
                }
            }
        }
    };

    const handleMouseMovePlayRange = (e: MouseEvent<HTMLCanvasElement>) => {
        if (rangeDragStartStep !== -1 && rangeDragEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const step = Math.floor(x / pianoRollNoteWidth);

            if (step !== rangeDragEndStep) {
                setRangeDragEndStep(step);
            }
        }
    };

    const handleMouseUpPlayRange = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool !== SoundEditorTool.EDIT) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        if (e.button === 0 && rangeDragStartStep !== -1 && rangeDragEndStep !== -1) {
            const startStep = Math.min(rangeDragStartStep, rangeDragEndStep);
            const endStep = rangeDragStartStep === rangeDragEndStep
                ? startStep + DEFAULT_PLAY_RANGE_SIZE
                : Math.max(rangeDragStartStep, rangeDragEndStep) + 1;

            setPlayRangeStart(startStep);
            setPlayRangeEnd(endStep);
            setCurrentPlayerPosition(-1);

            resetRangeDrag();
        }

        if (y < PIANO_ROLL_GRID_METER_HEIGHT) {
            if (e.button === 2) {
                if (playRangeStart !== -1 && playRangeEnd !== -1) {
                    resetPlayRange();
                } else {
                    const x = e.clientX - rect.left + pianoRollScrollWindow.x;
                    const step = Math.floor(x / pianoRollNoteWidth);
                    setCurrentPlayerPosition(step);
                    setForcePlayerRomRebuild(prev => prev + 1);
                }
            }
        } else {
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const step = Math.floor(x / pianoRollNoteWidth);
            setPatternAtCursorPosition(step * SUB_NOTE_RESOLUTION);
        }
    };

    const handleMouseDownDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool === SoundEditorTool.DRAG || e.button === 1) {
            setIsDragScrolling(true);
        }
    };

    const handleMouseMoveDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (isDragScrolling) {
            if (e.movementX !== 0 || e.movementY !== 0) {
                pianoRollRef.current?.scrollBy({
                    left: -e.movementX,
                    top: -e.movementY,
                });
            }
        }
    };

    const handleMouseUpDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool === SoundEditorTool.DRAG || e.button === 1) {
            setIsDragScrolling(false);
        }
    };

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        handleMouseDownPlayRange(e);
        handleMouseDownDragScrolling(e);
    };

    const onMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        handleMouseUpPlayRange(e);
        handleMouseUpDragScrolling(e);
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        handleMouseMovePlayRange(e);
        handleMouseMoveDragScrolling(e);
    };

    const onMouseLeave = (e: MouseEvent<HTMLCanvasElement>) => {
        setIsDragScrolling(false);
        resetRangeDrag();
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        if (y > PIANO_ROLL_GRID_METER_HEIGHT) {
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const step = Math.floor(x / pianoRollNoteWidth / SEQUENCER_RESOLUTION);

            const insidePatternAtSi = getFoundPatternSequenceIndex(soundData, currentTrackId, step);
            if (insidePatternAtSi > -1) {
                setPatternDialogOpen(true);
            }
        }
    };

    useEffect(() => {
        draw();
    }, [
        currentThemeType,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        playRangeStart,
        playRangeEnd,
        soundData,
        pianoRollNoteWidth,
        pianoRollScrollWindow.x,
        pianoRollScrollWindow.w,
    ]);

    return (
        <StyledPianoRollHeaderGridContainer>
            <canvas
                style={{
                    cursor: getToolModeCursor(tool, isDragScrolling),
                }}
                height={height}
                width={width}
                onDoubleClick={onDoubleClick}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                ref={canvasRef}
            />
        </StyledPianoRollHeaderGridContainer>
    );
}
