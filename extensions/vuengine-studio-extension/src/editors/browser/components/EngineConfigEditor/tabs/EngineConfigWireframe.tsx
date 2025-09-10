import { nls } from '@theia/core';
import React from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import {
    EngineConfigData,
    WIREFRAMES_FRUSTUM_EXTENSION_POWER_DEFAULT_VALUE,
    WIREFRAMES_FRUSTUM_EXTENSION_POWER_MAX_VALUE,
    WIREFRAMES_FRUSTUM_EXTENSION_POWER_MIN_VALUE,
    WIREFRAMES_INTERLACED_THRESHOLD_DEFAULT_VALUE,
    WIREFRAMES_INTERLACED_THRESHOLD_MAX_VALUE,
    WIREFRAMES_INTERLACED_THRESHOLD_MIN_VALUE,
    WIREFRAMES_LINE_SHRINKING_PADDING_DEFAULT_VALUE,
    WIREFRAMES_LINE_SHRINKING_PADDING_MAX_VALUE,
    WIREFRAMES_LINE_SHRINKING_PADDING_MIN_VALUE,
    WIREFRAMES_SORT_DEFAULT_VALUE,
    WIREFRAMES_VERTICAL_LINE_OPTIMIZATION_DEFAULT_VALUE
} from '../EngineConfigEditorTypes';

interface EngineConfigWireframeProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigWireframe(props: EngineConfigWireframeProps): React.JSX.Element {
    const { data, updateData } = props;

    const toggleSort = (): void => {
        updateData({
            ...data,
            wireframes: {
                ...(data.wireframes ?? {}),
                sort: !(data.wireframes?.sort ?? WIREFRAMES_SORT_DEFAULT_VALUE),
            }
        });
    };

    const setInterlacedThreshold = (interlacedThreshold: number): void => {
        updateData({
            ...data,
            wireframes: {
                ...(data.wireframes ?? {}),
                interlacedThreshold,
            }
        });
    };

    const setLineShrinkingPadding = (lineShrinkingPadding: number): void => {
        updateData({
            ...data,
            wireframes: {
                ...(data.wireframes ?? {}),
                lineShrinkingPadding,
            }
        });
    };

    const setFrustumExtensionPower = (frustumExtensionPower: number): void => {
        updateData({
            ...data,
            wireframes: {
                ...(data.wireframes ?? {}),
                frustumExtensionPower,
            }
        });
    };

    const toggleVerticalLineOptimization = (): void => {
        updateData({
            ...data,
            wireframes: {
                ...(data.wireframes ?? {}),
                verticalLineOptimization: !(data.wireframes?.verticalLineOptimization ?? WIREFRAMES_SORT_DEFAULT_VALUE),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/wireframes/sort', 'Sort')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/wireframes/sortDescription',
                        'Sort the wireframes based on their distance to the camera to cull off those that are far off if necessary.'
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.wireframes?.sort ?? WIREFRAMES_SORT_DEFAULT_VALUE}
                    onChange={() => toggleSort()}
                />
            </VContainer>
            <Input
                label={nls.localize('vuengine/editors/engineConfig/affine/interlacedThreshold', 'Interlaced Threshold')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/affine/interlacedThresholdDescription',
                    'The distance to start interlacing wireframe graphics.'
                )}
                type="number"
                value={data.wireframes?.interlacedThreshold ?? WIREFRAMES_INTERLACED_THRESHOLD_DEFAULT_VALUE}
                setValue={setInterlacedThreshold}
                min={WIREFRAMES_INTERLACED_THRESHOLD_MIN_VALUE}
                max={WIREFRAMES_INTERLACED_THRESHOLD_MAX_VALUE}
                defaultValue={WIREFRAMES_INTERLACED_THRESHOLD_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize('vuengine/editors/engineConfig/affine/lineShrinkingPadding', 'Line Shrinking Padding')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/affine/lineShrinkingPaddingDescription',
                    'Threshold before shrinking lines.'
                )}
                type="number"
                value={data.wireframes?.lineShrinkingPadding ?? WIREFRAMES_LINE_SHRINKING_PADDING_DEFAULT_VALUE}
                setValue={setLineShrinkingPadding}
                min={WIREFRAMES_LINE_SHRINKING_PADDING_MIN_VALUE}
                max={WIREFRAMES_LINE_SHRINKING_PADDING_MAX_VALUE}
                defaultValue={WIREFRAMES_LINE_SHRINKING_PADDING_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize('vuengine/editors/engineConfig/affine/frustumExtensionPower', 'Frustum Extension Power')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/affine/frustumExtensionPowerDescription',
                    'Frustum extension power for line shrinking checks.'
                )}
                type="number"
                value={data.wireframes?.frustumExtensionPower ?? WIREFRAMES_FRUSTUM_EXTENSION_POWER_DEFAULT_VALUE}
                setValue={setFrustumExtensionPower}
                min={WIREFRAMES_FRUSTUM_EXTENSION_POWER_MIN_VALUE}
                max={WIREFRAMES_FRUSTUM_EXTENSION_POWER_MAX_VALUE}
                defaultValue={WIREFRAMES_FRUSTUM_EXTENSION_POWER_DEFAULT_VALUE}
                width={64}
            />
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/wireframes/verticalLineOptimization', 'Vertical Line Optimization')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/wireframes/verticalLineOptimizationDescription',
                        'Optimize drawing of vertical lines.'
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.wireframes?.verticalLineOptimization ?? WIREFRAMES_VERTICAL_LINE_OPTIMIZATION_DEFAULT_VALUE}
                    onChange={() => toggleVerticalLineOptimization()}
                />
            </VContainer>
        </VContainer>
    );
}
