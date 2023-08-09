import React from 'react';
import { PALETTE_COLORS } from '../../../../../core/browser/ves-common-types';
import { FontEditorState, VariableSize, win1252CharNames } from '../FontEditorTypes';

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
    setState: (state: Partial<FontEditorState>) => void
}

export default function AlphabetChar(props: AlphabetCharProps): JSX.Element {
    const {
        charData,
        charHeight, charWidth,
        line, index,
        offset, charCount,
        currentCharacter,
        variableSize,
        setState
    } = props;

    const classNames = ['character'];
    const character = (line * 16) + index;
    if (character < offset || character >= offset + charCount) {
        classNames.push('inactive');
    }
    if (character === currentCharacter) {
        classNames.push('active');
    }

    // TODO: try using CssImage for this
    const boxShadow: string[] = [];
    [...Array(charHeight)].map((h, y) => {
        if (!variableSize.enabled || y < variableSize.y) {
            [...Array(charWidth)].map((w, x) => {
                if (!variableSize.enabled || x < (variableSize.x[line * 16 + index] ?? charWidth)) {
                    const pixelSize = (charWidth > 16 || charHeight > 16) ? 1 : 2;
                    const color = charData && charData[y] && charData[y][x] ? charData[y][x] : 0;
                    const xPos = (x + 1) * pixelSize;
                    const yPos = (y + 1) * pixelSize;
                    boxShadow.push(
                        `${xPos}px ${yPos}px 0 0 ${PALETTE_COLORS[color]}`
                    );
                }
            });
        }
    });

    return <div
        className={classNames.join(' ')}
        title={win1252CharNames[character]}
        onClick={() => !classNames.includes('inactive') && setState({ currentCharacter: character })}
    >
        <div
            key={`character-pixels-${character}`}
            style={{
                boxShadow: boxShadow.join(',')
            }}
        ></div>
    </div>;
}
