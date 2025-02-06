import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import { clamp } from '../../Common/Utils';
import {
    EngineConfigData,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MAX_VALUE,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE,
    MAX_FRAMES_PER_ANIMATION_FUNCTION_DEFAULT_VALUE,
    MAX_FRAMES_PER_ANIMATION_FUNCTION_MAX_VALUE,
    MAX_FRAMES_PER_ANIMATION_FUNCTION_MIN_VALUE
} from '../EngineConfigEditorTypes';
import { nls } from '@theia/core';
import InfoLabel from '../../Common/InfoLabel';

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
                maxAnimationFunctionNameLength: clamp(
                    maxAnimationFunctionNameLength,
                    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE,
                    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MAX_VALUE,
                    MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE
                ),
            }
        });
    };

    const setMaxFramesPerAnimationFunction = (maxFramesPerAnimationFunction: number): void => {
        updateData({
            ...data,
            animation: {
                ...(data.animation ?? {}),
                maxFramesPerAnimationFunction: clamp(
                    maxFramesPerAnimationFunction,
                    MAX_FRAMES_PER_ANIMATION_FUNCTION_MIN_VALUE,
                    MAX_FRAMES_PER_ANIMATION_FUNCTION_MAX_VALUE,
                    MAX_FRAMES_PER_ANIMATION_FUNCTION_DEFAULT_VALUE
                ),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/animation/maxAnimationFunctionNameLength',
                        'Maximum Animation Function Name Length'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/animation/maxAnimationFunctionNameLengthDescription',
                        'The maximum length of an animation function name.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.animation?.maxAnimationFunctionNameLength ?? MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE}
                    min={MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE}
                    max={MAX_ANIMATION_FUNCTION_NAME_LENGTH_MAX_VALUE}
                    onChange={e => setMaxAnimationFunctionNameLength(e.target.value === '' ? MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/animation/maxFramesPerAnimationFunction',
                        'Maximum Number of Frames per Animation Function'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/animation/maxFramesPerAnimationFunctionDescription',
                        'The maximum number of frames that any animation function can consist of.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.animation?.maxFramesPerAnimationFunction ?? MAX_FRAMES_PER_ANIMATION_FUNCTION_DEFAULT_VALUE}
                    min={MAX_FRAMES_PER_ANIMATION_FUNCTION_MIN_VALUE}
                    max={MAX_FRAMES_PER_ANIMATION_FUNCTION_MAX_VALUE}
                    onChange={e => setMaxFramesPerAnimationFunction(e.target.value === '' ? MAX_FRAMES_PER_ANIMATION_FUNCTION_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
        </VContainer>
    );
}
