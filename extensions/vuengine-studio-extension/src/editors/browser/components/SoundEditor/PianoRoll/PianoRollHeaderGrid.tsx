import React, { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    NOTE_RESOLUTION,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_NOTE_WIDTH,
    SoundData
} from '../SoundEditorTypes';

const StyledPianoRollHeaderGridContainer = styled.div`
    height: ${PIANO_ROLL_GRID_METER_HEIGHT}px;
    position: relative;
`;

interface PianoRollHeaderGridProps {
    soundData: SoundData
    currentPatternNoteOffset: number
    setCurrentStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollHeaderGrid(props: PianoRollHeaderGridProps): React.JSX.Element {
    const {
        soundData,
        currentPatternNoteOffset,
        setCurrentStep,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const height = PIANO_ROLL_GRID_METER_HEIGHT;
    const width = soundData.size * NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH;

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
        for (let x = 1; x <= soundData.size; x++) {
            const offset = x * NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH - 0.5;
            context.beginPath();
            context.moveTo(offset, 0);
            context.lineTo(offset, h);
            context.stroke();

            // meter numbers
            context.fillText(x.toString(), offset - (NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH) + 4, 12);
        }

        // bottom line
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .6)`;
        context.beginPath();
        context.moveTo(0, PIANO_ROLL_GRID_METER_HEIGHT - 0.5);
        context.lineTo(w, PIANO_ROLL_GRID_METER_HEIGHT - 0.5);
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
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const step = Math.floor(x / PIANO_ROLL_NOTE_WIDTH);

        if (e.button === 0) {
            setCurrentStep(prev => prev === currentPatternNoteOffset + step
                ? -1
                : currentPatternNoteOffset + step
            );
        } else if (e.button === 2) {
            // TODO
        }
    };

    useEffect(() => {
        services.themeService.onDidColorThemeChange(() => draw());
    }, []);

    useEffect(() => {
        draw();
    }, [
        soundData.size,
    ]);

    return (
        <StyledPianoRollHeaderGridContainer>
            <canvas
                height={height}
                width={width}
                onMouseDown={onMouseDown}
                ref={canvasRef}
            />
        </StyledPianoRollHeaderGridContainer>
    );
}
