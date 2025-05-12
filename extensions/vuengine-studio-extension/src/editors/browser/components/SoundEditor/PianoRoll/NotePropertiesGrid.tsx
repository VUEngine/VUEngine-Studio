import React, { useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    EFFECTS_PANEL_EXPANDED_HEIGHT,
    NOTE_RESOLUTION,
    PIANO_ROLL_NOTE_WIDTH,
    SoundData
} from '../SoundEditorTypes';

interface NotePropertiesGridProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentTick: number
    setCurrentTick: (currentTick: number) => void
    setNote: (step: number, note?: number, duration?: number, prevStep?: number) => void
}

export default function NotePropertiesGrid(props: NotePropertiesGridProps): React.JSX.Element {
    const {
        soundData,
        currentChannelId,
        currentPatternId, // setCurrentPatternId,
        currentSequenceIndex, // setCurrentSequenceIndex,
        currentTick, setCurrentTick,
        // setNote,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

        scaleCanvasAccountForDpi(canvas, context, width, EFFECTS_PANEL_EXPANDED_HEIGHT);

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

        context.strokeStyle = lowColor;
        context.lineWidth = 1;
        const h = canvas.height;

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
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const step = Math.floor(x / PIANO_ROLL_NOTE_WIDTH);

        if (e.button === 0) {
            // TODO
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
            height={EFFECTS_PANEL_EXPANDED_HEIGHT}
            width={width}
            onMouseDown={onMouseDown}
            ref={canvasRef}
        />
    );
}
