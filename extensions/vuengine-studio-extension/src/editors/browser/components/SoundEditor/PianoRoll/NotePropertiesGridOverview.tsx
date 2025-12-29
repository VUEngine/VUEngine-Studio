import React, { useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    EFFECTS_PANEL_COLLAPSED_HEIGHT,
    NOTE_RESOLUTION,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData
} from '../SoundEditorTypes';

export const drawGrid = (
    canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, themeType: string, bars: number, noteWidth: number, scrollOffset: number, scrollWidth: number
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
    for (let x = 1; x <= bars * NOTE_RESOLUTION; x++) {
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
        context.strokeStyle = x % NOTE_RESOLUTION === 0
            ? hiColor
            : x % 4 === 0
                ? medColor
                : lowColor;
        context.stroke();
    }
};

interface NotePropertiesGridOverviewProps {
    soundData: SoundData
    expandPanel: () => void
    pianoRollNoteWidth: number
    pianoRollScrollWindow: ScrollWindow
}

export default function NotePropertiesGridOverview(props: NotePropertiesGridOverviewProps): React.JSX.Element {
    const {
        soundData,
        expandPanel,
        pianoRollNoteWidth,
        pianoRollScrollWindow,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
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
        const themeType = services.themeService.getCurrentTheme().type;

        scaleCanvasAccountForDpi(canvas, context, width, EFFECTS_PANEL_COLLAPSED_HEIGHT);
        drawGrid(canvas, context, themeType, songLength, pianoRollNoteWidth, pianoRollScrollWindow.x, pianoRollScrollWindow.w);
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        expandPanel();
    };

    useEffect(() => {
        // TODO: wrap in disposable
        // services.themeService.onDidColorThemeChange(() => draw());

        draw();
    }, [
        soundData.tracks,
        songLength,
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
