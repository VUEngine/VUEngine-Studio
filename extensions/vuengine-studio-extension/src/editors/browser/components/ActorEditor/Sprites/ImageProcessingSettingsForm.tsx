import { nls } from '@theia/core';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import {
    DEFAULT_DITHER_ALGORITHM,
    DISTANCE_CALCULATOR_OPTIONS,
    IMAGE_QUANTIZATION_ALGORITHM_OPTIONS,
    NO_DITHER_ALGORITHM,
    TilesetOptimizationScope,
} from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import CanvasImage from '../../Common/CanvasImage';
import { clamp, getMaxScaleInContainer, roundToNextMultipleOf8 } from '../../Common/Utils';
import { DisplayMode } from '../../Common/VUEngineTypes';
import Images from '../../ImageEditor/Images';
import ColorModeSelect from './ColorModeSelect';
import {
    ColorDistanceFormula,
    ConversionResult,
  DEFAULT_COLOR_DISTANCE_CALCULATOR,
  DEFAULT_DITHER_SERPENTINE,
  DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
  ImageCompressionType,
  ImageProcessingSettings,
  ImageQuantizationAlgorithm,
  MAX_CHARS,
  MAX_IMAGE_WIDTH,
} from 'vb-image-converter';

const ReconvertButton = styled.button`
    background-color: transparent;
    height: 100%;
`;

const OptionGroup = styled(HContainer)`
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    flex-wrap: wrap !important;
    gap: 20px !important;
    min-height: 56px;
    padding: 10px;
`;

const DEFAULT_MAX_TILES = 128;

export interface ImageProcessingSettingsFormProps {
    image: string
    setFiles?: (files: string[]) => void
    imageData?: Partial<ConversionResult>
    processingSettings: ImageProcessingSettings
    updateProcessingSettings: (processingSettings: Partial<ImageProcessingSettings>) => void
    colorMode: ColorMode
    updateColorMode: (colorMode: ColorMode) => void
    allowFrameBlendMode: boolean
    compression: ImageCompressionType
    maxTiles: number
    updateMaxTiles: (maxTiles: number) => void
    optimizationScope: TilesetOptimizationScope
    convertImage?: () => void
}

