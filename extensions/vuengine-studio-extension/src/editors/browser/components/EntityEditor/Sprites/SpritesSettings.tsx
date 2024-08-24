import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';
import { SpriteType } from '../../Common/VUEngineTypes';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function SpritesSettings(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const setType = (type: SpriteType): void => {
        setData({
            sprites: {
                ...data.sprites,
                type,
            }
        });
    };

    const toggleUseZDisplacementInProjection = (): void => {
        setData({
            sprites: {
                ...data.sprites,
                useZDisplacementInProjection: !data.sprites.useZDisplacementInProjection,
            }
        });
    };

    return <VContainer gap={10}>
        <label>
            {nls.localize('vuengine/entityEditor/generalSpritesSettings', 'General Sprites Settings')}
        </label>
        <HContainer gap={15} wrap='wrap'>
            <HContainer gap={15} wrap='wrap'>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/spriteType', 'Type')}
                    </label>
                    <RadioSelect
                        options={[{
                            value: SpriteType.Bgmap,
                        }, {
                            value: SpriteType.Object,
                        }]}
                        defaultValue={data.sprites.type}
                        onChange={options => setType(options[0].value as SpriteType)}
                    />
                </VContainer>
            </HContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/projection', 'Projection')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.sprites.useZDisplacementInProjection}
                        onChange={toggleUseZDisplacementInProjection}
                    />
                    {nls.localize('vuengine/entityEditor/useZDisplacement', 'Use Z Displacement')}
                </label>
            </VContainer>
        </HContainer>
    </VContainer>;
}
