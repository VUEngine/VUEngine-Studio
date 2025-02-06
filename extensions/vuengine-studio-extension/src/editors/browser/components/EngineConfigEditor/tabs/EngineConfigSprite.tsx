import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import {
    EngineConfigData,
    HACK_BGMAP_SPRITE_HEIGHT_DEFAULT_VALUE,
    SPRITES_ROTATE_IN_3D_DEFAULT_VALUE,
    TOTAL_LAYERS_DEFAULT_VALUE,
    TOTAL_LAYERS_MAX_VALUE,
    TOTAL_LAYERS_MIN_VALUE,
    TOTAL_OBJECTS_DEFAULT_VALUE,
    TOTAL_OBJECTS_MAX_VALUE,
    TOTAL_OBJECTS_MIN_VALUE
} from '../EngineConfigEditorTypes';
import InfoLabel from '../../Common/InfoLabel';
import { nls } from '@theia/core';
import { clamp } from '../../Common/Utils';

interface EngineConfigSpriteProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigSprite(props: EngineConfigSpriteProps): React.JSX.Element {
    const { data, updateData } = props;

    const setTotalLayers = (totalLayers: number): void => {
        updateData({
            ...data,
            sprite: {
                ...(data.sprite ?? {}),
                totalLayers: clamp(
                    totalLayers,
                    TOTAL_LAYERS_MIN_VALUE,
                    TOTAL_LAYERS_MAX_VALUE,
                    TOTAL_LAYERS_DEFAULT_VALUE
                ),
            }
        });
    };

    const setTotalObjects = (totalObjects: number): void => {
        updateData({
            ...data,
            sprite: {
                ...(data.sprite ?? {}),
                totalObjects: clamp(
                    totalObjects,
                    TOTAL_OBJECTS_MIN_VALUE,
                    TOTAL_OBJECTS_MAX_VALUE,
                    TOTAL_OBJECTS_DEFAULT_VALUE
                ),
            }
        });
    };

    const toggleSpritesRotateIn3D = (): void => {
        updateData({
            ...data,
            sprite: {
                ...(data.sprite ?? {}),
                spritesRotateIn3D: !(data.sprite?.spritesRotateIn3D ?? SPRITES_ROTATE_IN_3D_DEFAULT_VALUE),
            }
        });
    };

    const toggleHackBgmapSpriteHeight = (): void => {
        updateData({
            ...data,
            sprite: {
                ...(data.sprite ?? {}),
                hackBgmapSpriteHeight: !(data.sprite?.hackBgmapSpriteHeight ?? HACK_BGMAP_SPRITE_HEIGHT_DEFAULT_VALUE),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/sprite/totalLayers', 'Total Layers')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/sprite/totalLayersDescription',
                        'Total number of available WORLDS.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.sprite?.totalLayers ?? TOTAL_LAYERS_DEFAULT_VALUE}
                    min={TOTAL_LAYERS_MIN_VALUE}
                    max={TOTAL_LAYERS_MAX_VALUE}
                    onChange={e => setTotalLayers(e.target.value === '' ? TOTAL_LAYERS_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/sprite/totalObjects', 'Total Objects')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/sprite/totalObjectsDescription',
                        'Total number of available OBJECTS.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.sprite?.totalObjects ?? TOTAL_OBJECTS_DEFAULT_VALUE}
                    min={TOTAL_OBJECTS_MIN_VALUE}
                    max={TOTAL_OBJECTS_MAX_VALUE}
                    onChange={e => setTotalObjects(e.target.value === '' ? TOTAL_OBJECTS_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/sprite/spritesRotateIn3D', 'Sprites Rotate In 3-D')}
                />
                <input
                    type="checkbox"
                    checked={data.sprite?.spritesRotateIn3D ?? SPRITES_ROTATE_IN_3D_DEFAULT_VALUE}
                    onChange={() => toggleSpritesRotateIn3D()}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/sprite/hackBgmapSpriteHeight', 'Hack: BGMap Sprite Height')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/sprite/hackBgmapSpriteHeightDescription',
                        "Account for VIP's design to draw 8 pixel when BGMAP WORLD's height is less than 8."
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.sprite?.hackBgmapSpriteHeight ?? HACK_BGMAP_SPRITE_HEIGHT_DEFAULT_VALUE}
                    onChange={() => toggleHackBgmapSpriteHeight()}
                />
            </VContainer>
        </VContainer>
    );
}
