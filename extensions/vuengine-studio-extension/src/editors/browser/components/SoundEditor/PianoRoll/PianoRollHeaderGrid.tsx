import React, { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    DEFAULT_PLAY_RANGE_SIZE,
    NOTE_RESOLUTION,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_GRID_WIDTH,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData,
    SUB_NOTE_RESOLUTION,
} from '../SoundEditorTypes';
import { getPatternName } from '../SoundEditor';

const StyledPianoRollHeaderGridContainer = styled.div`
    height: ${PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT}px;
    position: relative;
`;

interface PianoRollHeaderGridProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    pianoRollNoteWidth: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setPatternAtCursorPosition: (cursor?: number, size?: number) => Promise<boolean>
    pianoRollScrollWindow: ScrollWindow
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    removePatternFromSequence: (trackId: number, step: number) => void
    dragStartStep: number
    setDragStartStep: Dispatch<SetStateAction<number>>
    dragEndStep: number
    setDragEndStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollHeaderGrid(props: PianoRollHeaderGridProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId, currentPatternId, currentSequenceIndex,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        // setPatternDialogOpen,
        // removePatternFromSequence,
        dragStartStep, setDragStartStep,
        dragEndStep, setDragEndStep,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    // const track = soundData.tracks[currentTrackId];
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

        const c = services.themeService.getCurrentTheme().type === 'light' ? 0 : 255;

        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .4)`;
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .4)`;
        context.lineWidth = 1;
        context.font = '9px monospace';
        const w = canvas.width;
        const h = canvas.height;

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
            context.lineTo(offset, h);
            context.stroke();

            // meter numbers
            context.fillText(x.toString(), offset + 4, 11);
        }

        // middle line
        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .2)`;
        context.beginPath();
        context.moveTo(0, PIANO_ROLL_GRID_METER_HEIGHT - 0.5);
        context.lineTo(w, PIANO_ROLL_GRID_METER_HEIGHT - 0.5);
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
            const xOffset = step * NOTE_RESOLUTION * pianoRollNoteWidth / SEQUENCER_RESOLUTION - pianoRollScrollWindow.x + 0.5;
            const patternWidth = pattern.size / SEQUENCER_RESOLUTION * NOTE_RESOLUTION * pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH - 0.5;
            const isSelected = patternId === currentPatternId && step === currentSequenceIndex;
            context.fillStyle = isSelected ? patternBackgroundHighlight : patternBackground;
            context.fillRect(
                xOffset,
                PIANO_ROLL_GRID_METER_HEIGHT,
                patternWidth,
                PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - PIANO_ROLL_GRID_WIDTH,
            );
            context.fillStyle = isSelected ? patternForegroundHighlight : patternForeground;
            context.fillText(getPatternName(soundData, patternId), xOffset + 4, PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 6);
        });

        // bottom line
        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .6)`;
        context.beginPath();
        context.moveTo(0, PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 0.5);
        context.lineTo(w, PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 0.5);
        context.stroke();
    };

    /*
    const classNames = [];
    if (playRangeStart === index) {
        classNames.push('rangeStart');
    } else if (playRangeEnd === index) {
        classNames.push('rangeEnd');
    } else if (index > playRangeStart && index < playRangeEnd) {
        classNames.push('inRange');
    }

    const updatePlayRangeStart = (start: number): void => {
        setPlayRange(start);
    };

    const updatePlayRangeEnd = (end: number): void => {
        setPlayRange(undefined, end);
    };

    const setPlayRange = (start?: number, end?: number): void => {
        if (start === undefined) {
            start = playRangeStart;
        }
        if (end === undefined) {
            end = playRangeEnd;
        }

        // auto set the respective other value if it not yet
        if (start === -1 && end > -1) {
            start = 0;
        }
        if (end === -1 && start > -1) {
            end = patternSize - 1;
        }

        // handle end < start
        if (end > -1 && start > -1 && end < start) {
            const temp = start;
            start = end + 1;
            end = temp;
        }

        // unset both if same
        if (start === end) {
            start = -1;
            end = -1;
        }

        setPlayRangeStart(start);
        setPlayRangeEnd(end);
    };
    */

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        if (e.button === 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;

            if (y < PIANO_ROLL_GRID_METER_HEIGHT) {
                const x = e.clientX - rect.left + pianoRollScrollWindow.x;
                const step = Math.floor(x / pianoRollNoteWidth);
                if (e.button === 0) {
                    setDragStartStep(step);
                    setDragEndStep(step);
                    setPlayRangeStart(-1);
                    setPlayRangeEnd(-1);
                }
            }
        }
    };

    const onMouseUp = async (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        if (e.button === 0 && dragStartStep !== -1 && dragEndStep !== -1) {
            const startStep = Math.min(dragStartStep, dragEndStep);
            const endStep = dragStartStep === dragEndStep
                ? startStep + DEFAULT_PLAY_RANGE_SIZE
                : Math.max(dragStartStep, dragEndStep) + 1;

            setPlayRangeStart(startStep);
            setPlayRangeEnd(endStep);

            // reset
            setDragStartStep(-1);
            setDragEndStep(-1);
        }

        if (y < PIANO_ROLL_GRID_METER_HEIGHT) {
            if (e.button === 2) {
                setPlayRangeStart(-1);
                setPlayRangeEnd(-1);
            }
        } else {
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const step = Math.floor(x / pianoRollNoteWidth);
            // TODO: adapt drag to create pattern of specific size, as in sequencer
            setPatternAtCursorPosition(step * SUB_NOTE_RESOLUTION);
        }
    };

    const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (dragStartStep !== -1 && dragEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const step = Math.floor(x / pianoRollNoteWidth);

            if (step !== dragEndStep) {
                setDragEndStep(step);
            }
        }
    };

    useEffect(() => {
        draw();

        // TODO
        /*
        const watcher = services.themeService.onDidColorThemeChange(() => draw());
        return watcher.dispose();
        */
    }, [
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
                height={height}
                width={width}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                onMouseLeave={() => {
                    setDragStartStep(-1);
                    setDragEndStep(-1);
                }}
                ref={canvasRef}
            />
        </StyledPianoRollHeaderGridContainer>
    );
}
