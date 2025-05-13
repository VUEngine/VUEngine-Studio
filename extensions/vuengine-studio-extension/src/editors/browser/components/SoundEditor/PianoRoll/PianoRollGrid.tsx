import chroma from 'chroma-js';
import React, { useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    NOTE_RESOLUTION,
    NOTES,
    NOTES_PER_OCTAVE,
    NOTES_SPECTRUM,
    PIANO_ROLL_NOTE_HEIGHT,
    PIANO_ROLL_NOTE_WIDTH,
    SoundData,
    SoundEvent
} from '../SoundEditorTypes';

interface PianoRollGridProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentTick: number
    setCurrentTick: (currentTick: number) => void
    setNote: (step: number, note?: number, prevStep?: number) => void
}

export default function PianoRollGrid(props: PianoRollGridProps): React.JSX.Element {
    const {
        soundData,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentTick, setCurrentTick,
        setNote,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const height = NOTES_SPECTRUM * PIANO_ROLL_NOTE_HEIGHT;
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

        const themeType = services.themeService.getCurrentTheme().type;
        const highContrastTheme = ['hc', 'hcLight'].includes(themeType);
        const c = ['light', 'hcLight'].includes(themeType) ? 0 : 255;
        const lowColor = highContrastTheme
            ? `rgba(${c}, ${c}, ${c}, 0)`
            : `rgba(${c}, ${c}, ${c}, .1)`;
        const medColor = highContrastTheme
            ? `rgba(${c}, ${c}, ${c}, 1)`
            : `rgba(${c}, ${c}, ${c}, .2)`;
        const hiColor = highContrastTheme
            ? `rgba(${c}, ${c}, ${c}, 1)`
            : `rgba(${c}, ${c}, ${c}, .4)`;

        const noteKeys = Object.keys(NOTES);

        context.strokeStyle = lowColor;
        context.lineWidth = 1;
        const w = canvas.width;
        const h = canvas.height;

        // non-current pattern notes
        soundData.channels.map((channel, index) => {
            Object.keys(channel.sequence).forEach(key => {
                if ((index === currentChannelId && currentSequenceIndex === parseInt(key)) ||
                    (index !== currentChannelId && !channel.seeThrough)
                ) {
                    return;
                }
                const patternOffset = parseInt(key);
                const patternId = channel.sequence[patternOffset];
                const pattern = soundData.patterns[patternId];
                if (!pattern) {
                    return;
                }
                Object.keys(pattern.events).map(stepStr => {
                    const step = parseInt(stepStr);
                    const note = pattern.events[step][SoundEvent.Note] ?? -1;
                    const noteDuration = pattern.events[step][SoundEvent.Duration] ?? 1;
                    // eslint-disable-next-line no-null/no-null
                    if (note !== undefined && note !== null && note > -1) {
                        context.fillStyle = patternId === currentPatternId
                            ? hiColor
                            : lowColor;
                        context.rect(
                            (patternOffset * NOTE_RESOLUTION + step) * PIANO_ROLL_NOTE_WIDTH,
                            note * PIANO_ROLL_NOTE_HEIGHT,
                            noteDuration * PIANO_ROLL_NOTE_WIDTH,
                            PIANO_ROLL_NOTE_HEIGHT,
                        );
                        context.fill();
                    }
                });
            });
        });

        // highlight current step
        if (!highContrastTheme) {
            context.fillStyle = lowColor;
            context.rect(
                currentTick * PIANO_ROLL_NOTE_WIDTH,
                0,
                PIANO_ROLL_NOTE_WIDTH,
                NOTES_SPECTRUM * PIANO_ROLL_NOTE_HEIGHT,
            );
            context.fill();
        }

        // vertical lines
        for (let x = 1; x <= soundData.size * NOTE_RESOLUTION; x++) {
            const offset = x * PIANO_ROLL_NOTE_WIDTH - 0.5;
            context.beginPath();
            context.moveTo(offset, 0);
            context.lineTo(offset, h);
            context.strokeStyle = x % NOTE_RESOLUTION === 0
                ? hiColor
                : x % 4 === 0
                    ? medColor
                    : lowColor;
            context.stroke();
        }

        // horizontal lines
        for (let y = 0; y < NOTES_SPECTRUM; y++) {
            const offset = y * PIANO_ROLL_NOTE_HEIGHT - 0.5;
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(w, offset);
            context.strokeStyle = y % NOTES_PER_OCTAVE === 0
                ? hiColor
                : medColor;
            context.stroke();

            // sharp note background
            // TODO: precompute look-up table?
            if (noteKeys[y].includes('#') && !highContrastTheme) {
                context.fillStyle = themeType === 'light'
                    ? `rgba(${c}, ${c}, ${c}, .05)`
                    : 'rgba(0, 0, 0, .2)';
                context.rect(
                    0,
                    offset,
                    width,
                    PIANO_ROLL_NOTE_HEIGHT,
                );
                context.fill();
            }
        }

        // highlight current pattern
        const currentPattern = soundData.patterns[currentPatternId];
        if (currentPattern) {
            const currentPatternSize = currentPattern.size;
            const highlightColor = services.colorRegistry.getCurrentColor('focusBorder') ?? 'red';
            const mutedHighlightColor = chroma(highlightColor).alpha(0.1).toString();
            context.fillStyle = mutedHighlightColor;
            context.rect(
                currentSequenceIndex * NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH - 0.5,
                0,
                currentPatternSize * NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH - 0.5,
                h,
            );
            context.fill();
        }
    };

    const setPatternAtStep = (step: number) => {
        const bar = Math.floor(step / NOTE_RESOLUTION);
        let stop = false;
        const currentChannel = soundData.channels[currentChannelId];
        Object.keys(currentChannel.sequence).reverse().map(bStr => {
            const b = parseInt(bStr);
            const patternId = currentChannel.sequence[b];
            const pattern = soundData.patterns[patternId];
            if (!stop && b <= bar && b + pattern.size > bar) {
                stop = true;
                setCurrentSequenceIndex(currentChannelId, b);
                setCurrentPatternId(currentChannelId, patternId);
            }
        });
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const noteId = Math.floor(y / PIANO_ROLL_NOTE_HEIGHT);
        const step = Math.floor(x / PIANO_ROLL_NOTE_WIDTH);

        if (e.button === 0) {
            const currentPattern = soundData.patterns[currentPatternId];
            const currentStep = currentSequenceIndex * NOTE_RESOLUTION;
            if (!currentPattern) {
                return;
            }
            // if inside current pattern
            if (step >= currentStep && step < currentStep + currentPattern.size * NOTE_RESOLUTION) {
                setNote(step - currentStep, noteId);
            } else {
                setPatternAtStep(step);
            }
        } else if (e.button === 2) {
            setCurrentTick(step);
        }
    };

    useEffect(() => {
        services.themeService.onDidColorThemeChange(() => draw());
    }, []);

    useEffect(() => {
        draw();
    }, [
        soundData.channels,
        soundData.size,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex,
        currentTick,
    ]);

    return (
        <canvas
            height={height}
            width={width}
            onMouseDown={onMouseDown}
            ref={canvasRef}
        />
    );
}
