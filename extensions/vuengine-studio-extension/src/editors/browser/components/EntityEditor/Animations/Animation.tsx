import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
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
}

export default function Animation(props: AnimationProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, animation } = props;

    const removeAnimation = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeAnimation', 'Remove Animation'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveAnimation', 'Are you sure you want to remove this Animation?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedAnimations = { ...data.animations };
            updatedAnimations.animations = [
                ...data.animations.animations.slice(0, index),
                ...data.animations.animations.slice(index + 1)
            ];
            if (updatedAnimations.default === index && index > 0) {
                updatedAnimations.default--;
            }

            setData({ animations: updatedAnimations });
        }
    };

    const setAnimation = (partialAnimationData: Partial<AnimationData>): void => {
        const updatedAnimationsArray = [...data.animations.animations];
        updatedAnimationsArray[index] = {
            ...updatedAnimationsArray[index],
            ...partialAnimationData,
        };

        const updatedAnimations = { ...data.animations };
        updatedAnimations.animations = updatedAnimationsArray;

        setData({ animations: updatedAnimations });
    };

    const setName = (name: string): void => {
        setAnimation({ name });
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
        setAnimation({
            cycles: Math.min(Math.max(cycles, MIN_ANIMATION_CYLCES), MAX_ANIMATION_CYLCES),
        });
    };

    const toggleLoop = (): void => {
        setAnimation({
            loop: !animation.loop
        });
    };

    const setCallback = (callback: string): void => {
        setAnimation({ callback });
    };

    return <VContainer className='item' gap={15}>
        <button
            className="remove-button"
            onClick={removeAnimation}
            title={nls.localize('vuengine/entityEditor/remove', 'Remove')}
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
                <label>
                    {nls.localize('vuengine/entityEditor/default', 'Default')}
                </label>
                <input
                    type="checkbox"
                    checked={data.animations.default === index}
                    onChange={setDefault}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/cycles', 'Cycles')}
                </label>
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
                <label>
                    {nls.localize('vuengine/entityEditor/loop', 'Loop')}
                </label>
                <input
                    type="checkbox"
                    checked={animation.loop}
                    onChange={toggleLoop}
                />
            </VContainer>
            {!animation.loop && <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/callback', 'Callback')}
                </label>
                <input
                    className='theia-input'
                    value={animation.callback}
                    onChange={e => setCallback(e.target.value)}
                />
            </VContainer>}
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/frames', 'Frames')}
            </label>
            <HContainer alignItems='start' gap={15} wrap='wrap'>
                ...
            </HContainer>
        </VContainer>
    </VContainer>;
}
