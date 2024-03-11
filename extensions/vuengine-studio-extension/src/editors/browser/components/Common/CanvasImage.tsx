import React, { useEffect, useRef } from 'react';
import { ColorMode, PALETTE_COLORS, PALETTE_INDEX_MAPPING } from '../../../../core/browser/ves-common-types';
import { DisplayMode } from './VUEngineTypes';

interface CanvasImageProps {
    height: number
    palette: string
    pixelData: number[][][]
    displayMode: DisplayMode
    parallaxDisplacement: number
    width: number
    style?: object
    useTextColor?: boolean
}

export default function CanvasImage(props: CanvasImageProps): React.JSX.Element {
    const { height, palette, pixelData, displayMode, parallaxDisplacement, width, style, useTextColor } = props;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const effectiveParallaxDisplacement = displayMode === DisplayMode.Stereo ? parallaxDisplacement : 0;

    const drawToCanvas = (context: CanvasRenderingContext2D, pixels: number[][]) => {
        [...Array(height)].map((h, y) => {
            [...Array(width)].map((w, x) => {
                const color = pixels[y][x];
                if (color === 0) {
                    return;
                }
                const paletteStartChar = ((3 - color) % 4) << 1;
                context.fillStyle = useTextColor === true
                    ? 'var(--theia-foreground)'
                    : PALETTE_COLORS[ColorMode.Default][PALETTE_INDEX_MAPPING[palette.substring(paletteStartChar, paletteStartChar + 2)]];
                context.fillRect(x + Math.abs(effectiveParallaxDisplacement) - effectiveParallaxDisplacement, y, 1, 1);
            });
        });
    };

    const draw = (): void => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) {
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        drawToCanvas(context, pixelData[0]);

        if (displayMode === DisplayMode.Stereo) {
            const leftImageData = context.getImageData(0, 0, canvas.width, canvas.height);
            let rightImageData = leftImageData;

            // when there's image data for the right eye, ...
            if (pixelData[1]) {
                // create temporary canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCanvasContext = tempCanvas.getContext('2d');
                if (!tempCanvasContext) {
                    return;
                }

                // draw right eye image to temporary canvas
                drawToCanvas(tempCanvasContext, pixelData[1]);

                rightImageData = tempCanvasContext.getImageData(0, 0, canvas.width, canvas.height);
            }

            // convert to anaglyph
            //  2 -> -4
            // -2 -> 4
            const rightImageParallaxOffset = 2 * effectiveParallaxDisplacement;
            for (let x = 0; x < canvas.width * canvas.height; x++) {
                // write red color channel value of right image data to blue color channel of left image data
                leftImageData.data[x * 4 + 2] = rightImageData.data[(x - rightImageParallaxOffset) * 4 + 0];
                if (rightImageData.data[(x - rightImageParallaxOffset) * 4 + 3] > 0) {
                    leftImageData.data[x * 4 + 3] = 255;
                }
            };
            context.putImageData(leftImageData, 0, 0);
        }
    };

    useEffect(() => {
        draw();
    }, [
        displayMode,
        height,
        palette,
        parallaxDisplacement,
        pixelData,
        width,
    ]);

    return <div style={style}>
        <canvas
            ref={canvasRef}
            height={height}
            width={width + Math.abs(effectiveParallaxDisplacement) * 2}
            style={{
                imageRendering: 'pixelated'
            }}
        />
    </div>;
}
