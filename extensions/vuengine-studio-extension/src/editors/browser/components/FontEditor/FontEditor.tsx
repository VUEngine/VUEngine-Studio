import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import React from 'react';
import { ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { EditorsContextType } from '../../ves-editors-types';
import { DataSection } from '../Common/CommonTypes';
import HContainer from '../Common/HContainer';
import InfoLabel from '../Common/InfoLabel';
import RadioSelect from '../Common/RadioSelect';
import SectionSelect from '../Common/SectionSelect';
import VContainer from '../Common/VContainer';
import Alphabet from './Alphabet/Alphabet';
import AlphabetSettings from './Alphabet/AlphabetSettings';
import CharEditor from './CharEditor/CharEditor';
import CharSettings from './CharEditor/CharSettings';
import {
    CHAR_PIXEL_SIZE,
    FontData,
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
    data: FontData
    updateData: (data: FontData) => void
    context: EditorsContextType
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
            currentCharacter: this.props.data.offset,
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
            const { characterCount, offset } = this.props.data;
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

    protected removeTrailingNullsAndZeroesFromArray = (arr: any[]): any[] | null => {
        // eslint-disable-next-line no-null/no-null
        if (arr === null) {
            return arr;
        }

        let toDelete = 0;
        for (let c = arr.length - 1; c >= 0; c--) {
            // eslint-disable-next-line no-null/no-null
            if (arr[c] === null || arr[c] === 0) {
                toDelete++;
            } else {
                break;
            }
        }
        arr.splice(arr.length - toDelete, toDelete);

        // eslint-disable-next-line no-null/no-null
        return arr.length ? arr : null;
    };

    protected optimizeFontData = (fontData: FontData): FontData => {
        // @ts-ignore
        // eslint-disable-next-line no-null/no-null
        fontData.characters = fontData.characters === null ? null :
            this.removeTrailingNullsAndZeroesFromArray(fontData.characters.map(character =>
                // eslint-disable-next-line no-null/no-null
                character === null ? null :
                    this.removeTrailingNullsAndZeroesFromArray(character.map(line =>
                        this.removeTrailingNullsAndZeroesFromArray(line)
                    ))));

        return fontData;
    };

    protected updateFontData(partialFontData: Partial<FontData>): void {
        this.props.updateData(
            this.optimizeFontData({
                ...this.props.data,
                ...partialFontData,
            })
        );
    };

    protected setCurrentCharacterData(character: number[][]): void {
        const characters = [...(this.props.data.characters || [])];
        characters[this.state.currentCharacter] = character;
        this.updateFontData({ characters });
    };

    protected setCharCount(characterCount: number): void {
        this.updateFontData({ characterCount });
    }

    protected setOffset(offset: number): void {
        this.updateFontData({ offset });
    }

    protected setSection(section: DataSection): void {
        this.updateFontData({ section });
    }
    protected setCompression(compression: ImageCompressionType): void {
        this.updateFontData({ compression });
    }

    protected setCharSize(size?: Size, variableSize?: VariableSize): void {
        this.updateFontData({
            size: size ?? this.props.data.size,
            variableSize: variableSize ?? this.props.data.variableSize,
        });
    }

    protected clickPixel(x: number, y: number, color: number): void {
        switch (this.state.tool) {
            case FontEditorTools.PENCIL:
                this.setPixelColor(x, y, color);
                break;
            case FontEditorTools.FILL:
                const characters = this.props.data.characters || [];
                const currentColor = characters[this.state.currentCharacter]
                    && characters[this.state.currentCharacter][y]
                    ? characters[this.state.currentCharacter][y][x] ?? 0
                    : 0;
                if (currentColor !== color) {
                    this.setCurrentCharacterData(this.fill(
                        characters[this.state.currentCharacter] ?? [],
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

    protected setCharacters(characters: number[][][]): void {
        this.updateFontData({ characters });
    }

    protected setPixelColor(x: number, y: number, color: number): void {
        const characters = [...this.props.data.characters];
        if (!characters[this.state.currentCharacter]) {
            characters[this.state.currentCharacter] = [];
        }
        if (!characters[this.state.currentCharacter][y]) {
            characters[this.state.currentCharacter][y] = [];
        }
        characters[this.state.currentCharacter][y][x] = color;

        this.updateFontData({ characters });
    }

    protected fillAll(x: number, y: number, color: number): void {
        const characters = this.props.data.characters;
        const oldColor = characters[this.state.currentCharacter]
            && characters[this.state.currentCharacter][y]
            && characters[this.state.currentCharacter][y][x]
            ? characters[this.state.currentCharacter][y][x]
            : 0;
        if (oldColor !== color) {
            const updatedCharacter = characters[this.state.currentCharacter] ?? [];
            [...Array(this.props.data.size.y * CHAR_PIXEL_SIZE)].map((j, sy) => {
                if (!updatedCharacter[sy]) {
                    updatedCharacter[sy] = [];
                }
                [...Array(this.props.data.size.x * CHAR_PIXEL_SIZE)].map((k, sx) => {
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
            && x < this.props.data.size.x * CHAR_PIXEL_SIZE
            && y < this.props.data.size.y * CHAR_PIXEL_SIZE
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

    render(): React.JSX.Element {
        const { data } = this.props;

        const pixelWidth = data.size.x * CHAR_PIXEL_SIZE;
        const pixelHeight = data.size.y * CHAR_PIXEL_SIZE;

        const characters = this.props.data.characters || [];

        return <div
            tabIndex={0}
            className={`font-editor width-${pixelWidth} height-${pixelHeight}`}
            onFocus={() => this.setState({ active: true })}
            onBlur={() => this.setState({ active: false })}
            onMouseOver={() => this.setState({ active: true })}
            onMouseOut={() => this.setState({ active: false })}
        >
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
                        currentCharData={characters[this.state.currentCharacter]}
                        setCurrentCharData={this.setCurrentCharacterData.bind(this)}
                        setState={this.setState.bind(this)}
                    />
                    <ImportExport
                        setCharacters={this.setCharacters.bind(this)}
                        size={data.size}
                        offset={data.offset}
                        characterCount={data.characterCount}
                    />
                </div>
                <div className='editor-column'>
                    <CharSettings
                        currentCharacter={this.state.currentCharacter}
                        charHeight={pixelHeight}
                        charWidth={pixelWidth}
                        variableSize={data.variableSize}
                        setCharSize={this.setCharSize.bind(this)}
                        charGrid={this.state.charGrid}
                        setState={this.setState.bind(this)}
                    />
                    <CharEditor
                        char={characters[this.state.currentCharacter]}
                        charId={this.state.currentCharacter}
                        charHeight={pixelHeight}
                        charWidth={pixelWidth}
                        variableSize={data.variableSize}
                        clickPixel={this.clickPixel.bind(this)}
                        paletteIndexL={this.state.paletteIndexL}
                        paletteIndexR={this.state.paletteIndexR}
                        charGrid={this.state.charGrid}
                    />
                </div>
                <div className='alphabet-column'>
                    <AlphabetSettings
                        charCount={data.characterCount}
                        setCharCount={this.setCharCount.bind(this)}
                        offset={data.offset}
                        setOffset={this.setOffset.bind(this)}
                        alphabetGrid={this.state.alphabetGrid}
                        setState={this.setState.bind(this)}
                    />
                    <Alphabet
                        charsData={data.characters || []}
                        offset={data.offset}
                        charCount={data.characterCount}
                        charHeight={pixelHeight}
                        charWidth={pixelWidth}
                        currentCharacter={this.state.currentCharacter}
                        variableSize={data.variableSize}
                        alphabetGrid={this.state.alphabetGrid}
                        setState={this.setState.bind(this)}
                    />
                    <HContainer alignItems='start' gap={15} wrap='wrap'>
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/entityEditor/compression', 'Compression')}
                                tooltip={nls.localize(
                                    'vuengine/entityEditor/compressionDescription',
                                    // eslint-disable-next-line max-len
                                    'Image data can be stored in a compressed format to save ROM space. Comes at the cost of a slightly higher CPU load when loading data into memory.'
                                )}
                                tooltipPosition='bottom'
                            />
                            <RadioSelect
                                options={[{
                                    label: nls.localize('vuengine/entityEditor/none', 'None'),
                                    value: ImageCompressionType.NONE,
                                }, {
                                    label: nls.localize('vuengine/entityEditor/rle', 'RLE'),
                                    value: ImageCompressionType.RLE,
                                }]}
                                defaultValue={data.compression}
                                onChange={options => this.setCompression(options[0].value as ImageCompressionType)}
                            />
                        </VContainer>
                        <SectionSelect
                            value={data.section}
                            setValue={this.setSection.bind(this)}
                        />
                    </HContainer>
                </div>
            </div>
        </div>;
    }
}
