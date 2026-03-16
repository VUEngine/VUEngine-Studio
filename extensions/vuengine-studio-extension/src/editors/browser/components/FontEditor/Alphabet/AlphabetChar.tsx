import React, { useMemo } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import CanvasImage from '../../Common/CanvasImage';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { VariableSize } from '../FontEditorTypes';

interface AlphabetCharProps {
    index: number
    charData: number[][]
    offset: number
    charCount: number
    charHeight: number
    charWidth: number
    currentCharacterIndex: number
    setCurrentCharacterIndex: (currentCharacter: number) => void
    setCurrentCharacterHoverIndex: React.Dispatch<React.SetStateAction<number>>
    variableSize: VariableSize
}

export default function AlphabetChar(props: AlphabetCharProps): React.JSX.Element {
    const {
        charData,
        charHeight, charWidth,
        index,
        offset, charCount,
        currentCharacterIndex, setCurrentCharacterIndex: setCurrentCharacter, setCurrentCharacterHoverIndex,
        variableSize,
    } = props;

    const classNames = ['character'];
    if (index < offset || index >= offset + charCount) {
        classNames.push('inactive');
    }
    if (index === currentCharacterIndex) {
        classNames.push('active');
    }

    const pixeldata = useMemo(() => {
        const result: number[][] = [];
        [...Array(charHeight)].map((h, y) => {
            const resultRow: number[] = [];
            if (!variableSize.enabled || y < variableSize.y) {
                [...Array(charWidth)].map((w, x) => {
                    if (!variableSize.enabled || x < (variableSize.x[index] ?? charWidth)) {
                        const color = charData && charData[y] && charData[y][x] ? charData[y][x] : 0;
                        resultRow.push(color);
                    }
                });
            }
            result.push(resultRow);
        });
        return result;
    }, [
        charData,
        charHeight, charWidth,
        index,
        variableSize,
    ]);

    return <div
        className={classNames.join(' ')}
        onClick={() => !classNames.includes('inactive') && setCurrentCharacter(index)}
        onMouseOver={() => setCurrentCharacterHoverIndex(index)}
        onMouseOut={() => setCurrentCharacterHoverIndex(-1)}
    >
        <CanvasImage
            height={charHeight}
            palette={'11100100'}
            pixelData={[pixeldata]}
            style={{
                zoom: charWidth === 8 && charHeight <= 16 || charHeight === 8 && charWidth <= 16
                    ? 2
                    : undefined
            }}
            width={charWidth}
            displayMode={DisplayMode.Mono}
            colorMode={ColorMode.Default}
        />
    </div>;
}
