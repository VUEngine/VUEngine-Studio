import React from 'react';
import { FontData } from './ves-fontData-control';
import { deepmerge } from 'deepmerge-ts';

interface VesFontDataProps {
    value: FontData;
    label: string;
    updateValue: (newValue: FontData) => void;
}

const DEFAULT_FONT_DATA = {
    characterCount: 256,
    characters: [],
    offset: 0,
    size: {
        x: 1,
        y: 1
    }
};

export const VesFontData: React.FC<VesFontDataProps> = ({ value, updateValue, label }) => {
    value = deepmerge(DEFAULT_FONT_DATA, value || {});
    let currentCharacter = 64;

    return (
        <div className='control font-data-renderer'>
            <label>{label}</label>
            <div className='editor'>
                <div className='left-column'>
                    <label>Current Character</label>
                    <div className='current-character'>
                        <div key='current-header-0' className='header'></div>
                        {[...Array(value.size.x * 8)].map((x, i) =>
                            <div key={`current-header-${i}`} className='header'>{i}</div>
                        )}
                        {[...Array(value.size.x * value.size.y * 64)].map((x, i) => (<>
                            {i % (value.size.x * 8) === 0 && <div key={`rowheader-${i / (value.size.x * 8)}`} className='header'>{i / (value.size.x * 8)}</div>}
                            <div key={`current-pixel-${i}`} className={`pixel-${i % 4}`}></div>
                        </>)
                        )}
                    </div>

                    <label>Character Size</label>
                    <div className='character-size'>
                        <input
                            type="number"
                            step="8"
                            min="8"
                            max="32"
                            className="theia-input"
                            id="#/properties/size/properties/x-input"
                            value={value.size.x * 8}
                            onChange={e => updateValue({
                                ...value,
                                size: {
                                    x: parseInt(e.target.value) / 8,
                                    y: value.size.y
                                }
                            })}
                        />
                        &nbsp;×&nbsp;
                        <input
                            type="number"
                            step="8"
                            min="8"
                            max="32"
                            className="theia-input"
                            id="#/properties/size/properties/y-input"
                            onChange={e => updateValue({
                                ...value,
                                size: {
                                    x: value.size.x,
                                    y: parseInt(e.target.value) / 8
                                }
                            })}
                        />
                    </div>
                </div>
                <div className='right-column'>
                    <label>Alphabet</label>
                    <div className='character-map'>
                        <div className='characters'>
                            <div key='header-0' className='header'></div>
                            {[...Array(16)].map((x, i) =>
                                <div key={`header-${i}`} className='header'>{i}</div>
                            )}
                            {[...Array(256)].map((x, i) => {
                                const classNames = ['character'];
                                if (i < value.offset || i >= value.characterCount) {
                                    classNames.push('inactive');
                                }
                                if (i === currentCharacter) {
                                    classNames.push('active');
                                }
                                return (<>
                                    {i % 16 === 0 && <div key={`rowheader-${i / 16}`} className='header'>{i / 16}</div>}
                                    <div key={`character-${i}`} className={classNames.join(' ')} onClick={() => currentCharacter = i}>
                                        {String.fromCharCode(i)}
                                    </div>
                                    {i === 127 && <div key='character-separator' className='separator' />}
                                </>);
                            }
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
