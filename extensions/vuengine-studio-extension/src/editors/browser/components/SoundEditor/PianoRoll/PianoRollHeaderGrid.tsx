import React, { Dispatch, MouseEvent, SetStateAction, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import { getPatternName } from '../SoundEditor';
import {
    DEFAULT_PLAY_RANGE_SIZE,
    NOTE_RESOLUTION,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_GRID_WIDTH,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';

const StyledPianoRollHeaderGridContainer = styled.div`
    height: ${PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT}px;
    position: relative;
`;

interface PianoRollHeaderGridProps {
    soundData: SoundData
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
    setPatternAtCursorPosition: (cursor?: number, size?: number) => Promise<void>
    pianoRollScrollWindow: ScrollWindow
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    removePatternFromSequence: (trackId: number, step: number) => void
    rangeDragStartStep: number
    setRangeDragStartStep: Dispatch<SetStateAction<number>>
    rangeDragEndStep: number
    setRangeDragEndStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollHeaderGrid(props: PianoRollHeaderGridProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId, currentPatternId, currentSequenceIndex,
        setCurrentPlayerPosition,
        setForcePlayerRomRebuild,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        // setPatternDialogOpen,
        // removePatternFromSequence,
        rangeDragStartStep, setRangeDragStartStep,
        rangeDragEndStep, setRangeDragEndStep,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
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

        const c = currentThemeType === 'light' ? 0 : 255;

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

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;

            if (y < PIANO_ROLL_GRID_METER_HEIGHT) {
                const x = e.clientX - rect.left + pianoRollScrollWindow.x;
                const step = Math.floor(x / pianoRollNoteWidth);
                if (e.button === 0) {
                    setRangeDragStartStep(step);
                    setRangeDragEndStep(step);
                    setPlayRangeStart(-1);
                    setPlayRangeEnd(-1);
                }
            }
        }
    };

    const onMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
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

            // reset
            setRangeDragStartStep(-1);
            setRangeDragEndStep(-1);
        }

        if (y < PIANO_ROLL_GRID_METER_HEIGHT) {
            if (e.button === 2) {
                if (playRangeStart !== -1 && playRangeEnd !== -1) {
                    setPlayRangeStart(-1);
                    setPlayRangeEnd(-1);
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

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (rangeDragStartStep !== -1 && rangeDragEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const step = Math.floor(x / pianoRollNoteWidth);

            if (step !== rangeDragEndStep) {
                setRangeDragEndStep(step);
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
                height={height}
                width={width}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                onMouseLeave={() => {
                    // setRangeDragStartStep(-1);
                    // setRangeDragEndStep(-1);
                }}
                ref={canvasRef}
            />
        </StyledPianoRollHeaderGridContainer>
    );
}
