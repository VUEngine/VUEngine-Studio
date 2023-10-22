import React from 'react';
import { VariableSize } from '../FontEditorTypes';
import CharEditorPixel from './CharEditorPixel';

interface CharEditorProps {
    char: number[][],
    charId: number,
    charHeight: number,
    charWidth: number,
    variableSize: VariableSize,
    paletteIndexL: number,
    paletteIndexR: number,
    clickPixel: (x: number, y: number, color: number) => void,
    charGrid: number
}

export default function CharEditor(props: CharEditorProps): React.JSX.Element {
    const {
        char,
        charId,
        charHeight, charWidth,
        variableSize,
        clickPixel,
        paletteIndexL, paletteIndexR,
        charGrid
    } = props;

    return <div className={`current-character markers grid-${charGrid}`}>
        {
            [...Array(charHeight)].map((h, y) => (
                <div
                    key={`current-line-${y}`}
                    className={variableSize.enabled && y >= variableSize.y ? 'line inactive' : 'line'}
                >
                    {[...Array(charWidth)].map((w, x) => <CharEditorPixel
                        key={`current-pixel-${y}-${x}`}
                        x={x}
                        y={y}
                        pixelColor={char && char[y] && char[y][x] ? char[y][x] : 0}
                        clickPixel={clickPixel}
                        paletteIndexL={paletteIndexL}
                        paletteIndexR={paletteIndexR}
                        active={!variableSize.enabled || x < (variableSize.x[charId] ?? charWidth)}
                    />)}
                </div>)
            )
        }
    </div>;
}
