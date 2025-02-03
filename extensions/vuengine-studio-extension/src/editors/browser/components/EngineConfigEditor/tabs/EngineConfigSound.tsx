import { nls } from '@theia/core';
import { default as React } from 'react';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import {
    EAR_DISPLACEMENT_DEFAULT_VALUE,
    EAR_DISPLACEMENT_MAX_VALUE,
    EAR_DISPLACEMENT_MIN_VALUE,
    EngineConfigData,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MAX_VALUE,
    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE,
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
                earDisplacement: clamp(
                    earDisplacement,
                    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE,
                    MAX_ANIMATION_FUNCTION_NAME_LENGTH_MAX_VALUE,
                    MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE
                ),
            }
        });
    };

    const setStereoAttenuationDistance = (stereoAttenuationDistance: number): void => {
        updateData({
            ...data,
            sound: {
                ...(data.sound ?? {}),
                stereoAttenuationDistance: clamp(
                    stereoAttenuationDistance,
                    STEREO_ATTENUATION_DISTANCE_MIN_VALUE,
                    STEREO_ATTENUATION_DISTANCE_MAX_VALUE,
                    STEREO_ATTENUATION_DISTANCE_DEFAULT_VALUE
                ),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/animation/earDisplacement', 'Ear Displacement')}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.sound?.earDisplacement ?? EAR_DISPLACEMENT_DEFAULT_VALUE}
                    min={EAR_DISPLACEMENT_MIN_VALUE}
                    max={EAR_DISPLACEMENT_MAX_VALUE}
                    onChange={e => setEarDisplacement(e.target.value === '' ? EAR_DISPLACEMENT_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/engineConfigEditor/animation/stereoAttenuationDistance',
                        'Stereo Attenuation Distance'
                    )}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/animation/stereoAttenuationDistanceDescription',
                        "affects the amount of attenuation caused by the distance between the x coordinate and each ear's " +
                        'position defined by "Ear Displacement".'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.sound?.stereoAttenuationDistance ?? STEREO_ATTENUATION_DISTANCE_DEFAULT_VALUE}
                    min={STEREO_ATTENUATION_DISTANCE_MIN_VALUE}
                    max={STEREO_ATTENUATION_DISTANCE_MAX_VALUE}
                    onChange={e => setStereoAttenuationDistance(e.target.value === '' ? STEREO_ATTENUATION_DISTANCE_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
        </VContainer>
    );
}
