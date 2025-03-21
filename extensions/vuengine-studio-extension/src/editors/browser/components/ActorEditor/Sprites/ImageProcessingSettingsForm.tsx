import { nls } from '@theia/core';
import * as iq from 'image-q';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import {
    ConversionResult,
    DEFAULT_COLOR_DISTANCE_CALCULATOR,
    DEFAULT_DITHER_SERPENTINE,
    DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
    DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
    DISTANCE_CALCULATOR_OPTIONS,
    IMAGE_QUANTIZATION_ALGORITHM_OPTIONS,
    ImageCompressionType,
    ImageProcessingSettings,
    MAX_IMAGE_WIDTH,
} from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import HContainer from '../../Common/Base/HContainer';
import { clamp, getMaxScaleInContainer, roundToNextMultipleOf8 } from '../../Common/Utils';
import VContainer from '../../Common/Base/VContainer';
import { DisplayMode } from '../../Common/VUEngineTypes';
import Images from '../../ImageEditor/Images';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditorTypes';
import ColorModeSelect from './ColorModeSelect';
import Range from '../../Common/Base/Range';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';

const ReconvertButton = styled.button`
    background-color: transparent;
    height: 100%;
`;

interface ImageProcessingSettingsFormProps {
    image: string
    setFiles?: (files: string[]) => void
    imageData?: Partial<ConversionResult>
    processingSettings: ImageProcessingSettings
    updateProcessingSettings: (processingSettings: Partial<ImageProcessingSettings>) => void
    colorMode: ColorMode
    updateColorMode: (colorMode: ColorMode) => void
    allowFrameBlendMode: boolean
    compression: ImageCompressionType
    convertImage?: () => void
}

