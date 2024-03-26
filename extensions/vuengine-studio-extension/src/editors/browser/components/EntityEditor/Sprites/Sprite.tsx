import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { DataSection } from '../../Common/CommonTypes';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import SectionSelect from '../../Common/SectionSelect';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import { BgmapMode, DisplayMode, Displays, SpriteType, Transparency } from '../../Common/VUEngineTypes';
import Images from '../../ImageEditor/Images/Images';
import { EntityEditorSaveDataOptions } from '../EntityEditor';
import {
    EntityEditorContext,
    EntityEditorContextType,
    MAX_TEXTURE_PADDING,
    MIN_TEXTURE_PADDING,
    SpriteData,
    SpriteImageData,
} from '../EntityEditorTypes';
import { ArrowsHorizontal, ArrowsVertical } from '@phosphor-icons/react';

const MIN_REPEAT_SIZE = 0;
const MAX_REPEAT_SIZE = 512;
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
    const [dimensions, setDimensions] = useState<number[][]>([[], []]);
    const [filename, setFilename] = useState<string[]>([]);

    const getMetaData = async (): Promise<void> => {
        const dim: number[][] = [[], []];
        const fn: string[] = [];
        const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
        [
            sprite.texture?.files,
            sprite.texture?.files2
        ].map(async (f, i) => {
            fn[i] = '';
            dim[i] = [];
            if (f?.length) {
                const resolvedUri = workspaceRootUri.resolve(f[0]);
                fn[i] = resolvedUri.path.base;
                if (f.length > 1) {
                    fn[i] += ' +' + (f.length - 1);
                }
                const d = window.electronVesCore.getImageDimensions(resolvedUri.path.fsPath());
                dim[i] = [d.width ?? 0, d.height ?? 0];
            }
        });

        setFilename(fn);
        setDimensions(dim);
    };

    const getTilesCount = (imageData: SpriteImageData | number | undefined): number => {
        if (imageData !== undefined) {
            if (typeof imageData === 'number') {
                if (imageData > 0 && data.components?.sprites[imageData - 1] !== undefined) {
                    const pointedToImageData = data.components?.sprites[imageData - 1]._imageData;
                    if (pointedToImageData !== undefined) {
                        return getTilesCount(pointedToImageData);
                    }
                }
            } else {
                let tileCount = 0;
                [0, 1].map(i => {
                    if (imageData.images && imageData.images[i]) {
                        if (imageData.images[i].animation?.largestFrame) {
                            tileCount += imageData.images[i].animation?.largestFrame ?? 0;
                        } else if (imageData.images[i].tiles?.count) {
                            tileCount += data.components?.animations?.length > 0 && !data.animations.multiframe
                                ? (imageData.images[i].tiles?.count ?? 0) / (data.animations?.totalFrames ?? 1)
                                : imageData.images[i].tiles?.count ?? 0;
                        }
                    }
                });
                return Math.round(tileCount * 100) / 100;
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

    const setColorMode = (colorMode: ColorMode): void => {
        updateSprite({
            colorMode,
        });
    };

    const setDisplayMode = (displayMode: DisplayMode): void => {
        if (displayMode === DisplayMode.Stereo) {
            updateSprite({
                displayMode,
            });
        } else {
            updateSprite({
                displayMode,
                texture: {
                    ...sprite.texture,
                    files2: [],
                }
            });
        }
    };

    const setDisplays = (displays: Displays): void => {
        updateSprite({
            displays,
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

    const toggleFlip = (a: 'x' | 'y'): void => {
        const toggledValue = sprite.texture?.flip ?
            !!!sprite.texture?.flip[a]
            : true;
        updateSprite({
            texture: {
                ...sprite.texture,
                flip: {
                    ...sprite.texture?.flip,
                    [a]: toggledValue,
                },
            }
        });
    };

    const toggleRepeat = (a: 'x' | 'y'): void => {
        const toggledValue = sprite.texture?.repeat ?
            !!!sprite.texture?.repeat[a]
            : true;
        updateSprite({
            texture: {
                ...sprite.texture,
                repeat: {
                    ...sprite.texture?.repeat,
                    [a]: toggledValue
                },
            }
        });
    };

    const toggleRecycleable = (): void => {
        updateSprite({
            texture: {
                ...sprite.texture,
                recycleable: !!!sprite.texture?.recycleable,
            }
        });
    };

    const setRepeatSize = (axis: 'x' | 'y', value: number): void => {
        updateSprite({
            texture: {
                ...sprite.texture,
                repeat: {
                    ...sprite.texture?.repeat,
                    size: {
                        ...sprite.texture?.repeat?.size,
                        [axis]: clamp(value, MIN_REPEAT_SIZE, MAX_REPEAT_SIZE),
                    }
                }
            },
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

    const setFiles2 = async (files: string[]): Promise<void> => {
        updateSprite({
            texture: {
                ...sprite.texture,
                files2: files
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
        sprite.texture?.files,
        sprite.texture?.files2,
    ]);

    const tilesCount = getTilesCount(sprite._imageData);
    // if not an integer, the number of frames must be wrong
    const invalidTilesCount = tilesCount % 1 !== 0;

    return (
        <VContainer gap={15}>
            <HContainer gap={15} wrap='wrap'>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/displayMode', 'Display Mode')}
                    </label>
                    <RadioSelect
                        options={[{
                            value: DisplayMode.Mono,
                            label: nls.localize('vuengine/entityEditor/displayModeMono', 'Mono'),
                        }, {
                            value: DisplayMode.Stereo,
                            label: nls.localize('vuengine/entityEditor/displayModeStereo', 'Stereo'),
                        }]}
                        defaultValue={sprite.displayMode}
                        onChange={options => setDisplayMode(options[0].value as DisplayMode)}
                    />
                </VContainer>
                {data.sprites.type === SpriteType.Bgmap && !data.components?.animations?.length &&
                    !sprite.texture?.repeat?.x && !sprite.texture?.repeat?.y &&
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/entityEditor/colorMode', 'Color Mode')}
                            tooltip={nls.localize(
                                'vuengine/entityEditor/colorModeDescription',
                                'Whether to use the system\'s default 4 color palette or HiColor mode, ' +
                                'which simulates 7 colors by blending together adjacent frames to create mix colors. ' +
                                'Note: Mixed colors look fine on hardware, but flicker on emulators.'
                            )}
                        />
                        <RadioSelect
                            options={[{
                                value: ColorMode.Default,
                                label: nls.localize('vuengine/entityEditor/colorModeDefault', 'Default'),
                            }, {
                                value: ColorMode.FrameBlend,
                                label: nls.localize('vuengine/entityEditor/colorModeHiColor', 'HiColor'),
                            }]}
                            defaultValue={sprite.colorMode}
                            onChange={options => setColorMode(options[0].value as ColorMode)}
                        />
                    </VContainer>
                }
            </HContainer>
            <VContainer>
                <InfoLabel
                    label={sprite.displayMode === DisplayMode.Stereo
                        ? nls.localize('vuengine/entityEditor/sourceImagesStereo', 'Source Images (Left/Right Eye)')
                        : nls.localize('vuengine/entityEditor/sourceImage', 'Source Image')
                    }
                    tooltip={nls.localize(
                        'vuengine/entityEditor/filesDescription',
                        'PNG image to be used as texture. Must be four color indexed mode with the proper palette. ' +
                        'When animations are enabled, select either a single file containing a vertical spritesheet, ' +
                        'or multiple files, where each represents one animation frame.'
                    )}
                />
                <HContainer alignItems='center' gap={3} wrap='nowrap'>
                    <div style={{ paddingRight: 10 }}>
                        <Images
                            data={sprite.texture?.files || []}
                            updateData={setFiles}
                            allInFolderAsFallback={false}
                            canSelectMany={data.components?.animations.length > 0}
                            stack={true}
                            showMetaData={false}
                        />
                    </div>
                    <VContainer grow={1}>
                        {(sprite.texture?.files || []).length === 0 &&
                            <div className='empty'>
                                {sprite.displayMode !== DisplayMode.Stereo &&
                                    nls.localize(
                                        'vuengine/entityEditor/noImageFileSelected',
                                        'No Image File Selected'
                                    )
                                }
                                {sprite.displayMode === DisplayMode.Stereo &&
                                    nls.localize(
                                        'vuengine/entityEditor/noImageFileSelectedForLeftEye',
                                        'No Image File Selected For The Left Eye'
                                    )
                                }
                            </div>
                        }

                        {filename[0] !== '' &&
                            <div>
                                {filename[0]}
                            </div>
                        }

                        {dimensions[0].length > 0 &&
                            <>
                                <div>
                                    {dimensions[0][0]} × {dimensions[0][1]} px
                                </div>
                                {data.components?.animations?.length > 0 && !isMultiFileAnimation && data.animations?.totalFrames &&
                                    <div>
                                        (
                                        {dimensions[0][0]} × {Math.round(dimensions[0][1] / data.animations?.totalFrames * 100) / 100} px × {data.animations?.totalFrames}
                                        )
                                    </div>
                                }
                            </>
                        }

                        {tilesCount > 0 &&
                            <div
                                className={invalidTilesCount ? ' error' : undefined}
                            >
                                {invalidTilesCount ? `⚠ ${tilesCount}` : tilesCount} {nls.localize('vuengine/entityEditor/tiles', 'Tiles')}
                            </div>
                        }
                    </VContainer>
                </HContainer>
                {sprite.displayMode === DisplayMode.Stereo &&
                    <HContainer alignItems='center' gap={3} wrap='nowrap'>
                        <div style={{ paddingRight: 10 }}>
                            <Images
                                data={sprite.texture?.files2 || []}
                                updateData={setFiles2}
                                allInFolderAsFallback={false}
                                canSelectMany={data.components?.animations.length > 0}
                                stack={true}
                                showMetaData={false}
                            />
                        </div>
                        <VContainer grow={1}>
                            {(sprite.texture?.files2 || []).length === 0 &&
                                <div className='empty'>
                                    {nls.localize(
                                        'vuengine/entityEditor/noImageFileSelectedForRightEye',
                                        'No Image File Selected For The Right Eye'
                                    )}
                                </div>
                            }

                            {filename[1] !== '' &&
                                <div>
                                    {filename[1]}
                                </div>
                            }

                            {dimensions[1].length > 0 &&
                                <>
                                    <div>
                                        {dimensions[1][0]} × {dimensions[1][1]} px
                                    </div>
                                    {data.components?.animations?.length > 0 && !isMultiFileAnimation && data.animations?.totalFrames &&
                                        <div>
                                            (
                                            {dimensions[1][0]} × {Math.round(dimensions[1][1] / data.animations?.totalFrames * 100) / 100} px × {data.animations?.totalFrames}
                                            )
                                        </div>
                                    }
                                </>
                            }
                        </VContainer>
                    </HContainer>
                }
            </VContainer >
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
            <HContainer gap={15} wrap='wrap'>
                {sprite.displayMode === DisplayMode.Mono &&
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
                                { value: Displays.Left, label: nls.localize('vuengine/entityEditor/displayModeLeft', 'Left') },
                                { value: Displays.Right, label: nls.localize('vuengine/entityEditor/displayModeRight', 'Right') },
                            ]}
                            canSelectMany={true}
                            allowBlank={false}
                            defaultValue={sprite.displays === Displays.Both
                                ? [Displays.Left, Displays.Right]
                                : sprite.displays
                            }
                            onChange={options => setDisplays(options.length === 2
                                ? Displays.Both
                                : options[0].value as Displays)
                            }
                        />
                    </VContainer>
                }
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
                <HContainer wrap='wrap'>
                    <VContainer grow={1}>
                        <label>
                            <input
                                type="checkbox"
                                checked={sprite.texture?.flip?.y ?? false}
                                onChange={() => toggleFlip('y')}
                            />
                            <ArrowsHorizontal size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/entityEditor/flip', 'Flip')}
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={sprite.texture?.flip?.x ?? false}
                                onChange={() => toggleFlip('x')}
                            />
                            <ArrowsVertical size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/entityEditor/flip', 'Flip')}
                        </label>
                    </VContainer>
                    {data.sprites.type === SpriteType.Bgmap &&
                        <VContainer grow={1}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={sprite.texture?.repeat?.x ?? false}
                                    onChange={() => toggleRepeat('x')}
                                />
                                <ArrowsHorizontal size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/entityEditor/repeat', 'Repeat')}
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={sprite.texture?.repeat?.y ?? false}
                                    onChange={() => toggleRepeat('y')}
                                />
                                <ArrowsVertical size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/entityEditor/repeat', 'Repeat')}
                            </label>
                        </VContainer>
                    }
                </HContainer>
                <label>
                    <input
                        type="checkbox"
                        checked={sprite.texture?.recycleable ?? false}
                        onChange={toggleRecycleable}
                    />
                    {nls.localize('vuengine/entityEditor/recycleable', 'Recycleable')}
                </label>
            </VContainer>
            {data.sprites.type === SpriteType.Bgmap && (sprite.texture?.repeat?.x || sprite.texture?.repeat?.y) &&
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/entityEditor/repeatSize', 'Size (x, y)')}
                        tooltip={nls.localize(
                            'vuengine/entityEditor/repeatSizeDescription',
                            'Overrides the sprite\'s size to provide culling for repeated textures. ' +
                            'If 0, the value is inferred from the texture.'
                        )}
                    />
                    <HContainer wrap='wrap'>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_REPEAT_SIZE}
                            max={MAX_REPEAT_SIZE}
                            value={sprite.texture?.repeat?.size?.x ?? 0}
                            onChange={e => setRepeatSize('x', parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_REPEAT_SIZE}
                            max={MAX_REPEAT_SIZE}
                            value={sprite.texture?.repeat?.size?.y ?? 0}
                            onChange={e => setRepeatSize('y', parseInt(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
            }
            <HContainer gap={15} wrap='wrap'>
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
        </VContainer>
    );
}
