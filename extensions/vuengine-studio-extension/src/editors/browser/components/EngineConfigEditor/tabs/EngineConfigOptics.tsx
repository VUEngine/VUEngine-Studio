import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import {
    BASE_FACTOR_DEFAULT_VALUE,
    BASE_FACTOR_MAX_VALUE,
    BASE_FACTOR_MIN_VALUE,
    CAMERA_NEAR_PLANE_DEFAULT_VALUE,
    CAMERA_NEAR_PLANE_MAX_VALUE,
    CAMERA_NEAR_PLANE_MIN_VALUE,
    EngineConfigData,
    MAX_VIEW_DISTANCE_X_DEFAULT_VALUE,
    MAX_VIEW_DISTANCE_X_MAX_VALUE,
    MAX_VIEW_DISTANCE_X_MIN_VALUE,
    MAX_VIEW_DISTANCE_Y_DEFAULT_VALUE,
    MAX_VIEW_DISTANCE_Y_MAX_VALUE,
    MAX_VIEW_DISTANCE_Y_MIN_VALUE,
    SCALING_MODIFIER_FACTOR_DEFAULT_VALUE,
    SCALING_MODIFIER_FACTOR_MAX_VALUE,
    SCALING_MODIFIER_FACTOR_MIN_VALUE,
    SCREEN_DEPTH_DEFAULT_VALUE,
    SCREEN_DEPTH_MAX_VALUE,
    SCREEN_DEPTH_MIN_VALUE,
    SCREEN_HEIGHT_DEFAULT_VALUE,
    SCREEN_HEIGHT_MAX_VALUE,
    SCREEN_HEIGHT_MIN_VALUE,
    SCREEN_WIDTH_DEFAULT_VALUE,
    SCREEN_WIDTH_MAX_VALUE,
    SCREEN_WIDTH_MIN_VALUE,
    USE_LEGACY_COORDINATE_PROJECTION_DEFAULT_VALUE,
    VIEW_POINT_CENTER_HORIZONTAL_DEFAULT_VALUE,
    VIEW_POINT_CENTER_HORIZONTAL_MAX_VALUE,
    VIEW_POINT_CENTER_HORIZONTAL_MIN_VALUE,
    VIEW_POINT_CENTER_VERTICAL_DEFAULT_VALUE,
    VIEW_POINT_CENTER_VERTICAL_MAX_VALUE,
    VIEW_POINT_CENTER_VERTICAL_MIN_VALUE
} from '../EngineConfigEditorTypes';
import HContainer from '../../Common/Base/HContainer';

interface EngineConfigOpticsProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigOptics(props: EngineConfigOpticsProps): React.JSX.Element {
    const { data, updateData } = props;

