import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import VContainer from '../../Common/Base/VContainer';
import { ActorEditorContext, ActorEditorContextType } from '../ActorEditorTypes';

interface AnimationsSettingsProps {
    isMultiFileAnimation: boolean
}

export default function AnimationsSettings(props: AnimationsSettingsProps): React.JSX.Element {
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { isMultiFileAnimation } = props;
    const [maxAnimationFrames, setMaxAnimationFrames] = useState<number>(256);

    const getEngineSettings = async (): Promise<void> => {
        await services.vesProjectService.projectDataReady;
        const engineConfig = services.vesProjectService.getProjectDataItemById(ProjectContributor.Project, 'EngineConfig');
        // @ts-ignore
        setMaxAnimationFrames(engineConfig?.animation?.maxFramesPerAnimationFunction || maxAnimationFrames);
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
            {nls.localize('vuengine/editors/actor/generalAnimationsSettings', 'General Animations Settings')}
        </label>
        <HContainer gap={15} wrap='wrap'>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/actor/totalFrames', ' Total Frames')}
                    tooltip={nls.localize(
                        'vuengine/editors/actor/totalFramesDescription',
                        'The total number of frames that sprites on this actor consist of. \
The maximum value is specified in the engine config and can be changed in the engine config editor.'
                    )}
                />
                <input
                    className='theia-input'
                    type='number'
                    min={1}
                    max={maxAnimationFrames}
                    disabled={isMultiFileAnimation}
                    value={data.animations.totalFrames}
                    onChange={e => setAnimationFrames(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    onFocus={() => disableCommands()}
                    onBlur={() => enableCommands()}
                    width={64}
                />
            </VContainer>
            {!isMultiFileAnimation && <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/actor/multiframe', 'Multiframe')}
                    tooltip={nls.localize(
                        'vuengine/editors/actor/multiframeDescription',
                        'With this enabled, tiles for all animation frames are loaded into video memory at the same time. \
This allows multiple sprites to use the same texture, but show a different frame for each.'
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.animations.multiframe}
                    onChange={toggleMultiframe}
                    onFocus={() => disableCommands()}
                    onBlur={() => enableCommands()}
                />
            </VContainer>}
        </HContainer>
    </VContainer>;
}
