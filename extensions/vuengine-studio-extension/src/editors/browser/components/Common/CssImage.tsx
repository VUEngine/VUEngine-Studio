import React from 'react';
import { PALETTE_COLORS, PALETTE_INDEX_MAPPING } from '../../../../core/browser/ves-common-types';

interface CssImageProps {
    height: number
    palette: string
    pixelData: number[][]
    pixelSize: number
    width: number
}

export default function CssImage(props: CssImageProps): React.JSX.Element {
    const { height, palette, pixelData, pixelSize, width } = props;

    const getBoxShadow = (): string[] => {
        const result: string[] = [];
        [...Array(height)].map((h, y) => {
            [...Array(width)].map((w, x) => {
                const color = pixelData[y][x];
                if (color === 0) {
                    return;
                }
                const xPos = (x + 1) * pixelSize;
                const yPos = (y + 1) * pixelSize;
                const paletteStartChar = ((3 - color) % 4) << 1;
                result.push(
                    `${xPos}px ${yPos}px 0 0 ${PALETTE_COLORS[PALETTE_INDEX_MAPPING[palette.substring(paletteStartChar, paletteStartChar + 2)]]}`
                );
            });
        });

        return result;
    };

    return <div
        style={{
            height: height * pixelSize,
            width: width * pixelSize,
        }}
    >
        <div
            style={{
                height: pixelSize,
                boxShadow: getBoxShadow().join(','),
                marginLeft: -pixelSize,
                marginTop: -pixelSize,
                width: pixelSize,
            }}
        ></div>
    </div>;
}
