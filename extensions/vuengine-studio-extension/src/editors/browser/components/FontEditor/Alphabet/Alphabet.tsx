import { nls } from '@theia/core';
import React, { useEffect, useState } from 'react';
import VContainer from '../../Common/VContainer';
import { VariableSize } from '../FontEditorTypes';
import AlphabetChar from './AlphabetChar';

interface AlphabetProps {
    charsData: number[][][]
    offset: number
    charCount: number
    charWidth: number
    charHeight: number
    currentCharacterIndex: number
    setCurrentCharacterIndex: (currentCharacter: number) => void
    setCurrentCharacterHoverIndex: React.Dispatch<React.SetStateAction<number>>
    variableSize: VariableSize
}

export default function Alphabet(props: AlphabetProps): React.JSX.Element {
    const {
        charsData,
        charHeight, charWidth,
        offset, charCount,
        currentCharacterIndex, setCurrentCharacterIndex: setCurrentCharacter, setCurrentCharacterHoverIndex,
        variableSize,
    } = props;
    const [controlCharacters, setControlCharacters] = useState<React.JSX.Element>();
    const [asciiCharacters, setAsciiCharacters] = useState<React.JSX.Element>();
    const [extendedCharacters, setExtendedCharacters] = useState<React.JSX.Element>();

    const getCharacters = (count: number, start: number) => <>
        {[...Array(count)].map((i, x) => {
            const character = start + x;
            return <AlphabetChar
                key={`character-${character}`}
                index={character}
                charData={charsData[character]}
                offset={offset}
                charCount={charCount}
                charHeight={charHeight}
                charWidth={charWidth}
                currentCharacterIndex={currentCharacterIndex}
                setCurrentCharacterIndex={setCurrentCharacter}
                setCurrentCharacterHoverIndex={setCurrentCharacterHoverIndex}
                variableSize={variableSize}
            />;
        })}
    </>;

    useEffect(() => {
        setControlCharacters(getCharacters(32, 0));
        setAsciiCharacters(getCharacters(96, 32));
        setExtendedCharacters(getCharacters(128, 128));
    }, [
        charsData,
        charHeight, charWidth,
        offset, charCount,
        currentCharacterIndex,
        variableSize,
    ]);

    return (
        <VContainer grow={1} overflow='hidden'>
            <label>
                {nls.localize('vuengine/fontEditor/alphabet', 'Alphabet')}
            </label>
            <VContainer style={{
                overflowX: 'hidden',
                overflowY: 'auto',
            }}>
                {controlCharacters &&
                    <div className="characters">
                        {controlCharacters && controlCharacters}
                    </div>
                }
                {asciiCharacters &&
                    <div className="characters">
                        {asciiCharacters && asciiCharacters}
                    </div>
                }
                {extendedCharacters &&
                    <div className="characters">
                        {extendedCharacters}
                    </div>
                }
            </VContainer>
        </VContainer>
    );
}
