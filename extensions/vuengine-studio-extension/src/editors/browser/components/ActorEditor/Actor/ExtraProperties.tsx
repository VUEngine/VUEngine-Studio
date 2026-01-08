import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { ActorEditorContext, ActorEditorContextType, MAX_ACTOR_PIXEL_SIZE, MIN_ACTOR_PIXEL_SIZE } from '../ActorEditorTypes';

export default function ExtraProperties(): React.JSX.Element {
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;

    const setExtraInfo = (extraInfo: string): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                extraInfo,
            }
        });
    };

    const setPixelSize = (a: 'x' | 'y' | 'z', value: number): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                pixelSize: {
                    ...data.extraProperties.pixelSize,
                    [a]: value,
                },
            },
        });
    };

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize('vuengine/editors/actor/extraInfo', 'Extra Info')}
                value={data.extraProperties.extraInfo}
                setValue={setExtraInfo}
            />
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/actor/actorSize', 'Size (x, y, z)')}
                    tooltip={nls.localize(
                        'vuengine/editors/actor/actorSizeDescription',
                        "Size of the actor in pixels. Used by streaming to test if out of screen bounds. \
If 0, width and height will be inferred from the first sprite's texture size."
                    )}
                />
                <HContainer>
                    <Input
                        value={data.extraProperties.pixelSize.x}
                        setValue={v => setPixelSize('x', v as number)}
                        type='number'
                        min={MIN_ACTOR_PIXEL_SIZE}
                        max={MAX_ACTOR_PIXEL_SIZE}
                        width={64}
                    />
                    <Input
                        value={data.extraProperties.pixelSize.y}
                        setValue={v => setPixelSize('y', v as number)}
                        type='number'
                        min={MIN_ACTOR_PIXEL_SIZE}
                        max={MAX_ACTOR_PIXEL_SIZE}
                        width={64}
                    />
                    <Input
                        value={data.extraProperties.pixelSize.z}
                        setValue={v => setPixelSize('z', v as number)}
                        type='number'
                        min={MIN_ACTOR_PIXEL_SIZE}
                        max={MAX_ACTOR_PIXEL_SIZE}
                        width={64}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
