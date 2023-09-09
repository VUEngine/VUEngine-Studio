import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import { ImageConverterCompressor } from '../../../../image-converter/browser/ves-image-converter-types';
import Alphabet from './Alphabet/Alphabet';
import AlphabetSettings from './Alphabet/AlphabetSettings';
import CharEditor from './CharEditor/CharEditor';
import CharSettings from './CharEditor/CharSettings';
import {
    CHAR_PIXEL_SIZE,
    DataSection, FontData,
    FontEditorState,
    FontEditorTools, Size,
    VariableSize
} from './FontEditorTypes';
import Actions from './Tools/Actions';
import CurrentCharInfo from './Tools/CurrentCharInfo';
import ImportExport from './Tools/ImportExport';
import Palette from './Tools/Palette';
import Tools from './Tools/Tools';

interface FontEditorProps {
    fontData: FontData
    updateFontData: (fontData: FontData) => void
    services: {
        fileService: FileService,
        fileDialogService: FileDialogService,
    }
}

@injectable()
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

    protected setCurrentCharacterData(character: number[][]): void {
        const updatedCharacters = this.props.fontData.characters ?? [];
        updatedCharacters[this.state.currentCharacter] = character;
        this.props.updateFontData({
            ...this.props.fontData,
            characters: updatedCharacters
        });
    };

    protected onChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateFontData({
            ...this.props.fontData,
            name: e.target.value.trim()
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
    protected setCompression(compression: ImageConverterCompressor): void {
        this.props.updateFontData({
            ...this.props.fontData,
            compression: compression
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
                const currentColor = this.props.fontData.characters[this.state.currentCharacter]
                    && this.props.fontData.characters[this.state.currentCharacter][y]
                    ? this.props.fontData.characters[this.state.currentCharacter][y][x] ?? 0
                    : 0;
                if (currentColor !== color) {
                    this.setCurrentCharacterData(this.fill(
                        this.props.fontData.characters[this.state.currentCharacter] ?? [],
                        x,
                        y,
                        currentColor,
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
        const updatedCharacters = [...this.props.fontData.characters];
        if (!updatedCharacters[this.state.currentCharacter]) {
            updatedCharacters[this.state.currentCharacter] = [];
        }
        if (!updatedCharacters[this.state.currentCharacter][y]) {
            updatedCharacters[this.state.currentCharacter][y] = [];
        }
        updatedCharacters[this.state.currentCharacter][y][x] = color;

        this.props.updateFontData({
            ...this.props.fontData,
            characters: updatedCharacters
        });
    }

    protected fillAll(x: number, y: number, color: number): void {
        const oldColor = this.props.fontData.characters[this.state.currentCharacter]
            && this.props.fontData.characters[this.state.currentCharacter][y]
            && this.props.fontData.characters[this.state.currentCharacter][y][x]
            ? this.props.fontData.characters[this.state.currentCharacter][y][x]
            : 0;
        if (oldColor !== color) {
            const updatedCharacter = this.props.fontData.characters[this.state.currentCharacter] ?? [];
            [...Array(this.props.fontData.size.y * CHAR_PIXEL_SIZE)].map((j, sy) => {
                if (!updatedCharacter[sy]) {
                    updatedCharacter[sy] = [];
                }
                [...Array(this.props.fontData.size.x * CHAR_PIXEL_SIZE)].map((k, sx) => {
                    // eslint-disable-next-line no-null/no-null
                    if (updatedCharacter[sy][sx] === null
                        || updatedCharacter[sy][sx] === undefined
                        || updatedCharacter[sy][sx] === oldColor) {
                        updatedCharacter[sy][sx] = color;
                    }
                });
            });

            this.setCurrentCharacterData(updatedCharacter);
        }
    }

    protected fill(char: number[][], x: number, y: number, oldColor: number, newColor: number): number[][] {
        const charColor = char && char[y] ? char[y][x] ?? 0 : 0;
        if (x >= 0 && y >= 0
            && x < this.props.fontData.size.x * CHAR_PIXEL_SIZE
            && y < this.props.fontData.size.y * CHAR_PIXEL_SIZE
            && charColor === oldColor) {
            if (!char[y]) {
                char[y] = [];
            }
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
            <div className='font-properties'>
                <div>
                    <label>
                        {nls.localize('vuengine/fontEditor/compression', 'Compression')}
                    </label>
                    <select
                        className='theia-select'
                        onChange={e => this.setCompression(e.target.value as ImageConverterCompressor)}
                        value={fontData.compression}
                    >
                        <option value='none'>{nls.localize('vuengine/fontEditor/none', 'None')}</option>
                        <option value='rle'>RLE</option>
                    </select>
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
                    <ImportExport
                        fileDialogService={this.props.services.fileDialogService}
                        fileService={this.props.services.fileService}
                    />
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
        </div>;
    }
}
