import React, { useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    EFFECTS_PANEL_COLLAPSED_HEIGHT,
    NOTE_RESOLUTION,
    PIANO_ROLL_NOTE_WIDTH,
    SoundData
} from '../SoundEditorTypes';

export const drawGrid = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, themeType: string, bars: number) => {
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

interface NotePropertiesGridOverviewProps {
    soundData: SoundData
    expandPanel: () => void
}

export default function NotePropertiesGridOverview(props: NotePropertiesGridOverviewProps): React.JSX.Element {
    const {
        soundData,
        expandPanel,
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
        const themeType = services.themeService.getCurrentTheme().type;

        scaleCanvasAccountForDpi(canvas, context, width, EFFECTS_PANEL_COLLAPSED_HEIGHT);
        drawGrid(canvas, context, themeType, soundData.size);
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        expandPanel();
    };

    useEffect(() => {
        services.themeService.onDidColorThemeChange(() => draw());
    }, []);

    useEffect(() => {
        draw();
    }, [
        soundData.channels,
        soundData.size,
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
