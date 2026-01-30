import React, { MouseEvent, useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    EFFECTS_PANEL_COLLAPSED_HEIGHT,
    ScrollWindow,
    SoundData
} from '../SoundEditorTypes';

export const drawGrid = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    themeType: string,
    bars: number,
    noteWidth: number,
    scrollOffset: number,
    scrollWidth: number,
    stepsPerNote: number,
    stepsPerBar: number,
) => {
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
    for (let x = 1; x <= bars; x++) {
        const offsetElement = x * noteWidth;
        if (offsetElement < scrollOffset) {
            continue;
        }
        if (offsetElement > scrollOffset + scrollWidth) {
            break;
        }
        const offset = offsetElement - 0.5 - scrollOffset;
        context.beginPath();
        context.moveTo(offset, 0);
        context.lineTo(offset, h);
        context.strokeStyle = x % stepsPerBar === 0
            ? hiColor
            : x % stepsPerNote === 0
                ? medColor
                : lowColor;
        context.stroke();
    }
};

interface EffectsPanelGridOverviewProps {
    soundData: SoundData
    expandPanel: () => void
    pianoRollNoteWidth: number
    pianoRollScrollWindow: ScrollWindow
    stepsPerNote: number
    stepsPerBar: number
}

export default function EffectsPanelGridOverview(props: EffectsPanelGridOverviewProps): React.JSX.Element {
    const {
        soundData,
        expandPanel,
        pianoRollNoteWidth,
        pianoRollScrollWindow,
        stepsPerNote, stepsPerBar,
    } = props;
    const { currentThemeType } = useContext(EditorsContext) as EditorsContextType;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const width = Math.min(
        pianoRollScrollWindow.w,
        soundData.size * pianoRollNoteWidth
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

        scaleCanvasAccountForDpi(canvas, context, width, EFFECTS_PANEL_COLLAPSED_HEIGHT);
        drawGrid(canvas, context, currentThemeType, soundData.size, pianoRollNoteWidth, pianoRollScrollWindow.x, pianoRollScrollWindow.w, stepsPerNote, stepsPerBar);
    };

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        expandPanel();
    };

    useEffect(() => {
        draw();
    }, [
        currentThemeType,
        soundData,
        pianoRollNoteWidth,
        pianoRollScrollWindow.x,
        pianoRollScrollWindow.w,
    ]);

    return (
        <canvas
            height={EFFECTS_PANEL_COLLAPSED_HEIGHT}
            width={width}
            onMouseDown={onMouseDown}
            ref={canvasRef}
            style={{
                cursor: 'pointer',
            }}
        />
    );
}