    const setBaseFactor = (baseFactor: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                baseFactor: clamp(
                    baseFactor,
                    BASE_FACTOR_MIN_VALUE,
                    BASE_FACTOR_MAX_VALUE,
                    BASE_FACTOR_DEFAULT_VALUE
                ),
            }
        });
    };

    const setCameraNearPlane = (cameraNearPlane: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                cameraNearPlane: clamp(
                    cameraNearPlane,
                    CAMERA_NEAR_PLANE_MIN_VALUE,
                    CAMERA_NEAR_PLANE_MAX_VALUE,
                    CAMERA_NEAR_PLANE_DEFAULT_VALUE
                ),
            }
        });
    };

    const setMaximumXViewDistance = (maximumViewDistance: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                maximumXViewDistance: clamp(
                    maximumViewDistance,
                    MAX_VIEW_DISTANCE_X_MIN_VALUE,
                    MAX_VIEW_DISTANCE_X_MAX_VALUE,
                    MAX_VIEW_DISTANCE_X_DEFAULT_VALUE
                ),
            }
        });
    };

    const setMaximumYViewDistance = (maximumViewDistance: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                maximumYViewDistance: clamp(
                    maximumViewDistance,
                    MAX_VIEW_DISTANCE_Y_MIN_VALUE,
                    MAX_VIEW_DISTANCE_Y_MAX_VALUE,
                    MAX_VIEW_DISTANCE_Y_DEFAULT_VALUE
                ),
            }
        });
    };

    const setScalingModifierFactor = (scalingModifierFactor: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                scalingModifierFactor: clamp(
                    scalingModifierFactor,
                    SCALING_MODIFIER_FACTOR_MIN_VALUE,
                    SCALING_MODIFIER_FACTOR_MAX_VALUE,
                    SCALING_MODIFIER_FACTOR_DEFAULT_VALUE
                ),
            }
        });
    };

    const setHorizontalViewPointCenter = (horizontalViewPointCenter: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                horizontalViewPointCenter: clamp(
                    horizontalViewPointCenter,
                    VIEW_POINT_CENTER_HORIZONTAL_MIN_VALUE,
                    VIEW_POINT_CENTER_HORIZONTAL_MAX_VALUE,
                    VIEW_POINT_CENTER_HORIZONTAL_DEFAULT_VALUE
                ),
            }
        });
    };

    const setVerticalViewPointCenter = (verticalViewPointCenter: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                verticalViewPointCenter: clamp(
                    verticalViewPointCenter,
                    VIEW_POINT_CENTER_VERTICAL_MIN_VALUE,
                    VIEW_POINT_CENTER_VERTICAL_MAX_VALUE,
                    VIEW_POINT_CENTER_VERTICAL_DEFAULT_VALUE
                ),
            }
        });
    };

    const setScreenDepth = (screenDepth: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                screenDepth: clamp(
                    screenDepth,
                    SCREEN_DEPTH_MIN_VALUE,
                    SCREEN_DEPTH_MAX_VALUE,
                    SCREEN_DEPTH_DEFAULT_VALUE
                ),
            }
        });
    };

    const setScreenHeight = (screenHeight: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                screenHeight: clamp(
                    screenHeight,
                    SCREEN_HEIGHT_MIN_VALUE,
                    SCREEN_HEIGHT_MAX_VALUE,
                    SCREEN_HEIGHT_DEFAULT_VALUE
                ),
            }
        });
    };

    const setScreenWidth = (screenWidth: number): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                screenWidth: clamp(
                    screenWidth,
                    SCREEN_WIDTH_MIN_VALUE,
                    SCREEN_WIDTH_MAX_VALUE,
                    SCREEN_WIDTH_DEFAULT_VALUE
                ),
            }
        });
    };

    const toggleUseLegacyCoordinateProjection = (): void => {
        updateData({
            ...data,
            optics: {
                ...(data.optics ?? {}),
                useLegacyCoordinateProjection: !(data.optics?.useLegacyCoordinateProjection
                    ?? USE_LEGACY_COORDINATE_PROJECTION_DEFAULT_VALUE),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/optics/baseFactor',
                        'Base Factor'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/optics/baseFactorDescription',
                        'The distance between eyes.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.optics?.baseFactor ?? BASE_FACTOR_DEFAULT_VALUE}
                    min={BASE_FACTOR_MIN_VALUE}
                    max={BASE_FACTOR_MAX_VALUE}
                    onChange={e => setBaseFactor(e.target.value === '' ? BASE_FACTOR_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/optics/cameraNearPlane',
                        'Camera Near Plane'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/optics/cameraNearPlaneDescription',
                        "The distance of the player's eyes to the virtual screen."
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.optics?.cameraNearPlane ?? CAMERA_NEAR_PLANE_DEFAULT_VALUE}
                    min={CAMERA_NEAR_PLANE_MIN_VALUE}
                    max={CAMERA_NEAR_PLANE_MAX_VALUE}
                    onChange={e => setCameraNearPlane(e.target.value === '' ? CAMERA_NEAR_PLANE_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/optics/maximumViewDistance',
                        'Maximum View Distance (power of two) (x, y)'
                    )}
                />
                <HContainer>
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.optics?.maximumXViewDistance ?? MAX_VIEW_DISTANCE_X_DEFAULT_VALUE}
                        min={MAX_VIEW_DISTANCE_X_MIN_VALUE}
                        max={MAX_VIEW_DISTANCE_X_MAX_VALUE}
                        onChange={e => setMaximumXViewDistance(e.target.value === '' ? MAX_VIEW_DISTANCE_X_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.optics?.maximumYViewDistance ?? MAX_VIEW_DISTANCE_Y_DEFAULT_VALUE}
                        min={MAX_VIEW_DISTANCE_Y_MIN_VALUE}
                        max={MAX_VIEW_DISTANCE_Y_MAX_VALUE}
                        onChange={e => setMaximumYViewDistance(e.target.value === '' ? MAX_VIEW_DISTANCE_Y_MIN_VALUE : parseInt(e.target.value))}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/optics/scalingModifierFactor',
                        'Scaling Modifier Factor'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/optics/scalingModifierFactorDescription',
                        'The scaling modifier factor, affects the strength of sprite scaling.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.optics?.scalingModifierFactor ?? SCALING_MODIFIER_FACTOR_DEFAULT_VALUE}
                    min={SCALING_MODIFIER_FACTOR_MIN_VALUE}
                    max={SCALING_MODIFIER_FACTOR_MAX_VALUE}
                    onChange={e => setScalingModifierFactor(e.target.value === '' ? SCALING_MODIFIER_FACTOR_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/optics/screenSizeInPixels',
                        'Screen Size (in pixels) (x, y, z)'
                    )}
                />
                <HContainer>
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.optics?.screenWidth ?? SCREEN_WIDTH_DEFAULT_VALUE}
                        min={SCREEN_WIDTH_MIN_VALUE}
                        max={SCREEN_WIDTH_MAX_VALUE}
                        onChange={e => setScreenWidth(e.target.value === '' ? SCREEN_WIDTH_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.optics?.screenHeight ?? SCREEN_HEIGHT_DEFAULT_VALUE}
                        min={SCREEN_HEIGHT_MIN_VALUE}
                        max={SCREEN_HEIGHT_MAX_VALUE}
                        onChange={e => setScreenHeight(e.target.value === '' ? SCREEN_HEIGHT_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.optics?.screenDepth ?? SCREEN_DEPTH_DEFAULT_VALUE}
                        min={SCREEN_DEPTH_MIN_VALUE}
                        max={SCREEN_DEPTH_MAX_VALUE}
                        onChange={e => setScreenDepth(e.target.value === '' ? SCREEN_DEPTH_MIN_VALUE : parseInt(e.target.value))}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/optics/viewPointCenter',
                        'View Point Center (x, y)'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/optics/viewPointCenterDescription',
                        "The horizontal and vertical positions of the player's eyes."
                    )}
                />
                <HContainer>
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.optics?.horizontalViewPointCenter ?? VIEW_POINT_CENTER_HORIZONTAL_DEFAULT_VALUE}
                        min={VIEW_POINT_CENTER_HORIZONTAL_MIN_VALUE}
                        max={VIEW_POINT_CENTER_HORIZONTAL_MAX_VALUE}
                        onChange={e => setHorizontalViewPointCenter(e.target.value === '' ? VIEW_POINT_CENTER_HORIZONTAL_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.optics?.verticalViewPointCenter ?? VIEW_POINT_CENTER_VERTICAL_DEFAULT_VALUE}
                        min={VIEW_POINT_CENTER_VERTICAL_MIN_VALUE}
                        max={VIEW_POINT_CENTER_VERTICAL_MAX_VALUE}
                        onChange={e => setVerticalViewPointCenter(e.target.value === '' ? VIEW_POINT_CENTER_VERTICAL_MIN_VALUE : parseInt(e.target.value))}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/optics/useLegacyCoordinateProjection',
                        'Use Legacy Coordinate Projection'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/optics/useLegacyCoordinateProjectionDescription',
                        'Use the legacy coordinate system where (0, 0, 0) is at the top left corner of the screen, instead of in the middle of it.'
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.optics?.useLegacyCoordinateProjection ?? USE_LEGACY_COORDINATE_PROJECTION_DEFAULT_VALUE}
                    onChange={() => toggleUseLegacyCoordinateProjection()}
                />
            </VContainer>
        </VContainer>
    );
}
