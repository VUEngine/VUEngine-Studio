import { nls } from '@theia/core';
import { ImageProcessingSettings } from 'vb-image-converter';
import React, { useContext, useState } from 'react';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import ImageProcessingSettingsForm from '../ActorEditor/Sprites/ImageProcessingSettingsForm';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import { getTilesetOptimizationScope } from '../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { ImageEditorContext, ImageEditorContextType, isSingleConvertedFile } from './ImageEditorTypes';

export default function Quantisation(): React.JSX.Element {
    const { imageData, updateImageData, reconvertImages } = useContext(ImageEditorContext) as ImageEditorContextType;
    const { fileUri } = useContext(EditorsContext) as EditorsContextType;
    const [processingDialogOpen, setProcessingDialogOpen] = useState<boolean>(false);

    const allowFrameBlendMode = !imageData.animation.isAnimation;

    const previewName = isSingleConvertedFile(imageData)
        ? fileUri.path.name
        : imageData.files.length
            ? fileUri.parent.resolve(imageData.files[0]).path.name
            : '';
    const previewImageData = imageData._imageData?.[previewName];

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

    const setMaxTiles = (maxTiles: number): void => {
        updateImageData({
            tileset: {
                ...imageData.tileset,
                optimization: {
                    ...imageData.tileset.optimization,
                    maxTiles,
                },
            },
        });
    };

    return <>
        <VContainer gap={5}>
            <label>
                {nls.localize('vuengine/editors/image/quantisation', 'Quantisation')}
            </label>
            <button
                className="theia-button secondary"
                title={nls.localize('vuengine/editors/actor/imageProcessingSettings', 'Image Processing Settings')}
                onClick={() => setProcessingDialogOpen(true)}
            >
                <i className="codicon codicon-settings" />
            </button>
        </VContainer>
        <PopUpDialog
            open={processingDialogOpen}
            onClose={() => setProcessingDialogOpen(false)}
            onOk={() => setProcessingDialogOpen(false)}
            title={nls.localize('vuengine/editors/general/imageProcessingSettings', 'Image Processing Settings')}
            height='100%'
            width='100%'
        >
            <ImageProcessingSettingsForm
                image={imageData.files[0]}
                imageData={previewImageData}
                convertImage={reconvertImages}
                processingSettings={imageData.imageProcessingSettings}
                updateProcessingSettings={updateImageProcessingSettings}
                colorMode={allowFrameBlendMode ? imageData.colorMode : ColorMode.Default}
                updateColorMode={setColorMode}
                compression={imageData.tileset.compression}
                allowFrameBlendMode={allowFrameBlendMode}
                maxTiles={imageData.tileset.optimization?.maxTiles ?? 0}
                updateMaxTiles={setMaxTiles}
                optimizationScope={getTilesetOptimizationScope(
                    imageData.animation.isAnimation,
                    imageData.animation.individualFiles,
                    imageData.tileset.shared,
                )}
            />
        </PopUpDialog>
    </>;
}
