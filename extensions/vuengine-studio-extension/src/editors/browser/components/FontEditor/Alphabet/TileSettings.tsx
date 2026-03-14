import { deepClone, nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { clamp, roundToNextMultipleOf8 } from '../../Common/Utils';
import { TILE_PIXEL_SIZE, MAX_TILE_SIZE, MIN_TILE_SIZE, MIN_VARIABLE_TILE_SIZE, Size, VariableSize } from '../FontEditorTypes';

interface TileSettingsProps {
    currentCharacter: number
    tileHeight: number,
    tileWidth: number,
    variableSize: VariableSize,
    setCharSize: (size?: Size, variableSize?: VariableSize) => void
}

export default function TileSettings(props: TileSettingsProps): React.JSX.Element {
    const { currentCharacter, tileHeight, tileWidth, variableSize, setCharSize } = props;

    const setVariablePixelWidth = (size: number) => {
        const updatedVariableSizeX = deepClone(variableSize.x);
        updatedVariableSizeX[currentCharacter] = size;
        setCharSize(undefined, {
            ...variableSize,
            x: updatedVariableSizeX
        });
    };

    const setVariablePixelHeight = (size: number) => setCharSize(undefined, {
        ...variableSize,
        y: size,
    });

    const setPixelWidth = (value: number) => {
        const newSize = clamp(
            roundToNextMultipleOf8(value),
            MIN_TILE_SIZE * TILE_PIXEL_SIZE,
            MAX_TILE_SIZE * TILE_PIXEL_SIZE
        );

        let updatedVariableSize;
        if (variableSize.enabled) {
            const currentVariableSize = variableSize.x[currentCharacter] ?? tileWidth;
            const currentVariableSizeDifference = tileWidth - currentVariableSize;
            const newVariableSize = newSize - currentVariableSizeDifference;

            const updatedVariableSizeX = deepClone(variableSize.x);
            updatedVariableSizeX[currentCharacter] = newVariableSize;

            updatedVariableSize = {
                ...variableSize,
                x: updatedVariableSizeX
            };
        }

        setCharSize(
            {
                x: newSize / TILE_PIXEL_SIZE,
                y: tileHeight / TILE_PIXEL_SIZE
            },
            updatedVariableSize
        );
    };

    const setPixelHeight = (value: number) => {
        const newSize = clamp(
            roundToNextMultipleOf8(value),
            MIN_TILE_SIZE * TILE_PIXEL_SIZE,
            MAX_TILE_SIZE * TILE_PIXEL_SIZE
        );

        let updatedVariableSize;
        if (variableSize.enabled) {
            const currentVariableSize = variableSize.y;
            const currentVariableSizeDifference = tileHeight - currentVariableSize;
            const newVariableSize = newSize - currentVariableSizeDifference;
            updatedVariableSize = {
                ...variableSize,
                y: newVariableSize
            };
        }

        setCharSize(
            {
                x: tileWidth / TILE_PIXEL_SIZE,
                y: newSize / TILE_PIXEL_SIZE
            },
            updatedVariableSize
        );
    };

    return (
        <VContainer>
            {/* }
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/font/size', 'Size')}
                    tooltip={<>
                        <div>
                            <b>{nls.localize('vuengine/editors/font/fixed', 'Fixed')}: </b>
                            {nls.localize(
                                'vuengine/editors/font/fixedDescription',
                                'All characters have the same dimensions.'
                            )}
                        </div>
                        <div>
                            <b>{nls.localize('vuengine/editors/font/variable', 'Variable')}: </b>
                            {nls.localize(
                                'vuengine/editors/font/variableDescription',
                                'Every character can be of different width. Height is global. Allows for more dense or very small text. Uses Objects.'
                            )}
                        </div>
                    </>}
                    tooltipPosition='bottom'
                />
                <RadioSelect
                    options={[{
                        label: nls.localize('vuengine/editors/font/fixed', 'Fixed'),
                        value: '0',
                    }, {
                        label: nls.localize('vuengine/editors/font/variable', 'Variable'),
                        value: '1',
                    }]}
                    defaultValue={variableSize.enabled ? '1' : '0'}
                    onChange={options => setCharSize(
                        undefined,
                        {
                            ...variableSize,
                            enabled: options[0].value === '1' ? true : false
                        }
                    )}
                />
            </VContainer>
            { */}
            {variableSize.enabled &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/font/characterSize', 'Character Size')}
                    </label>
                    <HContainer alignItems='center'>
                        <Input
                            type="number"
                            value={variableSize.x[currentCharacter] ?? tileWidth}
                            setValue={setVariablePixelWidth}
                            min={MIN_VARIABLE_TILE_SIZE}
                            max={tileWidth}
                            width={64}
                        />
                        <div style={{ paddingBottom: 3 }}>×</div>
                        <Input
                            type="number"
                            value={variableSize.y}
                            setValue={setVariablePixelHeight}
                            min={MIN_VARIABLE_TILE_SIZE}
                            max={tileWidth}
                            width={64}
                        />
                    </HContainer>
                </VContainer>
            }
            <VContainer grow={1}>
                {!variableSize.enabled &&
                    <label>
                        {nls.localize('vuengine/editors/font/characterSize', 'Character Size')}
                    </label>
                }
                {variableSize.enabled &&
                    <label>
                        {nls.localize('vuengine/editors/font/maximumSize', 'Maximum Size')}
                    </label>
                }
                <HContainer alignItems='center'>
                    <Input
                        type="number"
                        step={TILE_PIXEL_SIZE}
                        min={MIN_TILE_SIZE * TILE_PIXEL_SIZE}
                        max={MAX_TILE_SIZE * TILE_PIXEL_SIZE}
                        value={tileWidth}
                        setValue={setPixelWidth}
                        width={64}
                    />
                    <div style={{ paddingBottom: 3 }}>×</div>
                    <Input
                        type="number"
                        step={TILE_PIXEL_SIZE}
                        min={MIN_TILE_SIZE * TILE_PIXEL_SIZE}
                        max={MAX_TILE_SIZE * TILE_PIXEL_SIZE}
                        value={tileHeight}
                        setValue={setPixelHeight}
                        width={64}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
