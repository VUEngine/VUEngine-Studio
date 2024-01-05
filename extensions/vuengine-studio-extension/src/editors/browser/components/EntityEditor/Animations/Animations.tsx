import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Animation from './Animation';

export default function Animations(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const addAnimation = (): void => {
        const updatedAnimations = { ...data.animations };
        updatedAnimations.animations = [
            ...updatedAnimations.animations,
            {
                name: '',
                cycles: 8,
                frames: [],
                loop: true,
                callback: '',
            },
        ];

        setData({ animations: updatedAnimations });
    };

    const toggleEnabled = (): void => {
        // set total frames to 1 when disabling animations
        const totalFrames = data.animations.enabled ? 1 : data.animations.totalFrames;

        setData({
            animations: {
                ...data.animations,
                enabled: !data.animations.enabled,
                totalFrames,
            }
        });
    };

    return <VContainer gap={15}>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/enabled', 'Enabled')}
            </label>
            <input
                type="checkbox"
                checked={data.animations.enabled}
                onChange={toggleEnabled}
            />
        </VContainer>
        {data.animations.enabled && <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/animations', 'Animations')} ({data.animations.animations.length})
            </label>
            {data.animations.animations.length > 0 && data.animations.animations.map((animation, index) =>
                <Animation
                    key={`animation-${index}`}
                    index={index}
                    animation={animation}
                    totalFrames={data.animations.totalFrames}
                />
            )}
            <button
                className='theia-button add-button large full-width'
                onClick={addAnimation}
                title={nls.localize('vuengine/entityEditor/addAnimation', 'Add Animation')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>}
    </VContainer>;
}
