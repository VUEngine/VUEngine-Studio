import { URI, nls } from '@theia/core';
import React, { useContext } from 'react';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import { EditorsServices } from '../../../ves-editors-widget';
import { DataSection } from '../../Common/CommonTypes';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';
import { BgmapMode, DisplayMode, EntityEditorContext, EntityEditorContextType, SpriteType, Transparency } from '../EntityEditorTypes';
import Sprite from './Sprite';

interface SpritesProps {
    fileUri: URI
    services: EditorsServices
}

export default function Sprites(props: SpritesProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { fileUri, services } = props;
    const mostFilesOnASprite = Math.max(...data.sprites.sprites.map(s => s.texture.files.length));
    const isMultiImageAnimation = mostFilesOnASprite > 1;

    const getCharCount = (): number => {
        let totalChars = 0;
        data.sprites?.sprites?.map(s => {
            if (s._imageData !== undefined && typeof s._imageData !== 'number') {
                if (s._imageData.animation?.largestFrame) {
                    totalChars += s._imageData.animation?.largestFrame;
                } else {
                    if (s._imageData.tiles?.count) {
                        totalChars += data.animations?.enabled && !data.animations.multiframe
                            ? s._imageData.tiles?.count / data.animations?.totalFrames || 1
                            : s._imageData.tiles?.count;
                    }
                }
            }
        });

        return totalChars;
    };

    const setType = (type: SpriteType): void => {
        setData({
            sprites: {
                ...data.sprites,
                type,
            }
        });
    };

    /*
    const setCustomClass = (customClass: string): void => {
        setData({
            sprites: {
                ...data.sprites,
                customClass,
            }
        });
    };
    */

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
        }, {
            appendImageData: true,
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
        }, {
            appendImageData: true,
        });
    };

    const toggleSharedTiles = (): void => {
        setData({
            sprites: {
                ...data.sprites,
                sharedTiles: !data.sprites.sharedTiles,
            }
        }, {
            appendImageData: true,
        });
    };

    const setAnimationFrames = (frames: number): void => {
        setData({
            animations: {
                ...data.animations,
                totalFrames: frames,
            }
        }, {
            appendImageData: true
        });
    };

    const charCount = getCharCount();

    const addSprite = (): void => {
        const updatedSprites = { ...data.sprites };
        updatedSprites.sprites = [
            ...updatedSprites.sprites,
            {
                _imageData: 0,
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

    const toggleAnimated = (): void => {
        setData({
            animations: {
                ...data.animations,
                enabled: !data.animations.enabled,
            }
        }, {
            appendImageData: true
        });
    };

    const toggleMultiframe = (): void => {
        setData({
            animations: {
                ...data.animations,
                multiframe: !data.animations.multiframe,
            }
        });
    };

    return <VContainer gap={15}>
        <HContainer alignItems='start' gap={15} wrap='wrap'>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/chars', 'Chars')}
                </label>
                <input
                    className={`theia-input heavyness ${charCount > 1200 ? 'heavynessHeavy' : charCount > 600 ? 'heavynessMedium' : 'heavynessLight'}`}
                    type='text'
                    value={charCount}
                    disabled
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/spriteType', 'Type')}
                </label>
                <RadioSelect
                    options={[{
                        value: SpriteType.Bgmap,
                    }, {
                        value: SpriteType.Object,
                    }]}
                    defaultValue={data.sprites.type}
                    onChange={options => setType(options[0].value as SpriteType)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/animated', 'Animated')}
                </label>
                <input
                    type="checkbox"
                    checked={data.animations.enabled}
                    onChange={toggleAnimated}
                />
            </VContainer>
            {data.animations.enabled && <>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/frames', 'Frames')}
                    </label>
                    {/* TODO: determine max frames from engine config */}
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        min={0}
                        max={128}
                        disabled={isMultiImageAnimation}
                        value={isMultiImageAnimation ? mostFilesOnASprite : data.animations.totalFrames}
                        onChange={e => setAnimationFrames(parseInt(e.target.value))}
                    />
                </VContainer>
                {!isMultiImageAnimation && <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/multiframe', 'Multiframe')}
                    </label>
                    <input
                        type="checkbox"
                        checked={data.animations.multiframe}
                        onChange={toggleMultiframe}
                    />
                </VContainer>}
            </>}
            {/* these setting are implicitly handled for animations */}
            {!data.animations.enabled && <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/tiles', 'Tiles')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.sprites.optimizedTiles}
                        onChange={toggleOptimizedTiles}
                    />
                    {nls.localize('vuengine/entityEditor/optimized', 'Optimized')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.sprites.sharedTiles}
                        onChange={toggleSharedTiles}
                    />
                    {nls.localize('vuengine/entityEditor/shared', 'Shared')}
                </label>
            </VContainer>}
            {/*
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
            */}
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/compression', 'Compression')}
                    hoverService={props.services.hoverService}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/compressionDescription',
                        // eslint-disable-next-line max-len
                        'Image data can be stored in a compressed format to save ROM space. Comes at the cost of a slightly higher CPU load when loading data into memory.'
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
                    defaultValue={data.sprites.compression}
                    onChange={options => setTilesCompression(options[0].value as ImageCompressionType)}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/section', 'Section')}
                    hoverService={props.services.hoverService}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/sectionDescription',
                        // eslint-disable-next-line max-len
                        'Defines whether image data should be stored in ROM space or Expansion space. You usually want to leave this untouched, since the latter only works on specially designed cartridges.'
                    )}
                />
                <RadioSelect
                    defaultValue={data.sprites.section}
                    options={[{
                        label: 'ROM',
                        value: DataSection.ROM,
                    }, {
                        label: nls.localize('vuengine/entityEditor/expansion', 'Expansion'),
                        value: DataSection.EXP,
                    }]}
                    onChange={options => setSection(options[0].value as DataSection)}
                />
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
            {data.sprites.sprites.length > 0 && data.sprites.sprites.map((s, i) =>
                <Sprite
                    key={`sprite-${i}`}
                    index={i}
                    sprite={s}
                    fileUri={fileUri}
                    services={services}
                />
            )}
            <button
                className='theia-button add-button large full-width'
                onClick={addSprite}
                title={nls.localize('vuengine/entityEditor/addSprite', 'Add Sprite')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>
    </VContainer>;
}
