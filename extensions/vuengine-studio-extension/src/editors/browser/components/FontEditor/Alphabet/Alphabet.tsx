import React from 'react';
import { FontEditorState, MAX_CHAR_COUNT, VariableSize } from '../FontEditorTypes';
import AlphabetChar from './AlphabetChar';

interface AlphabetProps {
    charsData: number[][][]
    offset: number
    charCount: number
    charHeight: number
    charWidth: number
    currentCharacter: number
    variableSize: VariableSize
    alphabetGrid: number
    setState: (state: Partial<FontEditorState>) => void
}

export default function Alphabet(props: AlphabetProps): JSX.Element {
    const {
        charsData,
        charHeight, charWidth,
        offset, charCount,
        currentCharacter,
        variableSize,
        alphabetGrid,
        setState,
    } = props;

    return <div className={`characters markers grid-${alphabetGrid}`}>
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
                            variableSize={variableSize}
                            setState={setState}
                        />;
                    })}
                </div>
            ))
        }
    </div >;
}
