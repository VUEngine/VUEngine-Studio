import { ArrowsHorizontal, ArrowsVertical } from '@phosphor-icons/react';
import { isNumber, nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { ImageCompressionType, ImageProcessingSettings, MAX_IMAGE_WIDTH } from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import { DataSection } from '../../Common/CommonTypes';
import InfoLabel from '../../Common/InfoLabel';
import SectionSelect from '../../Common/SectionSelect';
import TransparencySelect from '../../Common/TransparencySelect';
import { clamp, roundToNextMultipleOf8 } from '../../Common/Utils';
import { BgmapMode, DisplayMode, Displays, SpriteSourceType, SpriteType, Transparency } from '../../Common/VUEngineTypes';
import Images from '../../ImageEditor/Images';
import { ActorEditorSaveDataOptions } from '../ActorEditor';
import {
    ActorEditorContext,
    ActorEditorContextType,
    INPUT_BLOCKING_COMMANDS,
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
import SpritesSettings from './SpritesSettings';
import { ImageProcessingSettingsFormProps } from './ImageProcessingSettingsForm';

interface SpriteProps {
    sprite: SpriteData
    updateSprite: (partialData: Partial<SpriteData>, options?: ActorEditorSaveDataOptions) => void
    isMultiFileAnimation: boolean
    spriteProcessingDialog: boolean | ImageProcessingSettingsFormProps
    setSpriteProcessingDialog: Dispatch<SetStateAction<boolean | ImageProcessingSettingsFormProps>>
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
    const { fileUri, services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { data } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { sprite, updateSprite, isMultiFileAnimation, spriteProcessingDialog, setSpriteProcessingDialog } = props;
    const [dimensions, setDimensions] = useState<number[][]>([[], []]);
    const [filename, setFilename] = useState<string[]>([]);

    const isAnimated = sprite.isAnimated && (data.components?.animations?.length > 0);

    const allowFrameBlendMode = data.sprites.type === SpriteType.Bgmap &&
        // No HiColor support for animated sprites
        !isAnimated &&
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
                            tileCount += isAnimated && !data.animations.multiframe
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

    const resetDisplacement = (): void => {
        updateSprite({
            displacement: {
                ...sprite.displacement,
                x: 0,
                y: 0,
                z: 0,
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

    const toggleIsAnimated = (): void => {
        updateSprite({
            isAnimated: !!!sprite.isAnimated,
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

    const toggleShareTiles = (): void => {
        updateSprite({
            shareTiles: !!!sprite.shareTiles,
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

    const setProcessingDialogData = () => {
        setSpriteProcessingDialog({
            image: sprite.texture?.files[0],
            setFiles: setFiles,
            imageData: !isNumber(sprite._imageData) ? sprite._imageData?.images[0] : undefined,
            processingSettings: sprite.imageProcessingSettings,
            updateProcessingSettings: updateImageProcessingSettings,
            colorMode: allowFrameBlendMode ? sprite.colorMode : ColorMode.Default,
            updateColorMode: setColorMode,
            allowFrameBlendMode: allowFrameBlendMode,
            compression: sprite.compression,
            convertImage: reconvertImage,
        });
    };

    useEffect(() => {
        if (spriteProcessingDialog !== false) {
            setProcessingDialogData();
        }
    }, [
        sprite,
    ]);

    useEffect(() => {
        getMetaData();
    }, [
        isAnimated,
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
                        label={nls.localize('vuengine/editors/actor/spriteSource', 'Source')}
                        tooltipPosition='bottom'
                        tooltip={<>
                            <div>
                                {nls.localize(
                                    'vuengine/editors/actor/spriteSourceDescription',
                                    "The type of source to retrieve image data from for this sprite's texture."
                                )}
                            </div><br />
                            <div>
                                <b>{nls.localize('vuengine/editors/actor/spriteSourceModeImage', 'Image')}: </b>
                                {nls.localize(
                                    'vuengine/editors/actor/spriteSourceModeImageDescription',
                                    'PNG image file. When animations are enabled, select either a single file containing a vertical spritesheet, \
or multiple files, where each represents one animation frame.'
                                )}
                            </div><br />
                            <div>
                                <b>{nls.localize('vuengine/editors/actor/spriteSourceModePixel', 'Pixel')}: </b>
                                {nls.localize(
                                    'vuengine/editors/actor/spriteSourceModePixelDescription',
                                    "VUEngine Studio's native image format that supports layers and animations."
                                )}
                            </div><br />
                            <div>
                                <b>{nls.localize('vuengine/editors/actor/spriteSourceModeTileMap', 'Tile Map')}: </b>
                                {nls.localize(
                                    'vuengine/editors/actor/spriteSourceModeTileMapDescription',
                                    'A tile map that can be edited in-line in the editor. \
Select a PNG file containing a tileset as the source, then copy into the editor.'
                                )}
                            </div><br />
                            <div>
                                <b>{nls.localize('vuengine/editors/actor/spriteSourceModeModel', 'Model')}: </b>
                                {nls.localize(
                                    'vuengine/editors/actor/spriteSourceModeModelDescription',
                                    'A 3D model file to render to a mono or stereo. \
Supported file types are [...].'
                                )}
                            </div><br />
                        </>}
                    />
                    <RadioSelect
                        options={[{
                            value: SpriteSourceType.Image,
                            label: nls.localize('vuengine/editors/actor/spriteSourceModeImage', 'Image'),
                        }, {
                            value: SpriteSourceType.Pixel,
                            label: nls.localize('vuengine/editors/actor/spriteSourceModePixel', 'Pixel'),
                        }, {
                            value: SpriteSourceType.TileMap,
                            label: nls.localize('vuengine/editors/actor/spriteSourceModeTileMap', 'Tile Map'),
                        }, {
                            value: SpriteSourceType.Model,
                            label: nls.localize('vuengine/editors/actor/spriteSourceModeModel', 'Model'),
                        }]}
                        defaultValue={sprite.sourceType}
                        onChange={options => setSourceType(options[0].value as SpriteSourceType)}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    */}
                    <InfoLabel
                        label={nls.localize('vuengine/editors/actor/sourceImage', 'Source Image')}
                        tooltip={nls.localize(
                            'vuengine/editors/actor/spriteSourceModeImageDescription',
                            'PNG image file to use as image data source. \
When animations are enabled, select either a single file containing a vertical spritesheet, \
or multiple files, where each represents one animation frame.'
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
                                        canSelectMany={isAnimated}
                                        stack={true}
                                        showMetaData={false}
                                        containerHeight='80px'
                                        containerWidth='100px'
                                        fileAddExtraAction={() => setProcessingDialogData()}
                                    />
                                </div>
                                <VContainer grow={1} justifyContent="center" overflow="hidden">
                                    {(sprite.texture?.files || []).length === 0
                                        ? <div className="lightLabel">
                                            {sprite.displayMode !== DisplayMode.Stereo &&
                                                nls.localize(
                                                    'vuengine/editors/actor/noImageFileSelected',
                                                    'No Image File Selected'
                                                )
                                            }
                                            {sprite.displayMode === DisplayMode.Stereo &&
                                                nls.localize(
                                                    'vuengine/editors/actor/noImageFileSelectedForLeftEye',
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
                                                            {isAnimated && !isMultiFileAnimation && data.animations?.totalFrames &&
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
                                                            {invalidTilesCount ? `⚠ ${tilesCount}` : tilesCount} {nls.localize('vuengine/editors/actor/tiles', 'Tiles')}
                                                        </div>
                                                    }
                                                </VContainer>
                                                <VContainer alignItems="end" justifyContent="end">
                                                    <button
                                                        className="theia-button secondary"
                                                        title={nls.localize('vuengine/editors/actor/imageProcessingSettings', 'Image Processing Settings')}
                                                        onClick={() => setProcessingDialogData()}
                                                    >
                                                        <i className="codicon codicon-settings" />
                                                    </button>
                                                    <button
                                                        className="theia-button secondary"
                                                        title={nls.localize('vuengine/editors/actor/reconvertImage', 'Reconvert Image')}
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
                                            canSelectMany={isAnimated}
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
                                                    'vuengine/editors/actor/noImageFileSelectedForRightEye',
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
                                                        {isAnimated && !isMultiFileAnimation && data.animations?.totalFrames &&
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
                    {sprite.sourceType === SpriteSourceType.Pixel &&
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
                            label={nls.localize('vuengine/editors/actor/displayMode', 'Display Mode')}
                            tooltip={nls.localize(
                                'vuengine/editors/actor/displayModeDescription',
                                'Select either a single image that is the same on both eyes, \
or two separate images, one for each eye. Stereo sprites require more system ressources.'
                            )}
                        />
                        <RadioSelect
                            options={[{
                                value: DisplayMode.Mono,
                                label: nls.localize('vuengine/editors/actor/displayModeMono', 'Mono'),
                            }, {
                                value: DisplayMode.Stereo,
                                label: nls.localize('vuengine/editors/actor/displayModeStereo', 'Stereo'),
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
                                label={nls.localize('vuengine/editors/actor/displays', 'Displays')}
                                tooltip={nls.localize(
                                    'vuengine/editors/actor/displaysDescription',
                                    "Select which screens the sprite should be visible on. \
Use with care! It can be very uncomfortable for the viewer if left and right eye images don't match."
                                )}
                            />
                            <RadioSelect
                                options={[
                                    { value: Displays.Left, label: nls.localize('vuengine/editors/actor/displayModeLeft', 'Left') },
                                    { value: Displays.Right, label: nls.localize('vuengine/editors/actor/displayModeRight', 'Right') },
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
                            {nls.localize('vuengine/editors/actor/palette', 'Palette')}
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
                        label={nls.localize('vuengine/editors/actor/displacement', 'Displacement (x, y, z, parallax)')}
                        tooltip={nls.localize(
                            'vuengine/editors/actor/displacementDescription',
                            "Offset this sprite by the given amount of pixels from the actor's center. \
The parallax value controls the depth, while the z value is used for fine tuning. \
Positive z (and parallax) values go into the screen, negative stick out."
                        )}
                    />
                    <HContainer alignItems="center">
                        <Input
                            type="number"
                            min={MIN_SPRITE_TEXTURE_DISPLACEMENT}
                            max={MAX_SPRITE_TEXTURE_DISPLACEMENT}
                            value={sprite.displacement.x}
                            setValue={v => setDisplacement('x', v as number)}
                            commands={INPUT_BLOCKING_COMMANDS}
                            width={64}
                        />
                        <Input
                            type="number"
                            min={MIN_SPRITE_TEXTURE_DISPLACEMENT}
                            max={MAX_SPRITE_TEXTURE_DISPLACEMENT}
                            value={sprite.displacement.y}
                            setValue={v => setDisplacement('y', v as number)}
                            commands={INPUT_BLOCKING_COMMANDS}
                            width={64}
                        />
                        <Input
                            type="number"
                            min={MIN_SPRITE_TEXTURE_DISPLACEMENT}
                            max={MAX_SPRITE_TEXTURE_DISPLACEMENT}
                            value={sprite.displacement.z}
                            setValue={v => setDisplacement('z', v as number)}
                            commands={INPUT_BLOCKING_COMMANDS}
                            width={64}
                        />
                        <Input
                            type="number"
                            min={MIN_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX}
                            max={MAX_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX}
                            value={sprite.displacement.parallax}
                            setValue={setDisplacementParallax}
                            commands={INPUT_BLOCKING_COMMANDS}
                            width={64}
                        />
                        <i
                            className='codicon codicon-issues'
                            title={nls.localize('vuengine/editors/actor/center', 'Center')}
                            onClick={resetDisplacement}
                            style={{
                                cursor: 'pointer'
                            }}
                        />
                    </HContainer>
                </VContainer>
                {data.sprites.type === SpriteType.Bgmap &&
                    <HContainer gap={15} wrap='wrap'>
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/editors/actor/bgmapMode', 'Bgmap Mode')}
                                tooltip={<>
                                    <div>
                                        <b>{nls.localize('vuengine/editors/actor/bgmapModeBgmap', 'Bgmap')}: </b>
                                        {nls.localize(
                                            'vuengine/editors/actor/bgmapModeBgmapDescription',
                                            'A regular sprite with no effects applied.'
                                        )}
                                    </div><br />
                                    <div>
                                        <b>{nls.localize('vuengine/editors/actor/bgmapModeAffine', 'Affine')}: </b>
                                        {nls.localize(
                                            'vuengine/editors/actor/bgmapModeAffineDescription',
                                            'The sprite can be scaled and rotated. This mode needs a lot of CPU resources and should be used sparsely.'
                                        )}
                                    </div><br />
                                    <div>
                                        <b>{nls.localize('vuengine/editors/actor/bgmapModeHBias', 'HBias')}: </b>
                                        {nls.localize(
                                            'vuengine/editors/actor/bgmapModeHBiasDescription',
                                            'Each row of pixels of the sprite can be manipulated independently. This mode is slightly heavier on the CPU than regular Bgmap mode.'
                                        )}
                                    </div>
                                </>}
                            />
                            <RadioSelect
                                options={[
                                    {
                                        value: BgmapMode.Bgmap,
                                        label: nls.localize('vuengine/editors/actor/bgmapModeBgmap', 'Bgmap'),
                                    },
                                    {
                                        value: BgmapMode.Affine,
                                        label: nls.localize('vuengine/editors/actor/bgmapModeAffine', 'Affine'),
                                    },
                                    {
                                        value: BgmapMode.HBias,
                                        label: nls.localize('vuengine/editors/actor/bgmapModeHBias', 'HBias'),
                                    },
                                ]}
                                defaultValue={sprite.bgmapMode}
                                onChange={options => setBgmapMode(options[0].value as BgmapMode)}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                        </VContainer>
                        {data.components?.animations?.length > 0 &&
                            <VContainer>
                                <label>
                                    {nls.localize('vuengine/editors/actor/animate', 'Animate')}
                                </label>
                                <input
                                    type="checkbox"
                                    checked={sprite.isAnimated ?? false}
                                    onChange={() => toggleIsAnimated()}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                            </VContainer>
                        }
                    </HContainer>
                }
                {
                    (data.sprites.type === SpriteType.Bgmap && [BgmapMode.Affine, BgmapMode.HBias].includes(sprite.bgmapMode)) &&
                    <HContainer gap={15} wrap='wrap'>
                        <VContainer>
                            <InfoLabel
                                label={nls.localize('vuengine/editors/actor/padding', 'Padding (X, Y)')}
                                tooltip={nls.localize(
                                    'vuengine/editors/actor/paddingDescription',
                                    'Pad texture data in memory by the specified amount of blank pixels to prevent fragments of \
surrounding textures to appear at the outer edges.'
                                )}
                            />
                            <HContainer>
                                <Input
                                    type='number'
                                    min={MIN_TEXTURE_PADDING}
                                    max={MAX_TEXTURE_PADDING}
                                    value={sprite.texture.padding.x}
                                    setValue={v => setPadding('x', v as number)}
                                    commands={INPUT_BLOCKING_COMMANDS}
                                    width={54}
                                />
                                <Input
                                    type='number'
                                    min={MIN_TEXTURE_PADDING}
                                    max={MAX_TEXTURE_PADDING}
                                    value={sprite.texture.padding.y}
                                    setValue={v => setPadding('y', v as number)}
                                    commands={INPUT_BLOCKING_COMMANDS}
                                    width={54}
                                />
                            </HContainer>
                        </VContainer>
                        <Input
                            label={nls.localize('vuengine/editors/actor/manipulationFunction', 'Manipulation Function')}
                            tooltip={nls.localize(
                                'vuengine/editors/actor/manipulationFunctionDescription',
                                'Provide the name of the function responsible for handling the Affine or HBias transformations of this sprite.'
                            )}
                            value={sprite.manipulationFunction}
                            setValue={setManipulationFunction}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                    </HContainer>
                }
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/actor/texture', 'Texture')}
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
                                <ArrowsHorizontal size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/editors/actor/flip', 'Flip')}
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={sprite.texture?.flip?.x ?? false}
                                    onChange={() => toggleFlip('x')}
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                                <ArrowsVertical size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/editors/actor/flip', 'Flip')}
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
                                    <ArrowsHorizontal size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/editors/actor/repeat', 'Repeat')}
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={sprite.texture?.repeat?.y ?? false}
                                        onChange={() => toggleRepeat('y')}
                                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                    />
                                    <ArrowsVertical size={16} style={{ verticalAlign: 'text-bottom' }} /> {nls.localize('vuengine/editors/actor/repeat', 'Repeat')}
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
                        {nls.localize('vuengine/editors/actor/recycleable', 'Recycleable')}
                    </label>
                </VContainer>
                {
                    data.sprites.type === SpriteType.Bgmap && (sprite.texture?.repeat?.x || sprite.texture?.repeat?.y) &&
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/editors/actor/repeatSize', 'Size (x, y)')}
                            tooltip={nls.localize(
                                'vuengine/editors/actor/repeatSizeDescription',
                                'Overrides the sprite\'s size to provide culling for repeated textures. \
If 0, the value is inferred from the texture.'
                            )}
                        />
                        <HContainer wrap='wrap'>
                            <Input
                                type='number'
                                min={MIN_SPRITE_REPEAT_SIZE}
                                max={MAX_SPRITE_REPEAT_SIZE}
                                value={sprite.texture?.repeat?.size?.x ?? 0}
                                setValue={v => setRepeatSize('x', v as number)}
                                commands={INPUT_BLOCKING_COMMANDS}
                                width={48}
                            />
                            <Input
                                type='number'
                                min={MIN_SPRITE_REPEAT_SIZE}
                                max={MAX_SPRITE_REPEAT_SIZE}
                                value={sprite.texture?.repeat?.size?.y ?? 0}
                                setValue={v => setRepeatSize('y', v as number)}
                                commands={INPUT_BLOCKING_COMMANDS}
                                width={48}
                            />
                        </HContainer>
                    </VContainer>
                }
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/actor/tiles', 'Tiles')}
                    </label>
                    {/* this setting is implicitly handled for animations */}
                    {!isAnimated &&
                        <label>
                            <input
                                type="checkbox"
                                checked={sprite.optimizeTiles}
                                onChange={toggleOptimizeTiles}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                            {nls.localize('vuengine/editors/actor/optimize', 'Optimize')}
                        </label>
                    }
                    <HContainer gap={0}>
                        <input
                            type="checkbox"
                            checked={sprite.shareTiles}
                            onChange={toggleShareTiles}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        <InfoLabel
                            label={nls.localize('vuengine/editors/actor/share', 'Share')}
                            tooltip={nls.localize(
                                'vuengine/editors/actor/shareDescription',
                                "When enabled, this Sprite's CharSet will be shared with other instances using the same CharSet."
                            )}
                        />
                    </HContainer>
                </VContainer>
                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/editors/actor/compression', 'Compression')}
                            tooltip={nls.localize(
                                'vuengine/editors/actor/compressionDescription',
                                'Image data can be stored in a compressed format to save ROM space. \
                                    Comes at the cost of a slightly higher CPU load when loading data into memory. \
                                    Will be skipped if compressed data is not smaller than source data .'
                            )}
                        />
                        <RadioSelect
                            options={[{
                                label: nls.localize('vuengine/editors/actor/compressionType/none', 'None'),
                                value: ImageCompressionType.NONE,
                            }, {
                                label: 'RLE',
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
        </>
    );
}
