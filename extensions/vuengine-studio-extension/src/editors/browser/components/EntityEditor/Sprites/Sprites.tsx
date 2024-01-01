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

    const setCustomClass = (customClass: string): void => {
        setData({
            sprites: {
                ...data.sprites,
                customClass,
            }
        });
    };

    const setSection = (section: DataSection) => {
        setData({
            sprites: {
                ...data.sprites,
                section,
            }
        });
    };

    const setTilesCompression = (compression: ImageCompressionType) => {
        setData({
            sprites: {
                ...data.sprites,
                compression,
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

    const toggleOptimizedTiles = (): void => {
        setData({
            sprites: {
                ...data.sprites,
                optimizedTiles: !data.sprites.optimizedTiles,
            }
        });
    };

    const toggleSharedTiles = (): void => {
        setData({
            sprites: {
                ...data.sprites,
                sharedTiles: !data.sprites.sharedTiles,
            }
        });
    };

    const addSprite = (): void => {
        const updatedSprites = { ...data.sprites };
        updatedSprites.sprites = [
            ...updatedSprites.sprites,
            {
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
                },
            },
        ];

        setData({
            sprites: updatedSprites,
        });
    };

    return <VContainer gap={20}>
        <HContainer alignItems='start' gap={10} wrap='wrap'>
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
                    {nls.localize('vuengine/entityEditor/customClass', 'Custom Class')}
                </label>
                <input
                    className='theia-input'
                    type='string'
                    value={data.sprites.customClass}
                    onChange={e => setCustomClass(e.target.value)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/section', 'Section')}
                </label>
                <SelectComponent
                    defaultValue={data.sprites.section}
                    options={[{
                        label: nls.localize('vuengine/entityEditor/romSpace', 'ROM Space'),
                        value: DataSection.ROM,
                        description: nls.localize('vuengine/entityEditor/romSpaceDescription', 'Store image data in ROM space'),
                    }, {
                        label: nls.localize('vuengine/entityEditor/expansionSpace', 'Expansion Space'),
                        value: DataSection.EXP,
                        description: nls.localize('vuengine/entityEditor/expansionSpaceDescription', 'Store image data in expansion space'),
                    }]}
                    onChange={option => setSection(option.value as DataSection)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/compression', 'Compression')}
                </label>
                <SelectComponent
                    defaultValue={data.sprites.compression}
                    options={[{
                        label: nls.localize('vuengine/entityEditor/compression/none', 'None'),
                        value: ImageCompressionType.NONE,
                        description: nls.localize('vuengine/entityEditor/compression/offDescription', 'Do not compress image data'),
                    }, {
                        label: nls.localize('vuengine/entityEditor/compression/rle', 'RLE'),
                        value: ImageCompressionType.RLE,
                        description: nls.localize('vuengine/entityEditor/compression/rleDescription', 'Compress image data with RLE'),
                    }]}
                    onChange={option => setTilesCompression(option.value as ImageCompressionType)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/tiles', 'Tiles')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.sprites.sharedTiles}
                        onChange={toggleSharedTiles}
                    />
                    {nls.localize('vuengine/entityEditor/shared', 'Shared')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.sprites.optimizedTiles}
                        onChange={toggleOptimizedTiles}
                    />
                    {nls.localize('vuengine/entityEditor/optimized', 'Optimized')}
                </label>
            </VContainer>
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
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/xSprites', 'Sprites ({0})', data.sprites.sprites.length)}
            </label>
            {data.sprites.sprites.length && data.sprites.sprites.map((s, i) =>
                <Sprite
                    key={`sprite-${i}`}
                    index={i}
                    sprite={s}
                    fileUri={fileUri}
                    services={services}
                />
            )}
            <button
                className='theia-button add-button full-width'
                onClick={addSprite}
                title={nls.localize('vuengine/entityEditor/addSprite', 'Add Sprite')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>
    </VContainer>;
}
