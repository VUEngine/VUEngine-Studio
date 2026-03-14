import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { FontEditorCommands } from '../FontEditorCommands';
import { VariableSize } from '../FontEditorTypes';
import AlphabetChar from './AlphabetChar';

interface AlphabetProps {
    tilesData: number[][][]
    offset: number
    tileCount: number
    tileWidth: number
    tileHeight: number
    currentCharacterIndex: number
    setCurrentCharacterIndex: (currentCharacter: number) => void
    setCurrentCharacterHoverIndex: React.Dispatch<React.SetStateAction<number>>
    variableSize: VariableSize
}

export default function Alphabet(props: AlphabetProps): React.JSX.Element {
    const {
        tilesData,
        tileHeight, tileWidth,
        offset, tileCount,
        currentCharacterIndex, setCurrentCharacterIndex, setCurrentCharacterHoverIndex,
        variableSize,
    } = props;
    const { onCommandExecute } = useContext(EditorsContext) as EditorsContextType;
    const [controlCharacters, setControlCharacters] = useState<React.JSX.Element>();
    const [asciiCharacters, setAsciiCharacters] = useState<React.JSX.Element>();
    const [extendedCharacters, setExtendedCharacters] = useState<React.JSX.Element>();

    const getCharacters = (count: number, start: number) => <>
        {[...Array(count)].map((i, x) => {
            const character = start + x;
            return <AlphabetChar
                key={`character-${character}`}
                index={character}
                tileData={tilesData[character]}
                offset={offset}
                tileCount={tileCount}
                tileHeight={tileHeight}
                tileWidth={tileWidth}
                currentCharacterIndex={currentCharacterIndex}
                setCurrentCharacterIndex={setCurrentCharacterIndex}
                setCurrentCharacterHoverIndex={setCurrentCharacterHoverIndex}
                variableSize={variableSize}
            />;
        })}
    </>;

    const commandListener = (commandId: string): void => {
        switch (commandId) {
            case FontEditorCommands.ALPHABET_NAVIGATE_LINE_DOWN.id:
                setCurrentCharacterIndex(currentCharacterIndex + 16 < offset + tileCount
                    ? currentCharacterIndex + 16
                    : currentCharacterIndex);
                break;
            case FontEditorCommands.ALPHABET_NAVIGATE_PREV_TILE.id:
                setCurrentCharacterIndex(currentCharacterIndex > offset
                    ? currentCharacterIndex - 1
                    : currentCharacterIndex);
                break;
            case FontEditorCommands.ALPHABET_NAVIGATE_NEXT_TILE.id:
                setCurrentCharacterIndex(currentCharacterIndex + 1 < offset + tileCount
                    ? currentCharacterIndex + 1
                    : currentCharacterIndex);
                break;
            case FontEditorCommands.ALPHABET_NAVIGATE_LINE_UP.id:
                setCurrentCharacterIndex(currentCharacterIndex - 16 >= offset
                    ? currentCharacterIndex - 16
                    : currentCharacterIndex);
                break;
        }
    };

    useEffect(() => {
        setControlCharacters(getCharacters(32, 0));
        setAsciiCharacters(getCharacters(96, 32));
        setExtendedCharacters(getCharacters(128, 128));
    }, [
        tilesData,
        tileHeight, tileWidth,
        offset, tileCount,
        currentCharacterIndex,
        variableSize,
    ]);

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, [
        offset,
        tileCount,
        currentCharacterIndex,
        setCurrentCharacterIndex,
    ]);

    return (
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
    );
}
