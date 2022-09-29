import React from 'react';
import { VariableSize } from '../types';
import CharEditorPixel from './CharEditorPixel';

interface CharEditorProps {
    char: number[][],
    charId: number,
    charHeight: number,
    charWidth: number,
    variableSize: VariableSize,
    paletteIndexL: number,
    paletteIndexR: number,
    setPixelColor: (x: number, y: number, color: number) => void,
}

export default function CharEditor(props: CharEditorProps): JSX.Element {
    const {
        char,
        charId,
        charHeight, charWidth,
        variableSize,
        setPixelColor,
        paletteIndexL, paletteIndexR,
    } = props;

    return <div className='current-character'>
        {[...Array(charHeight)].map((h, y) => (
            <div
                key={`current-line-${y}`}
                className={variableSize.enabled && y >= variableSize.y ? 'line inactive' : 'line'}
            >
                {[...Array(charWidth)].map((w, x) => <CharEditorPixel
                    key={`current-pixel-${y}-${x}`}
                    x={x}
                    y={y}
                    pixelColor={char[y][x]}
                    setPixelColor={setPixelColor}
                    paletteIndexL={paletteIndexL}
                    paletteIndexR={paletteIndexR}
                    active={!variableSize.enabled || x < variableSize.x[charId]}
                />)}
            </div>)
        )}
    </div>;
}
