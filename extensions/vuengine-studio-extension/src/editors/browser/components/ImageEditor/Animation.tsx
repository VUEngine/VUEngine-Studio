import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../Common/Base/VContainer';
import { ImageEditorContext, ImageEditorContextType } from './ImageEditorTypes';

export default function Animation(): React.JSX.Element {
    const { imageData, updateImageData } = useContext(ImageEditorContext) as ImageEditorContextType;

    const toggleIsAnimation = () => {
        updateImageData({
            animation: {
                ...imageData.animation,
                isAnimation: !imageData.animation.isAnimation
            },
        });
    };

    const toggleIndividualFiles = () => {
        updateImageData({
            animation: {
                ...imageData.animation,
                individualFiles: !imageData.animation.individualFiles
            },
        });
    };

    const onChangeAnimationFrames = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateImageData({
            animation: {
                ...imageData.animation,
                frames: e.target.value === '' ? 0 : parseInt(e.target.value)
            },
        });
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/image/animation', 'Animation')}
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={imageData.animation.isAnimation}
                    onChange={toggleIsAnimation}
                />
                {nls.localize('vuengine/editors/image/isAnimation', 'Is animation')}
            </label>
            {imageData.animation.isAnimation && <label>
                <input
                    type="checkbox"
                    checked={imageData.animation.individualFiles}
                    onChange={toggleIndividualFiles}
                />
                {nls.localize('vuengine/editors/image/individualFiles', 'Frames are separate image files')}
            </label>}
        </VContainer>
        {imageData.animation.isAnimation && !imageData.animation.individualFiles && <VContainer>
            <label>{nls.localize('vuengine/editors/image/frames', 'Frames')}</label>
            <input
                className='theia-input'
                type='number'
                value={imageData.animation.frames}
                onChange={onChangeAnimationFrames}
                min={0}
            />
        </VContainer>}
    </VContainer >;
}
