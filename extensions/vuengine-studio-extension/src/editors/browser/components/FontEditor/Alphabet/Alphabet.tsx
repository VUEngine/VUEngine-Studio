import React from 'react';
import { MAX_CHAR_COUNT, VariableSize } from '../FontEditorTypes';
import AlphabetChar from './AlphabetChar';

interface AlphabetProps {
    charsData: number[][][]
    offset: number
    charCount: number
    charHeight: number
    charWidth: number
    currentCharacter: number
    variableSize: VariableSize
    setCurrentCharacter: (id: number) => void
    alphabetGrid: number
}

export default function Alphabet(props: AlphabetProps): JSX.Element {
    const {
        charsData,
        charHeight, charWidth,
        offset, charCount,
        currentCharacter, setCurrentCharacter,
        variableSize,
        alphabetGrid,
    } = props;

    return <div className={`characters grid-${alphabetGrid}`} >
        {
            [...Array(16)].map((i, line) => (
                <div key={`characters-line-${line}`} className="line">
                    {[...Array(MAX_CHAR_COUNT / 16)].map((j, index) => {
                        const character = (line * 16) + index;
                        return <AlphabetChar
                            key={`character-${character}`}
                            line={line}
                            index={index}
                            charData={charsData[character]}
                            offset={offset}
                            charCount={charCount}
                            charHeight={charHeight}
                            charWidth={charWidth}
                            currentCharacter={currentCharacter}
                            setCurrentCharacter={setCurrentCharacter}
                            variableSize={variableSize}
                        />;
                    })}
                </div>
            ))
        }
    </div >;
}
