import React, { useMemo } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import CanvasImage from '../../Common/CanvasImage';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { VariableSize } from '../FontEditorTypes';

interface AlphabetCharProps {
    index: number
    tileData: number[][]
    offset: number
    tileCount: number
    tileHeight: number
    tileWidth: number
    currentCharacterIndex: number
    setCurrentCharacterIndex: (currentCharacter: number) => void
    setCurrentCharacterHoverIndex: React.Dispatch<React.SetStateAction<number>>
    variableSize: VariableSize
}

export default function AlphabetChar(props: AlphabetCharProps): React.JSX.Element {
    const {
        tileData,
        tileHeight, tileWidth,
        index,
        offset, tileCount,
        currentCharacterIndex, setCurrentCharacterIndex: setCurrentCharacter, setCurrentCharacterHoverIndex,
        variableSize,
    } = props;

    const classNames = ['character'];
    if (index < offset || index >= offset + tileCount) {
        classNames.push('inactive');
    }
    if (index === currentCharacterIndex) {
        classNames.push('active');
    }

    const pixeldata = useMemo(() => {
        const result: number[][] = [];
        [...Array(tileHeight)].map((h, y) => {
            const resultRow: number[] = [];
            if (!variableSize.enabled || y < variableSize.y) {
                [...Array(tileWidth)].map((w, x) => {
                    if (!variableSize.enabled || x < (variableSize.x[index] ?? tileWidth)) {
                        const color = tileData && tileData[y] && tileData[y][x] ? tileData[y][x] : 0;
                        resultRow.push(color);
                    }
                });
            }
            result.push(resultRow);
        });
        return result;
    }, [
        tileData,
        tileHeight, tileWidth,
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
            height={tileHeight}
            palette={'11100100'}
            pixelData={[pixeldata]}
            style={{
                zoom: tileWidth === 8 && tileHeight <= 16 || tileHeight === 8 && tileWidth <= 16
                    ? 2
                    : undefined
            }}
            width={tileWidth}
            displayMode={DisplayMode.Mono}
            colorMode={ColorMode.Default}
        />
    </div>;
}