export default function ImageProcessingSettingsForm(props: ImageProcessingSettingsFormProps): React.JSX.Element {
    const { fileUri, services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const {
        image,
        setFiles,
        imageData,
        processingSettings,
        updateProcessingSettings,
        colorMode,
        updateColorMode,
        allowFrameBlendMode,
        compression,
        convertImage,
    } = props;
    const [pixelData, setPixelData] = useState<number[][]>([]);
    const [resultImageBase64, setResultImageBase64] = useState<string>('');
    const [canvasScale, setCanvasScale] = useState<number>(1);
    const [height, setHeight] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);
    // eslint-disable-next-line no-null/no-null
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const getImageDimensions = async () => {
        if (image) {
            const resolvedImageUri = fileUri.parent.resolve(image);
            const exists = await services.fileService.exists(resolvedImageUri);
            if (exists) {
                const d = window.electronVesCore.getImageDimensions(resolvedImageUri.path.fsPath());
                setHeight(d.height ?? 0);
                setWidth(d.width ?? 0);
                return;
            }
        }

        setHeight(0);
        setWidth(0);
    };

    const getImageDataFromFile = async () => {
        if (image) {
            const imageUri = fileUri.parent.resolve(image);
            const output = await services.vesImagesService.quantizeImage(imageUri, processingSettings, colorMode);
            setResultImageBase64(Buffer.from(output).toString('base64'));
        } else {
            setResultImageBase64('');
        }
    };

    const uncompressImageData = async () => {
        let data: number[][] = [[], []];
        if (!imageData?.maps) {
            return;
        }
        const uncompressedTileData = await services.vesCommonService.unzipJson(imageData?.tiles?.data) as string[];
        if (!uncompressedTileData) {
            return;
        }
        const uncompressedMapData = await services.vesCommonService.unzipJson(imageData.maps[0]?.data) as string[];

        const actualCompression = compression === ImageCompressionType.RLE && imageData.tiles?.compressionRatio && imageData.tiles?.compressionRatio < 0
            ? ImageCompressionType.RLE
            : ImageCompressionType.NONE;
        data = services.vesImagesService.imageDataToPixelData(uncompressedTileData, { ...imageData.maps[0], data: uncompressedMapData }, actualCompression);
        setPixelData(data);
    };

    const findCanvasScale = () => {
        setCanvasScale(getMaxScaleInContainer(
            canvasContainerRef.current?.clientWidth ?? finalWidth,
            canvasContainerRef.current?.clientHeight ?? finalHeight,
            finalWidth,
            finalHeight,
        ));
    };

    const finalHeight = useMemo(() => clamp(roundToNextMultipleOf8(height), 0, height), [height]);
    const finalWidth = useMemo(() => clamp(roundToNextMultipleOf8(width), 0, MAX_IMAGE_WIDTH), [width]);
    const isPadded = finalHeight > height || finalWidth > width;
    const isCropped = width > MAX_IMAGE_WIDTH;

    useEffect(() => {
        getImageDimensions();
    }, [
        image,
    ]);

    useEffect(() => {
        if (imageData) {
            uncompressImageData();
        } else {
            setPixelData([]);
        }
    }, [
        imageData,
    ]);

    useEffect(() => {
        if (!imageData) {
            // use image file as fallback if no imageData was provided
            getImageDataFromFile();
        }
    }, [
        image,
        colorMode,
        processingSettings,
    ]);

    useEffect(() => {
        if (!canvasContainerRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => findCanvasScale());
        resizeObserver.observe(canvasContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [
        finalHeight,
        finalWidth,
    ]);

    return (
        <div className="jsonforms-container">
            <VContainer gap={10} style={{ padding: '1px' }}>
                <VContainer grow={1}>
                    <HContainer grow={1}>
                        <VContainer style={{ width: '50%' }}>
                            <HContainer justifyContent='space-between'>
                                <label>
                                    {nls.localize('vuengine/editors/general/source', 'Source')}
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
                            <label style={{ width: 34 }}>&nbsp;</label>
                            {convertImage &&
                                <ReconvertButton
                                    className="theia-button"
                                    title={nls.localize('vuengine/editors/actor/reconvertImage', 'Reconvert Image')}
                                    onClick={convertImage}
                                >
                                    <i className="codicon codicon-arrow-right"></i>
                                </ReconvertButton>
                            }
                            {!convertImage &&
                                <i className="codicon codicon-arrow-right"></i>
                            }
                        </VContainer>
                        <VContainer style={{ width: '50%' }}>
                            <HContainer justifyContent='space-between'>
                                <label>
                                    {nls.localize('vuengine/editors/general/result', 'Result')}
                                </label>
                                {height > 0 && width > 0 &&
                                    <VContainer style={{ opacity: .6 }}>
                                        {
                                            isPadded && isCropped
                                                ? <>{nls.localize('vuengine/editors/general/paddedAndCroppedTo', 'Padded and cropped to')}</>
                                                : isPadded
                                                    ? <>{nls.localize('vuengine/editors/general/paddedTo', 'Padded to')}</>
                                                    : isCropped
                                                        ? <>{nls.localize('vuengine/editors/general/croppedTo', 'Cropped to')}</>
                                                        : <></>
                                        }
                                        {' '}{finalWidth} × {finalHeight} px
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
                                        {pixelData.length > 0 &&
                                            <CanvasImage
                                                height={finalHeight}
                                                palette={'11100100'}
                                                pixelData={[pixelData]}
                                                displayMode={DisplayMode.Mono}
                                                width={finalWidth}
                                                colorMode={colorMode}
                                                style={{
                                                    backgroundColor: '#000',
                                                    transform: `scale(${canvasScale})`,
                                                }}
                                            />
                                        }
                                        {!pixelData.length && image && resultImageBase64 &&
                                            <>
                                                <div
                                                    style={{
                                                        backgroundColor: '#000',
                                                        backgroundImage: `url(data:image/png;base64,${resultImageBase64})`,
                                                        backgroundPosition: 'bottom',
                                                        height: finalHeight,
                                                        width: finalWidth,
                                                        position: 'absolute',
                                                        opacity: .5,
                                                        transform: `scale(${canvasScale})`,
                                                        zIndex: 2,
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        backgroundColor: '#000',
                                                        backgroundImage: `url(data:image/png;base64,${resultImageBase64})`,
                                                        backgroundPosition: 'top',
                                                        height: finalHeight,
                                                        width: finalWidth,
                                                        position: 'absolute',
                                                        transform: `scale(${canvasScale})`,
                                                        zIndex: 1,
                                                    }}
                                                />
                                            </>
                                        }
                                    </div>
                                </div>
                            </VContainer>
                        </VContainer>
                    </HContainer>
                </VContainer>
                <HContainer gap={20}>
                    <VContainer>
                        <ColorModeSelect
                            value={colorMode ?? ColorMode.Default}
                            setValue={newColorMode => updateColorMode(newColorMode)}
                            hoverService={services.hoverService}
                            disabled={!image || !allowFrameBlendMode}
                        />
                    </VContainer>
                    <HContainer gap={10} style={{ minHeight: 64 }}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/editors/general/dither', 'Dither')}
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
                                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                />
                                {nls.localize('vuengine/editors/general/enable', 'Enable')}
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
                                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                    />
                                    {nls.localize('vuengine/editors/general/serpentine', 'Serpentine')}
                                </label>
                            }
                        </VContainer>
                        {processingSettings?.imageQuantizationAlgorithm !== 'nearest' &&
                            <>
                                <VContainer style={{ minWidth: 200 }}>
                                    <label>
                                        {nls.localize('vuengine/editors/general/quantizationAlgorithm', 'Quantization Algorithm')}
                                    </label>
                                    <AdvancedSelect
                                        options={IMAGE_QUANTIZATION_ALGORITHM_OPTIONS}
                                        defaultValue={processingSettings?.imageQuantizationAlgorithm ?? DEFAULT_IMAGE_QUANTIZATION_ALGORITHM}
                                        onChange={options => updateProcessingSettings({
                                            imageQuantizationAlgorithm: options[0] as iq.ImageQuantization,
                                        })}
                                        disabled={!image}
                                        menuPlacement="top"
                                    />
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localize('vuengine/editors/general/minimumColorDistance', 'Minimum Color Distance')}
                                    </label>
                                    <Range
                                        value={processingSettings?.minimumColorDistanceToDither ?? DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER}
                                        max={1}
                                        min={0}
                                        step={0.05}
                                        setValue={(v: number) => updateProcessingSettings({
                                            minimumColorDistanceToDither: v,
                                        })}
                                        commandsToDisable={INPUT_BLOCKING_COMMANDS}
                                    />
                                </VContainer>
                                {processingSettings?.minimumColorDistanceToDither > 0 &&
                                    <VContainer style={{ minWidth: 200 }}>
                                        <label>
                                            {nls.localize('vuengine/editors/general/colorDistanceCalculator', 'Color Distance Calculator')}
                                        </label>
                                        <AdvancedSelect
                                            options={DISTANCE_CALCULATOR_OPTIONS}
                                            defaultValue={processingSettings?.distanceCalculator ?? DEFAULT_COLOR_DISTANCE_CALCULATOR}
                                            onChange={options => updateProcessingSettings({
                                                distanceCalculator: options[0] as iq.ColorDistanceFormula,
                                            })}
                                            disabled={!image}
                                            menuPlacement="top"
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
