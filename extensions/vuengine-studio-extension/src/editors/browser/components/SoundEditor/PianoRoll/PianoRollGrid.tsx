import chroma from 'chroma-js';
import React, { useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    NOTE_RESOLUTION,
    NOTES,
    NOTES_PER_OCTAVE,
    NOTES_SPECTRUM,
    PIANO_ROLL_GRID_WIDTH,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';

interface PianoRollGridProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (noteCursor: number) => void
    setNote: (step: number, note?: number, prevStep?: number) => void
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
}

export default function PianoRollGrid(props: PianoRollGridProps): React.JSX.Element {
    const {
        soundData,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor, setNoteCursor,
        setNote,
        pianoRollNoteHeight, pianoRollNoteWidth,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const height = NOTES_SPECTRUM * pianoRollNoteHeight;
    const width = soundData.size * NOTE_RESOLUTION * pianoRollNoteWidth;

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
        // context.clearRect(0, 0, canvas.width, canvas.height);

        const themeType = services.themeService.getCurrentTheme().type;
        const highContrastTheme = ['hc', 'hcLight'].includes(themeType);
        const c = ['light', 'hcLight'].includes(themeType) ? 0 : 255;
        const fullColor = `rgba(${c}, ${c}, ${c}, 1)`;
        const lowColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .1)`;
        const medColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .2)`;
        const hiColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .4)`;

        const noteKeys = Object.keys(NOTES);

        context.strokeStyle = lowColor;
        context.lineWidth = PIANO_ROLL_GRID_WIDTH;
        const w = canvas.width;
        const h = canvas.height;

        // highlight current step
        if (!highContrastTheme) {
            context.fillStyle = lowColor;
            context.fillRect(
                noteCursor / SUB_NOTE_RESOLUTION * pianoRollNoteWidth,
                0,
                pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH,
                NOTES_SPECTRUM * pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
            );
        }

        // vertical lines
        for (let x = 1; x <= soundData.size * NOTE_RESOLUTION; x++) {
            const offset = x * pianoRollNoteWidth - 0.5;
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
            const offset = y * pianoRollNoteHeight - 0.5;
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
                context.fillRect(
                    0,
                    offset,
                    width - PIANO_ROLL_GRID_WIDTH,
                    pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
                );
            }
        }

        // highlight current pattern
        const currentPattern = soundData.patterns[currentPatternId];
        if (currentPattern) {
            const currentPatternSize = currentPattern.size;
            const highlightColor = services.colorRegistry.getCurrentColor('focusBorder') ?? 'red';
            const mutedHighlightColor = chroma(highlightColor).alpha(0.1).toString();
            context.fillStyle = mutedHighlightColor;
            context.fillRect(
                currentSequenceIndex * NOTE_RESOLUTION * pianoRollNoteWidth - 0.5,
                0,
                currentPatternSize * NOTE_RESOLUTION * pianoRollNoteWidth - 0.5,
                h,
            );
        }

        // non-current pattern notes
        soundData.channels.map((channel, channelId) => {
            Object.keys(channel.sequence).forEach(key => {
                if ((channelId === currentChannelId && currentSequenceIndex === parseInt(key)) ||
                    (channelId !== currentChannelId && !channel.seeThrough)
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
                        context.fillStyle = channelId === currentChannelId ? fullColor : medColor;
                        context.fillRect(
                            (patternOffset * NOTE_RESOLUTION + step / SUB_NOTE_RESOLUTION) * pianoRollNoteWidth,
                            note * pianoRollNoteHeight,
                            noteDuration * pianoRollNoteWidth / SUB_NOTE_RESOLUTION - PIANO_ROLL_GRID_WIDTH,
                            pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
                        );
                    }
                });
            });
        });
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const noteId = Math.floor(y / pianoRollNoteHeight);
        const step = Math.floor(x / pianoRollNoteWidth);

        if (e.button === 0) {
            const currentPattern = soundData.patterns[currentPatternId];
            const currentStep = currentSequenceIndex * NOTE_RESOLUTION;
            setNoteCursor(step * SUB_NOTE_RESOLUTION);
            // if inside current pattern
            if (currentPattern && step >= currentStep && step < currentStep + currentPattern.size * NOTE_RESOLUTION) {
                setNote((step - currentStep) * SUB_NOTE_RESOLUTION, noteId);
            } else {
                services.commandService.executeCommand(SoundEditorCommands.SELECT_PATTERN_AT_CURSOR_POSITION.id);
            }
        } else if (e.button === 2) {
            setNoteCursor(step * SUB_NOTE_RESOLUTION);
        }
    };

    useEffect(() => {
        services.themeService.onDidColorThemeChange(() => draw());
    }, []);

    /*
    useEffect(() => {
    */
    draw();
    /*
    }, [
        soundData.channels,
        soundData.size,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor,
        pianoRollNoteHeight,
        pianoRollNoteWidth,
    ]);
    */

    return (
        <canvas
            height={height}
            width={width}
            onClick={onClick}
            ref={canvasRef}
        />
    );
}
