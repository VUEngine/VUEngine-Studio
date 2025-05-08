import React, { SyntheticEvent, useContext, useEffect, useRef } from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import {
    MAX_PATTERN_SIZE,
    MIN_PATTERN_SIZE,
    NOTE_RESOLUTION,
    NOTES_PER_OCTAVE,
    NOTES_SPECTRUM,
    PIANO_ROLL_NOTE_HEIGHT,
    PIANO_ROLL_NOTE_WIDTH,
    SoundData,
} from '../SoundEditorTypes';

const StyledPianoRollGridContainer = styled.div`
    height: ${NOTES_SPECTRUM * PIANO_ROLL_NOTE_HEIGHT}px;
    position: relative;
    user-select: none;

    .react-resizable {
        canvas {
            cursor: crosshair;
            position: relative;
            z-index: 10;
        }
    }

    .react-resizable-handle {
        align-items: center;
        border: 1px solid rgba(255, 255, 255, .2);
        bottom: -1px;
        cursor: col-resize;
        display: flex;
        justify-content: center;
        position: absolute;
        right: -22px;
        top: -2px;
        width: 16px;

        body.theia-light &,
        body.theia-hc & {
            border: 1px solid rgba(0, 0, 0, .2);
        }

        &:before {
            color: rgba(255, 255, 255, .2);
            content: '\\ea99';
            font: normal normal normal 11px / 1 codicon;
            text-rendering: auto;

            body.theia-light &,
            body.theia-hc & {
                color: rgba(0, 0, 0, .2);
            }
        }

        &:focus,
        &:hover {
            background-color: var(--theia-focusBorder);
            border-color: var(--theia-focusBorder);

            &:before {
                color: #fff !important;
            }
        }
    }

    &.min {
        .react-resizable-handle {
            cursor: e-resize;

            &:before {
                content: '\\ea9c';
            }
        }
    }

    &.max {
        .react-resizable-handle {
            cursor: w-resize;

            &:before {
                content: '\\ea9b';
            }
        }
    }
`;

interface PianoRollGridProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentChannelId: number
    currentPatternId: number
    currentTick: number
    setCurrentTick: (currentTick: number) => void
    setNote: (step: number, note?: number, duration?: number, prevStep?: number) => void
}

export default function PianoRollGrid(props: PianoRollGridProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentChannelId, currentPatternId,
        currentTick, setCurrentTick,
        setNote,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const channel = soundData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    const height = NOTES_SPECTRUM * PIANO_ROLL_NOTE_HEIGHT;
    const width = pattern.size * NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH;

    const setSize = (size: number): void => {
        if (size <= MAX_PATTERN_SIZE && size >= MIN_PATTERN_SIZE) {
            const updatedSoundData = { ...soundData };
            updatedSoundData.channels[currentChannelId].patterns[currentPatternId].size = size;
            updateSoundData(updatedSoundData);
        }
    };

    const accountForDPI = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const dpr = window.devicePixelRatio ?? 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        context.scale(dpr, dpr);

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    };

    const draw = (): void => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const c = services.themeService.getCurrentTheme().type === 'light' ? 0 : 255;

        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .1)`;
        context.lineWidth = 1;
        const w = canvas.width;
        const h = canvas.height;

        // highlight current step
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .1)`;
        context.rect(
            currentTick * PIANO_ROLL_NOTE_WIDTH,
            0,
            PIANO_ROLL_NOTE_WIDTH,
            height,
        );
        context.fill();

        // vertical lines
        for (let x = 1; x <= pattern.size * NOTE_RESOLUTION; x++) {
            const offset = x * PIANO_ROLL_NOTE_WIDTH - 0.5;
            context.beginPath();
            context.moveTo(offset, 0);
            context.lineTo(offset, h);
            context.strokeStyle = x % NOTE_RESOLUTION === 0
                ? `rgba(${c}, ${c}, ${c}, .4)`
                : x % 4 === 0
                    ? `rgba(${c}, ${c}, ${c}, .2)`
                    : `rgba(${c}, ${c}, ${c}, .1)`;
            context.stroke();
        }

        // horizontal lines
        for (let y = 0; y < NOTES_SPECTRUM; y++) {
            const offset = y * PIANO_ROLL_NOTE_HEIGHT - 0.5;
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(w, offset);
            context.strokeStyle = y % NOTES_PER_OCTAVE === 0
                ? `rgba(${c}, ${c}, ${c}, .4)`
                : `rgba(${c}, ${c}, ${c}, .2)`;
            context.stroke();
        }
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.floor(data.size.width / (PIANO_ROLL_NOTE_WIDTH * NOTE_RESOLUTION));
        setSize(newSize);
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const noteId = Math.floor(y / PIANO_ROLL_NOTE_HEIGHT);
        const step = Math.floor(x / PIANO_ROLL_NOTE_WIDTH);

        if (e.button === 0) {
            setNote(step, noteId);
        } else if (e.button === 2) {
            setCurrentTick(step);
        }
    };

    const classNames = [];
    if (pattern.size === MIN_PATTERN_SIZE) {
        classNames.push('min');
    } else if (pattern.size === MAX_PATTERN_SIZE) {
        classNames.push('max');
    }

    useEffect(() => {
        services.themeService.onDidColorThemeChange(() => draw());
    }, []);

    useEffect(() => {
        accountForDPI();
        draw();
    }, [
        pattern.size,
        currentTick,
    ]);

    return (
        <StyledPianoRollGridContainer className={classNames.join(' ')}>
            <ResizableBox
                width={width}
                height={height}
                draggableOpts={{
                    grid: [PIANO_ROLL_NOTE_WIDTH * NOTE_RESOLUTION, PIANO_ROLL_NOTE_HEIGHT]
                }}
                axis="x"
                minConstraints={[PIANO_ROLL_NOTE_WIDTH * NOTE_RESOLUTION * MIN_PATTERN_SIZE, PIANO_ROLL_NOTE_HEIGHT]}
                maxConstraints={[PIANO_ROLL_NOTE_WIDTH * NOTE_RESOLUTION * MAX_PATTERN_SIZE, PIANO_ROLL_NOTE_HEIGHT]}
                resizeHandles={['e']}
                onResize={onResize}
            >
                <canvas
                    height={height}
                    width={width}
                    onMouseDown={onMouseDown}
                    ref={canvasRef}
                />
            </ResizableBox>
        </StyledPianoRollGridContainer>
    );
}
