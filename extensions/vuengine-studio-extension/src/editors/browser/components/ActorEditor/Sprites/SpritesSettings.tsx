import { nls } from '@theia/core';
import React, { useContext } from 'react';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import { SpriteType } from '../../Common/VUEngineTypes';
import { ActorEditorContext, ActorEditorContextType } from '../ActorEditorTypes';

export default function SpritesSettings(): React.JSX.Element {
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;

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
            {nls.localize('vuengine/editors/actor/generalSpritesSettings', 'General Sprites Settings')}
        </label>
        <HContainer gap={15} wrap='wrap'>
            <HContainer gap={15} wrap='wrap'>
                <VContainer>
                    <label>
                        {nls.localizeByDefault('Type')}
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
            <Checkbox
                label={nls.localize('vuengine/editors/actor/projection', 'Projection')}
                sideLabel={nls.localize('vuengine/editors/actor/useZDisplacement', 'Use Z Displacement')}
                checked={data.sprites.useZDisplacementInProjection}
                setChecked={toggleUseZDisplacementInProjection}
            />
        </HContainer>
    </VContainer>;
}
