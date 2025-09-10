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
    STEREO_ATTENUATION_DISTANCE_MIN_VALUE
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

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize('vuengine/editors/engineConfig/animation/earDisplacement', 'Ear Displacement')}
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
                    'vuengine/editors/engineConfig/animation/stereoAttenuationDistance',
                    'Stereo Attenuation Distance'
                )}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/animation/stereoAttenuationDistanceDescription',
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
        </VContainer>
    );
}
