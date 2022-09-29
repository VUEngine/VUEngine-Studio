import React from 'react';
import {
    CHAR_PIXEL_SIZE,
    DataSection,
    DEFAULT_CHAR_COUNT,
    DEFAULT_CHAR_SIZE,
    DEFAULT_OFFSET,
    DEFAULT_VARIABLE_CHAR_SIZE,
    DEFAULT_VARIABLE_SIZE_ENABLED,
    FontData,
    MAX_CHAR_COUNT,
    MAX_CHAR_SIZE,
    MAX_OFFSET,
    MAX_VARIABLE_CHAR_SIZE,
    MIN_CHAR_COUNT,
    MIN_CHAR_SIZE,
    MIN_OFFSET,
    MIN_VARIABLE_CHAR_SIZE,
    Size,
    VariableSize
} from '../types';
import Actions from './Tools/Actions';
import Alphabet from './Alphabet/Alphabet';
import AlphabetSettings from './Alphabet/AlphabetSettings';
import CharEditor from './CharEditor/CharEditor';
import CharSettings from './CharEditor/CharSettings';
import CurrentCharInfo from './Tools/CurrentCharInfo';
import ImportExport from './Tools/ImportExport';
import Palette from './Tools/Palette';
import Tools from './Tools/Tools';

interface FontEditorProps {
    fontData: FontData
    updateFontData: (fontData: FontData) => void
}

