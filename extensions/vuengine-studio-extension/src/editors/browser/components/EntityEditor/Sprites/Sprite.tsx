import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ConversionResult } from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';
import Images from '../../ImageEditor/Images/Images';
import { EntityEditorSaveDataOptions } from '../EntityEditor';
import {
    BgmapMode,
    DisplayMode,
    EntityEditorContext,
    EntityEditorContextType,
    MAX_TEXTURE_PADDING,
    MIN_TEXTURE_PADDING,
    SpriteData,
    SpriteType,
    Transparency
} from '../EntityEditorTypes';

interface SpriteProps {
    sprite: SpriteData
    updateSprite: (partialData: Partial<SpriteData>, options?: EntityEditorSaveDataOptions) => void
    isMultiFileAnimation: boolean
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { sprite, updateSprite, isMultiFileAnimation } = props;
    const [dimensions, setDimensions] = useState<string>('');
    const [filename, setFilename] = useState<string>('');

    const getMetaData = async (): Promise<void> => {
        if (sprite.texture?.files?.length) {
            const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
            const resolvedUri = workspaceRootUri.resolve(sprite.texture.files[0]);
            if (await services.fileService.exists(resolvedUri)) {
                let fn = resolvedUri.path.base;
                if (sprite.texture.files.length > 1) {
                    fn += ' +' + (sprite.texture.files.length - 1);
                }
                setFilename(fn);
                const d = await window.electronVesCore.getImageDimensions(resolvedUri.path.fsPath());
                const width = d.width ?? 0;
                let height = d.height ?? 0;
                if (data.components?.animations?.length > 0 && !isMultiFileAnimation && data.animations?.totalFrames) {
                    height /= data.animations?.totalFrames;
                }

                setDimensions(`${width}×${height}`);
            }
        } else {
            setFilename('');
            setDimensions('');
        }
    };

    const getCharCount = (imageData: Partial<ConversionResult & { _dupeIndex: number }> | number | undefined): number => {
        if (imageData !== undefined) {
            if (typeof imageData === 'number') {
                if (imageData > 0) {
                    const pointedToImageData = data.components?.sprites[imageData - 1]._imageData;
                    if (pointedToImageData !== undefined) {
                        return getCharCount(pointedToImageData as Partial<ConversionResult>);
                    }
                }
            } else if (imageData.animation?.largestFrame) {
                return imageData.animation?.largestFrame;
            } else if (imageData.tiles?.count) {
                return data.components?.animations?.length > 0 && !data.animations.multiframe
                    ? imageData.tiles?.count / data.animations?.totalFrames || 1
                    : imageData.tiles?.count;
            }
        }

        return 0;
    };

    const setManipulationFunction = (manipulationFunction: string): void => {
        updateSprite({
            manipulationFunction,
        });
    };

    const setTransparency = (transparency: Transparency): void => {
        updateSprite({
            transparency,
        });
    };

    const setBgmapMode = (bgmapMode: BgmapMode): void => {
        updateSprite({
            bgmapMode,
        });
    };

    const setDisplayMode = (displayMode: DisplayMode): void => {
        updateSprite({
            displayMode,
        });
    };

    const setPalette = (palette: number): void => {
        updateSprite({
            texture: {
                ...sprite.texture,
                palette: Math.min(Math.max(palette, 0), 3),
            },
        });
    };

    const setPaddingX = (x: number): void => {
        updateSprite({
            texture: {
                ...sprite.texture,
                padding: {
                    ...sprite.texture.padding,
                    x: Math.min(Math.max(x, MIN_TEXTURE_PADDING), MAX_TEXTURE_PADDING),
                },
            },
        });
    };

    const setPaddingY = (y: number): void => {
        updateSprite({
            texture: {
                ...sprite.texture,
                padding: {
                    ...sprite.texture.padding,
                    y: Math.min(Math.max(y, MIN_TEXTURE_PADDING), MAX_TEXTURE_PADDING),
                },
            },
        });
    };

    const setDisplacementX = (x: number): void => {
        updateSprite({
            displacement: {
                ...sprite.displacement,
                x,
            },
        });
    };

