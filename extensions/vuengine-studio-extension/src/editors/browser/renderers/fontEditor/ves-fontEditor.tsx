import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import { isBoolean } from 'lodash';
import React from 'react';
import { DataSection, FontData, win1252CharNames } from './ves-fontEditor-control';

interface VesFontEditorProps {
    value: FontData;
    label: string;
    updateValue: (newValue: FontData) => void;
}

const CHAR_PIXEL_SIZE = 8;
const MIN_CHAR_SIZE = 1;
const MAX_CHAR_SIZE = 4;
const DEFAULT_CHAR_SIZE = MIN_CHAR_SIZE;

const MIN_CHAR_COUNT = 1;
const MAX_CHAR_COUNT = 256;
const DEFAULT_CHAR_COUNT = 128;

const MIN_OFFSET = 0;
const MAX_OFFSET = MAX_CHAR_COUNT - MIN_CHAR_COUNT;
const DEFAULT_OFFSET = MIN_OFFSET;

const DEFAULT_VARIABLE_SIZE_ENABLED = false;
const MIN_VARIABLE_CHAR_SIZE = 1;
const MAX_VARIABLE_CHAR_SIZE = MAX_CHAR_SIZE * CHAR_PIXEL_SIZE;
const DEFAULT_VARIABLE_CHAR_SIZE = DEFAULT_CHAR_SIZE * CHAR_PIXEL_SIZE;

const PALETTE_COLORS = ['#000', '#500', '#a00', '#f00'];

let clipboard: number[][] | undefined;

