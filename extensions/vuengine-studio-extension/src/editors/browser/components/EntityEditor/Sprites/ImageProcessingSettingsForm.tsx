import * as iq from 'image-q';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import {
    colorDistanceFormulaOptions,
    ConversionResult,
    DEFAULT_COLOR_DISTANCE_FORMULA,
    DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
    DEFAULT_PALETTE_QUANTIZATION_ALGORITHM,
    ImageProcessingSettings,
    imageQuantizationAlgorithmOptions,
    paletteQuantizationAlgorithmOptions
} from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import BasicSelect from '../../Common/BasicSelect';
import CanvasImage from '../../Common/CanvasImage';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { DisplayMode } from '../../Common/VUEngineTypes';
import Images from '../../ImageEditor/Images';
import ColorModeSelect from './ColorModeSelect';
import { getMaxScaleInContainer } from '../../Common/Utils';

interface ImageProcessingSettingsFormProps {
    image: string
    setFiles: (files: string[]) => void
    imageData?: Partial<ConversionResult>
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
        imageData,
        processingSettings,
        updateProcessingSettings,
        colorMode,
        updateColorMode,
        allowFrameBlendMode,
        height,
        width
    } = props;
    const [uncompressedImageData, setUncompressedImageData] = useState<number[][]>([]);
    const [canvasScale, setCanvasScale] = useState<number>(1);
    // eslint-disable-next-line no-null/no-null
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const uncompressImageData = async () => {
        let data: number[][] = [[], []];
        const uncompressedTileData = await services.vesCommonService.uncompressJson(imageData?.tiles?.data) as string[];
        if (imageData?.maps) {
            const uncompressedMapData = await services.vesCommonService.uncompressJson(imageData.maps[0]?.data) as string[];
            data = services.vesImagesService.imageDataToPixelData(uncompressedTileData, { ...imageData.maps[0], data: uncompressedMapData });
        }
        setUncompressedImageData(data);
    };

    const findCanvasScale = () => {
        setCanvasScale(getMaxScaleInContainer(
            canvasContainerRef.current?.clientWidth ?? width,
            canvasContainerRef.current?.clientHeight ?? height,
            width,
            height,
        ));
    };

    useEffect(() => {
        uncompressImageData();
    }, [
        imageData,
    ]);

    useEffect(() => {
        if (!canvasContainerRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => findCanvasScale());
        resizeObserver.observe(canvasContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [
        height,
        width,
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
                                <div
                                    className="filePreview"
                                    style={{
                                        // @ts-ignore
                                        '--ves-file-height': '100%',
                                        '--ves-file-width': '100%',
                                    }}
                                >
                                    <div className="filePreviewImage" ref={canvasContainerRef}>
                                        {uncompressedImageData &&
                                            <CanvasImage
                                                height={height}
                                                palette={'11100100'}
                                                pixelData={[uncompressedImageData]}
                                                displayMode={DisplayMode.Mono}
                                                width={width}
                                                colorMode={colorMode}
                                                style={{
                                                    transform: `scale(${canvasScale})`
                                                }}
                                            />
                                        }
                                    </div>
                                </div>
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
            </VContainer >
        </div >
    );
}
