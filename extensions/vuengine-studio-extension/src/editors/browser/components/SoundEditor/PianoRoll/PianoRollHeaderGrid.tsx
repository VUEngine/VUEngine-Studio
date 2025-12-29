import React, { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    NOTE_RESOLUTION,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData,
    SUB_NOTE_RESOLUTION,
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
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number, createNew?: boolean) => void
    pianoRollScrollWindow: ScrollWindow
}

export default function PianoRollHeaderGrid(props: PianoRollHeaderGridProps): React.JSX.Element {
    const {
        soundData,
        // currentTrackId,
        // currentPatternId,
        // currentSequenceIndex,
        setCurrentPlayerPosition,
        pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
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
        /*
        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .2)`;
        context.beginPath();
        context.moveTo(0, PIANO_ROLL_GRID_METER_HEIGHT - 0.5);
        context.lineTo(w, PIANO_ROLL_GRID_METER_HEIGHT - 0.5);
        context.stroke();
        */

        // patterns
        /*
        const patternBackground = services.colorRegistry.getCurrentColor('secondaryButton.background')!;
        const patternForeground = services.colorRegistry.getCurrentColor('editor.foreground')!;
        const patternBackgroundHighlight = services.colorRegistry.getCurrentColor('focusBorder')!;
        const patternForegroundHighlight = '#fff';
        Object.keys(track.sequence).forEach(key => {
            const step = parseInt(key);
            const patternId = track.sequence[step];
            const pattern = soundData.patterns[patternId];
            if (!pattern) {
                return;
            }
            const xOffset = step * NOTE_RESOLUTION * pianoRollNoteWidth / SEQUENCER_RESOLUTION;
            const isSelected = patternId === currentPatternId && step === currentSequenceIndex;
            context.fillStyle = isSelected ? patternBackgroundHighlight : patternBackground;
            context.fillRect(
                xOffset + 1,
                PIANO_ROLL_GRID_METER_HEIGHT,
                pattern.size / SEQUENCER_RESOLUTION * NOTE_RESOLUTION * pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH - 2,
                PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - PIANO_ROLL_GRID_WIDTH - 1,
            );
            context.fillStyle = isSelected ? patternForegroundHighlight : patternForeground;
            context.fillText(getPatternName(soundData, patternId), xOffset + 4, PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 6);
        });
        */

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

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const step = Math.floor(x / pianoRollNoteWidth);

        if (y < PIANO_ROLL_GRID_METER_HEIGHT) {
            if (e.button === 0) {
                setCurrentPlayerPosition(prev => prev === step
                    ? -1
                    : step
                );
            } else {
                // TODO: set play range
            }
        } else {
            // TODO: adapt drag to create pattern of specific size, as in sequencer
            setPatternAtCursorPosition(step * SUB_NOTE_RESOLUTION, undefined, e.button === 0);
        }
    };

    useEffect(() => {
        // TODO: wrap in disposable
        // services.themeService.onDidColorThemeChange(() => draw());
        draw();
    }, [
        // currentTrackId,
        // currentPatternId,
        // currentSequenceIndex,
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
                onClick={onClick}
                onContextMenu={onClick}
                ref={canvasRef}
            />
        </StyledPianoRollHeaderGridContainer>
    );
}