export const VesFontEditor: React.FC<VesFontEditorProps> = ({ value, updateValue, label }) => {
    const validateFontData = (): void => {
        if (!value) {
            value = {
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
            };
        };

        if (!value.characterCount
            || !Number.isInteger(value.characterCount)
            || value.characterCount < MIN_CHAR_COUNT
            || value.characterCount > MAX_CHAR_COUNT) {
            value.characterCount = DEFAULT_CHAR_COUNT;
        }

        if (!value.offset
            || !Number.isInteger(value.offset)
            || value.offset < MIN_OFFSET
            || value.offset > MAX_OFFSET) {
            value.offset = DEFAULT_OFFSET;
        }

        if (!value.size) {
            value.size = {
                x: DEFAULT_CHAR_SIZE,
                y: DEFAULT_CHAR_SIZE
            };
        } else {
            if (!value.size.x
                || !Number.isInteger(value.size.x)
                || value.size.x < MIN_CHAR_SIZE
                || value.size.x > MAX_CHAR_SIZE) {
                value.size.x = DEFAULT_CHAR_SIZE;
            }
            if (!value.size.y
                || !Number.isInteger(value.size.y)
                || value.size.y < MIN_CHAR_SIZE
                || value.size.y > MAX_CHAR_SIZE) {
                value.size.y = DEFAULT_CHAR_SIZE;
            }
        }

        if (!value.variableSize) {
            value.variableSize = {
                enabled: DEFAULT_VARIABLE_SIZE_ENABLED,
                x: [],
                y: DEFAULT_VARIABLE_CHAR_SIZE
            };
        } else {
            if (value.variableSize.enabled === undefined
                || !isBoolean(value.variableSize.enabled)) {
                value.variableSize.enabled = DEFAULT_VARIABLE_SIZE_ENABLED;
            }
            if (!value.variableSize.y
                || value.variableSize.y < MIN_VARIABLE_CHAR_SIZE
                || value.variableSize.y > MAX_VARIABLE_CHAR_SIZE) {
                value.variableSize.y = DEFAULT_VARIABLE_CHAR_SIZE;
            }
        }

        const variableCharacterWidths: number[] = [];
        [...Array(MAX_CHAR_COUNT)].map((i, character) => {
            variableCharacterWidths.push(value.variableSize
                && value.variableSize.x[character]
                ? value.variableSize.x[character]
                : value.size.x * CHAR_PIXEL_SIZE);
        });
        value.variableSize.x = variableCharacterWidths;

        const characters: number[][][] = [];
        [...Array(MAX_CHAR_COUNT)].map((i, character) => {
            const charData: number[][] = [];
            [...Array(value.size.y * CHAR_PIXEL_SIZE)].map((j, y) => {
                const charLineData: number[] = [];
                [...Array(value.size.x * CHAR_PIXEL_SIZE)].map((k, x) => {
                    charLineData.push(value.characters
                        && value.characters[character]
                        && value.characters[character][y]
                        && value.characters[character][y][x]
                        ? value.characters[character][y][x]
                        : 0);
                });
                charData.push(charLineData);
            });
            characters.push(charData);
        });
        value.characters = characters;
    };

    const setCurrentCharacterData = (character: number[][]): void => {
        updateValue({
            ...value,
            characters: {
                ...value.characters,
                [currentCharacter]: character
            }
        });
    };

    const getBlankCharacter = (): number[][] => {
        const charData: number[][] = [];
        [...Array(value.size.y * CHAR_PIXEL_SIZE)].map((j, y) => {
            charData.push(getBlankCharacterLine());
        });
        return charData;
    };

    const getBlankCharacterLine = (): number[] => {
        const charLineData: number[] = [];
        [...Array(value.size.x * CHAR_PIXEL_SIZE)].map((k, x) => {
            charLineData.push(0);
        });
        return charLineData;
    };

    const clear = (): void => {
        setCurrentCharacterData(getBlankCharacter());
    };

    const rotate = (): void => {
        const char = value.characters[currentCharacter];

        const n = char.length;
        const x = Math.floor(n / 2);
        const y = n - 1;
        let k;
        for (let i = 0; i < x; i++) {
            for (let j = i; j < y - i; j++) {
                k = char[i][j];
                char[i][j] = char[y - j][i];
                char[y - j][i] = char[y - i][y - j];
                char[y - i][y - j] = char[j][y - i];
                char[j][y - i] = k;
            }
        }

        setCurrentCharacterData(char);
    };

    const mirrorHorizontally = (): void => {
        setCurrentCharacterData(value.characters[currentCharacter].map(line => line.reverse()));
    };

    const mirrorVertically = (): void => {
        setCurrentCharacterData(value.characters[currentCharacter].reverse());
    };

    const moveUp = (): void => {
        setCurrentCharacterData([
            ...value.characters[currentCharacter].slice(1),
            getBlankCharacterLine()
        ]);
    };

    const moveDown = (): void => {
        setCurrentCharacterData([
            getBlankCharacterLine(),
            ...value.characters[currentCharacter].slice(0, -1)
        ]);
    };

    const moveLeft = (): void => {
        setCurrentCharacterData(value.characters[currentCharacter].map(line => [...line.slice(1), 0]));
    };

    const moveRight = (): void => {
        setCurrentCharacterData(value.characters[currentCharacter].map(line => [0, ...line.slice(0, -1)]));
    };

    const copy = (): void => {
        clipboard = [...value.characters[currentCharacter]];
    };

    const paste = (): void => {
        if (clipboard) {
            setCurrentCharacterData(clipboard);
        }
    };

    const setPixelColor = (x: number, y: number, color: number) =>
        updateValue({
            ...value,
            characters: {
                ...value.characters,
                [currentCharacter]: {
                    ...value.characters[currentCharacter],
                    [y]: {
                        ...value.characters[currentCharacter][y],
                        [x]: color
                    }
                }
            }
        });

    const onClick = (e: React.MouseEvent<HTMLElement>, x: number, y: number) => {
        setPixelColor(x, y, paletteIndexL);
        e.preventDefault();
    };
    const onRightClick = (e: React.MouseEvent<HTMLElement>, x: number, y: number) => {
        setPixelColor(x, y, paletteIndexR);
        e.preventDefault();
    };

    const onMouseOver = (e: React.MouseEvent<HTMLElement>, x: number, y: number) => {
        if (e.buttons === 1) {
            setPixelColor(x, y, paletteIndexL);
        } else if (e.buttons === 2) {
            setPixelColor(x, y, paletteIndexR);
        }
        e.preventDefault();
    };

    validateFontData();
    const [paletteIndexL, setPaletteIndexL] = React.useState<number>(3);
    const [paletteIndexR, setPaletteIndexR] = React.useState<number>(0);
    const [currentCharacter, setCurrentCharacter] = React.useState<number>(0);

    const pixelWidth = value.size.x * CHAR_PIXEL_SIZE;
    const pixelHeight = value.size.y * CHAR_PIXEL_SIZE;

    return (
        <div className={`control font-data-renderer width-${pixelWidth} height-${pixelHeight}`}>
            <div key="font-name" className='font-properties'>
                <div key="font-name-inner">
                    <label>Name</label>
                    <input
                        className="theia-input large"
                        id="#/properties/name-input"
                        value={value.name}
                        onChange={e => updateValue({
                            ...value,
                            name: e.target.value
                        })}
                    />
                </div>
            </div>
            <div className='editor'>
                <div key='editor-col-1' className='tools-column'>
                    <div key='current-character-info' className='current-character-info'>
                        <input
                            type="string"
                            maxLength={1}
                            minLength={1}
                            className="theia-input"
                            value={win1252CharNames[currentCharacter]}
                            readOnly
                        />
                        {currentCharacter} / 0x{currentCharacter.toString(16).toUpperCase().padStart(2, '0')}
                    </div>
                    <div key='palette' className='palette'>
                        {[...Array(4)].map((x, i) =>
                            /* TODO: switch index with keyboard, display resp. key on color */
                            <div
                                key={`palette-${i}`}
                                className={`color-${i} ${(i === paletteIndexL || i === paletteIndexR) && 'active'}`}
                                onClick={() => setPaletteIndexL(i)}
                                onContextMenu={() => setPaletteIndexR(i)}
                            >
                                {i === paletteIndexL && 'L'}
                                {i === paletteIndexL && i === paletteIndexR && '/'}
                                {i === paletteIndexR && 'R'}
                            </div>
                        )}
                    </div>
                    <div key='mode' className='tools'>
                        <button
                            className='theia-button full-width'
                            title="Pencil"
                        >
                            <i className="fa fa-pencil"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Fill"
                        >
                            <i className="fa fa-paint-brush"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Line"
                        >
                            /
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Rectangle"
                        >
                            <i className="fa fa-square-o"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Rectangle (Filled)"
                        >
                            <i className="fa fa-square"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Circle"
                        >
                            <i className="fa fa-circle-o"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Circle (Filled)"
                        >
                            <i className="fa fa-circle"></i>
                        </button>
                    </div>
                    <div key='tools' className='tools'>
                        <button
                            className='theia-button secondary'
                            title="Clear"
                            onClick={clear}
                        >
                            <i className="fa fa-trash"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Rotate"
                            onClick={rotate}
                        >
                            <i className="fa fa-rotate-right"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Mirror Horizontally"
                            onClick={mirrorHorizontally}
                        >
                            <i className="fa fa-arrows-h"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Mirror Vertically"
                            onClick={mirrorVertically}
                        >
                            <i className="fa fa-arrows-v"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Move Up"
                            onClick={moveUp}
                        >
                            <i className="fa fa-arrow-up"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Move Down"
                            onClick={moveDown}
                        >
                            <i className="fa fa-arrow-down"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Move Left"
                            onClick={moveLeft}
                        >
                            <i className="fa fa-arrow-left"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Move Right"
                            onClick={moveRight}
                        >
                            <i className="fa fa-arrow-right"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Copy"
                            onClick={copy}
                        >
                            <i className="fa fa-clone"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Paste"
                            onClick={paste}
                        >
                            <i className="fa fa-paste"></i>
                        </button>
                    </div>
                    <div key='import-export' className='tools'>
                        <button
                            className='theia-button secondary full-width'
                            title="Import"
                        >
                            Import
                        </button>
                        <button
                            className='theia-button secondary full-width'
                            title="Export"
                        >
                            Export
                        </button>
                    </div>
                </div>
                <div key='editor-col-2' className='editor-column'>
                    <div key="font-properties" className='font-properties'>
                        {value.variableSize.enabled && <div>
                            <label>Character Size</label>
                            <div key="variable-character-size" className='character-size'>
                                <input
                                    type="number"
                                    min={MIN_VARIABLE_CHAR_SIZE}
                                    max={value.size.x * CHAR_PIXEL_SIZE}
                                    className="theia-input"
                                    value={value.variableSize.x[currentCharacter]}
                                    onChange={e => updateValue({
                                        ...value,
                                        variableSize: {
                                            ...value.variableSize,
                                            x: {
                                                ...value.variableSize.x,
                                                [currentCharacter]: parseInt(e.target.value)
                                            }
                                        }
                                    })}
                                />
                                <div>×</div>
                                <input
                                    type="number"
                                    min={MIN_VARIABLE_CHAR_SIZE}
                                    max={value.size.y * CHAR_PIXEL_SIZE}
                                    className="theia-input"
                                    value={value.variableSize.y}
                                    onChange={e => updateValue({
                                        ...value,
                                        variableSize: {
                                            ...value.variableSize,
                                            y: parseInt(e.target.value)
                                        }
                                    })}
                                />
                            </div>
                        </div>}
                        <div>
                            {!value.variableSize.enabled && <label>Character Size</label>}
                            {value.variableSize.enabled && <label>Maximum</label>}
                            <div key="character-size" className='character-size'>
                                <input
                                    type="number"
                                    step={CHAR_PIXEL_SIZE}
                                    min={MIN_CHAR_SIZE * CHAR_PIXEL_SIZE}
                                    max={MAX_CHAR_SIZE * CHAR_PIXEL_SIZE}
                                    className="theia-input"
                                    id="#/properties/size/properties/x-input"
                                    value={pixelWidth}
                                    onChange={e => updateValue({
                                        ...value,
                                        size: {
                                            x: parseInt(e.target.value) / CHAR_PIXEL_SIZE,
                                            y: value.size.y
                                        }
                                    })}
                                />
                                <div>×</div>
                                <input
                                    type="number"
                                    step={CHAR_PIXEL_SIZE}
                                    min={MIN_CHAR_SIZE * CHAR_PIXEL_SIZE}
                                    max={MAX_CHAR_SIZE * CHAR_PIXEL_SIZE}
                                    className="theia-input"
                                    id="#/properties/size/properties/y-input"
                                    value={pixelHeight}
                                    onChange={e => updateValue({
                                        ...value,
                                        size: {
                                            x: value.size.x,
                                            y: parseInt(e.target.value) / CHAR_PIXEL_SIZE
                                        }
                                    })}
                                />
                            </div>
                        </div>
                        <div>
                            <label>Type</label>
                            <SelectComponent
                                key="#/properties/variableSize-input"
                                defaultValue={value.variableSize.enabled ? '1' : '0'}
                                options={[{
                                    label: 'Fixed Size',
                                    value: '0',
                                    description: 'All characters have the same dimensions',
                                }, {
                                    label: 'Variable Size',
                                    value: '1',
                                    description: 'Every character can be of different width. Height is global. Allows for more dense or very small text. Uses Objects.',
                                }]}
                                onChange={option => updateValue({
                                    ...value,
                                    variableSize: {
                                        ...value.variableSize,
                                        enabled: !!option.value
                                    }
                                })}
                            />
                        </div>
                    </div>
                    <div key='current-char' className='current-character'>
                        {[...Array(pixelHeight)].map((h, y) => (
                            <div
                                key={`current-line-${y}`}
                                className={y >= value.variableSize.y ? 'line inactive' : 'line'}
                            >
                                {[...Array(pixelWidth)].map((w, x) => {
                                    const classNames = [`pixel color-${value.characters[currentCharacter][y][x]}`];
                                    if (x >= value.variableSize.x[currentCharacter]) {
                                        classNames.push('inactive');
                                    }

                                    return <div
                                        key={`current-pixel-${y}-${x}`}
                                        className={classNames.join(' ')}
                                        onClick={e => onClick(e, x, y)}
                                        onContextMenu={e => onRightClick(e, x, y)}
                                        onMouseOver={e => onMouseOver(e, x, y)}
                                        onMouseLeave={e => onMouseOver(e, x, y)}
                                    ></div>;
                                })}
                            </div>)
                        )}
                    </div>
                </div>
                <div key='editor-col-3' className='alphabet-column'>
                    <div key="alphabet-properties" className='font-properties'>
                        <div>
                            <label>Count</label>
                            <input
                                type="number"
                                step="1"
                                min={MIN_CHAR_COUNT}
                                max={MAX_CHAR_COUNT - value.offset}
                                className="theia-input"
                                id="#/properties/characterCount-input"
                                value={value.characterCount}
                                onChange={e => updateValue({
                                    ...value,
                                    characterCount: parseInt(e.target.value)
                                })}
                            />
                        </div>
                        <div>
                            <label>Offset</label>
                            <input
                                type="number"
                                step="1"
                                min={MIN_OFFSET}
                                max={MAX_CHAR_COUNT - value.characterCount}
                                className="theia-input"
                                id="#/properties/offset-input"
                                value={value.offset}
                                onChange={e => updateValue({
                                    ...value,
                                    offset: parseInt(e.target.value)
                                })}
                            />
                        </div>
                        <div>
                            <label>Section</label>
                            <SelectComponent
                                key="#/properties/section-input"
                                defaultValue={value.section}
                                options={[{
                                    label: 'ROM Space',
                                    value: DataSection.ROM,
                                    description: 'Save tile data in regular ROM space',
                                }, {
                                    label: 'Expansion Space',
                                    value: DataSection.EXP,
                                    description: 'Save tile data to expansion space',
                                }]}
                                onChange={option => updateValue({
                                    ...value,
                                    section: option.value as DataSection
                                })}
                            />
                        </div>
                    </div>
                    <div key='characters' className='characters'>
                        {[...Array(16)].map((i, line) => (
                            <div key={`characters-line-${line}`} className="line">
                                {[...Array(MAX_CHAR_COUNT / 16)].map((j, char) => {
                                    const classNames = ['character'];
                                    const character = (line * 16) + char;
                                    if (character < value.offset || character >= value.offset + value.characterCount) {
                                        classNames.push('inactive');
                                    }
                                    if (character === currentCharacter) {
                                        classNames.push('active');
                                    }

                                    const boxShadow: string[] = [];
                                    [...Array(pixelHeight)].map((h, y) => {
                                        if (!value.variableSize.enabled || y < value.variableSize.y) {
                                            [...Array(pixelWidth)].map((w, x) => {
                                                if (!value.variableSize.enabled || x < value.variableSize.x[line * 16 + char]) {
                                                    const pixelSize = (pixelWidth > 16 || pixelHeight > 16) ? 1 : 2;
                                                    const color = value.characters[character][y][x];
                                                    boxShadow.push(
                                                        `${(x + 1) * pixelSize}px ${(y + 1) * pixelSize}px 0 0 ${PALETTE_COLORS[color]}`
                                                    );
                                                }
                                            });
                                        }
                                    });

                                    return (<>
                                        <div
                                            key={`character-${character}`}
                                            className={classNames.join(' ')}
                                            title={win1252CharNames[character]}
                                            onClick={() => !classNames.includes('inactive') && setCurrentCharacter(character)}
                                        >
                                            <div
                                                key={`character-pixels-${character}`}
                                                style={{
                                                    boxShadow: boxShadow.join(',')
                                                }}
                                            ></div>
                                        </div>
                                    </>);
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};
