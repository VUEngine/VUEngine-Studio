import { nls } from '@theia/core';
import { default as React } from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import {
    EAR_DISPLACEMENT_DEFAULT_VALUE,
    EAR_DISPLACEMENT_MAX_VALUE,
    EAR_DISPLACEMENT_MIN_VALUE,
    EngineConfigData,
    STEREO_ATTENUATION_DISTANCE_DEFAULT_VALUE,
    STEREO_ATTENUATION_DISTANCE_MAX_VALUE,
    STEREO_ATTENUATION_DISTANCE_MIN_VALUE,
    MAXIMUM_VOLUME_MIN_VALUE,
    MAXIMUM_VOLUME_MAX_VALUE,
    MAXIMUM_VOLUME_DEFAULT_VALUE
} from '../EngineConfigEditorTypes';

interface EngineConfigSoundProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigSound(props: EngineConfigSoundProps): React.JSX.Element {
    const { data, updateData } = props;

    const setEarDisplacement = (earDisplacement: number): void => {
        updateData({
            ...data,
            sound: {
                ...(data.sound ?? {}),
                earDisplacement,
            }
        });
    };

    const setStereoAttenuationDistance = (stereoAttenuationDistance: number): void => {
        updateData({
            ...data,
            sound: {
                ...(data.sound ?? {}),
                stereoAttenuationDistance,
            }
        });
    };

    const setGroupGeneralMaximumVolume = (value: number): void => {
        setMaximumVolume(value, 'general');
    };

    const setGroupEffectsMaximumVolume = (value: number): void => {
        setMaximumVolume(value, 'effects');
    };

    const setGroupMusicMaximumVolume = (value: number): void => {
        setMaximumVolume(value, 'music');
    };

    const setGroupOtherMaximumVolume = (value: number): void => {
        setMaximumVolume(value, 'other');
    };
    
    const setMaximumVolume = (value: number, group: 'general' | 'music' | 'effects' | 'other'): void => {
        updateData({
            ...data,
            sound: {
                ...(data.sound ?? {}),
                groups: {
                    ...data.sound?.groups,
                    [group]: value,
                }
            }
        });
    }

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize('vuengine/editors/engineConfig/sound/earDisplacement', 'Ear Displacement')}
                type="number"
                value={data.sound?.earDisplacement ?? EAR_DISPLACEMENT_DEFAULT_VALUE}
                setValue={setEarDisplacement}
                min={EAR_DISPLACEMENT_MIN_VALUE}
                max={EAR_DISPLACEMENT_MAX_VALUE}
                defaultValue={EAR_DISPLACEMENT_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/sound/stereoAttenuationDistance',
                    'Stereo Attenuation Distance'
                )}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/sound/stereoAttenuationDistanceDescription',
                    "affects the amount of attenuation caused by the distance between the x coordinate and each ear's \
position defined by \"Ear Displacement\"."
                )}
                type="number"
                value={data.sound?.stereoAttenuationDistance ?? STEREO_ATTENUATION_DISTANCE_DEFAULT_VALUE}
                setValue={setStereoAttenuationDistance}
                min={STEREO_ATTENUATION_DISTANCE_MIN_VALUE}
                max={STEREO_ATTENUATION_DISTANCE_MAX_VALUE}
                defaultValue={STEREO_ATTENUATION_DISTANCE_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/sound/groups/general',
                    'Group General Maximum Volume'
                )}
                type="number"
                value={data.sound?.groups?.general ?? MAXIMUM_VOLUME_DEFAULT_VALUE}
                setValue={setGroupGeneralMaximumVolume}
                min={MAXIMUM_VOLUME_MIN_VALUE}
                max={MAXIMUM_VOLUME_MAX_VALUE}
                defaultValue={MAXIMUM_VOLUME_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/sound/groups/effects',
                    'Group Effects Maximum Volume'
                )}
                type="number"
                value={data.sound?.groups?.effects ?? MAXIMUM_VOLUME_DEFAULT_VALUE}
                setValue={setGroupEffectsMaximumVolume}
                min={MAXIMUM_VOLUME_MIN_VALUE}
                max={MAXIMUM_VOLUME_MAX_VALUE}
                defaultValue={MAXIMUM_VOLUME_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/sound/groups/music',
                    'Group Music Maximum Volume'
                )}
                type="number"
                value={data.sound?.groups?.music ?? MAXIMUM_VOLUME_DEFAULT_VALUE}
                setValue={setGroupMusicMaximumVolume}
                min={MAXIMUM_VOLUME_MIN_VALUE}
                max={MAXIMUM_VOLUME_MAX_VALUE}
                defaultValue={MAXIMUM_VOLUME_DEFAULT_VALUE}
                width={64}
            />
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/sound/groups/other',
                    'Group Other Maximum Volume'
                )}
                type="number"
                value={data.sound?.groups?.other ?? MAXIMUM_VOLUME_DEFAULT_VALUE}
                setValue={setGroupOtherMaximumVolume}
                min={MAXIMUM_VOLUME_MIN_VALUE}
                max={MAXIMUM_VOLUME_MAX_VALUE}
                defaultValue={MAXIMUM_VOLUME_DEFAULT_VALUE}
                width={64}
            />

        </VContainer>
    );
}
