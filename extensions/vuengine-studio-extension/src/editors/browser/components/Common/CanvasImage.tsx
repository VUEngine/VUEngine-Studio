import React, { useEffect, useRef } from 'react';
import { ColorMode, PALETTE_COLORS, PALETTE_INDEX_MAPPING } from '../../../../core/browser/ves-common-types';

interface CanvasImageProps {
    height: number
    palette: string
    pixelData: number[][]
    width: number
    style?: object
    useTextColor?: boolean
}

export default function CanvasImage(props: CanvasImageProps): React.JSX.Element {
    const { height, palette, pixelData, width, style, useTextColor } = props;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = (): void => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        [...Array(height)].map((h, y) => {
            [...Array(width)].map((w, x) => {
                const color = pixelData[y][x];
                if (color === 0) {
                    return;
                }
                const paletteStartChar = ((3 - color) % 4) << 1;
                context.fillStyle = useTextColor === true
                    ? 'var(--theia-foreground)'
                    : PALETTE_COLORS[ColorMode.Default][PALETTE_INDEX_MAPPING[palette.substring(paletteStartChar, paletteStartChar + 2)]];
                context.fillRect(x, y, 1, 1);
            });
        });

    };

    useEffect(() => {
        draw();
    }, [
        pixelData
    ]);

    return <div
        style={{
            ...style,
            height: height,
            width: width,
        }}
    >
        <canvas
            ref={canvasRef}
            height={height}
            width={width}
            style={{
                imageRendering: 'pixelated'
            }}
        />
    </div>;
}
