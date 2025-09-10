import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import { SpriteType } from '../../Common/VUEngineTypes';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditorTypes';
import { ActorEditorContext, ActorEditorContextType } from '../ActorEditorTypes';

export default function SpritesSettings(): React.JSX.Element {
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

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
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
            </HContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/actor/projection', 'Projection')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.sprites.useZDisplacementInProjection}
                        onChange={toggleUseZDisplacementInProjection}
                    />
                    {nls.localize('vuengine/editors/actor/useZDisplacement', 'Use Z Displacement')}
                </label>
            </VContainer>
        </HContainer>
    </VContainer>;
}
