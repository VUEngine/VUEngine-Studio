import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import { FontData, win1252CharNames } from './ves-fontData-control';

interface VesFontDataProps {
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

const DEFAULT_DYNAMIC_SIZE = false;

const PALETTE_COLORS = ['#000', '#500', '#a00', '#f00'];

const validateFontData = (fontData: FontData): FontData => {
    if (!fontData) {
        fontData = {
            characters: [],
            characterCount: DEFAULT_CHAR_COUNT,
            offset: DEFAULT_OFFSET,
            size: {
                x: DEFAULT_CHAR_SIZE,
                y: DEFAULT_CHAR_SIZE
            },
            dynamicSize: DEFAULT_DYNAMIC_SIZE
        };
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

    if (!fontData.dynamicSize) {
        fontData.dynamicSize = DEFAULT_DYNAMIC_SIZE;
    }

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

    return fontData;
};

export const VesFontData: React.FC<VesFontDataProps> = ({ value, updateValue, label }) => {
    value = validateFontData(value);
    const [paletteIndex, setPaletteIndex] = React.useState<number>(3);
    const [currentCharacter, setCurrentCharacter] = React.useState<number>(0);

    const pixelWidth = value.size.x * CHAR_PIXEL_SIZE;
    const pixelHeight = value.size.y * CHAR_PIXEL_SIZE;

    const setPixelColor = (x: number, y: number, color: number) =>
        updateValue({
            ...value,
            characters: {
                ...value.characters,
                [currentCharacter]: {
                    ...value.characters[currentCharacter],
                    [y]: {
                        ...value.characters[color][y],
                        [x]: paletteIndex
                    }
                }
            }
        });

    const onClick = (e: React.MouseEvent<HTMLElement>, x: number, y: number) => {
        setPixelColor(x, y, currentCharacter);
        e.preventDefault();
    };

    const onMouseOver = (e: React.MouseEvent<HTMLElement>, x: number, y: number) => {
        if (e.buttons === 1) {
            setPixelColor(x, y, currentCharacter);
        } else if (e.buttons === 2) {
            setPixelColor(x, y, 0);
        }
        e.preventDefault();
    };

    return (
        <div className={`control font-data-renderer width-${pixelWidth} height-${pixelHeight} palette-index-${paletteIndex}`}>
            <div className='font-properties'>
                <div>
                    <label>Character Size</label>
                    <div className='character-size'>
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
                        key="#/properties/dynamicSize-input"
                        defaultValue={value.dynamicSize ? '1' : '0'}
                        options={[{
                            label: 'Fixed Width',
                            value: '0',
                            description: 'All characters have the same dimensions',
                        }, {
                            label: 'Variable Width',
                            value: '1',
                            description: 'Every character can be of different width. Allows for more dense text. Uses Objects.',
                        }]}
                        onChange={option => updateValue({
                            ...value,
                            dynamicSize: !!option.value
                        })}
                    />
                </div>
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
                        />
                        {currentCharacter} / 0x{currentCharacter.toString(16).toUpperCase().padStart(2, '0')}
                    </div>
                    <div key='palette' className='palette'>
                        {[...Array(4)].map((x, i) =>
                            /* TODO: switch index with keyboard, display resp. key on color */
                            <div
                                key={`palette-${i}`}
                                className={`color-${i} ${i === paletteIndex && 'active'}`}
                                onClick={() => setPaletteIndex(i)}
                            ></div>
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
                        >
                            <i className="fa fa-trash"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Rotate"
                        >
                            <i className="fa fa-rotate-right"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Mirror Horizontally"
                        >
                            <i className="fa fa-arrows-h"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Mirror Vertically"
                        >
                            <i className="fa fa-arrows-v"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Move Up"
                        >
                            <i className="fa fa-arrow-up"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Move Down"
                        >
                            <i className="fa fa-arrow-down"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Move Left"
                        >
                            <i className="fa fa-arrow-left"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Move Right"
                        >
                            <i className="fa fa-arrow-right"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Copy"
                        >
                            <i className="fa fa-clone"></i>
                        </button>
                        <button
                            className='theia-button secondary'
                            title="Paste"
                        >
                            <i className="fa fa-paste"></i>
                        </button>
                    </div>
                    <div key='tools' className='tools'>
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
                    <div key='current-char' className='current-character'>
                        <div key='current-header-0' className='header'></div>
                        {[...Array(pixelWidth)].map((x, i) =>
                            <div key={`current-header-${i}`} className='header'>{i}</div>
                        )}
                        {[...Array(pixelHeight)].map((h, y) =>
                            [...Array(pixelWidth)].map((w, x) => (<>
                                {x === 0 && <div key={`current-header-row-${y}`} className='header'>{y}</div>}
                                <div
                                    key={`current-pixel-${y}-${x}`}
                                    className={`color-${value.characters[currentCharacter][y][x]}`}
                                    onClick={e => onClick(e, x, y)}
                                    onMouseOver={e => onMouseOver(e, x, y)}
                                    onMouseLeave={e => onMouseOver(e, x, y)}
                                ></div>
                            </>
                            ))
                        )}
                    </div>
                </div>
                <div key='editor-col-3' className='table-column'>
                    <div key='characters' className='characters'>
                        <div key='characters-header-tl' className='header'></div>
                        {[...Array(16)].map((k, i) =>
                            <div key={`characters-header-${i}`} className='header'>{i}</div>
                        )}
                        {[...Array(MAX_CHAR_COUNT)].map((j, character) => {
                            const classNames = ['character'];
                            if (character < value.offset || character >= value.offset + value.characterCount) {
                                classNames.push('inactive');
                            }
                            if (character === currentCharacter) {
                                classNames.push('active');
                            }
                            return (<>
                                {character % 16 === 0 && <div key={`characters-header-row-${character / 16}`} className='header'>{character / 16}</div>}
                                <div
                                    key={`character-${character}`}
                                    className={classNames.join(' ')}
                                    title={win1252CharNames[character]}
                                    onClick={() => !classNames.includes('inactive') && setCurrentCharacter(character)}
                                >
                                    <div
                                        key={`character-pixels-${character}`}
                                        style={{
                                            boxShadow: [...Array(pixelHeight)].map((h, y) =>
                                                [...Array(pixelWidth)].map((w, x) => {
                                                    const pixelSize = (pixelWidth > 16 || pixelHeight > 16) ? 1 : 2;
                                                    /* TODO: do not render black pixels */
                                                    return `${(x + 1) * pixelSize}px ${(y + 1) * pixelSize}px 0 0 ${PALETTE_COLORS[value.characters[character][y][x]]}`;
                                                })
                                            ).join(',')
                                        }}
                                    ></div>
                                </div>
                                {
                                    character === 127 && <>
                                        <div key='character-separator-1' className='separator' />
                                        <div key='character-separator-2' className='separator' />
                                        <div key='character-separator-3' className='separator' />
                                        <div key='character-separator-4' className='separator' />
                                        <div key='character-separator-5' className='separator' />
                                        <div key='character-separator-6' className='separator' />
                                        <div key='character-separator-7' className='separator' />
                                        <div key='character-separator-8' className='separator' />
                                        <div key='character-separator-9' className='separator' />
                                        <div key='character-separator-10' className='separator' />
                                        <div key='character-separator-11' className='separator' />
                                        <div key='character-separator-12' className='separator' />
                                        <div key='character-separator-13' className='separator' />
                                        <div key='character-separator-14' className='separator' />
                                        <div key='character-separator-15' className='separator' />
                                        <div key='character-separator-16' className='separator' />
                                        <div key='character-separator-17' className='separator' />
                                    </>
                                }
                            </>);
                        }
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};
