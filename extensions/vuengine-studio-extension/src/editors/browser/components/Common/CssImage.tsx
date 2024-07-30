import React from 'react';
import { ColorMode, PALETTE_COLORS, PALETTE_BIT_INDEX_MAP } from '../../../../core/browser/ves-common-types';

interface CssImageProps {
    height: number
    palette: string
    pixelData: number[][]
    width: number
    style?: object
    useTextColor?: boolean
}

export default function CssImage(props: CssImageProps): React.JSX.Element {
    const { height, palette, pixelData, width, style, useTextColor } = props;

    const getBoxShadow = (): string[] => {
        const result: string[] = [];
        [...Array(height)].map((h, y) => {
            [...Array(width)].map((w, x) => {
                const color = pixelData[y][x];
                if (color === 0) {
                    return;
                }
                const xPos = (x + 1);
                const yPos = (y + 1);
                const paletteStartChar = ((3 - color) % 4) << 1;
                result.push(
                    `${xPos}px ${yPos}px 0 0 ${useTextColor === true
                        ? 'var(--theia-foreground)'
                        : PALETTE_COLORS[ColorMode.Default][PALETTE_BIT_INDEX_MAP[palette.substring(paletteStartChar, paletteStartChar + 2)]]
                    }`
                );
            });
        });

        return result;
    };

    return <div
        style={{
            ...style,
            height: height,
            width: width,
        }}
    >
        <div
            style={{
                height: 1,
                boxShadow: getBoxShadow().join(','),
                marginLeft: -1,
                marginTop: -1,
                width: 1,
            }}
        ></div>
    </div>;
}
