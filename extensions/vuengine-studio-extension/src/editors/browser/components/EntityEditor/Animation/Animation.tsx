import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import VContainer from '../../Common/VContainer';
import {
    AnimationData,
    EntityEditorContext,
    EntityEditorContextType,
    MAX_ANIMATION_CYLCES,
    MIN_ANIMATION_CYLCES
} from '../EntityEditorTypes';

interface AnimationProps {
    index: number
    animation: AnimationData
    updateAnimation: (partialData: Partial<AnimationData>) => void
    removeAnimation: () => void
    totalFrames: number
}

export default function Animation(props: AnimationProps): React.JSX.Element {
    const { data, setData, state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, animation, updateAnimation, removeAnimation, totalFrames } = props;

    const setName = (name: string): void => {
        updateAnimation({ name });
    };

    const setDefault = (): void => {
        setState({
            preview: {
                ...state.preview,
                currentAnimation: index,
            }
        });

        setData({
            animations: {
                ...data.animations,
                default: index,
            }
        });
    };

    const setCycles = (cycles: number): void => {
        updateAnimation({
            cycles: Math.min(Math.max(cycles, MIN_ANIMATION_CYLCES), MAX_ANIMATION_CYLCES),
        });
    };

    const toggleLoop = (): void => {
        updateAnimation({
            loop: !animation.loop
        });
    };

    const setCallback = (callback: string): void => {
        updateAnimation({ callback });
    };

    const setFrame = (i: number, frame: number): void => {
        const frames = [...animation.frames];
        frames[i] = Math.min(Math.max(frame, 1), totalFrames);
        updateAnimation({ frames });
    };

    const addFrame = (): void => {
        updateAnimation({
            frames: [
                ...animation.frames,
                Math.min((animation.frames.pop() || 0) + 1, totalFrames),
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

    return <div>
        <VContainer className='item' gap={15}>
            <button
                className="remove-button"
                onClick={removeAnimation}
                title={nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component')}
            >
                <i className='codicon codicon-x' />
            </button>
            <HContainer alignItems='start' gap={15} wrap='wrap'>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/name', 'Name')}
                    </label>
                    <input
                        className='theia-input'
                        value={animation.name}
                        onChange={e => setName(e.target.value)}
                    />
                </VContainer>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/entityEditor/default', 'Default')}
                        tooltip={nls.localize(
                            'vuengine/entityEditor/defaultAnimationDescription',
                            'Play this animation as the default when the entity is created.'
                        )}
                    />
                    <input
                        type="checkbox"
                        checked={data.animations.default === index}
                        onChange={setDefault}
                    />
                </VContainer>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/entityEditor/cycles', 'Cycles')}
                        tooltip={nls.localize(
                            'vuengine/entityEditor/animationCyclesDescription',
                            'Each frame of this animation Number is display the fiven amount of CPU cycles.'
                        )}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        min={MIN_ANIMATION_CYLCES}
                        max={MAX_ANIMATION_CYLCES}
                        value={animation.cycles}
                        onChange={e => setCycles(parseInt(e.target.value))}
                    />
                </VContainer>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/entityEditor/loop', 'Loop')}
                        tooltip={nls.localize(
                            'vuengine/entityEditor/animationLoopDescription',
                            'Should this animation play endlessly in a loop or stop and continue showing the last frame after playing it once?'
                        )}
                    />
                    <input
                        type="checkbox"
                        checked={animation.loop}
                        onChange={toggleLoop}
                    />
                </VContainer>
                {!animation.loop && <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/entityEditor/callback', 'Callback')}
                        tooltip={nls.localize(
                            'vuengine/entityEditor/animationCallbackDescription',
                            'Provide the name of the method to call on animation completion.'
                        )}
                    />
                    <input
                        className='theia-input'
                        value={animation.callback}
                        onChange={e => setCallback(e.target.value)}
                    />
                </VContainer>}
            </HContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/frames', 'Frames')} ({animation.frames.length})
                </label>
                <HContainer alignItems='start' wrap='wrap'>
                    {animation.frames.map((f, i) =>
                        <HContainer key={`frame-${i}`} gap={1}>
                            <input
                                key={`frame-${i}`}
                                className='theia-input'
                                style={{ width: 40 }}
                                type='number'
                                min={1}
                                max={totalFrames}
                                value={animation.frames[i]}
                                onChange={e => setFrame(i, parseInt(e.target.value))}
                            />
                            <button
                                className="theia-button secondary"
                                onClick={() => removeFrame(i)}
                                title={nls.localize('vuengine/entityEditor/removeFrame', 'Remove Frame')}
                            >
                                <i className='codicon codicon-x' />
                            </button>
                        </HContainer>
                    )}
                    <button
                        className='theia-button add-button'
                        onClick={addFrame}
                        title={nls.localize('vuengine/entityEditor/addFrame', 'Add Frame')}
                    >
                        <i className='codicon codicon-plus' />
                    </button>
                </HContainer>
            </VContainer>
        </VContainer>
    </div>;
}
