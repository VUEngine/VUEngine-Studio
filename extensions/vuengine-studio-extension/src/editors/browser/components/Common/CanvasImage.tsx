/* eslint-disable no-null/no-null */
import React, { useEffect, useMemo, useRef } from 'react';
import { ColorMode, PALETTE_BIT_INDEX_MAP, PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import { DisplayMode } from './VUEngineTypes';

interface CanvasImageProps {
    height: number
    palette: string
    pixelData: (number | null)[][][]
    displayMode: DisplayMode
    parallaxDisplacement?: number
    width: number
    colorMode: ColorMode
    style?: object
    repeatX?: boolean
    repeatY?: boolean
    textColor?: string
    drawBlack?: boolean
}

export default function CanvasImage(props: CanvasImageProps): React.JSX.Element {
    const {
        height,
        palette,
        pixelData,
        displayMode,
        parallaxDisplacement,
        width,
        colorMode,
        style,
        repeatX,
        repeatY,
        textColor,
        drawBlack
    } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const effectiveParallaxDisplacement = displayMode === DisplayMode.Stereo ? (parallaxDisplacement ?? 0) : 0;

    const drawToCanvas = (context: CanvasRenderingContext2D, pixels: (number | null)[][]) => {
        if (pixels === undefined) {
            return;
        }

        const getEffectiveColorByPalette = (color: number) => {
            const paletteStartChar = ((3 - color) % 4) << 1;
            return PALETTE_BIT_INDEX_MAP[palette.substring(paletteStartChar, paletteStartChar + 2)];
        };
        const getColor = (color: number) =>
            PALETTE_COLORS[colorMode][color];

        [...Array(height)].map((h, y) => {
            [...Array(width)].map((w, x) => {
                if (
                    pixels[y] === undefined ||
                    pixels[y][x] === undefined ||
                    pixels[y][x] === null ||
                    (colorMode === ColorMode.FrameBlend && (
                        pixels[height + y] === undefined ||
                        pixels[height + y][x] === undefined
                    ))
                ) {
                    return;
                }

                const originalColorIndex = pixels[y][x];
                let effectiveColorByPalette = getEffectiveColorByPalette(originalColorIndex ?? 0);
                if (colorMode === ColorMode.FrameBlend) {
                    // for HiColor, find middle value of the two images (both are combined in one, over/under)
                    effectiveColorByPalette = (effectiveColorByPalette * 2 + getEffectiveColorByPalette(pixels[height + y][x]!) * 2) / 2;
                }

                // don't draw index 0; neither does the VB
                if (originalColorIndex === 0 && !drawBlack) {
                    return;
                }

                const fillColor = textColor ?? getColor(effectiveColorByPalette);

                context.fillStyle = fillColor;
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

        if (!width || !height || !totalWidth || !totalHeight) {
            return;
        }

        // create temporary canvas and pattern
        const pattern = document.createElement('canvas');
        pattern.width = width;
        pattern.height = height;
        const patternContext = pattern.getContext('2d');
        if (!pattern || !patternContext) {
            return;
        }
        drawToCanvas(patternContext, pixelData[0]);

        if (displayMode === DisplayMode.Stereo) {
            const leftImageData = patternContext.getImageData(0, 0, canvas.width, canvas.height);
            let rightImageData = leftImageData;

            // when there's image data for the right eye, ...
            if (pixelData[1]) {
                // create temporary canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
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
            patternContext.putImageData(leftImageData, 0, 0);
        }

        context.clearRect(0, 0, width, height);

        // create repeatable pattern
        const canvasPattern = patternContext.createPattern(pattern, 'repeat');
        context.rect(0, 0, totalWidth, totalHeight);
        context.fillStyle = canvasPattern as CanvasPattern;
        context.fill();
    };

    const totalHeight = useMemo(() => repeatY
        ? (Math.round(Math.round(10000 / height) / 2) * 2 + 1) * height
        : height
        , [
            height,
            repeatY
        ]);

    const totalWidth = useMemo(() => repeatX
        ? (Math.round(Math.round(10000 / width) / 2) * 2 + 1) * width
        : width
        , [
            width,
            repeatX
        ]);

    useEffect(() => {
        draw();
    }, [
        colorMode,
        displayMode,
        palette,
        parallaxDisplacement,
        pixelData,
        totalHeight,
        totalWidth,
    ]);

    return <canvas
        ref={canvasRef}
        height={totalHeight}
        width={totalWidth + Math.abs(effectiveParallaxDisplacement) * 2}
        style={{
            ...style,
            float: 'left', // fix top offset on small sprites
            imageRendering: 'pixelated',
            opacity: (repeatX || repeatY) ? .25 : undefined,
        }}
    />;
}
