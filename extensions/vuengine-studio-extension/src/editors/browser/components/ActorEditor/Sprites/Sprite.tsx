import { ArrowsHorizontal, ArrowsVertical } from '@phosphor-icons/react';
import { isNumber, nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { ImageCompressionType, ImageProcessingSettings, MAX_IMAGE_WIDTH } from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { DataSection } from '../../Common/CommonTypes';
import HContainer from '../../Common/Base/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import PopUpDialog from '../../Common/Base/PopUpDialog';
import RadioSelect from '../../Common/Base/RadioSelect';
import SectionSelect from '../../Common/SectionSelect';
import { clamp, roundToNextMultipleOf8 } from '../../Common/Utils';
import VContainer from '../../Common/Base/VContainer';
import { BgmapMode, DisplayMode, Displays, SpriteSourceType, SpriteType, Transparency } from '../../Common/VUEngineTypes';
import Images from '../../ImageEditor/Images';
import { ActorEditorSaveDataOptions, INPUT_BLOCKING_COMMANDS } from '../ActorEditor';
import {
    ActorEditorContext,
    ActorEditorContextType,
    MAX_SPRITE_REPEAT_SIZE,
    MAX_SPRITE_TEXTURE_DISPLACEMENT,
    MAX_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX,
    MAX_TEXTURE_PADDING,
    MIN_SPRITE_REPEAT_SIZE,
    MIN_SPRITE_TEXTURE_DISPLACEMENT,
    MIN_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX,
    MIN_TEXTURE_PADDING,
    SpriteData,
    SpriteImageData,
} from '../ActorEditorTypes';
import ImageProcessingSettingsForm from './ImageProcessingSettingsForm';
import SpritesSettings from './SpritesSettings';
import TransparencySelect from '../../Common/TransparencySelect';

interface SpriteProps {
    sprite: SpriteData
    updateSprite: (partialData: Partial<SpriteData>, options?: ActorEditorSaveDataOptions) => void
    isMultiFileAnimation: boolean
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
    const { fileUri, services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { data } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { sprite, updateSprite, isMultiFileAnimation } = props;
    const [processingDialogOpen, setProcessingDialogOpen] = useState<boolean>(false);
    const [dimensions, setDimensions] = useState<number[][]>([[], []]);
    const [filename, setFilename] = useState<string[]>([]);

    const allowFrameBlendMode = data.sprites.type === SpriteType.Bgmap &&
        // No HiColor support for animated sprites
        !data.components?.animations?.length &&
        // No HiColor support for repeated sprites
        !sprite.texture?.repeat?.x &&
        !sprite.texture?.repeat?.y &&
        // FrameBlend sprites are stored in a single map, aligned top/down. Therefore, they can't be higher than 256 px.
        dimensions[0][3] <= 256;

    const getMetaData = async (): Promise<void> => {
        const dim: number[][] = [[], []];
        const fn: string[] = [];
        [
            sprite.texture?.files,
            sprite.texture?.files2
        ].map(async (f, i) => {
            fn[i] = '';
            dim[i] = [];
            if (f?.length) {
                const resolvedUri = fileUri.parent.resolve(f[0]);
                fn[i] = resolvedUri.path.base;
                if (f.length > 1) {
                    fn[i] += ' +' + (f.length - 1);
                }
                const exists = await services.fileService.exists(resolvedUri);
                let d;
                if (exists) {
                    d = window.electronVesCore.getImageDimensions(resolvedUri.path.fsPath());
                }

                const imageHeight = d?.height ?? 0;
                const imageWidth = d?.width ?? 0;
                const finalHeight = clamp(roundToNextMultipleOf8(imageHeight), 0, imageHeight);
                const finalWidth = clamp(roundToNextMultipleOf8(imageWidth), 0, MAX_IMAGE_WIDTH);
                dim[i] = [imageWidth, imageHeight, finalWidth, finalHeight];
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

    const reconvertImage = (): void => {
        updateSprite({}, {
            appendImageData: true,
        });
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
        }, {
            appendImageData: true,
        });
    };

    /*
    const setSourceType = (sourceType: SpriteSourceType): void => {
        updateSprite({
            sourceType,
        });
    };
    */

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
                [axis]: clamp(value, MIN_SPRITE_TEXTURE_DISPLACEMENT, MAX_SPRITE_TEXTURE_DISPLACEMENT),
            },
        });
    };

    const setDisplacementParallax = (value: number): void => {
        updateSprite({
            displacement: {
                ...sprite.displacement,
                parallax: clamp(value, MIN_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX, MAX_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX),
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

    const toggleOptimizeTiles = (): void => {
        updateSprite({
            optimizeTiles: !!!sprite.optimizeTiles,
        }, {
            appendImageData: true,
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
                        [axis]: clamp(value, MIN_SPRITE_REPEAT_SIZE, MAX_SPRITE_REPEAT_SIZE),
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

    const updateImageProcessingSettings = (partialImageProcessingSettings: Partial<ImageProcessingSettings>) => {
        updateSprite({
            imageProcessingSettings: {
                ...sprite.imageProcessingSettings,
                ...partialImageProcessingSettings
            },
        }, {
            appendImageData: true,
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
        <>
            <VContainer gap={15}>
                <VContainer>
                    {/*
                    <InfoLabel
                        label={nls.localize('vuengine/actorEditor/spriteSource', 'Source')}
                        tooltipPosition='bottom'
                        tooltip={<>
                            <div>
                                {nls.localize(
                                    'vuengine/actorEditor/spriteSourceDescription',
                                    "The type of source to retrieve image data from for this sprite's texture."
                                )}
                            </div><br />
                            <div>
                                <b>{nls.localize('vuengine/actorEditor/spriteSourceModeImage', 'Image')}: </b>
                                {nls.localize(
                                    'vuengine/actorEditor/spriteSourceModeImageDescription',
                                    'PNG image file. When animations are enabled, select either a single file containing a vertical spritesheet, ' +
                                    'or multiple files, where each represents one animation frame.'
                                )}
                            </div><br />
                            <div>
                                <b>{nls.localize('vuengine/actorEditor/spriteSourceModeSprite', 'Sprite')}: </b>
                                {nls.localize(
                                    'vuengine/actorEditor/spriteSourceModeSpriteDescription',
                                    "VUEngine Studio's native image format that supports layers and animations."
                                )}
                            </div><br />
                            <div>
                                <b>{nls.localize('vuengine/actorEditor/spriteSourceModeTileMap', 'Tile Map')}: </b>
                                {nls.localize(
                                    'vuengine/actorEditor/spriteSourceModeTileMapDescription',
                                    'A tile map that can be edited in-line in the editor. ' +
                                    'Select a PNG file containing a tileset as the source, then copy into the editor.'
                                )}
                            </div><br />
                            <div>
                                <b>{nls.localize('vuengine/actorEditor/spriteSourceModeModel', 'Model')}: </b>
                                {nls.localize(
                                    'vuengine/actorEditor/spriteSourceModeModelDescription',
                                    'A 3D model file to render to a mono or stereo. ' +
                                    'Supported file types are [...].'
                                )}
                            </div><br />
                        </>}
                    />
                    <RadioSelect
                        options={[{
                            value: SpriteSourceType.Image,
                            label: nls.localize('vuengine/actorEditor/spriteSourceModeImage', 'Image'),
                        }, {
                            value: SpriteSourceType.Sprite,
                            label: nls.localize('vuengine/actorEditor/spriteSourceModeSprite', 'Sprite'),
                        }, {
                            value: SpriteSourceType.TileMap,
                            label: nls.localize('vuengine/actorEditor/spriteSourceModeTileMap', 'Tile Map'),
                        }, {
                            value: SpriteSourceType.Model,
                            label: nls.localize('vuengine/actorEditor/spriteSourceModeModel', 'Model'),
                        }]}
                        defaultValue={sprite.sourceType}
                        onChange={options => setSourceType(options[0].value as SpriteSourceType)}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    */}
                    <InfoLabel
                        label={nls.localize('vuengine/actorEditor/sourceImage', 'Source Image')}
                        tooltip={nls.localize(
                            'vuengine/actorEditor/spriteSourceModeImageDescription',
                            'PNG image file to use as image data source. ' +
                            'When animations are enabled, select either a single file containing a vertical spritesheet, ' +
                            'or multiple files, where each represents one animation frame.'
                        )}
                    />
                    {sprite.sourceType === SpriteSourceType.Image &&
                        <>
                            <HContainer justifyContent='center' gap={3} wrap='nowrap'>
                                <div style={{ paddingRight: 10 }}>
                                    <Images
                                        data={sprite.texture?.files || []}
                                        updateData={setFiles}
                                        allInFolderAsFallback={false}
                                        canSelectMany={data.components?.animations.length > 0}
                                        stack={true}
                                        showMetaData={false}
                                        containerHeight='80px'
                                        containerWidth='100px'
                                        fileAddExtraAction={() => setProcessingDialogOpen(true)}
                                    />
                                </div>
                                <VContainer grow={1} justifyContent="center" overflow="hidden">
                                    {(sprite.texture?.files || []).length === 0
                                        ? <div className="lightLabel">
                                            {sprite.displayMode !== DisplayMode.Stereo &&
                                                nls.localize(
                                                    'vuengine/actorEditor/noImageFileSelected',
                                                    'No Image File Selected'
                                                )
                                            }
                                            {sprite.displayMode === DisplayMode.Stereo &&
                                                nls.localize(
                                                    'vuengine/actorEditor/noImageFileSelectedForLeftEye',
                                                    'No Image File Selected For The Left Eye'
                                                )
                                            }
                                        </div>
                                        : <>
                                            {filename[0] !== '' &&
                                                <div
                                                    style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                    title={filename[0]}
                                                >
                                                    {filename[0]}
                                                </div>
                                            }

                                            <HContainer>
                                                <VContainer grow={1}>
                                                    {dimensions[0].length > 1 &&
                                                        <div style={{ opacity: .6 }}>
                                                            <div>
                                                                {dimensions[0][0]} × {dimensions[0][1]} px
                                                            </div>
                                                            {(dimensions[0][0] !== dimensions[0][2] || dimensions[0][1] !== dimensions[0][3]) &&
                                                                <div>
                                                                    (→ {dimensions[0][2]} × {dimensions[0][3]} px)
                                                                </div>
                                                            }
                                                            {data.components?.animations?.length > 0 && !isMultiFileAnimation && data.animations?.totalFrames &&
                                                                <div>
                                                                    (
                                                                    {dimensions[0][0]} × {Math.round(dimensions[0][1] /
                                                                        data.animations?.totalFrames * 100) / 100} px × {data.animations?.totalFrames}
                                                                    )
                                                                </div>
                                                            }
                                                        </div>
                                                    }

                                                    {tilesCount > 0 &&
                                                        <div
                                                            className={invalidTilesCount ? ' error' : undefined}
                                                            style={{ opacity: .6 }}
                                                        >
                                                            {invalidTilesCount ? `⚠ ${tilesCount}` : tilesCount} {nls.localize('vuengine/actorEditor/tiles', 'Tiles')}
                                                        </div>
                                                    }
                                                </VContainer>
                                                <VContainer alignItems="end" justifyContent="end">
                                                    <button
                                                        className="theia-button secondary"
                                                        title={nls.localize('vuengine/actorEditor/imageProcessingSettings', 'Image Processing Settings')}
                                                        onClick={() => setProcessingDialogOpen(true)}
                                                    >
                                                        <i className="codicon codicon-settings" />
                                                    </button>
                                                    <button
                                                        className="theia-button secondary"
                                                        title={nls.localize('vuengine/actorEditor/reconvertImage', 'Reconvert Image')}
                                                        onClick={reconvertImage}
                                                    >
                                                        <i className="codicon codicon-sync" />
                                                    </button>
                                                </VContainer>
                                            </HContainer>
                                        </>
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
                                            containerHeight='80px'
                                            containerWidth='100px'
                                        />
                                    </div>
                                    <VContainer grow={1} justifyContent="center" overflow="hidden">
                                        {(sprite.texture?.files2 || []).length === 0
                                            ? <div className="lightLabel">
                                                {nls.localize(
                                                    'vuengine/actorEditor/noImageFileSelectedForRightEye',
                                                    'No Image File Selected For The Right Eye'
                                                )}
                                            </div>
                                            : <>
                                                {filename[1] !== '' &&
                                                    <div
                                                        style={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                        title={filename[1]}
                                                    >
                                                        {filename[1]}
                                                    </div>
                                                }

                                                {dimensions[1].length > 1 &&
                                                    <div style={{ opacity: .6 }}>
                                                        <div>
                                                            {dimensions[1][0]} × {dimensions[1][1]} px
                                                        </div>
                                                        {dimensions[1][0] !== dimensions[1][2] || dimensions[1][1] !== dimensions[1][3] &&
                                                            <div>
                                                                <i className="codicon codicon-arrow-right"></i> {dimensions[1][2]} × {dimensions[1][3]} px
                                                            </div>
                                                        }
                                                        {data.components?.animations?.length > 0 && !isMultiFileAnimation && data.animations?.totalFrames &&
                                                            <div>
                                                                {dimensions[1][0]}
                                                                {' × '}
                                                                {Math.round(dimensions[1][1] / data.animations?.totalFrames * 100) / 100}
                                                                {' px × '}
                                                                {data.animations?.totalFrames}
                                                            </div>
                                                        }
                                                    </div>
                                                }
                                            </>
                                        }
                                    </VContainer>
                                </HContainer>
                            }
                        </>
                    }
                    {sprite.sourceType === SpriteSourceType.Sprite &&
                        <>This source type is not yet supported</>
                    }
                    {sprite.sourceType === SpriteSourceType.TileMap &&
                        <>This source type is not yet supported</>
                    }
                    {sprite.sourceType === SpriteSourceType.Model &&
                        <>This source type is not yet supported</>
                    }
                </VContainer >
                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/actorEditor/displayMode', 'Display Mode')}
                            tooltip={nls.localize(
                                'vuengine/actorEditor/displayModeDescription',
                                'Select either a single image that is the same on both eyes, ' +
                                'or two separate images, one for each eye. ' +
                                'Stereo sprites require more system ressources.'
                            )}
                        />
                        <RadioSelect
                            options={[{
                                value: DisplayMode.Mono,
                                label: nls.localize('vuengine/actorEditor/displayModeMono', 'Mono'),
                            }, {
                                value: DisplayMode.Stereo,
                                label: nls.localize('vuengine/actorEditor/displayModeStereo', 'Stereo'),
                            }]}
                            defaultValue={sprite.displayMode}
                            onChange={options => setDisplayMode(options[0].value as DisplayMode)}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                    </VContainer>
                    {sprite.displayMode === DisplayMode.Mono &&
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/actorEditor/displays', 'Displays')}
                                tooltip={nls.localize(
                                    'vuengine/actorEditor/displaysDescription',
                                    'Select which screens the sprite should be visible on. ' +
                                    'Use with care! It can be very uncomfortable for the viewer ' +
                                    "if left and right eye images don't match."
                                )}
                            />
                            <RadioSelect
                                options={[
                                    { value: Displays.Left, label: nls.localize('vuengine/actorEditor/displayModeLeft', 'Left') },
                                    { value: Displays.Right, label: nls.localize('vuengine/actorEditor/displayModeRight', 'Right') },
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
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                        </VContainer>
                    }
                </HContainer>
                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/actorEditor/palette', 'Palette')}
                        </label>
                        <RadioSelect
                            options={[{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }]}
                            defaultValue={sprite.texture.palette}
                            onChange={options => setPalette(options[0].value as number)}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                    </VContainer>
                    <TransparencySelect
                        value={sprite.transparency}
                        setValue={setTransparency}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/actorEditor/displacement', 'Displacement (x, y, z, parallax)')}
                        tooltip={nls.localize(
                            'vuengine/actorEditor/displacementDescription',
                            'Offset this sprite by the given amount of pixels from the actor\'s center. ' +
                            'The parallax value controls the depth, while the z value is used for fine tuning. ' +
                            'Positive z (and parallax) values go into the screen, negative stick out.'
                        )}
                    />
                    <HContainer wrap='wrap'>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_SPRITE_TEXTURE_DISPLACEMENT}
                            max={MAX_SPRITE_TEXTURE_DISPLACEMENT}
                            value={sprite.displacement.x}
                            onChange={e => setDisplacement('x', e.target.value === '' ? 0 : parseInt(e.target.value))}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_SPRITE_TEXTURE_DISPLACEMENT}
                            max={MAX_SPRITE_TEXTURE_DISPLACEMENT}
                            value={sprite.displacement.y}
                            onChange={e => setDisplacement('y', e.target.value === '' ? 0 : parseInt(e.target.value))}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_SPRITE_TEXTURE_DISPLACEMENT}
                            max={MAX_SPRITE_TEXTURE_DISPLACEMENT}
                            value={sprite.displacement.z}
                            onChange={e => setDisplacement('z', e.target.value === '' ? 0 : parseInt(e.target.value))}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX}
                            max={MAX_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX}
                            value={sprite.displacement.parallax}
                            onChange={e => setDisplacementParallax(e.target.value === '' ? 0 : parseInt(e.target.value))}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                    </HContainer>
                </VContainer>
                {data.sprites.type === SpriteType.Bgmap &&
                    <HContainer gap={15} wrap='wrap'>
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/actorEditor/bgmapMode', 'Bgmap Mode')}
                                tooltip={<>
                                    <div>
                                        <b>{nls.localize('vuengine/actorEditor/bgmapModeBgmap', 'Bgmap')}: </b>
                                        {nls.localize(
                                            'vuengine/actorEditor/bgmapModeBgmapDescription',
                                            'A regular sprite with no effects applied.'
                                        )}
                                    </div><br />
                                    <div>
                                        <b>{nls.localize('vuengine/actorEditor/bgmapModeAffine', 'Affine')}: </b>
                                        {nls.localize(
                                            'vuengine/actorEditor/bgmapModeAffineDescription',
                                            'The sprite can be scaled and rotated. This mode needs a lot of CPU resources and should be used sparsely.'
                                        )}
                                    </div><br />
                                    <div>
                                        <b>{nls.localize('vuengine/actorEditor/bgmapModeHBias', 'HBias')}: </b>
                                        {nls.localize(
                                            'vuengine/actorEditor/bgmapModeHBiasDescription',
                                            'Each row of pixels of the sprite can be manipulated independently. This mode is slightly heavier on the CPU than regular Bgmap mode.'
                                        )}
                                    </div>
                                </>}
                            />
                            <RadioSelect
                                options={[
                                    {
                                        value: BgmapMode.Bgmap,
                                        label: nls.localize('vuengine/actorEditor/bgmapModeBgmap', 'Bgmap'),
                                    },
                                    {
                                        value: BgmapMode.Affine,
                                        label: nls.localize('vuengine/actorEditor/bgmapModeAffine', 'Affine'),
                                    },
                                    {
                                        value: BgmapMode.HBias,
                                        label: nls.localize('vuengine/actorEditor/bgmapModeHBias', 'HBias'),
                                    },
                                ]}
                                defaultValue={sprite.bgmapMode}
                                onChange={options => setBgmapMode(options[0].value as BgmapMode)}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                        </VContainer>
                    </HContainer>
                }
                {
                    (data.sprites.type === SpriteType.Bgmap && [BgmapMode.Affine, BgmapMode.HBias].includes(sprite.bgmapMode)) &&
                    <HContainer gap={15} wrap='wrap'>
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/actorEditor/padding', 'Padding (X, Y)')}
                                tooltip={nls.localize(
                                    'vuengine/actorEditor/paddingDescription',
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
                                    onChange={e => setPadding('x', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                                <input
                                    className='theia-input'
                                    style={{ width: 48 }}
                                    type='number'
                                    min={MIN_TEXTURE_PADDING}
                                    max={MAX_TEXTURE_PADDING}
                                    value={sprite.texture.padding.y}
                                    onChange={e => setPadding('y', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                            </HContainer>
                        </VContainer>
                        <VContainer grow={1}>
                            <InfoLabel
                                label={nls.localize('vuengine/actorEditor/manipulationFunction', 'Manipulation Function')}
                                tooltip={nls.localize(
                                    'vuengine/actorEditor/manipulationFunctionDescription',
                                    'Provide the name of the function responsible for handling the Affine or HBias transformations of this sprite.'
                                )}
                            />
                            <input
                                className='theia-input'
                                type='string'
                                value={sprite.manipulationFunction}
                                onChange={e => setManipulationFunction(e.target.value)}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                        </VContainer>
                    </HContainer>
                }
                <VContainer>
                    <label>
                        {nls.localize('vuengine/actorEditor/texture', 'Texture')}
                    </label>
                    <HContainer wrap='wrap'>
                        <VContainer grow={1}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={sprite.texture?.flip?.y ?? false}
                                    onChange={() => toggleFlip('y')}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                                <ArrowsHorizontal size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/actorEditor/flip', 'Flip')}
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={sprite.texture?.flip?.x ?? false}
                                    onChange={() => toggleFlip('x')}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                                <ArrowsVertical size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/actorEditor/flip', 'Flip')}
                            </label>
                        </VContainer>
                        {data.sprites.type === SpriteType.Bgmap &&
                            <VContainer grow={1}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={sprite.texture?.repeat?.x ?? false}
                                        onChange={() => toggleRepeat('x')}
                                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                    />
                                    <ArrowsHorizontal size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/actorEditor/repeat', 'Repeat')}
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={sprite.texture?.repeat?.y ?? false}
                                        onChange={() => toggleRepeat('y')}
                                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                    />
                                    <ArrowsVertical size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/actorEditor/repeat', 'Repeat')}
                                </label>
                            </VContainer>
                        }
                    </HContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={sprite.texture?.recycleable ?? false}
                            onChange={toggleRecycleable}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        {nls.localize('vuengine/actorEditor/recycleable', 'Recycleable')}
                    </label>
                </VContainer>
                {
                    data.sprites.type === SpriteType.Bgmap && (sprite.texture?.repeat?.x || sprite.texture?.repeat?.y) &&
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/actorEditor/repeatSize', 'Size (x, y)')}
                            tooltip={nls.localize(
                                'vuengine/actorEditor/repeatSizeDescription',
                                'Overrides the sprite\'s size to provide culling for repeated textures. ' +
                                'If 0, the value is inferred from the texture.'
                            )}
                        />
                        <HContainer wrap='wrap'>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={MIN_SPRITE_REPEAT_SIZE}
                                max={MAX_SPRITE_REPEAT_SIZE}
                                value={sprite.texture?.repeat?.size?.x ?? 0}
                                onChange={e => setRepeatSize('x', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={MIN_SPRITE_REPEAT_SIZE}
                                max={MAX_SPRITE_REPEAT_SIZE}
                                value={sprite.texture?.repeat?.size?.y ?? 0}
                                onChange={e => setRepeatSize('y', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                        </HContainer>
                    </VContainer>
                }
                {/* this setting is implicitly handled for animations */}
                {data.components?.animations.length === 0 && <VContainer>
                    <label>
                        {nls.localize('vuengine/actorEditor/tiles', 'Tiles')}
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={sprite.optimizeTiles}
                            onChange={toggleOptimizeTiles}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        {nls.localize('vuengine/actorEditor/optimize', 'Optimize')}
                    </label>
                </VContainer>}
                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/actorEditor/compression', 'Compression')}
                            tooltip={nls.localize(
                                'vuengine/actorEditor/compressionDescription',
                                'Image data can be stored in a compressed format to save ROM space. '
                                + 'Comes at the cost of a slightly higher CPU load when loading data into memory. '
                                + 'Will be skipped if compressed data is not smaller than source data . '
                            )}
                        />
                        <RadioSelect
                            options={[{
                                label: nls.localize('vuengine/actorEditor/compression/none', 'None'),
                                value: ImageCompressionType.NONE,
                            }, {
                                label: nls.localize('vuengine/actorEditor/compression/rle', 'RLE'),
                                value: ImageCompressionType.RLE,
                            }]}
                            defaultValue={sprite.compression}
                            onChange={options => setTilesCompression(options[0].value as ImageCompressionType)}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                    </VContainer>
                    <SectionSelect
                        value={sprite.section}
                        setValue={setSection}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
            </VContainer>
            <hr />
            <SpritesSettings />
            <PopUpDialog
                open={processingDialogOpen}
                onClose={() => setProcessingDialogOpen(false)}
                onOk={() => setProcessingDialogOpen(false)}
                title={nls.localize('vuengine/editors/imageProcessingSettings', 'Image Processing Settings')}
                height='100%'
                width='100%'
            >
                <ImageProcessingSettingsForm
                    image={sprite.texture?.files[0]}
                    setFiles={setFiles}
                    imageData={!isNumber(sprite._imageData) ? sprite._imageData?.images[0] : undefined}
                    processingSettings={sprite.imageProcessingSettings}
                    updateProcessingSettings={updateImageProcessingSettings}
                    colorMode={allowFrameBlendMode ? sprite.colorMode : ColorMode.Default}
                    updateColorMode={setColorMode}
                    allowFrameBlendMode={allowFrameBlendMode}
                    compression={sprite.compression}
                    convertImage={reconvertImage}
                />
            </PopUpDialog>
        </>
    );
}
