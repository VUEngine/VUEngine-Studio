import { nls } from '@theia/core';
import * as iq from 'image-q';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import {
    ConversionResult,
    DEFAULT_COLOR_DISTANCE_CALCULATOR,
    DEFAULT_DITHER_SERPENTINE,
    DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
    DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
    DISTANCE_CALCULATOR_OPTIONS,
    IMAGE_QUANTIZATION_ALGORITHM_OPTIONS,
    ImageProcessingSettings,
} from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import BasicSelect from '../../Common/BasicSelect';
import CanvasImage from '../../Common/CanvasImage';
import HContainer from '../../Common/HContainer';
import { getMaxScaleInContainer, roundToNextMultipleOf8 } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import { DisplayMode } from '../../Common/VUEngineTypes';
import Images from '../../ImageEditor/Images';
import ColorModeSelect from './ColorModeSelect';

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
            canvasContainerRef.current?.clientWidth ?? paddedWidth,
            canvasContainerRef.current?.clientHeight ?? paddedHeight,
            paddedWidth,
            paddedHeight,
        ));
    };

    const paddedHeight = useMemo(() => roundToNextMultipleOf8(height), [height]);
    const paddedWidth = useMemo(() => roundToNextMultipleOf8(width), [width]);

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
        paddedHeight,
        paddedWidth,
    ]);

    return (
        <div className="jsonforms-container">
            <VContainer gap={10} style={{ padding: '1px' }}>
                <VContainer grow={1}>
                    <HContainer grow={1}>
                        <VContainer style={{ width: '50%' }}>
                            <HContainer justifyContent='space-between'>
                                <label>
                                    {nls.localize('vuengine/editors/source', 'Source')}
                                </label>
                                <VContainer style={{ opacity: .6 }}>
                                    {height
                                        ? <>{width} × {height} px</>
                                        : <>&nbsp;</>
                                    }
                                </VContainer>
                            </HContainer>
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
                            <HContainer justifyContent='space-between'>
                                <label>
                                    {nls.localize('vuengine/editors/result', 'Result')}
                                </label>
                                {
                                    (paddedHeight > height || paddedWidth > width) &&
                                    <VContainer style={{ opacity: .6 }}>
                                        {nls.localize('vuengine/editors/paddedTo', 'Padded to')} {paddedWidth} × {paddedHeight} px
                                    </VContainer>
                                }
                            </HContainer>
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
                                                height={paddedHeight}
                                                palette={'11100100'}
                                                pixelData={[uncompressedImageData]}
                                                displayMode={DisplayMode.Mono}
                                                width={paddedWidth}
                                                colorMode={colorMode}
                                                style={{
                                                    backgroundColor: '#000',
                                                    transform: `scale(${canvasScale})`,
                                                }}
                                            />
                                        }
                                    </div>
                                </div>
                            </VContainer>
                        </VContainer>
                    </HContainer>
                </VContainer>
                <HContainer gap={20}>
                    {allowFrameBlendMode &&
                        <VContainer>
                            <ColorModeSelect
                                value={colorMode ?? ColorMode.Default}
                                setValue={newColorMode => updateColorMode(newColorMode)}
                                hoverService={services.hoverService}
                                disabled={!image}
                            />
                        </VContainer>
                    }
                    <HContainer gap={10}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/editors/dither', 'Dither')}
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={processingSettings?.imageQuantizationAlgorithm !== 'nearest'}
                                    onChange={() => {
                                        updateProcessingSettings({
                                            imageQuantizationAlgorithm: processingSettings?.imageQuantizationAlgorithm === 'nearest' ? 'floyd-steinberg' : 'nearest',
                                        });
                                    }}
                                />
                                {nls.localize('vuengine/editors/enable', 'Enable')}
                            </label>
                            {processingSettings?.imageQuantizationAlgorithm !== 'nearest' &&
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={processingSettings?.serpentine ?? DEFAULT_DITHER_SERPENTINE}
                                        onChange={() => {
                                            updateProcessingSettings({
                                                serpentine: !processingSettings?.serpentine,
                                            });
                                        }}
                                    />
                                    {nls.localize('vuengine/editors/serpentine', 'Serpentine')}
                                </label>
                            }
                        </VContainer>
                        {processingSettings?.imageQuantizationAlgorithm !== 'nearest' &&
                            <>
                                <VContainer style={{ minWidth: 200 }}>
                                    <label>
                                        {nls.localize('vuengine/editors/quantizationAlgorithm', 'Quantization Algorithm')}
                                    </label>
                                    <BasicSelect
                                        options={IMAGE_QUANTIZATION_ALGORITHM_OPTIONS}
                                        value={processingSettings?.imageQuantizationAlgorithm ?? DEFAULT_IMAGE_QUANTIZATION_ALGORITHM}
                                        onChange={e => updateProcessingSettings({
                                            imageQuantizationAlgorithm: e.target.value as iq.ImageQuantization,
                                        })}
                                        disabled={!image}
                                    />
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/editors/minimumColorDistance', 'Minimum Color Distance')}
                                    </label>
                                    <HContainer>
                                        <input
                                            type='range'
                                            min={0}
                                            max={1}
                                            step={0.05}
                                            value={processingSettings?.minimumColorDistanceToDither ?? DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER}
                                            onChange={e => updateProcessingSettings({
                                                minimumColorDistanceToDither: parseFloat(e.target.value),
                                            })}
                                        />
                                        <div style={{ minWidth: 32, textAlign: 'right', width: 32 }}>
                                            {processingSettings?.minimumColorDistanceToDither ?? 0}
                                        </div>
                                    </HContainer>
                                </VContainer>
                                {processingSettings?.minimumColorDistanceToDither > 0 &&
                                    <VContainer style={{ minWidth: 200 }}>
                                        <label>
                                            {nls.localize('vuengine/editors/colorDistanceCalculator', 'Color Distance Calculator')}
                                        </label>
                                        <BasicSelect
                                            options={DISTANCE_CALCULATOR_OPTIONS}
                                            value={processingSettings?.distanceCalculator ?? DEFAULT_COLOR_DISTANCE_CALCULATOR}
                                            onChange={e => updateProcessingSettings({
                                                distanceCalculator: e.target.value as iq.ColorDistanceFormula,
                                            })}
                                            disabled={!image}
                                        />
                                    </VContainer>
                                }
                            </>
                        }
                    </HContainer>
                </HContainer>
            </VContainer >
        </div >
    );
}
