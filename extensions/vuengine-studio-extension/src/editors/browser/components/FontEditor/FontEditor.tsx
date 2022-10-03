import { nls } from '@theia/core';
import React from 'react';
import Alphabet from './Alphabet/Alphabet';
import AlphabetSettings from './Alphabet/AlphabetSettings';
import CharEditor from './CharEditor/CharEditor';
import CharSettings from './CharEditor/CharSettings';
import {
    CHAR_PIXEL_SIZE,
    DataSection,
    DEFAULT_CHAR_COUNT,
    DEFAULT_CHAR_SIZE,
    DEFAULT_OFFSET,
    DEFAULT_VARIABLE_CHAR_SIZE,
    DEFAULT_VARIABLE_SIZE_ENABLED,
    FontData,
    FontEditorState,
    FontEditorTools,
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
} from './FontEditorTypes';
import Actions from './Tools/Actions';
import CurrentCharInfo from './Tools/CurrentCharInfo';
import Palette from './Tools/Palette';
import Tools from './Tools/Tools';

interface FontEditorProps {
    fontData: FontData
    updateFontData: (fontData: FontData) => void
}

export default class FontEditor extends React.Component<FontEditorProps, FontEditorState> {
    constructor(props: FontEditorProps) {
        super(props);
        this.state = {
            active: true,
            tool: FontEditorTools.PENCIL,
            clipboard: undefined,
            paletteIndexL: 3,
            paletteIndexR: 0,
            currentCharacter: this.props.fontData.offset,
            charGrid: 1,
            alphabetGrid: 1
        };

        document.addEventListener('keydown', this.keyEventListerner.bind(this));
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keyEventListerner);
    }

    protected keyEventListerner(e: KeyboardEvent): void {
        if (this.state.active && document.activeElement?.tagName !== 'INPUT') {
            const { characterCount, offset } = this.props.fontData;
            const { currentCharacter } = this.state;

            switch (e.key) {
                case 'ArrowDown':
                    this.setState({
                        currentCharacter: currentCharacter + 16 < offset + characterCount
                            ? currentCharacter + 16
                            : currentCharacter
                    });
                    break;
                case 'ArrowLeft':
                    this.setState({
                        currentCharacter: currentCharacter > offset
                            ? currentCharacter - 1
                            : currentCharacter
                    });
                    break;
                case 'ArrowRight':
                    this.setState({
                        currentCharacter: currentCharacter + 1 < offset + characterCount
                            ? currentCharacter + 1
                            : currentCharacter
                    });
                    break;
                case 'ArrowUp':
                    this.setState({
                        currentCharacter: currentCharacter - 16 >= offset
                            ? currentCharacter - 16
                            : currentCharacter
                    });
                    break;
                case '1':
                    this.setState({ paletteIndexL: 0 });
                    break;
                case '2':
                    this.setState({ paletteIndexL: 1 });
                    break;
                case '3':
                    this.setState({ paletteIndexL: 2 });
                    break;
                case '4':
                    this.setState({ paletteIndexL: 3 });
                    break;
            }
        }
    }

    protected validateFontData(): void {
        if (!this.props.fontData) {
            this.props.updateFontData({
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

        if (!this.props.fontData.characterCount
            || !Number.isInteger(this.props.fontData.characterCount)
            || this.props.fontData.characterCount < MIN_CHAR_COUNT
            || this.props.fontData.characterCount > MAX_CHAR_COUNT) {
            this.props.fontData.characterCount = DEFAULT_CHAR_COUNT;
        }

        if (!this.props.fontData.offset
            || !Number.isInteger(this.props.fontData.offset)
            || this.props.fontData.offset < MIN_OFFSET
            || this.props.fontData.offset > MAX_OFFSET) {
            this.props.fontData.offset = DEFAULT_OFFSET;
        }

        if (!this.props.fontData.size) {
            this.props.fontData.size = {
                x: DEFAULT_CHAR_SIZE,
                y: DEFAULT_CHAR_SIZE
            };
        } else {
            if (!this.props.fontData.size.x
                || !Number.isInteger(this.props.fontData.size.x)
                || this.props.fontData.size.x < MIN_CHAR_SIZE
                || this.props.fontData.size.x > MAX_CHAR_SIZE) {
                this.props.fontData.size.x = DEFAULT_CHAR_SIZE;
            }
            if (!this.props.fontData.size.y
                || !Number.isInteger(this.props.fontData.size.y)
                || this.props.fontData.size.y < MIN_CHAR_SIZE
                || this.props.fontData.size.y > MAX_CHAR_SIZE) {
                this.props.fontData.size.y = DEFAULT_CHAR_SIZE;
            }
        }

        if (!this.props.fontData.variableSize) {
            this.props.fontData.variableSize = {
                enabled: DEFAULT_VARIABLE_SIZE_ENABLED,
                x: [],
                y: DEFAULT_VARIABLE_CHAR_SIZE
            };
        } else {
            if (this.props.fontData.variableSize.enabled === undefined
                || typeof this.props.fontData.variableSize.enabled !== 'boolean') {
                this.props.fontData.variableSize.enabled = DEFAULT_VARIABLE_SIZE_ENABLED;
            }
            if (!this.props.fontData.variableSize.y
                || this.props.fontData.variableSize.y < MIN_VARIABLE_CHAR_SIZE
                || this.props.fontData.variableSize.y > MAX_VARIABLE_CHAR_SIZE) {
                this.props.fontData.variableSize.y = DEFAULT_VARIABLE_CHAR_SIZE;
            }
        }

        const variableCharacterWidths: number[] = [];
        [...Array(MAX_CHAR_COUNT)].map((i, character) => {
            variableCharacterWidths.push(this.props.fontData.variableSize
                && this.props.fontData.variableSize.x[character]
                ? this.props.fontData.variableSize.x[character]
                : this.props.fontData.size.x * CHAR_PIXEL_SIZE);
        });
        this.props.fontData.variableSize.x = variableCharacterWidths;

        const characters: number[][][] = [];
        [...Array(MAX_CHAR_COUNT)].map((i, character) => {
            const charData: number[][] = [];
            [...Array(this.props.fontData.size.y * CHAR_PIXEL_SIZE)].map((j, y) => {
                const charLineData: number[] = [];
                [...Array(this.props.fontData.size.x * CHAR_PIXEL_SIZE)].map((k, x) => {
                    charLineData.push(this.props.fontData.characters
                        && this.props.fontData.characters[character]
                        && this.props.fontData.characters[character][y]
                        && this.props.fontData.characters[character][y][x]
                        ? this.props.fontData.characters[character][y][x]
                        : 0);
                });
                charData.push(charLineData);
            });
            characters.push(charData);
        });
        this.props.fontData.characters = characters;
    };

    protected setCurrentCharacterData(character: number[][]): void {
        this.props.updateFontData({
            ...this.props.fontData,
            characters: {
                ...this.props.fontData.characters,
                [this.state.currentCharacter]: character
            }
        });
    };

    protected onChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateFontData({
            ...this.props.fontData,
            name: e.target.value
        });
    }

    protected setCharCount(charCount: number): void {
        this.props.updateFontData({
            ...this.props.fontData,
            characterCount: charCount
        });
    }

    protected setOffset(offset: number): void {
        this.props.updateFontData({
            ...this.props.fontData,
            offset: offset
        });
    }

    protected setSection(section: DataSection): void {
        this.props.updateFontData({
            ...this.props.fontData,
            section: section
        });
    }

    protected setCharSize(size?: Size, variableSize?: VariableSize): void {
        this.props.updateFontData({
            ...this.props.fontData,
            size: size ?? this.props.fontData.size,
            variableSize: variableSize ?? this.props.fontData.variableSize,
        });
    }

    protected clickPixel(x: number, y: number, color: number): void {
        switch (this.state.tool) {
            case FontEditorTools.PENCIL:
                this.setPixelColor(x, y, color);
                break;
            case FontEditorTools.FILL:
                if (this.props.fontData.characters[this.state.currentCharacter][y][x] !== color) {
                    this.setCurrentCharacterData(this.fill(
                        this.props.fontData.characters[this.state.currentCharacter],
                        x,
                        y,
                        this.props.fontData.characters[this.state.currentCharacter][y][x],
                        color
                    ));
                }
                break;
            case FontEditorTools.FILL_ALL:
                this.fillAll(x, y, color);
                break;
        }
    }

    protected setPixelColor(x: number, y: number, color: number): void {
        this.props.updateFontData({
            ...this.props.fontData,
            characters: {
                ...this.props.fontData.characters,
                [this.state.currentCharacter]: {
                    ...this.props.fontData.characters[this.state.currentCharacter],
                    [y]: {
                        ...this.props.fontData.characters[this.state.currentCharacter][y],
                        [x]: color
                    }
                }
            }
        });
    }

    protected fillAll(x: number, y: number, color: number): void {
        const oldColor = this.props.fontData.characters[this.state.currentCharacter][y][x];
        if (oldColor !== color) {
            this.setCurrentCharacterData(this.props.fontData.characters[this.state.currentCharacter].map(line =>
                line.map(c => c === oldColor ? color : c
                )));
        }
    }

    protected fill(char: number[][], x: number, y: number, oldColor: number, newColor: number): number[][] {
        if (x >= 0 && y >= 0
            && x < this.props.fontData.size.x * CHAR_PIXEL_SIZE
            && y < this.props.fontData.size.y * CHAR_PIXEL_SIZE
            && char[y][x] === oldColor) {
            char[y][x] = newColor;
            char = this.fill(char, x, y + 1, oldColor, newColor);
            char = this.fill(char, x, y - 1, oldColor, newColor);
            char = this.fill(char, x + 1, y, oldColor, newColor);
            char = this.fill(char, x - 1, y, oldColor, newColor);
        }

        return char;
    }

    render(): JSX.Element {
        const { fontData } = this.props;

        this.validateFontData();

        const pixelWidth = fontData.size.x * CHAR_PIXEL_SIZE;
        const pixelHeight = fontData.size.y * CHAR_PIXEL_SIZE;

        return <div
            tabIndex={0}
            className={`font-editor width-${pixelWidth} height-${pixelHeight}`}
            onFocus={() => this.setState({ active: true })}
            onBlur={() => this.setState({ active: false })}
            onMouseOver={() => this.setState({ active: true })}
            onMouseOut={() => this.setState({ active: false })}
        >
            <div className='font-properties'>
                <div>
                    <label>
                        {nls.localize('vuengine/fontEditor/name', 'Name')}
                    </label>
                    <input
                        className="theia-input large"
                        value={fontData.name}
                        onChange={this.onChangeName.bind(this)}
                    />
                </div>
            </div>
            <div className='editor'>
                <div className='tools-column'>
                    <CurrentCharInfo
                        currentCharacter={this.state.currentCharacter}
                    />
                    <Palette
                        paletteIndexL={this.state.paletteIndexL}
                        paletteIndexR={this.state.paletteIndexR}
                        setState={this.setState.bind(this)}
                    />
                    <Tools
                        tool={this.state.tool}
                        setState={this.setState.bind(this)}
                    />
                    <Actions
                        clipboard={this.state.clipboard}
                        charHeight={pixelHeight}
                        charWidth={pixelWidth}
                        currentCharData={fontData.characters[this.state.currentCharacter]}
                        setCurrentCharData={this.setCurrentCharacterData.bind(this)}
                        setState={this.setState.bind(this)}
                    />
                    {/*
                <ImportExport />
                 */}
                </div>
                <div className='editor-column'>
                    <CharSettings
                        currentCharacter={this.state.currentCharacter}
                        charHeight={pixelHeight}
                        charWidth={pixelWidth}
                        variableSize={fontData.variableSize}
                        setCharSize={this.setCharSize.bind(this)}
                        charGrid={this.state.charGrid}
                        setState={this.setState.bind(this)}
                    />
                    <CharEditor
                        char={fontData.characters[this.state.currentCharacter]}
                        charId={this.state.currentCharacter}
                        charHeight={pixelHeight}
                        charWidth={pixelWidth}
                        variableSize={fontData.variableSize}
                        clickPixel={this.clickPixel.bind(this)}
                        paletteIndexL={this.state.paletteIndexL}
                        paletteIndexR={this.state.paletteIndexR}
                        charGrid={this.state.charGrid}
                    />
                </div>
                <div className='alphabet-column'>
                    <AlphabetSettings
                        charCount={fontData.characterCount}
                        setCharCount={this.setCharCount.bind(this)}
                        offset={fontData.offset}
                        setOffset={this.setOffset.bind(this)}
                        section={fontData.section}
                        setSection={this.setSection.bind(this)}
                        alphabetGrid={this.state.alphabetGrid}
                        setState={this.setState.bind(this)}
                    />
                    <Alphabet
                        charsData={fontData.characters}
                        offset={fontData.offset}
                        charCount={fontData.characterCount}
                        charHeight={pixelHeight}
                        charWidth={pixelWidth}
                        currentCharacter={this.state.currentCharacter}
                        variableSize={fontData.variableSize}
                        alphabetGrid={this.state.alphabetGrid}
                        setState={this.setState.bind(this)}
                    />
                </div>
            </div>
        </div >;
    }
}
