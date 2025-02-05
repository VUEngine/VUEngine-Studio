import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor';
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
                label={nls.localize('vuengine/actorEditor/extraInfo', 'Extra Info')}
                value={data.extraProperties.extraInfo}
                setValue={v => setExtraInfo(v as string)}
                commands={INPUT_BLOCKING_COMMANDS}
            />
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/actorEditor/actorSize', 'Size (x, y, z)')}
                    tooltip={
                        nls.localize(
                            'vuengine/actorEditor/actorSizeDescription',
                            'Size of the actor in pixels. Used by streaming to test if out of screen bounds. ' +
                            'If 0, width and height will be inferred from the first sprite\'s texture\'s size.'
                        )}
                />
                <HContainer>
                    <Input
                        value={data.extraProperties.pixelSize.x}
                        setValue={v => setPixelSize('x', v as number)}
                        type='number'
                        min={MIN_ACTOR_PIXEL_SIZE}
                        max={MAX_ACTOR_PIXEL_SIZE}
                        width={54}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <Input
                        value={data.extraProperties.pixelSize.y}
                        setValue={v => setPixelSize('y', v as number)}
                        type='number'
                        min={MIN_ACTOR_PIXEL_SIZE}
                        max={MAX_ACTOR_PIXEL_SIZE}
                        width={54}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <Input
                        value={data.extraProperties.pixelSize.z}
                        setValue={v => setPixelSize('z', v as number)}
                        type='number'
                        min={MIN_ACTOR_PIXEL_SIZE}
                        max={MAX_ACTOR_PIXEL_SIZE}
                        width={54}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
