import { URI, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { EditorsServices } from '../../../ves-editors-widget';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import Images from '../../ImageConvEditor/Images/Images';
import {
    BgmapMode,
    DisplayMode,
    EntityEditorContext,
    EntityEditorContextType,
    MAX_TEXTURE_PADDING,
    MIN_TEXTURE_PADDING,
    Sprite,
    SpriteType,
    Transparency
} from '../EntityEditorTypes';

interface SpriteProps {
    index: number
    sprite: Sprite
    fileUri: URI
    services: EditorsServices
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, sprite, fileUri, services } = props;

    const setSprite = (partialSpriteData: Partial<Sprite>): void => {
        const updatedSpritesArray = [...data.sprites.sprites];
        updatedSpritesArray[index] = {
            ...updatedSpritesArray[index],
            ...partialSpriteData,
        };

        const updatedSprites = { ...data.sprites };
        updatedSprites.sprites = updatedSpritesArray;

        setData({ sprites: updatedSprites });
    };

    const setManipulationFunction = (manipulationFunction: string): void => {
        setSprite({
            manipulationFunction,
        });
    };

    const setTransparency = (transparency: Transparency): void => {
        setSprite({
            transparency,
        });
    };

    const setBgmapMode = (bgmapMode: BgmapMode): void => {
        setSprite({
            bgmapMode,
        });
    };

    const setDisplayMode = (displayMode: DisplayMode): void => {
        setSprite({
            displayMode,
        });
    };

    const setPalette = (palette: number): void => {
        setSprite({
            texture: {
                ...data.sprites.sprites[index].texture,
                palette: Math.min(Math.max(palette, 0), 3),
            },
        });
    };

    const setPaddingX = (x: number): void => {
        setSprite({
            texture: {
                ...data.sprites.sprites[index].texture,
                padding: {
                    ...data.sprites.sprites[index].texture.padding,
                    x: Math.min(Math.max(x, MIN_TEXTURE_PADDING), MAX_TEXTURE_PADDING),
                },
            },
        });
    };

    const setPaddingY = (y: number): void => {
        setSprite({
            texture: {
                ...data.sprites.sprites[index].texture,
                padding: {
                    ...data.sprites.sprites[index].texture.padding,
                    y: Math.min(Math.max(y, MIN_TEXTURE_PADDING), MAX_TEXTURE_PADDING),
                },
            },
        });
    };

    const setDisplacementX = (x: number): void => {
        setSprite({
            displacement: {
                ...data.sprites.sprites[index].displacement,
                x,
            },
        });
    };

    const setDisplacementY = (y: number): void => {
        setSprite({
            displacement: {
                ...data.sprites.sprites[index].displacement,
                y,
            },
        });
    };

    const setDisplacementZ = (z: number): void => {
        setSprite({
            displacement: {
                ...data.sprites.sprites[index].displacement,
                z,
            },
        });
    };

    const setDisplacementParallax = (parallax: number): void => {
        setSprite({
            displacement: {
                ...data.sprites.sprites[index].displacement,
                parallax,
            },
        });
    };

    const toggleRecycleable = (): void => {
        setSprite({
            texture: {
                ...sprite.texture,
                recycleable: !sprite.texture.recycleable,
            }
        });
    };

    const toggleFlipHorizontally = (): void => {
        setSprite({
            texture: {
                ...sprite.texture,
                flip: {
                    ...sprite.texture.flip,
                    horizontal: !sprite.texture.flip.horizontal
                },
            }
        });
    };

    const toggleFlipVertically = (): void => {
        setSprite({
            texture: {
                ...sprite.texture,
                flip: {
                    ...sprite.texture.flip,
                    vertical: !sprite.texture.flip.vertical
                },
            }
        });
    };

    const removeSprite = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeSprite', 'Remove Sprite'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveSprite', 'Are you sure you want to remove this sprite?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedSprites = { ...data.sprites };
            updatedSprites.sprites = [
                ...data.sprites.sprites.slice(0, index),
                ...data.sprites.sprites.slice(index + 1)
            ];

            setData({ sprites: updatedSprites });
        }
    };

    const setFiles = (files: string[]): void => {
        setSprite({
            texture: {
                ...sprite.texture,
                files
            }
        });
    };

    return <div className='item'>
        <VContainer gap={10}>
            <HContainer alignItems='start' gap={10}>
                <HContainer gap={10} grow={1} wrap='wrap'>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/padding', 'Padding (X, Y)')}
                        </label>
                        <HContainer>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={MIN_TEXTURE_PADDING}
                                max={MAX_TEXTURE_PADDING}
                                value={sprite.texture.padding.x}
                                onChange={e => setPaddingX(parseInt(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={MIN_TEXTURE_PADDING}
                                max={MAX_TEXTURE_PADDING}
                                value={sprite.texture.padding.y}
                                onChange={e => setPaddingY(parseInt(e.target.value))}
                            />
                        </HContainer>
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/displacement', 'Displacement (X, Y, Z, Parallax)')}
                        </label>
                        <HContainer>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                value={sprite.displacement.x}
                                onChange={e => setDisplacementX(parseInt(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                value={sprite.displacement.y}
                                onChange={e => setDisplacementY(parseInt(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                value={sprite.displacement.z}
                                onChange={e => setDisplacementZ(parseInt(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                value={sprite.displacement.parallax}
                                onChange={e => setDisplacementParallax(parseInt(e.target.value))}
                            />
                        </HContainer>
                    </VContainer>
                </HContainer>
                <button
                    className="theia-button secondary remove-button"
                    onClick={removeSprite}
                    title={nls.localize('vuengine/entityEditor/remove', 'Remove')}
                >
                    <i className='fa fa-trash' />
                </button>
            </HContainer>
            <HContainer gap={10} wrap='wrap'>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/transparency', 'Transparency')}
                    </label>
                    <SelectComponent
                        options={[{
                            value: Transparency.None,
                            label: nls.localize('vuengine/entityEditor/transparencyNone', 'None'),
                            description: nls.localize('vuengine/entityEditor/transparencyNoneDescription', 'Display every frame'),
                        }, {
                            value: Transparency.Odd,
                            label: nls.localize('vuengine/entityEditor/transparencyOdd', 'Odd'),
                            description: nls.localize('vuengine/entityEditor/transparencyOddDescription', 'Display only every odd frame'),
                        }, {
                            value: Transparency.Even,
                            label: nls.localize('vuengine/entityEditor/transparencyEven', 'Even'),
                            description: nls.localize('vuengine/entityEditor/transparencyEvenDescription', 'Display only every even frame'),
                        }]}
                        defaultValue={sprite.transparency}
                        onChange={option => setTransparency(option.value as Transparency)}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/displayMode', 'Display Mode')}
                    </label>
                    <SelectComponent
                        options={[
                            { value: DisplayMode.Both, label: nls.localize('vuengine/entityEditor/displayModeBoth', 'Both') },
                            { value: DisplayMode.Left, label: nls.localize('vuengine/entityEditor/displayModeLeft', 'Left') },
                            { value: DisplayMode.Right, label: nls.localize('vuengine/entityEditor/displayModeRight', 'Right') },
                        ]}
                        defaultValue={sprite.displayMode}
                        onChange={option => setDisplayMode(option.value as DisplayMode)}
                    />
                </VContainer>
                {data.sprites.type === SpriteType.Bgmap && <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/bgmapMode', 'Bgmap Mode')}
                    </label>
                    <SelectComponent
                        options={[
                            {
                                value: BgmapMode.Bgmap,
                                label: nls.localize('vuengine/entityEditor/bgmapModeBgmap', 'Bgmap'),
                                description: nls.localize('vuengine/entityEditor/bgmapModeBgmapDescription', 'A regular sprite with no effects applied'),
                            },
                            {
                                value: BgmapMode.Affine,
                                label: nls.localize('vuengine/entityEditor/bgmapModeAffine', 'Affine'),
                                description: nls.localize('vuengine/entityEditor/bgmapModeAffineDescription', 'The sprite can be scaled and rotated'),
                            },
                            {
                                value: BgmapMode.HBias,
                                label: nls.localize('vuengine/entityEditor/bgmapModeHBias', 'HBias'),
                                description: nls.localize('vuengine/entityEditor/bgmapModeHBiasDescription', 'Each row of pixels of the sprite can be manipulated independently'),
                            },
                        ]}
                        defaultValue={sprite.bgmapMode}
                        onChange={option => setBgmapMode(option.value as BgmapMode)}
                    />
                </VContainer>}
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/palette', 'Palette')}
                    </label>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        min={0}
                        max={3}
                        value={sprite.texture.palette}
                        onChange={e => setPalette(parseInt(e.target.value))}
                    />
                </VContainer>
            </HContainer>
            {([BgmapMode.Affine, BgmapMode.HBias].includes(sprite.bgmapMode)) && <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/manipulationFunction', 'Manipulation Function')}
                </label>
                <input
                    className='theia-input'
                    type='string'
                    value={sprite.manipulationFunction}
                    onChange={e => setManipulationFunction(e.target.value)}
                />
            </VContainer>}
            <HContainer alignItems='start' gap={10}>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/texture', 'Texture')}
                    </label>
                    <HContainer gap={10} wrap="wrap">
                        <label>
                            <input
                                type="checkbox"
                                checked={sprite.texture.flip.horizontal}
                                onChange={toggleFlipHorizontally}
                            />
                            {nls.localize('vuengine/entityEditor/flipHorizontally', 'Flip Horizontally')}
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={sprite.texture.flip.vertical}
                                onChange={toggleFlipVertically}
                            />
                            {nls.localize('vuengine/entityEditor/flipVertically', 'Flip Vertically')}
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={sprite.texture.recycleable}
                                onChange={toggleRecycleable}
                            />
                            {nls.localize('vuengine/entityEditor/recycleable', 'Recycleable')}
                        </label>
                    </HContainer>
                </VContainer>
            </HContainer>
            <Images
                data={sprite.texture.files}
                updateData={setFiles}
                allInFolderAsFallback={false}
                canSelectMany={false}
                fileUri={fileUri}
                services={services}
            />
        </VContainer>
    </div>;
}