    const setDisplacementY = (y: number): void => {
        updateSprite({
            displacement: {
                ...sprite.displacement,
                y,
            },
        });
    };

    const setDisplacementZ = (z: number): void => {
        updateSprite({
            displacement: {
                ...sprite.displacement,
                z,
            },
        });
    };

    const setDisplacementParallax = (parallax: number): void => {
        updateSprite({
            displacement: {
                ...sprite.displacement,
                parallax,
            },
        });
    };

    const toggleRecycleable = (): void => {
        updateSprite({
            texture: {
                ...sprite.texture,
                recycleable: !sprite.texture.recycleable,
            }
        });
    };

    const toggleFlipHorizontally = (): void => {
        updateSprite({
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
        updateSprite({
            texture: {
                ...sprite.texture,
                flip: {
                    ...sprite.texture.flip,
                    vertical: !sprite.texture.flip.vertical
                },
            }
        });
    };

    const setFiles = (files: string[]): void => {
        updateSprite({
            texture: {
                ...sprite.texture,
                files
            }
        }, {
            appendImageData: true,
        });
    };

    useEffect(() => {
        getMetaData();
    }, [
        data.components?.animations?.length,
        data.animations?.totalFrames,
        isMultiFileAnimation,
        sprite.texture.files
    ]);

    const charCount = getCharCount(sprite._imageData);

    return (
        <HContainer gap={20} wrap='wrap'>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/image', 'Image')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/filesDescription',
                        'PNG image to be used as texture. Must be four color indexed mode with the proper palette. ' +
                        'When animations are enabled, select either a single file containing a vertical spritesheet, ' +
                        'or multiple files, where each represents one animation frame.'
                    )}
                />
                <HContainer gap={15}>
                    <Images
                        data={sprite.texture.files}
                        updateData={setFiles}
                        allInFolderAsFallback={false}
                        canSelectMany={data.components?.animations.length > 0}
                        stack={true}
                        showMetaData={false}
                    />
                    <VContainer grow={1}>
                        {filename !== '' &&
                            <div>
                                {filename}
                            </div>
                        }
                        {dimensions !== '' &&
                            <div>
                                {dimensions} px
                            </div>
                        }
                        {charCount > 0 &&
                            <div>
                                {charCount} {nls.localize('vuengine/entityEditor/chars', 'Chars')}
                            </div>
                        }
                    </VContainer>
                </HContainer>
            </VContainer>
            <VContainer gap={15}>
                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/entityEditor/displays', 'Displays')}
                            tooltip={nls.localize(
                                'vuengine/entityEditor/displayModeDescription',
                                'Select which screens the sprite should be visible on. ' +
                                'Can be used to set up a stereo sprite by creating one sprite each for the left and right eye.'
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
                                'With transparency enabled, this sprite will only be shown on every even or odd frame, ' +
                                'resulting in it appearing transparent (and slightly dimmer). ' +
                                'This also halves CPU load since 50% less pixels have to be rendered per frame in average.'
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
                </HContainer>
                <HContainer gap={15}>
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
                </HContainer>
                {(data.sprites.type === SpriteType.Bgmap && [BgmapMode.Affine, BgmapMode.HBias].includes(sprite.bgmapMode)) &&
                    <HContainer gap={15} wrap='wrap'>
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/entityEditor/padding', 'Padding (X, Y)')}
                                tooltip={nls.localize(
                                    'vuengine/entityEditor/paddingDescription',
                                    // eslint-disable-next-line max-len
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
                        <VContainer grow={1}>
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
                    </HContainer>
                }
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/entityEditor/displacement', 'Displacement (x, y, z, parallax)')}
                        tooltip={nls.localize(
                            'vuengine/entityEditor/displacementDescription',
                            'Offset this sprite by the given amount of pixels from the entity\'s center. ' +
                            'The parallax value controls the depth, while the z value is used for fine tuning. ' +
                            'Positive z (and parallax) values go into the screen, negative stick out.'
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
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/texture', 'Texture')}
                    </label>
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
                </VContainer>
            </VContainer>
        </HContainer>
    );
}