export default function ImageProcessingSettingsForm(props: ImageProcessingSettingsFormProps): React.JSX.Element {
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;
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
        maxTiles,
        updateMaxTiles,
        optimizationScope,
        convertImage,
    } = props;
    const [pixelData, setPixelData] = useState<number[][]>([]);
    const [resultImageBase64, setResultImageBase64] = useState<string>('');
    const [canvasScale, setCanvasScale] = useState<number>(1);
    const [height, setHeight] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);
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
            setResultImageBase64(Buffer.from(output as unknown as string).toString('base64'));
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

    const finalHeight = useMemo(() => roundToNextMultipleOf8(height), [height]);
    const finalWidth = useMemo(() => clamp(roundToNextMultipleOf8(width), 0, MAX_IMAGE_WIDTH), [width]);
    const isPadded = finalHeight > height || finalWidth > width;
    const isCropped = width > MAX_IMAGE_WIDTH;

    // An animation is budgeted per frame, so the counts that matter are those of its
    // largest frame, the one character memory has to hold. Everything else is
    // budgeted as a whole tileset.
    const isPerFrame = optimizationScope === TilesetOptimizationScope.FRAME;
    const tilesAfter = isPerFrame
        ? imageData?.optimization?.tilesAfter ?? imageData?.animation?.largestFrame ?? 0
        : imageData?.tiles?.count ?? 0;
    const tilesBefore = imageData?.optimization?.tilesBefore ?? tilesAfter;
    const tolerance = imageData?.optimization
        ? Math.round(imageData.optimization.tolerance * 100) / 100
        : undefined;
    const isOptimizing = maxTiles > 0;
    const toggleOptimize = () => updateMaxTiles(isOptimizing
        ? 0
        : tilesBefore || DEFAULT_MAX_TILES
    );

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
                <HContainer gap={10} wrap='wrap'>
                    <OptionGroup>
                        <ColorModeSelect
                            value={colorMode ?? ColorMode.Default}
                            setValue={newColorMode => updateColorMode(newColorMode)}
                            hoverService={services.hoverService}
                            disabled={!image || !allowFrameBlendMode}
                        />
                    </OptionGroup>
                    <OptionGroup>
                        <VContainer>
                            <Checkbox
                                sideLabel={nls.localize('vuengine/editors/general/dither', 'Dither')}
                                checked={processingSettings?.imageQuantizationAlgorithm !== NO_DITHER_ALGORITHM}
                                setChecked={() => {
                                    updateProcessingSettings({
                                        imageQuantizationAlgorithm: processingSettings?.imageQuantizationAlgorithm === NO_DITHER_ALGORITHM
                                            ? DEFAULT_DITHER_ALGORITHM
                                            : NO_DITHER_ALGORITHM,
                                    });
                                }}
                            />
                            {processingSettings?.imageQuantizationAlgorithm !== NO_DITHER_ALGORITHM &&
                                <Checkbox
                                    sideLabel={nls.localize('vuengine/editors/general/serpentine', 'Serpentine')}
                                    checked={processingSettings?.serpentine ?? DEFAULT_DITHER_SERPENTINE}
                                    setChecked={() => {
                                        updateProcessingSettings({
                                            serpentine: !processingSettings?.serpentine,
                                        });
                                    }}
                                />
                            }
                        </VContainer>
                        {processingSettings?.imageQuantizationAlgorithm !== NO_DITHER_ALGORITHM &&
                            <>
                                <VContainer style={{ minWidth: 200 }}>
                                    <label>
                                        {nls.localize('vuengine/editors/general/quantizationAlgorithm', 'Quantization Algorithm')}
                                    </label>
                                    <AdvancedSelect
                                        options={IMAGE_QUANTIZATION_ALGORITHM_OPTIONS}
                                        defaultValue={processingSettings?.imageQuantizationAlgorithm ?? DEFAULT_DITHER_ALGORITHM}
                                        onChange={options => updateProcessingSettings({
                                            imageQuantizationAlgorithm: options[0] as ImageQuantizationAlgorithm,
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
                                                distanceCalculator: options[0] as ColorDistanceFormula,
                                            })}
                                            disabled={!image}
                                            menuPlacement="top"
                                        />
                                    </VContainer>
                                }
                            </>
                        }
                    </OptionGroup>
                    {optimizationScope !== TilesetOptimizationScope.NONE &&
                        <OptionGroup>
                            <VContainer>
                                <Checkbox
                                    sideLabel={nls.localize('vuengine/editors/general/optimize', 'Optimize')}
                                    checked={isOptimizing}
                                    setChecked={toggleOptimize}
                                    disabled={!image}
                                />
                            </VContainer>
                            {isOptimizing &&
                                <>
                                    <Input
                                        label={nls.localize('vuengine/editors/general/targetTileCount', 'Target')
                                        }
                                        tooltip={isPerFrame
                                            ? nls.localize(
                                                'vuengine/editors/general/targetTileCountPerFrameDescription',
                                                'Merges near-identical tiles until every animation frame fits into the given number of tiles. \
Frames are optimized one by one, since only one of them has to be in character memory at a time, \
and the resulting tileset still holds all of them. \
This is lossy, the images get redrawn from the reduced tileset.',
                                            )
                                            : nls.localize(
                                                'vuengine/editors/general/targetTileCountDescription',
                                                'Merges near-identical tiles until the tileset fits into the given number of tiles. \
This is lossy, the image gets redrawn from the reduced tileset. \
Has no effect while tile reduction is turned off.',
                                            )
                                        }
                                        type="number"
                                        value={maxTiles}
                                        setValue={v => updateMaxTiles(v as number)}
                                        min={1}
                                        max={MAX_CHARS}
                                        step={1}
                                        width={64}
                                        disabled={!image}
                                    />
                                    {tilesBefore > 0 &&
                                        <VContainer gap="0">
                                            <label>
                                                {isPerFrame
                                                    ? nls.localize('vuengine/editors/general/largestFrame', 'Largest Frame')
                                                    : nls.localize('vuengine/editors/general/tileCount', 'Tile Count')
                                                }
                                            </label>
                                            <VContainer gap={2} style={{ opacity: .6, paddingTop: 4 }}>
                                                <div>
                                                    {tilesBefore} → {tilesAfter}
                                                </div>
                                                {tolerance !== undefined &&
                                                    <div>
                                                        {nls.localize('vuengine/editors/general/tolerance', 'Tolerance')}: {tolerance}
                                                    </div>
                                                }
                                            </VContainer>
                                        </VContainer>
                                    }
                                </>
                            }
                        </OptionGroup>
                    }
                </HContainer>
            </VContainer >
        </div >
    );
}
