import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { CHAR_PIXEL_SIZE, FontEditorState, MAX_CHAR_SIZE, MIN_CHAR_SIZE, MIN_VARIABLE_CHAR_SIZE, Size, VariableSize } from '../FontEditorTypes';
import RadioSelect from '../../Common/RadioSelect';

interface CharSettingsProps {
    currentCharacter: number
    charHeight: number,
    charWidth: number,
    variableSize: VariableSize,
    setCharSize: (size?: Size, variableSize?: VariableSize) => void
    charGrid: number
    setState: (state: Partial<FontEditorState>) => void
}

export default function CharSettings(props: CharSettingsProps): React.JSX.Element {
    const {
        currentCharacter,
        charHeight, charWidth, variableSize, setCharSize,
        charGrid,
        setState,
    } = props;

    const onChangeVariablePixelWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedVariableSizeX = [...variableSize.x];
        updatedVariableSizeX[currentCharacter] = parseInt(e.target.value);
        setCharSize(undefined, {
            ...variableSize,
            x: updatedVariableSizeX
        });
    };

    const onChangeVariablePixelHeight = (e: React.ChangeEvent<HTMLInputElement>) => setCharSize(undefined, {
        ...variableSize,
        y: parseInt(e.target.value)
    });

    const onChangePixelWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = parseInt(e.target.value);

        let updatedVariableSize;
        if (variableSize.enabled) {
            const currentVariableSize = variableSize.x[currentCharacter] ?? charWidth;
            const currentVariableSizeDifference = charWidth - currentVariableSize;
            const newVariableSize = newSize - currentVariableSizeDifference;

            const updatedVariableSizeX = [...variableSize.x];
            updatedVariableSizeX[currentCharacter] = newVariableSize;

            updatedVariableSize = {
                ...variableSize,
                x: updatedVariableSizeX
            };
        }

        setCharSize(
            {
                x: newSize / CHAR_PIXEL_SIZE,
                y: charHeight / CHAR_PIXEL_SIZE
            },
            updatedVariableSize
        );
    };

    const onChangePixelHeight = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = parseInt(e.target.value);

        let updatedVariableSize;
        if (variableSize.enabled) {
            const currentVariableSize = variableSize.y;
            const currentVariableSizeDifference = charHeight - currentVariableSize;
            const newVariableSize = newSize - currentVariableSizeDifference;
            updatedVariableSize = {
                ...variableSize,
                y: newVariableSize
            };
        }

        setCharSize(
            {
                x: charWidth / CHAR_PIXEL_SIZE,
                y: newSize / CHAR_PIXEL_SIZE
            },
            updatedVariableSize
        );
    };

    return <HContainer gap={15}>
        {variableSize.enabled &&
            <VContainer>
                <label>
                    {nls.localize('vuengine/fontEditor/characterSize', 'Character Size')}
                </label>
                <HContainer>
                    <input
                        type="number"
                        className="theia-input"
                        style={{ width: 48 }}
                        min={MIN_VARIABLE_CHAR_SIZE}
                        max={charWidth}
                        value={variableSize.x[currentCharacter] ?? charWidth}
                        onChange={onChangeVariablePixelWidth}
                    />
                    <div>×</div>
                    <input
                        type="number"
                        className="theia-input"
                        style={{ width: 48 }}
                        min={MIN_VARIABLE_CHAR_SIZE}
                        max={charWidth}
                        value={variableSize.y}
                        onChange={onChangeVariablePixelHeight}
                    />
                </HContainer>
            </VContainer>}
        <VContainer grow={1}>
            {!variableSize.enabled && <label>
                {nls.localize('vuengine/fontEditor/characterSize', 'Character Size')}
            </label>}
            {variableSize.enabled && <label>
                {nls.localize('vuengine/fontEditor/maximum', 'Maximum')}
            </label>}
            <HContainer>
                <input
                    type="number"
                    className="theia-input"
                    style={{ width: 48 }}
                    step={CHAR_PIXEL_SIZE}
                    min={MIN_CHAR_SIZE * CHAR_PIXEL_SIZE}
                    max={MAX_CHAR_SIZE * CHAR_PIXEL_SIZE}
                    id="#/properties/size/properties/x-input"
                    value={charWidth}
                    onChange={onChangePixelWidth}
                />
                <div>×</div>
                <input
                    type="number"
                    className="theia-input"
                    style={{ width: 48 }}
                    step={CHAR_PIXEL_SIZE}
                    min={MIN_CHAR_SIZE * CHAR_PIXEL_SIZE}
                    max={MAX_CHAR_SIZE * CHAR_PIXEL_SIZE}
                    id="#/properties/size/properties/y-input"
                    value={charHeight}
                    onChange={onChangePixelHeight}
                />
            </HContainer>
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/fontEditor/grid', 'Grid')}
            </label>
            <RadioSelect
                options={[{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }]}
                defaultValue={charGrid}
                onChange={options => setState({ charGrid: options[0].value as number })}
            />
        </VContainer>
    </HContainer>;
}
