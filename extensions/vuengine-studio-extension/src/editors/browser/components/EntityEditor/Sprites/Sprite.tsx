import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ConversionResult, ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { DataSection } from '../../Common/CommonTypes';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import SectionSelect from '../../Common/SectionSelect';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import { BgmapMode, DisplayMode, SpriteType, Transparency } from '../../Common/VUEngineTypes';
import Images from '../../ImageEditor/Images/Images';
import { EntityEditorSaveDataOptions } from '../EntityEditor';
import {
    EntityEditorContext,
    EntityEditorContextType,
    MAX_TEXTURE_PADDING,
    MIN_TEXTURE_PADDING,
    SpriteData,
} from '../EntityEditorTypes';

const MIN_TEXTURE_DISPLACEMENT = -256;
const MAX_TEXTURE_DISPLACEMENT = 256;
const MIN_TEXTURE_DISPLACEMENT_PARALLAX = -32;
const MAX_TEXTURE_DISPLACEMENT_PARALLAX = 32;

interface SpriteProps {
    sprite: SpriteData
    updateSprite: (partialData: Partial<SpriteData>, options?: EntityEditorSaveDataOptions) => void
    isMultiFileAnimation: boolean
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { sprite, updateSprite, isMultiFileAnimation } = props;
    const [dimensions, setDimensions] = useState<number[]>([]);
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
                setDimensions([d.width ?? 0, d.height ?? 0]);
            }
        } else {
            setFilename('');
            setDimensions([]);
        }
    };

    const getTilesCount = (imageData: Partial<ConversionResult & { _dupeIndex: number }> | number | undefined): number => {
        if (imageData !== undefined) {
            if (typeof imageData === 'number') {
                if (imageData > 0 && data.components?.sprites[imageData - 1] !== undefined) {
                    const pointedToImageData = data.components?.sprites[imageData - 1]._imageData;
                    if (pointedToImageData !== undefined) {
                        return getTilesCount(pointedToImageData as Partial<ConversionResult>);
                    }
                }
            } else if (imageData.animation?.largestFrame) {
                return imageData.animation?.largestFrame;
            } else if (imageData.tiles?.count) {
                return data.components?.animations?.length > 0 && !data.animations.multiframe
                    ? Math.round((imageData.tiles?.count / data.animations?.totalFrames || 1) * 100) / 100
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
                palette: clamp(palette, 0, 3),
            },
        });
    };

    const setPadding = (axis: 'x' | 'y', value: number): void => {
        updateSprite({
            texture: {
                ...sprite.texture,
                padding: {
                    ...sprite.texture.padding,
                    [axis]: clamp(value, MIN_TEXTURE_PADDING, MAX_TEXTURE_PADDING),
                },
            },
        });
    };

    const setDisplacement = (axis: 'x' | 'y' | 'z', value: number): void => {
        updateSprite({
            displacement: {
                ...sprite.displacement,
                [axis]: clamp(value, MIN_TEXTURE_DISPLACEMENT, MAX_TEXTURE_DISPLACEMENT),
            },
        });
    };

    const setDisplacementParallax = (value: number): void => {
        updateSprite({
            displacement: {
                ...sprite.displacement,
                parallax: clamp(value, MIN_TEXTURE_DISPLACEMENT_PARALLAX, MAX_TEXTURE_DISPLACEMENT_PARALLAX),
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

    const setFiles = async (files: string[]): Promise<void> => {
        updateSprite({
            name: files.length ? files[0].split('/').pop()?.split('.')[0] : undefined,
            texture: {
                ...sprite.texture,
                files
            }
        }, {
            appendImageData: true,
        });
    };

    const setSection = (section: DataSection) => {
        updateSprite({
            section,
        });
    };

    const setTilesCompression = async (compression: ImageCompressionType): Promise<void> => {
        updateSprite({
            compression,
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

    const tilesCount = getTilesCount(sprite._imageData);
    // if not an integer, the number of frames must be wrong
    const invalidTilesCount = tilesCount % 1 !== 0;

    return (
        <HContainer gap={15} wrap='wrap'>
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
                <HContainer gap={0} wrap='wrap'>
                    <div style={{ paddingRight: 10 }}>
                        <Images
                            data={sprite.texture.files}
                            updateData={setFiles}
                            allInFolderAsFallback={false}
                            canSelectMany={data.components?.animations.length > 0}
                            stack={true}
                            showMetaData={false}
                        />
                    </div>
                    <VContainer grow={1}>
                        {filename !== '' &&
                            <div>
                                {filename}
                            </div>
                        }

                        {dimensions.length > 0 &&
                            <>
                                <div>
                                    {dimensions[0]}×{dimensions[1]} px
                                </div>
                                {data.components?.animations?.length > 0 && !isMultiFileAnimation && data.animations?.totalFrames &&
                                    <div>
                                        (
                                        {dimensions[0]}×{Math.round(dimensions[1] / data.animations?.totalFrames * 100) / 100} px × {data.animations?.totalFrames}
                                        )
                                    </div>
                                }
                            </>
                        }

                        {tilesCount > 0 &&
                            <div className={invalidTilesCount ? 'error' : ''}>
                                {invalidTilesCount &&
                                    <><i className='fa fa-warning' />{' '}</>
                                }
                                {tilesCount} {nls.localize('vuengine/entityEditor/tiles', 'Tiles')}
                            </div>
                        }
                    </VContainer>
                </HContainer>
            </VContainer >
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
            <HContainer gap={15} wrap='wrap'>
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
                                onChange={e => setPadding('x', parseInt(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={MIN_TEXTURE_PADDING}
                                max={MAX_TEXTURE_PADDING}
                                value={sprite.texture.padding.y}
                                onChange={e => setPadding('y', parseInt(e.target.value))}
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
                <HContainer wrap='wrap'>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        min={MIN_TEXTURE_DISPLACEMENT}
                        max={MAX_TEXTURE_DISPLACEMENT}
                        value={sprite.displacement.x}
                        onChange={e => setDisplacement('x', parseInt(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        min={MIN_TEXTURE_DISPLACEMENT}
                        max={MAX_TEXTURE_DISPLACEMENT}
                        value={sprite.displacement.y}
                        onChange={e => setDisplacement('y', parseInt(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        min={MIN_TEXTURE_DISPLACEMENT}
                        max={MAX_TEXTURE_DISPLACEMENT}
                        value={sprite.displacement.z}
                        onChange={e => setDisplacement('z', parseInt(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        min={MIN_TEXTURE_DISPLACEMENT_PARALLAX}
                        max={MAX_TEXTURE_DISPLACEMENT_PARALLAX}
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
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/compression', 'Compression')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/compressionDescription',
                        'Image data can be stored in a compressed format to save ROM space. '
                        + 'Comes at the cost of a slightly higher CPU load when loading data into memory.'
                    )}
                />
                <RadioSelect
                    options={[{
                        label: nls.localize('vuengine/entityEditor/compression/none', 'None'),
                        value: ImageCompressionType.NONE,
                    }, {
                        label: nls.localize('vuengine/entityEditor/compression/rle', 'RLE'),
                        value: ImageCompressionType.RLE,
                    }]}
                    defaultValue={sprite.compression}
                    onChange={options => setTilesCompression(options[0].value as ImageCompressionType)}
                />
            </VContainer>
            <SectionSelect
                value={sprite.section}
                setValue={setSection}
            />
        </HContainer>
    );
}
