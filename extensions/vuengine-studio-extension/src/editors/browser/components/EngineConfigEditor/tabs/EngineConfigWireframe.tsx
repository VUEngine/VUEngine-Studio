import React from 'react';
import VContainer from '../../Common/Base/VContainer';
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
import InfoLabel from '../../Common/InfoLabel';
import { nls } from '@theia/core';
import { clamp } from '../../Common/Utils';

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
                interlacedThreshold: clamp(
                    interlacedThreshold,
                    WIREFRAMES_INTERLACED_THRESHOLD_MIN_VALUE,
                    WIREFRAMES_INTERLACED_THRESHOLD_MAX_VALUE,
                    WIREFRAMES_INTERLACED_THRESHOLD_DEFAULT_VALUE
                ),
            }
        });
    };

    const setLineShrinkingPadding = (lineShrinkingPadding: number): void => {
        updateData({
            ...data,
            wireframes: {
                ...(data.wireframes ?? {}),
                lineShrinkingPadding: clamp(
                    lineShrinkingPadding,
                    WIREFRAMES_LINE_SHRINKING_PADDING_MIN_VALUE,
                    WIREFRAMES_LINE_SHRINKING_PADDING_MAX_VALUE,
                    WIREFRAMES_LINE_SHRINKING_PADDING_DEFAULT_VALUE
                ),
            }
        });
    };

    const setFrustumExtensionPower = (frustumExtensionPower: number): void => {
        updateData({
            ...data,
            wireframes: {
                ...(data.wireframes ?? {}),
                frustumExtensionPower: clamp(
                    frustumExtensionPower,
                    WIREFRAMES_FRUSTUM_EXTENSION_POWER_MIN_VALUE,
                    WIREFRAMES_FRUSTUM_EXTENSION_POWER_MAX_VALUE,
                    WIREFRAMES_FRUSTUM_EXTENSION_POWER_DEFAULT_VALUE
                ),
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
                    label={nls.localize('vuengine/engineConfigEditor/wireframes/sort', 'Sort')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/wireframes/sortDescription',
                        'Sort the wireframes based on their distance to the camera to cull off those that are far off if necessary.'
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.wireframes?.sort ?? WIREFRAMES_SORT_DEFAULT_VALUE}
                    onChange={() => toggleSort()}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/affine/interlacedThreshold', 'Interlaced Threshold')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/affine/interlacedThresholdDescription',
                        'The distance to start interlacing wireframe graphics.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.wireframes?.interlacedThreshold ?? WIREFRAMES_INTERLACED_THRESHOLD_DEFAULT_VALUE}
                    min={WIREFRAMES_INTERLACED_THRESHOLD_MIN_VALUE}
                    max={WIREFRAMES_INTERLACED_THRESHOLD_MAX_VALUE}
                    onChange={e => setInterlacedThreshold(e.target.value === '' ? WIREFRAMES_INTERLACED_THRESHOLD_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/affine/lineShrinkingPadding', 'Line Shrinking Padding')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/affine/lineShrinkingPaddingDescription',
                        'Threshold before shrinking lines.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.wireframes?.lineShrinkingPadding ?? WIREFRAMES_LINE_SHRINKING_PADDING_DEFAULT_VALUE}
                    min={WIREFRAMES_LINE_SHRINKING_PADDING_MIN_VALUE}
                    max={WIREFRAMES_LINE_SHRINKING_PADDING_MAX_VALUE}
                    onChange={e => setLineShrinkingPadding(e.target.value === '' ? WIREFRAMES_LINE_SHRINKING_PADDING_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/affine/frustumExtensionPower', 'Frustum Extension Power')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/affine/frustumExtensionPowerDescription',
                        'Frustum extension power for line shrinking checks.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.wireframes?.frustumExtensionPower ?? WIREFRAMES_FRUSTUM_EXTENSION_POWER_DEFAULT_VALUE}
                    min={WIREFRAMES_FRUSTUM_EXTENSION_POWER_MIN_VALUE}
                    max={WIREFRAMES_FRUSTUM_EXTENSION_POWER_MAX_VALUE}
                    onChange={e => setFrustumExtensionPower(e.target.value === '' ? WIREFRAMES_FRUSTUM_EXTENSION_POWER_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/wireframes/verticalLineOptimization', 'Vertical Line Optimization')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/wireframes/verticalLineOptimizationDescription',
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
