import { nls } from '@theia/core';
import React, { useContext, useState } from 'react';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import { ImageProcessingSettings } from '../../../../images/browser/ves-images-types';
import PopUpDialog from '../Common/PopUpDialog';
import VContainer from '../Common/VContainer';
import { ImageEditorContext, ImageEditorContextType } from './ImageEditorTypes';
import ImageProcessingSettingsForm from '../EntityEditor/Sprites/ImageProcessingSettingsForm';

export default function Quantisation(): React.JSX.Element {
    const { imageData, updateImageData } = useContext(ImageEditorContext) as ImageEditorContextType;
    const [processingDialogOpen, setProcessingDialogOpen] = useState<boolean>(false);

    const allowFrameBlendMode = !imageData.animation.isAnimation;

    const setColorMode = (colorMode: ColorMode): void => {
        updateImageData({ colorMode });
    };

    const updateImageProcessingSettings = (partialImageProcessingSettings: Partial<ImageProcessingSettings>) => {
        updateImageData({
            imageProcessingSettings: {
                ...imageData.imageProcessingSettings,
                ...partialImageProcessingSettings
            },
        });
    };

    return <>
        <VContainer gap={5}>
            <label>
                {nls.localize('vuengine/imageEditor/quantisation', 'Quantisation')}
            </label>
            <button
                className="theia-button secondary"
                title={nls.localize('vuengine/entityEditor/imageProcessingSettings', 'Image Processing Settings')}
                onClick={() => setProcessingDialogOpen(true)}
            >
                <i className="codicon codicon-settings" />
            </button>
        </VContainer>
        <PopUpDialog
            open={processingDialogOpen}
            onClose={() => setProcessingDialogOpen(false)}
            onOk={() => setProcessingDialogOpen(false)}
            title={nls.localize('vuengine/editors/imageProcessingSettings', 'Image Processing Settings')}
            height='100%'
            width='100%'
        >
            <ImageProcessingSettingsForm
                image={imageData.files[0]}
                processingSettings={imageData.imageProcessingSettings}
                updateProcessingSettings={updateImageProcessingSettings}
                colorMode={allowFrameBlendMode ? imageData.colorMode : ColorMode.Default}
                updateColorMode={setColorMode}
                allowFrameBlendMode={allowFrameBlendMode}
            />
        </PopUpDialog>
    </>;
}
