import React from 'react';
import { PALETTE_COLORS } from '../../../../core/browser/ves-common-types';

interface CssImageProps {
    height: number
    palette: number[]
    pixelData: number[][]
    pixelSize: number
    width: number
}

export default function CssImage(props: CssImageProps): React.JSX.Element {
    const { height, palette, pixelData, pixelSize, width } = props;

    const boxShadow: string[] = [];
    [...Array(height)].map((h, y) => {
        [...Array(width)].map((w, x) => {
            const color = pixelData[y][x];
            if (color === 0) {
                return;
            }
            const xPos = (x + 1) * pixelSize;
            const yPos = (y + 1) * pixelSize;
            boxShadow.push(
                `${xPos}px ${yPos}px 0 0 ${PALETTE_COLORS[palette[color - 1]]}`
            );
        });
    });

    return <div
        style={{
            height: height * pixelSize,
            width: width * pixelSize,
        }}
    >
        <div
            style={{
                height: pixelSize,
                boxShadow: boxShadow.join(','),
                marginLeft: -pixelSize,
                marginTop: -pixelSize,
                width: pixelSize,
            }}
        ></div>
    </div>;
}
