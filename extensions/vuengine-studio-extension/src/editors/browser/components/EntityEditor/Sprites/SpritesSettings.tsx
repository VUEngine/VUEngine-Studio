import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
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

    return <VContainer gap={10}>
        <label>
            {nls.localize('vuengine/entityEditor/generalSpritesSettings', 'General Sprites Settings')}
        </label>
        <HContainer gap={15} wrap='wrap'>
            <HContainer gap={15} wrap='wrap'>
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
            </HContainer>
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
                                'With this enabled, tiles for all animation frames are loaded into video memory at the same time. ' +
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
                        {nls.localize('vuengine/entityEditor/optimize', 'Optimize')}
                    </label>
                    {data.components?.sprites.length > 1 && <label>
                        <input
                            type="checkbox"
                            checked={data.sprites.sharedTiles}
                            onChange={toggleSharedTiles}
                        />
                        {nls.localize('vuengine/entityEditor/share', 'Share')}
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
        </HContainer>
    </VContainer>;
}