export default function FontEditor(props: FontEditorProps): JSX.Element {
    const { fontData, updateFontData } = props;

    const [clipboard, setClipboard] = React.useState<number[][] | undefined>();
    const [paletteIndexL, setPaletteIndexL] = React.useState<number>(3);
    const [paletteIndexR, setPaletteIndexR] = React.useState<number>(0);
    const [currentCharacter, setCurrentCharacter] = React.useState<number>(0);

    const pixelWidth = fontData.size.x * CHAR_PIXEL_SIZE;
    const pixelHeight = fontData.size.y * CHAR_PIXEL_SIZE;

    const validateFontData = (): void => {
        if (!fontData) {
            updateFontData({
                name: 'New',
                characters: [],
                characterCount: DEFAULT_CHAR_COUNT,
                offset: DEFAULT_OFFSET,
                size: {
                    x: DEFAULT_CHAR_SIZE,
                    y: DEFAULT_CHAR_SIZE
                },
                section: DataSection.ROM,
                variableSize: {
                    enabled: DEFAULT_VARIABLE_SIZE_ENABLED,
                    x: [],
                    y: DEFAULT_VARIABLE_CHAR_SIZE
                }
            });
        };

        if (!fontData.characterCount
            || !Number.isInteger(fontData.characterCount)
            || fontData.characterCount < MIN_CHAR_COUNT
            || fontData.characterCount > MAX_CHAR_COUNT) {
            fontData.characterCount = DEFAULT_CHAR_COUNT;
        }

        if (!fontData.offset
            || !Number.isInteger(fontData.offset)
            || fontData.offset < MIN_OFFSET
            || fontData.offset > MAX_OFFSET) {
            fontData.offset = DEFAULT_OFFSET;
        }

        if (!fontData.size) {
            fontData.size = {
                x: DEFAULT_CHAR_SIZE,
                y: DEFAULT_CHAR_SIZE
            };
        } else {
            if (!fontData.size.x
                || !Number.isInteger(fontData.size.x)
                || fontData.size.x < MIN_CHAR_SIZE
                || fontData.size.x > MAX_CHAR_SIZE) {
                fontData.size.x = DEFAULT_CHAR_SIZE;
            }
            if (!fontData.size.y
                || !Number.isInteger(fontData.size.y)
                || fontData.size.y < MIN_CHAR_SIZE
                || fontData.size.y > MAX_CHAR_SIZE) {
                fontData.size.y = DEFAULT_CHAR_SIZE;
            }
        }

        if (!fontData.variableSize) {
            fontData.variableSize = {
                enabled: DEFAULT_VARIABLE_SIZE_ENABLED,
                x: [],
                y: DEFAULT_VARIABLE_CHAR_SIZE
            };
        } else {
            if (fontData.variableSize.enabled === undefined
                || typeof fontData.variableSize.enabled !== 'boolean') {
                fontData.variableSize.enabled = DEFAULT_VARIABLE_SIZE_ENABLED;
            }
            if (!fontData.variableSize.y
                || fontData.variableSize.y < MIN_VARIABLE_CHAR_SIZE
                || fontData.variableSize.y > MAX_VARIABLE_CHAR_SIZE) {
                fontData.variableSize.y = DEFAULT_VARIABLE_CHAR_SIZE;
            }
        }

        const variableCharacterWidths: number[] = [];
        [...Array(MAX_CHAR_COUNT)].map((i, character) => {
            variableCharacterWidths.push(fontData.variableSize
                && fontData.variableSize.x[character]
                ? fontData.variableSize.x[character]
                : fontData.size.x * CHAR_PIXEL_SIZE);
        });
        fontData.variableSize.x = variableCharacterWidths;

        const characters: number[][][] = [];
        [...Array(MAX_CHAR_COUNT)].map((i, character) => {
            const charData: number[][] = [];
            [...Array(fontData.size.y * CHAR_PIXEL_SIZE)].map((j, y) => {
                const charLineData: number[] = [];
                [...Array(fontData.size.x * CHAR_PIXEL_SIZE)].map((k, x) => {
                    charLineData.push(fontData.characters
                        && fontData.characters[character]
                        && fontData.characters[character][y]
                        && fontData.characters[character][y][x]
                        ? fontData.characters[character][y][x]
                        : 0);
                });
                charData.push(charLineData);
            });
            characters.push(charData);
        });
        fontData.characters = characters;
    };

    const setCurrentCharacterData = (character: number[][]): void => {
        updateFontData({
            ...fontData,
            characters: {
                ...fontData.characters,
                [currentCharacter]: character
            }
        });
    };

    const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => updateFontData({
        ...fontData,
        name: e.target.value
    });

    const setCharCount = (charCount: number) => updateFontData({
        ...fontData,
        characterCount: charCount
    });

    const setOffset = (offset: number) => updateFontData({
        ...fontData,
        offset: offset
    });

    const setSection = (section: DataSection) => updateFontData({
        ...fontData,
        section: section
    });

    const setCharSize = (size?: Size, variableSize?: VariableSize): void => updateFontData({
        ...fontData,
        size: size ?? fontData.size,
        variableSize: variableSize ?? fontData.variableSize,
    });

    const setPixelColor = (x: number, y: number, color: number) =>
        updateFontData({
            ...fontData,
            characters: {
                ...fontData.characters,
                [currentCharacter]: {
                    ...fontData.characters[currentCharacter],
                    [y]: {
                        ...fontData.characters[currentCharacter][y],
                        [x]: color
                    }
                }
            }
        });

    validateFontData();

    return <div className={`font-editor width-${pixelWidth} height-${pixelHeight}`}>
        <div className='font-properties'>
            <div>
                <label>Name</label>
                <input
                    className="theia-input large"
                    value={fontData.name}
                    onChange={onChangeName}
                />
            </div>
        </div>
        <div className='editor'>
            <div className='tools-column'>
                <CurrentCharInfo
                    currentCharacter={currentCharacter}
                />
                <Palette
                    paletteIndexL={paletteIndexL}
                    setPaletteIndexL={setPaletteIndexL}
                    paletteIndexR={paletteIndexR}
                    setPaletteIndexR={setPaletteIndexR}
                />
                <Tools />
                <Actions
                    clipboard={clipboard}
                    setClipboard={setClipboard}
                    charHeight={pixelHeight}
                    charWidth={pixelWidth}
                    currentCharData={fontData.characters[currentCharacter]}
                    setCurrentCharData={setCurrentCharacterData}
                />
                <ImportExport />
            </div>
            <div className='editor-column'>
                <CharSettings
                    currentCharacter={currentCharacter}
                    charHeight={pixelHeight}
                    charWidth={pixelWidth}
                    variableSize={fontData.variableSize}
                    setCharSize={setCharSize}
                />
                <CharEditor
                    char={fontData.characters[currentCharacter]}
                    charId={currentCharacter}
                    charHeight={pixelHeight}
                    charWidth={pixelWidth}
                    variableSize={fontData.variableSize}
                    setPixelColor={setPixelColor}
                    paletteIndexL={paletteIndexL}
                    paletteIndexR={paletteIndexR}
                />
            </div>
            <div className='alphabet-column'>
                <AlphabetSettings
                    charCount={fontData.characterCount}
                    setCharCount={setCharCount}
                    offset={fontData.offset}
                    setOffset={setOffset}
                    section={fontData.section}
                    setSection={setSection}
                />
                <Alphabet
                    charsData={fontData.characters}
                    offset={fontData.offset}
                    charCount={fontData.characterCount}
                    charHeight={pixelHeight}
                    charWidth={pixelWidth}
                    currentCharacter={currentCharacter}
                    setCurrentCharacter={setCurrentCharacter}
                    variableSize={fontData.variableSize}
                />
            </div>
        </div>
    </div >;
}
