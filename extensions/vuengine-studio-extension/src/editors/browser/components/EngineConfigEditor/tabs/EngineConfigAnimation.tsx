import { nls } from '@theia/core';
import React from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import {
    EngineConfigData,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MAX_VALUE,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE,
    MAX_FRAMES_PER_ANIMATION_FUNCTION_DEFAULT_VALUE,
    MAX_FRAMES_PER_ANIMATION_FUNCTION_MAX_VALUE,
    MAX_FRAMES_PER_ANIMATION_FUNCTION_MIN_VALUE
} from '../EngineConfigEditorTypes';

interface EngineConfigAnimationProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigAnimation(props: EngineConfigAnimationProps): React.JSX.Element {
    const { data, updateData } = props;

    const setMaxAnimationFunctionNameLength = (maxAnimationFunctionNameLength: number): void => {
        updateData({
            ...data,
            animation: {
                ...(data.animation ?? {}),
                maxAnimationFunctionNameLength,
            }
        });
    };

    const setMaxFramesPerAnimationFunction = (maxFramesPerAnimationFunction: number): void => {
        updateData({
            ...data,
            animation: {
                ...(data.animation ?? {}),
                maxFramesPerAnimationFunction,
            }
        });
    };

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/animation/maxAnimationFunctionNameLength',
                    'Maximum Animation Function Name Length'
                )}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/animation/maxAnimationFunctionNameLengthDescription',
                    'The maximum length of an animation function name.'
                )}
                type="number"
                value={data.animation?.maxAnimationFunctionNameLength ?? MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE}
                setValue={setMaxAnimationFunctionNameLength}
                min={MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE}
                max={MAX_ANIMATION_FUNCTION_NAME_LENGTH_MAX_VALUE}
                defaultValue={MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/animation/maxFramesPerAnimationFunction',
                    'Maximum Number of Frames per Animation Function'
                )}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/animation/maxFramesPerAnimationFunctionDescription',
                    'The maximum number of frames that any animation function can consist of.'
                )}
                type="number"
                value={data.animation?.maxFramesPerAnimationFunction ?? MAX_FRAMES_PER_ANIMATION_FUNCTION_DEFAULT_VALUE}
                setValue={setMaxFramesPerAnimationFunction}
                min={MAX_FRAMES_PER_ANIMATION_FUNCTION_MIN_VALUE}
                max={MAX_FRAMES_PER_ANIMATION_FUNCTION_MAX_VALUE}
                defaultValue={MAX_FRAMES_PER_ANIMATION_FUNCTION_DEFAULT_VALUE}
                width={64}
            />
        </VContainer>
    );
}
