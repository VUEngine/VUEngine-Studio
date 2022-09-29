import React from 'react';
import { PALETTE_COLORS, VariableSize, win1252CharNames } from '../types';

interface AlphabetCharProps {
    line: number
    index: number
    charData: number[][]
    offset: number
    charCount: number
    charHeight: number
    charWidth: number
    currentCharacter: number
    variableSize: VariableSize
    setCurrentCharacter: (id: number) => void
}

export default function AlphabetChar(props: AlphabetCharProps): JSX.Element {
    const {
        charData,
        charHeight, charWidth,
        line, index,
        offset, charCount,
        currentCharacter, setCurrentCharacter,
        variableSize
    } = props;

    const classNames = ['character'];
    const character = (line * 16) + index;
    if (character < offset || character >= offset + charCount) {
        classNames.push('inactive');
    }
    if (character === currentCharacter) {
        classNames.push('active');
    }

    const boxShadow: string[] = [];
    [...Array(charHeight)].map((h, y) => {
        if (!variableSize.enabled || y < variableSize.y) {
            [...Array(charWidth)].map((w, x) => {
                if (!variableSize.enabled || x < variableSize.x[line * 16 + index]) {
                    const pixelSize = (charWidth > 16 || charHeight > 16) ? 1 : 2;
                    const color = charData[y][x];
                    boxShadow.push(
                        `${(x + 1) * pixelSize}px ${(y + 1) * pixelSize}px 0 0 ${PALETTE_COLORS[color]}`
                    );
                }
            });
        }
    });

    return <div
        className={classNames.join(' ')}
        title={win1252CharNames[character]}
        onClick={() => !classNames.includes('inactive') && setCurrentCharacter(character)}
    >
        <div
            key={`character-pixels-${character}`}
            style={{
                boxShadow: boxShadow.join(',')
            }}
        ></div>
    </div>;
}
