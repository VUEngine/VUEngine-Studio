import { nls } from '@theia/core';
import React from 'react';
import Checkbox from '../../Common/Base/Checkbox';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
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
                totalLayers,
            }
        });
    };

    const setTotalObjects = (totalObjects: number): void => {
        updateData({
            ...data,
            sprite: {
                ...(data.sprite ?? {}),
                totalObjects,
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
            <Input
                label={nls.localize('vuengine/editors/engineConfig/sprite/totalLayers', 'Total Layers')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/sprite/totalLayersDescription',
                    'Total number of available WORLDS.'
                )}
                type="number"
                value={data.sprite?.totalLayers ?? TOTAL_LAYERS_DEFAULT_VALUE}
                setValue={setTotalLayers}
                min={TOTAL_LAYERS_MIN_VALUE}
                max={TOTAL_LAYERS_MAX_VALUE}
                defaultValue={TOTAL_LAYERS_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize('vuengine/editors/engineConfig/sprite/totalObjects', 'Total Objects')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/sprite/totalObjectsDescription',
                    'Total number of available OBJECTS.'
                )}
                type="number"
                value={data.sprite?.totalObjects ?? TOTAL_OBJECTS_DEFAULT_VALUE}
                setValue={setTotalObjects}
                min={TOTAL_OBJECTS_MIN_VALUE}
                max={TOTAL_OBJECTS_MAX_VALUE}
                defaultValue={TOTAL_OBJECTS_DEFAULT_VALUE}
                width={64}
            />
            <Checkbox
                label={nls.localize('vuengine/editors/engineConfig/sprite/spritesRotateIn3D', 'Sprites Rotate In 3-D')}
                checked={data.sprite?.spritesRotateIn3D ?? SPRITES_ROTATE_IN_3D_DEFAULT_VALUE}
                setChecked={toggleSpritesRotateIn3D}
            />
            <Checkbox
                label={nls.localize('vuengine/editors/engineConfig/sprite/hackBgmapSpriteHeight', 'Hack: BGMap Sprite Height')}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/sprite/hackBgmapSpriteHeightDescription',
                    "Account for VIP's design to draw 8 pixel when BGMAP WORLD's height is less than 8."
                )}
                checked={data.sprite?.hackBgmapSpriteHeight ?? HACK_BGMAP_SPRITE_HEIGHT_DEFAULT_VALUE}
                setChecked={toggleHackBgmapSpriteHeight}
            />
        </VContainer>
    );
}
