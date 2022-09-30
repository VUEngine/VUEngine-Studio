import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import { CHAR_PIXEL_SIZE, MAX_CHAR_SIZE, MIN_CHAR_SIZE, MIN_VARIABLE_CHAR_SIZE, Size, VariableSize } from '../FontEditorTypes';

interface CharSettingsProps {
    currentCharacter: number
    charHeight: number,
    charWidth: number,
    variableSize: VariableSize,
    setCharSize: (size?: Size, variableSize?: VariableSize) => void
}

export default function CharSettings(props: CharSettingsProps): JSX.Element {
    const {
        currentCharacter,
        charHeight, charWidth, variableSize, setCharSize,
    } = props;

    const onChangeVariablePixelWidth = (e: React.ChangeEvent<HTMLInputElement>) => setCharSize(
        undefined,
        {
            ...variableSize,
            x: {
                ...variableSize.x,
                [currentCharacter]: parseInt(e.target.value)
            }
        }
    );

    const onChangeVariablePixelHeight = (e: React.ChangeEvent<HTMLInputElement>) => setCharSize(
        undefined,
        {
            ...variableSize,
            y: parseInt(e.target.value)
        }
    );

    const onChangePixelWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentVariableSize = variableSize.x[currentCharacter];
        const newSize = parseInt(e.target.value);
        const currentVariableSizeDifference = charWidth - currentVariableSize;
        const newVariableSize = newSize - currentVariableSizeDifference;

        setCharSize(
            {
                x: newSize / CHAR_PIXEL_SIZE,
                y: charHeight / CHAR_PIXEL_SIZE
            },
            {
                ...variableSize,
                x: {
                    ...variableSize.x,
                    [currentCharacter]: newVariableSize
                }
            }
        );
    };

    const onChangePixelHeight = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentVariableSize = variableSize.y;
        const newSize = parseInt(e.target.value);
        const currentVariableSizeDifference = charHeight - currentVariableSize;
        const newVariableSize = newSize - currentVariableSizeDifference;

        setCharSize(
            {
                x: charWidth / CHAR_PIXEL_SIZE,
                y: newSize / CHAR_PIXEL_SIZE
            },
            {
                ...variableSize,
                y: newVariableSize
            }
        );
    };

    return <div className='font-properties'>
        {variableSize.enabled && <div>
            <label>Character Size</label>
            <div className='character-size'>
                <input
                    type="number"
                    min={MIN_VARIABLE_CHAR_SIZE}
                    max={charWidth}
                    className="theia-input"
                    value={variableSize.x[currentCharacter]}
                    onChange={onChangeVariablePixelWidth}
                />
                <div>×</div>
                <input
                    type="number"
                    min={MIN_VARIABLE_CHAR_SIZE}
                    max={charWidth}
                    className="theia-input"
                    value={variableSize.y}
                    onChange={onChangeVariablePixelHeight}
                />
            </div>
        </div>}
        <div>
            {!variableSize.enabled && <label>Character Size</label>}
            {variableSize.enabled && <label>Maximum</label>}
            <div className='character-size'>
                <input
                    type="number"
                    step={CHAR_PIXEL_SIZE}
                    min={MIN_CHAR_SIZE * CHAR_PIXEL_SIZE}
                    max={MAX_CHAR_SIZE * CHAR_PIXEL_SIZE}
                    className="theia-input"
                    id="#/properties/size/properties/x-input"
                    value={charWidth}
                    onChange={onChangePixelWidth}
                />
                <div>×</div>
                <input
                    type="number"
                    step={CHAR_PIXEL_SIZE}
                    min={MIN_CHAR_SIZE * CHAR_PIXEL_SIZE}
                    max={MAX_CHAR_SIZE * CHAR_PIXEL_SIZE}
                    className="theia-input"
                    id="#/properties/size/properties/y-input"
                    value={charHeight}
                    onChange={onChangePixelHeight}
                />
            </div>
        </div>
        <div>
            <label>Type</label>
            <SelectComponent
                defaultValue={variableSize.enabled ? '1' : '0'}
                options={[{
                    label: 'Fixed Size',
                    value: '0',
                    description: 'All characters have the same dimensions',
                }, {
                    label: 'Variable Size',
                    value: '1',
                    description: 'Every character can be of different width. Height is global. Allows for more dense or very small text. Uses Objects.',
                }]}
                onChange={option => setCharSize(
                    undefined,
                    {
                        ...variableSize,
                        enabled: option.value === '1' ? true : false
                    }
                )}
            />
        </div>
    </div>;
}
