import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { clamp, roundToNextMultipleOf8 } from '../../Common/Utils';
import { INPUT_BLOCKING_COMMANDS } from '../FontEditor';
import { CHAR_PIXEL_SIZE, MAX_CHAR_SIZE, MIN_CHAR_SIZE, MIN_VARIABLE_CHAR_SIZE, Size, VariableSize } from '../FontEditorTypes';

interface CharSettingsProps {
    currentCharacter: number
    charHeight: number,
    charWidth: number,
    variableSize: VariableSize,
    setCharSize: (size?: Size, variableSize?: VariableSize) => void
}

export default function CharSettings(props: CharSettingsProps): React.JSX.Element {
    const { currentCharacter, charHeight, charWidth, variableSize, setCharSize } = props;
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

    const setVariablePixelWidth = (size: number) => {
        const updatedVariableSizeX = [...variableSize.x];
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

    const onChangePixelWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = clamp(
            roundToNextMultipleOf8(parseInt(e.target.value)),
            MIN_CHAR_SIZE * CHAR_PIXEL_SIZE,
            MAX_CHAR_SIZE * CHAR_PIXEL_SIZE
        );

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
        const newSize = clamp(
            roundToNextMultipleOf8(parseInt(e.target.value)),
            MIN_CHAR_SIZE * CHAR_PIXEL_SIZE,
            MAX_CHAR_SIZE * CHAR_PIXEL_SIZE
        );

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
                            value={variableSize.x[currentCharacter] ?? charWidth}
                            setValue={setVariablePixelWidth}
                            min={MIN_VARIABLE_CHAR_SIZE}
                            max={charWidth}
                            width={48}
                        />
                        <div style={{ paddingBottom: 3 }}>×</div>
                        <Input
                            type="number"
                            value={variableSize.y}
                            setValue={setVariablePixelHeight}
                            min={MIN_VARIABLE_CHAR_SIZE}
                            max={charWidth}
                            width={48}
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
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <div style={{ paddingBottom: 3 }}>×</div>
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
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
