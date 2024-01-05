import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { ConversionResult } from '../../../../../images/browser/ves-images-types';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
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
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, sprite } = props;

    const getCharCount = (imageData: Partial<ConversionResult & { _dupeIndex: number }> | number | undefined): number => {
        if (imageData !== undefined) {
            if (typeof imageData === 'number') {
                if (imageData > 0) {
                    const pointedToImageData = data.sprites?.sprites[imageData - 1]._imageData;
                    if (pointedToImageData !== undefined) {
                        return getCharCount(pointedToImageData as Partial<ConversionResult>);
                    }
                }
            } else if (imageData.animation?.largestFrame) {
                return imageData.animation?.largestFrame;
            } else if (imageData.tiles?.count) {
                return data.animations?.enabled && !data.animations.multiframe
                    ? imageData.tiles?.count / data.animations?.totalFrames || 1
                    : imageData.tiles?.count;
            }
        }

        return 0;
    };

    const setSprite = (partialSpriteData: Partial<Sprite>, appendImageData = false): void => {
        const updatedSpritesArray = [...data.sprites.sprites];
        updatedSpritesArray[index] = {
            ...updatedSpritesArray[index],
            ...partialSpriteData,
        };

        const updatedSprites = { ...data.sprites };
        updatedSprites.sprites = updatedSpritesArray;

        setData({
            sprites: updatedSprites
        }, {
            appendImageData
        });
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

            setData({
                sprites: updatedSprites
            }, {
                appendImageData: true
            });
        }
    };

    const setFiles = (files: string[]): void => {
        setSprite({
            texture: {
                ...sprite.texture,
                files
            }
        }, true);
    };

    return <VContainer className='item' gap={15}>
        <button
            className="remove-button"
            onClick={removeSprite}
            title={nls.localize('vuengine/entityEditor/remove', 'Remove')}
        >
            <i className='codicon codicon-x' />
        </button>
        <HContainer gap={15} grow={1} wrap='wrap'>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/chars', 'Chars')}
                </label>
                <input
                    className='theia-input heaviness'
                    style={{ width: 40 }}
                    type='text'
                    value={getCharCount(sprite._imageData)}
                    disabled
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/displays', 'Displays')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/displayModeDescription',
                        // eslint-disable-next-line max-len
                        'Select which screens the sprite should be visible on. Can be used to set up a stereo sprite by creating one sprite each for the left and right eye versions.'
                    )}
                />
                <RadioSelect
                    options={[
                        { value: DisplayMode.Left, label: nls.localize('vuengine/entityEditor/displayModeLeft', 'Left') },
                        { value: DisplayMode.Right, label: nls.localize('vuengine/entityEditor/displayModeRight', 'Right') },
                    ]}
                    canSelectMany={true}
                    allowBlank={false}
                    defaultValue={sprite.displayMode === DisplayMode.Both
                        ? [DisplayMode.Left, DisplayMode.Right]
                        : sprite.displayMode
                    }
                    onChange={options => setDisplayMode(options.length === 2
                        ? DisplayMode.Both
                        : options[0].value as DisplayMode)
                    }
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/transparency', 'Transparency')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/spriteTransparencyDescription',
                        // eslint-disable-next-line max-len
                        'With transparency enabled, this sprite will only be shown on every even or odd screen, resulting in it appearing transparent (and slightly dimmer). This also halves CPU load since 50% less pixels have to be rendered per frame in average.'
                    )}
                />
                <RadioSelect
                    options={[{
                        value: Transparency.None,
                        label: nls.localize('vuengine/entityEditor/transparencyNone', 'None'),
                    }, {
                        value: Transparency.Odd,
                        label: nls.localize('vuengine/entityEditor/transparencyOdd', 'Odd'),
                    }, {
                        value: Transparency.Even,
                        label: nls.localize('vuengine/entityEditor/transparencyEven', 'Even'),
                    }]}
                    defaultValue={sprite.transparency}
                    onChange={options => setTransparency(options[0].value as Transparency)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/palette', 'Palette')}
                </label>
                <RadioSelect
                    options={[{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }]}
                    defaultValue={sprite.texture.palette}
                    onChange={options => setPalette(options[0].value as number)}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/displacement', 'Displacement (x, y, z, parallax)')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/displacementDescription',
                        // eslint-disable-next-line max-len
                        'Offset this sprite by the given amount of pixels from the entity\'s center. The parallax value controls the depth, while the z value is used for fine tuning.'
                    )}
                />
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
            {data.sprites.type === SpriteType.Bgmap && <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/bgmapMode', 'Bgmap Mode')}
                    tooltip={<>
                        <div>
                            <b>{nls.localize('vuengine/entityEditor/bgmapModeBgmap', 'Bgmap')}: </b>
                            {nls.localize(
                                'vuengine/entityEditor/bgmapModeBgmapDescription',
                                'A regular sprite with no effects applied.'
                            )}
                        </div><br />
                        <div>
                            <b>{nls.localize('vuengine/entityEditor/bgmapModeAffine', 'Affine')}: </b>
                            {nls.localize(
                                'vuengine/entityEditor/bgmapModeAffineDescription',
                                'The sprite can be scaled and rotated. This mode needs a lot of CPU resources and should be used sparsely.'
                            )}
                        </div><br />
                        <div>
                            <b>{nls.localize('vuengine/entityEditor/bgmapModeHBias', 'HBias')}: </b>
                            {nls.localize(
                                'vuengine/entityEditor/bgmapModeHBiasDescription',
                                'Each row of pixels of the sprite can be manipulated independently. This mode is slightly heavier on the CPU than regular Bgmap mode.'
                            )}
                        </div>
                    </>}
                />
                <RadioSelect
                    options={[
                        {
                            value: BgmapMode.Bgmap,
                            label: nls.localize('vuengine/entityEditor/bgmapModeBgmap', 'Bgmap'),
                        },
                        {
                            value: BgmapMode.Affine,
                            label: nls.localize('vuengine/entityEditor/bgmapModeAffine', 'Affine'),
                        },
                        {
                            value: BgmapMode.HBias,
                            label: nls.localize('vuengine/entityEditor/bgmapModeHBias', 'HBias'),
                        },
                    ]}
                    defaultValue={sprite.bgmapMode}
                    onChange={options => setBgmapMode(options[0].value as BgmapMode)}
                />
            </VContainer>}
            {(data.sprites.type === SpriteType.Bgmap && [BgmapMode.Affine, BgmapMode.HBias].includes(sprite.bgmapMode)) &&
                <>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/entityEditor/padding', 'Padding (X, Y)')}
                            tooltip={nls.localize(
                                'vuengine/entityEditor/paddingDescription',
                                'Pad texture data in memory by the specified amount of blank pixels to prevent fragments of surrounding textures to appear at the outer edges.'
                            )}
                        />
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
                        <InfoLabel
                            label={nls.localize('vuengine/entityEditor/manipulationFunction', 'Manipulation Function')}
                            tooltip={nls.localize(
                                'vuengine/entityEditor/manipulationFunctionDescription',
                                'Provide the name of the function responsible for handling the Affine or HBias transformations of this sprite.'
                            )}
                        />
                        <input
                            className='theia-input'
                            type='string'
                            value={sprite.manipulationFunction}
                            onChange={e => setManipulationFunction(e.target.value)}
                        />
                    </VContainer>
                </>
            }
        </HContainer>
        <HContainer alignItems='start' gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/texture', 'Texture')}
                </label>
                <HContainer gap={15} wrap="wrap">
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
        <VContainer>
            <InfoLabel
                label={data.animations.enabled
                    ? nls.localize('vuengine/entityEditor/files', 'Image File(s)')
                    : nls.localize('vuengine/entityEditor/file', 'Image File')}
                tooltip={nls.localize(
                    'vuengine/entityEditor/filesDescription',
                    // eslint-disable-next-line max-len
                    'PNG image to be used as texture. Must be four color indexed mode with the proper palette. When animations are enabled, select either a single file containing a vertical spritesheet, or multiple files, where each represents one animation frame.'
                )}
            />
            <VContainer style={{ maxHeight: 400, overflow: 'hidden' }}>
                <Images
                    data={sprite.texture.files}
                    updateData={setFiles}
                    allInFolderAsFallback={false}
                    canSelectMany={data.animations.enabled}
                />
            </VContainer>
        </VContainer>
    </VContainer>;
}
