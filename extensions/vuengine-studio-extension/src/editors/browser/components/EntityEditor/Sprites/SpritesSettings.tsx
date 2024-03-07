import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { DataSection } from '../../Common/CommonTypes';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import SectionSelect from '../../Common/SectionSelect';
import VContainer from '../../Common/VContainer';
import { SpriteType } from '../../Common/VUEngineTypes';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

interface SpritesSettingsProps {
    isMultiFileAnimation: boolean
}

export default function SpritesSettings(props: SpritesSettingsProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { isMultiFileAnimation } = props;
    const [maxAnimationFrames, setMaxAnimationFrames] = useState<number>(256);

    const getEngineSettings = async (): Promise<void> => {
        await services.vesProjectService.projectItemsReady;
        const engineConfig = services.vesProjectService.getProjectDataItemById(ProjectContributor.Project, 'EngineConfig');
        // @ts-ignore
        setMaxAnimationFrames(engineConfig?.animation?.maxFramesPerAnimationFunction || maxAnimationFrames);
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

    const setTilesCompression = async (compression: ImageCompressionType): Promise<void> => {
        await setData({
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

    const toggleOptimizedTiles = async (): Promise<void> => {
        await setData({
            sprites: {
                ...data.sprites,
                optimizedTiles: !data.sprites.optimizedTiles,
            }
        }, {
            appendImageData: true,
        });
    };

    const toggleSharedTiles = async (): Promise<void> => {
        await setData({
            sprites: {
                ...data.sprites,
                sharedTiles: !data.sprites.sharedTiles,
            }
        }, {
            appendImageData: true,
        });
    };

    const setAnimationFrames = async (frames: number): Promise<void> => {
        await setData({
            animations: {
                ...data.animations,
                totalFrames: frames,
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

    useEffect(() => {
        getEngineSettings();
    }, []);

    return <>
        <VContainer gap={15}>
            <label>
                {nls.localize('vuengine/entityEditor/generalSpritesSettings', 'General Sprites Settings')}
            </label>
            <HContainer gap={15}>
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
                        defaultValue={data.sprites.compression}
                        onChange={options => setTilesCompression(options[0].value as ImageCompressionType)}
                    />
                </VContainer>
            </HContainer>
            <SectionSelect
                value={data.sprites.section}
                setValue={setSection}
            />
            <HContainer gap={15}>
                {data.components?.animations.length > 0 && <>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/frames', 'Frames')}
                        </label>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={1}
                            max={maxAnimationFrames}
                            disabled={isMultiFileAnimation}
                            value={data.animations.totalFrames}
                            onChange={e => setAnimationFrames(parseInt(e.target.value))}
                        />
                    </VContainer>
                    {!isMultiFileAnimation && <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/entityEditor/multiframe', 'Multiframe')}
                            tooltip={nls.localize(
                                'vuengine/entityEditor/multiframeDescription',
                                'With this enabled, chars for all animation frames are loaded into video memory at the same time. ' +
                                'This allows multiple sprites to use the same texture, but show a different frame for each.'
                            )}
                        />
                        <input
                            type="checkbox"
                            checked={data.animations.multiframe}
                            onChange={toggleMultiframe}
                        />
                    </VContainer>}
                </>}
                {/* these setting are implicitly handled for animations */}
                {data.components?.animations.length === 0 && <VContainer>
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
                    {data.components?.sprites.length > 1 && <label>
                        <input
                            type="checkbox"
                            checked={data.sprites.sharedTiles}
                            onChange={toggleSharedTiles}
                        />
                        {nls.localize('vuengine/entityEditor/shared', 'Shared')}
                    </label>}
                </VContainer>}
            </HContainer>
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
        </VContainer>
    </>;
}
