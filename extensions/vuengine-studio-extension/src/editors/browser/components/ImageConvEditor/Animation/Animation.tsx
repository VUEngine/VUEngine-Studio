import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { ImageConvEditorContext, ImageConvEditorContextType } from '../ImageConvEditorTypes';

export default function Animation(): React.JSX.Element {
    const { imageConvData, setImageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;

    const toggleIsAnimation = () => {
        setImageConvData({
            animation: {
                ...imageConvData.animation,
                isAnimation: !imageConvData.animation.isAnimation
            },
        });
    };

    const toggleIndividualFiles = () => {
        setImageConvData({
            animation: {
                ...imageConvData.animation,
                individualFiles: !imageConvData.animation.individualFiles
            },
        });
    };

    const onChangeAnimationFrames = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageConvData({
            animation: {
                ...imageConvData.animation,
                frames: parseInt(e.target.value)
            },
        });
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>
                {nls.localize('vuengine/imageConvEditor/animation', 'Animation')}
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={imageConvData.animation.isAnimation}
                    onChange={toggleIsAnimation}
                />
                {nls.localize('vuengine/imageConvEditor/isAnimation', 'Is animation')}
            </label>
            {imageConvData.animation.isAnimation && <label>
                <input
                    type="checkbox"
                    checked={imageConvData.animation.individualFiles}
                    onChange={toggleIndividualFiles}
                />
                {nls.localize('vuengine/imageConvEditor/individualFiles', 'Frames are separate image files')}
            </label>}
        </VContainer>
        {imageConvData.animation.isAnimation && !imageConvData.animation.individualFiles && <VContainer>
            <label>{nls.localize('vuengine/imageConvEditor/frames', 'Frames')}</label>
            <input
                className='theia-input'
                type='number'
                value={imageConvData.animation.frames}
                onChange={onChangeAnimationFrames}
                min={0}
            />
        </VContainer>}
    </VContainer >;
}
