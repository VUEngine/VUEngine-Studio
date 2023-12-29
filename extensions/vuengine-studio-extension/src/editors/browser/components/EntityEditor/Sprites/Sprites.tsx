import { URI, nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import { EditorsServices } from '../../../ves-editors-widget';
import { DataSection } from '../../Common/CommonTypes';
import VContainer from '../../Common/VContainer';
import { BgmapMode, DisplayMode, EntityEditorContext, EntityEditorContextType, SpriteType, Transparency } from '../EntityEditorTypes';
import Sprite from './Sprite';
import HContainer from '../../Common/HContainer';

interface SpritesProps {
    fileUri: URI
    services: EditorsServices
}

export default function Sprites(props: SpritesProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { fileUri, services } = props;

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

    const addSprite = (): void => {
        const updatedSprites = { ...data.sprites };
        updatedSprites.sprites = [
            ...updatedSprites.sprites,
            {
                class: 'BgmapSprite',
                section: DataSection.ROM,
                compression: ImageCompressionType.NONE,
                bgmapMode: BgmapMode.Bgmap,
                displayMode: DisplayMode.Both,
                transparency: Transparency.None,
                displacement: {
                    x: 0,
                    y: 0,
                    z: 0,
                    parallax: 0,
                },
                manipulationFunction: '',
                texture: {
                    charset: {
                        optimized: false,
                        shared: false,
                    },
                    files: [],
                    padding: {
                        x: 0,
                        y: 0,
                    },
                    palette: 0,
                    recycleable: false,
                    flip: {
                        horizontal: false,
                        vertical: false,
                    },
                    size: {
                        x: 0,
                        y: 0,
                    },
                },
            },
        ];

        setData({
            sprites: updatedSprites,
        });
    };

    return <VContainer gap={20}>
        <HContainer alignItems='start' gap={20}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/spriteType', 'Type')}
                </label>
                <SelectComponent
                    defaultValue={data.sprites.type}
                    options={[{
                        value: SpriteType.Bgmap,
                    }, {
                        value: SpriteType.Object,
                    }]}
                    onChange={option => setType(option.value as SpriteType)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/useZDisplacementInProjection', 'Use Z Displacement In Projection')}
                </label>
                <input
                    type="checkbox"
                    checked={data.sprites.useZDisplacementInProjection}
                    onChange={toggleUseZDisplacementInProjection}
                />
            </VContainer>
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/sprites', 'Sprites')}
            </label>
            {data.sprites.sprites.length
                ? data.sprites.sprites.map((s, i) =>
                    <Sprite
                        key={`sprite-${i}`}
                        index={i}
                        sprite={s}
                        fileUri={fileUri}
                        services={services}
                    />
                )
                : nls.localize('vuengine/entityEditor/noSprites', 'No Sprites')}
            <button
                className='theia-button secondary full-width'
                onClick={addSprite}
                title={nls.localize('vuengine/entityEditor/addSprite', 'Add Sprite')}
            >
                <i className='fa fa-plus' />
            </button>
        </VContainer>
    </VContainer>;
}
