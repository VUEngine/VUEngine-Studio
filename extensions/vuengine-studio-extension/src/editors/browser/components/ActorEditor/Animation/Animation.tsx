import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor';
import {
    ActorEditorContext,
    ActorEditorContextType,
    AnimationData,
    MAX_ANIMATION_CYLCES,
    MIN_ANIMATION_CYLCES
} from '../ActorEditorTypes';
import AnimationsSettings from './AnimationsSettings';

interface AnimationProps {
    index: number
    animation: AnimationData
    updateAnimation: (partialData: Partial<AnimationData>) => void
    totalFrames: number
    isMultiFileAnimation: boolean
}

export default function Animation(props: AnimationProps): React.JSX.Element {
    const { data, setData, currentAnimationStep } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { index, animation, updateAnimation, totalFrames, isMultiFileAnimation } = props;
    const [maxAnimationFrames, setMaxAnimationFrames] = useState<number>(256);

    const getEngineSettings = async (): Promise<void> => {
        await services.vesProjectService.projectDataReady;
        const engineConfig = services.vesProjectService.getProjectDataItemById(ProjectContributor.Project, 'EngineConfig');
        // @ts-ignore
        setMaxAnimationFrames(engineConfig?.animation?.maxFramesPerAnimationFunction || maxAnimationFrames);
    };

    const setDefault = (): void => {
        setData({
            animations: {
                ...data.animations,
                default: index,
            }
        });
    };

    const setCycles = (cycles: number): void => {
        updateAnimation({ cycles });
    };

    const toggleLoop = (): void => {
        updateAnimation({
            loop: !animation.loop
        });
    };

    const setName = (name: string): void => {
        updateAnimation({ name });
    };

    const setCallback = (callback: string): void => {
        updateAnimation({ callback });
    };

    const setFrame = (i: number, frame: number): void => {
        const frames = [...animation.frames];
        frames[i] = clamp(frame, 0, totalFrames - 1);
        updateAnimation({ frames });
    };

    const addFrame = (): void => {
        updateAnimation({
            frames: [
                ...animation.frames,
                Math.min((animation.frames.pop() ?? -1) + 1, totalFrames - 1),
            ]
        });
    };

    const removeFrame = (i: number): void => {
        updateAnimation({
            frames: [
                ...animation.frames.slice(0, i),
                ...animation.frames.slice(i + 1)
            ]
        });
    };

    useEffect(() => {
        getEngineSettings();
    }, []);

    return <div>
        <VContainer gap={15}>
            <HContainer alignItems='start' gap={15}>
                <Input
                    label={nls.localizeByDefault('Name')}
                    value={animation.name}
                    setValue={setName}
                    commands={INPUT_BLOCKING_COMMANDS}
                    grow={1}
                />
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/actor/default', 'Default')}
                        tooltip={nls.localize(
                            'vuengine/editors/actor/defaultAnimationDescription',
                            'Play this animation as the default when the actor is created.'
                        )}
                    />
                    <input
                        type="checkbox"
                        checked={data.animations.default === index}
                        onChange={setDefault}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
            </HContainer>
            <HContainer alignItems='start' gap={15}>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/actor/cycles', 'Cycles')}
                        tooltip={nls.localize(
                            'vuengine/editors/actor/animationCyclesDescription',
                            'Each frame of this animation is displayed the given amount of CPU cycles.'
                        )}
                    />
                    <Input
                        type='number'
                        value={animation.cycles}
                        setValue={setCycles}
                        min={MIN_ANIMATION_CYLCES}
                        max={MAX_ANIMATION_CYLCES}
                        width={80}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                </VContainer>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/actor/loop', 'Loop')}
                        tooltip={nls.localize(
                            'vuengine/editors/actor/animationLoopDescription',
                            'Should this animation play endlessly in a loop or stop and continue showing the last frame after playing it once?'
                        )}
                    />
                    <input
                        type="checkbox"
                        checked={animation.loop}
                        onChange={toggleLoop}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
            </HContainer>
            {!animation.loop &&
                <Input
                    label={nls.localize('vuengine/editors/actor/callback', 'Callback')}
                    tooltip={nls.localize(
                        'vuengine/editors/actor/animationCallbackDescription',
                        'Provide the name of the method to call on animation completion.'
                    )}
                    value={animation.callback}
                    setValue={setCallback}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
            }
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/actor/frames', 'Frames')} <span className='count'>{animation.frames.length}</span>
                </label>
                <HContainer alignItems='start' wrap='wrap'>
                    {animation.frames.map((f, i) =>
                        <HContainer key={`frame-${i}`} gap={1}>
                            <input
                                key={`frame-${i}`}
                                className={i === currentAnimationStep ? 'theia-input current' : 'theia-input'}
                                style={{ width: 40 }}
                                type='number'
                                min={0}
                                max={totalFrames - 1}
                                value={animation.frames[i] + 1}
                                onChange={e => setFrame(i, e.target.value === '' ? 0 : parseInt(e.target.value) - 1)}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                            <button
                                className="theia-button secondary"
                                onClick={() => removeFrame(i)}
                                title={nls.localizeByDefault('Remove')}
                            >
                                <i className='codicon codicon-x' />
                            </button>
                        </HContainer>
                    )}
                    {animation.frames.length < maxAnimationFrames
                        ? <button
                            className='theia-button add-button'
                            onClick={addFrame}
                            title={nls.localizeByDefault('Add')}
                        >
                            <i className='codicon codicon-plus' />
                        </button>
                        : <div>
                            {nls.localize('vuengine/editors/actor/frameLimitReaced', 'Frame limit reached. Edit in EngineConfig if necessary.')}
                        </div>
                    }
                </HContainer>
            </VContainer>
            <hr />
            <AnimationsSettings
                isMultiFileAnimation={isMultiFileAnimation}
            />
        </VContainer>
    </div>;
}
