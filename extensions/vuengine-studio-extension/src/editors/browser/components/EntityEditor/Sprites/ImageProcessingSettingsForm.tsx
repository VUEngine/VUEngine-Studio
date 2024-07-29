import * as iq from 'image-q';
import React, { useContext, useEffect, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import {
    colorDistanceFormulaOptions,
    DEFAULT_COLOR_DISTANCE_FORMULA,
    DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
    DEFAULT_PALETTE_QUANTIZATION_ALGORITHM,
    ImageProcessingSettings,
    imageQuantizationAlgorithmOptions,
    paletteQuantizationAlgorithmOptions
} from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import BasicSelect from '../../Common/BasicSelect';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import Images from '../../ImageEditor/Images';
import ColorModeSelect from './ColorModeSelect';

interface ImageProcessingSettingsFormProps {
    image: string
    setFiles: (files: string[]) => void
    processingSettings: ImageProcessingSettings
    updateProcessingSettings: (processingSettings: Partial<ImageProcessingSettings>) => void
    colorMode: ColorMode
    updateColorMode: (colorMode: ColorMode) => void
    allowFrameBlendMode: boolean
    height: number
    width: number
}

export default function ImageProcessingSettingsForm(props: ImageProcessingSettingsFormProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        image,
        setFiles,
        processingSettings,
        updateProcessingSettings,
        colorMode,
        updateColorMode,
        allowFrameBlendMode,
        height,
        width
    } = props;
    const [resultImageBase64, setResultImageBase64] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);

    // TODO: just render sprite._imageData here instead?
    const quantizeImage = async () => {
        setProgress(0);
        setResultImageBase64('');

        if (image !== undefined && processingSettings !== undefined && colorMode !== undefined) {
            const output = await services.vesImagesService.quantizeImage(image, processingSettings, colorMode, setProgress);
            setResultImageBase64(Buffer.from(output).toString('base64'));
        }
    };

    useEffect(() => {
        quantizeImage();
    }, [
        image,
        processingSettings,
        colorMode,
    ]);

    return (
        <div className="jsonforms-container">
            <VContainer gap={10} style={{ padding: '1px' }}>
                <VContainer grow={1}>
                    <HContainer grow={1}>
                        <VContainer style={{ width: '50%' }}>
                            <label>Source</label>
                            <Images
                                data={image ? [image] : []}
                                updateData={setFiles}
                                allInFolderAsFallback={false}
                                canSelectMany={false}
                                stack={true}
                                showMetaData={false}
                                containerHeight={'100%'}
                                containerWidth={'100%'}
                            />
                        </VContainer>

                        <VContainer justifyContent="center">
                            <label>&nbsp;</label>
                            <i className="codicon codicon-arrow-right"></i>
                        </VContainer>
                        <VContainer style={{ width: '50%' }}>
                            <label>Result</label>
                            <VContainer grow={1} style={{ position: 'relative' }}>
                                <Images
                                    data={image && resultImageBase64 ? [`data:image/png;base64,${resultImageBase64}`] : []}
                                    allInFolderAsFallback={false}
                                    canSelectMany={false}
                                    stack={true}
                                    showMetaData={false}
                                    containerHeight={'100%'}
                                    containerWidth={'100%'}
                                />
                                {!resultImageBase64 &&
                                    <VContainer
                                        alignItems="center"
                                        justifyContent="center"
                                        style={{
                                            backgroundColor: 'var(--theia-activityBar-background)',
                                            borderRadius: 2,
                                            bottom: 0,
                                            left: 0,
                                            lineHeight: 1,
                                            position: 'absolute',
                                            right: 0,
                                            top: 0,
                                        }}
                                    >
                                        {image &&
                                            <>
                                                <i
                                                    className="codicon codicon-loading codicon-modifier-spin"
                                                    style={{ fontSize: '4rem', position: 'absolute' }}
                                                ></i>
                                                {Math.round(progress)}%
                                            </>
                                        }
                                    </VContainer>
                                }
                            </VContainer>
                        </VContainer>
                    </HContainer>
                    <VContainer style={{ opacity: .6 }}>
                        {height
                            ? <>{width} × {height} px</>
                            : <>&nbsp;</>
                        }
                    </VContainer>
                </VContainer>
                <HContainer gap={10}>
                    <VContainer style={{ width: '50%' }}>
                        <label>Image Quantization Algorithm</label>
                        <BasicSelect
                            options={imageQuantizationAlgorithmOptions}
                            value={processingSettings?.imageQuantizationAlgorithm ?? DEFAULT_IMAGE_QUANTIZATION_ALGORITHM}
                            onChange={e => updateProcessingSettings({
                                imageQuantizationAlgorithm: e.target.value as iq.ImageQuantization,
                            })}
                            disabled={!image}
                        />
                    </VContainer>
                    <VContainer style={{ width: '50%' }}>
                        <label>Palette Quantization Algorithm</label>
                        <BasicSelect
                            options={paletteQuantizationAlgorithmOptions}
                            value={processingSettings?.paletteQuantizationAlgorithm ?? DEFAULT_PALETTE_QUANTIZATION_ALGORITHM}
                            onChange={e => updateProcessingSettings({
                                paletteQuantizationAlgorithm: e.target.value as iq.PaletteQuantization,
                            })}
                            disabled={!image}
                        />
                    </VContainer>
                </HContainer>
                <HContainer gap={10}>
                    <VContainer style={{ width: '50%' }}>
                        <label>Color Distance Formula</label>
                        <BasicSelect
                            options={colorDistanceFormulaOptions}
                            value={processingSettings?.colorDistanceFormula ?? DEFAULT_COLOR_DISTANCE_FORMULA}
                            onChange={e => updateProcessingSettings({
                                colorDistanceFormula: e.target.value as iq.ColorDistanceFormula,
                            })}
                            disabled={!image}
                        />
                    </VContainer>
                    <VContainer style={{ width: '50%' }}>
                        {allowFrameBlendMode &&
                            <ColorModeSelect
                                value={colorMode}
                                setValue={newColorMode => updateColorMode(newColorMode)}
                                hoverService={services.hoverService}
                                disabled={!image}
                            />
                        }

                    </VContainer>
                </HContainer>
            </VContainer>
        </div>
    );
}
