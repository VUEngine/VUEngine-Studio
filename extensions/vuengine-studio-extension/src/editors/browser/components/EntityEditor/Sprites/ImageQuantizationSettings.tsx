import * as iq from 'image-q';
import { PNG } from 'pngjs/browser';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import BasicSelect, { BasicSelectOption } from '../../Common/BasicSelect';
import HContainer from '../../Common/HContainer';
import { getMaxScaleInContainer } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import Images from '../../ImageEditor/Images';
import ColorModeSelect from './ColorModeSelect';

export interface ImageQuantizationSettingsType {
    colorDistanceFormula: iq.ColorDistanceFormula,
    paletteQuantizationAlgorithm: iq.PaletteQuantization | 'none',
    imageQuantizationAlgorithm: iq.ImageQuantization,
}

export const DEFAULT_COLOR_DISTANCE_FORMULA = 'euclidean';
export const DEFAULT_PALETTE_QUANTIZATION_ALGORITHM = 'none';
export const DEFAULT_IMAGE_QUANTIZATION_ALGORITHM = 'nearest';

interface ImageQuantizationSettingsProps {
    image: string
    setFiles: (files: string[]) => void
    quantizationSettings: ImageQuantizationSettingsType
    updateQuantizationSettings: (quantizationSettings: Partial<ImageQuantizationSettingsType>) => void
    colorMode: ColorMode
    updateColorMode: (colorMode: ColorMode) => void
    allowFrameBlendMode: boolean
    height: number
    width: number
}

const colorDistanceFormulaOptions: BasicSelectOption[] = [
    {
        label: 'CIE94 (Textiles)',
        value: 'cie94-textiles'
    },
    {
        label: 'CIE94 (Graphic Arts)',
        value: 'cie94-graphic-arts'
    },
    {
        label: 'CIEDE2000',
        value: 'ciede2000'
    },
    {
        label: 'Color Metric',
        value: 'color-metric'
    },
    {
        label: 'Euclidean',
        value: 'euclidean'
    },
    {
        label: 'Euclidean BT709',
        value: 'euclidean-bt709'
    },
    {
        label: 'Euclidean BT709 (No Alpha)',
        value: 'euclidean-bt709-noalpha'
    },
    {
        label: 'Manhattan',
        value: 'manhattan'
    },
    {
        label: 'Manhattan BT709',
        value: 'manhattan-bt709'
    },
    {
        label: 'Manhattan (nommyde)',
        value: 'manhattan-nommyde'
    },
    {
        label: 'PNGQuant',
        value: 'pngquant'
    },
];

const paletteQuantizationAlgorithmOptions: BasicSelectOption[] = [
    {
        label: 'None',
        value: 'none'
    },
    {
        label: 'NeuQuant (Integer)',
        value: 'neuquant'
    },
    {
        label: 'NeuQuant (Floating Point)',
        value: 'neuquant-float'
    },
    {
        label: 'RGBQuant',
        value: 'rgbquant'
    },
    {
        label: 'WuQuant',
        value: 'wuquant'
    },
];

const imageQuantizationAlgorithmOptions: BasicSelectOption[] = [
    {
        label: 'Nearest Color',
        value: 'nearest'
    },
    {
        label: 'Riemersma',
        value: 'riemersma'
    },
    {
        label: 'Floyd-Steinberg',
        value: 'floyd-steinberg'
    },
    {
        label: 'False Floyd Steinberg',
        value: 'false-floyd-steinberg'
    },
    {
        label: 'Stucki',
        value: 'stucki'
    },
    {
        label: 'Atkinson',
        value: 'atkinson'
    },
    {
        label: 'Jarvis',
        value: 'jarvis'
    },
    {
        label: 'Burkes',
        value: 'burkes'
    },
    {
        label: 'Sierra',
        value: 'sierra'
    },
    {
        label: 'Two-Row Sierra',
        value: 'two-sierra'
    },
    {
        label: 'Sierra Lite',
        value: 'sierra-lite'
    },
];

export default function ImageQuantizationSettings(props: ImageQuantizationSettingsProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        image,
        setFiles,
        quantizationSettings,
        updateQuantizationSettings,
        colorMode,
        updateColorMode,
        allowFrameBlendMode,
        height,
        width
    } = props;
    const [imageData, setImageData] = useState<PNG>();
    const [resultImageBase64, setResultImageBase64] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [targetPalette, setTargetPalette] = useState<iq.utils.Palette>();

    const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
    const resolvedImageUri = workspaceRootUri.resolve(image ?? '');

    const quantizeImage = async () => {
        setProgress(0);
        setResultImageBase64('');

        if (imageData && targetPalette) {
            let pointContainer = iq.utils.PointContainer.fromUint8Array(imageData.data, imageData.width, imageData.height);

            if (quantizationSettings?.paletteQuantizationAlgorithm && quantizationSettings?.paletteQuantizationAlgorithm !== 'none') {
                const reducedPalette = await iq.buildPalette([pointContainer], {
                    colorDistanceFormula: quantizationSettings?.colorDistanceFormula ?? DEFAULT_COLOR_DISTANCE_FORMULA,
                    paletteQuantization: quantizationSettings?.paletteQuantizationAlgorithm,
                    colors: colorMode === ColorMode.FrameBlend ? 7 : 4,
                });
                pointContainer = await iq.applyPalette(pointContainer, reducedPalette);
            }

            const outPointContainer = await iq.applyPalette(pointContainer, targetPalette, {
                colorDistanceFormula: quantizationSettings?.colorDistanceFormula ?? DEFAULT_COLOR_DISTANCE_FORMULA,
                imageQuantization: quantizationSettings?.imageQuantizationAlgorithm ?? DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
                onProgress: p => setProgress(p),
            });

            const output = PNG.sync.write({
                ...imageData,
                data: Buffer.from(outPointContainer.toUint8Array())
            } as PNG, {
                // colorType: 3
            });

            setResultImageBase64(Buffer.from(output).toString('base64'));
        }
    };

    const readImageData = async () => {
        const imageFileContent = await services.fileService.readFile(resolvedImageUri);
        const data = PNG.sync.read(Buffer.from(imageFileContent.value.buffer));
        setImageData(data);
    };

    const scale = useMemo(() => getMaxScaleInContainer(256, 256, height, width),
        [
            height,
            width
        ]);

    const buildTargetPalette = async () => {
        const palette = await iq.buildPalette([]);
        const point0 = iq.utils.Point.createByRGBA(0, 0, 0, 0);
        const pointMixed01 = iq.utils.Point.createByRGBA(42, 0, 0, 255);
        const point1 = iq.utils.Point.createByRGBA(85, 0, 0, 255);
        const pointMixed12 = iq.utils.Point.createByRGBA(127, 0, 0, 255);
        const point2 = iq.utils.Point.createByRGBA(170, 0, 0, 255);
        const pointMixed23 = iq.utils.Point.createByRGBA(212, 0, 0, 255);
        const point3 = iq.utils.Point.createByRGBA(255, 0, 0, 255);
        const paletteColors = colorMode === ColorMode.FrameBlend
            ? [point0, pointMixed01, point1, pointMixed12, point2, pointMixed23, point3]
            : [point0, point1, point2, point3];
        paletteColors.forEach(pc => palette.add(pc));
        setTargetPalette(palette);
    };

    useEffect(() => {
        readImageData();
    }, [image]);

    useEffect(() => {
        buildTargetPalette();
    }, [colorMode]);

    useEffect(() => {
        quantizeImage();
    }, [
        imageData,
        quantizationSettings,
        targetPalette,
    ]);

    return (
        <div className="jsonforms-container" style={{
            height: '425px',
            width: '564px'
        }}>
            <VContainer gap={10} style={{ padding: '1px' }}>
                <VContainer>
                    <HContainer>
                        <VContainer>
                            <label>Source</label>
                            <Images
                                data={image ? [image] : []}
                                updateData={setFiles}
                                allInFolderAsFallback={false}
                                canSelectMany={false}
                                stack={true}
                                showMetaData={false}
                                containerHeight={256}
                                containerWidth={256}
                                height={height}
                                width={width}
                            />
                        </VContainer>
                        {image &&
                            <>
                                <VContainer justifyContent="center">
                                    <label>&nbsp;</label>
                                    <i className="codicon codicon-arrow-right"></i>
                                </VContainer>
                                <VContainer>
                                    <label>Result</label>
                                    <div className="filePreviewImage" style={{
                                        height: '256px',
                                        width: '256px',
                                    }}>
                                        {!resultImageBase64
                                            ? <VContainer
                                                alignItems="center"
                                                justifyContent="center"
                                                style={{ lineHeight: 1 }}
                                            >
                                                <i
                                                    className="codicon codicon-loading codicon-modifier-spin"
                                                    style={{ fontSize: '4rem', position: 'absolute' }}
                                                ></i>
                                                {Math.round(progress)}%
                                            </VContainer>
                                            : <>
                                                <img
                                                    src={`data:image/png;base64,${resultImageBase64}`}
                                                    style={{
                                                        backgroundColor: '#000',
                                                        transform: `scale(${scale})`
                                                    }}
                                                />
                                                {scale !== 1 &&
                                                    <div
                                                        className="fileZoom"
                                                        title="Preview Zoom"
                                                    >
                                                        <i className="codicon codicon-zoom-in" /> {scale}
                                                    </div>
                                                }
                                            </>
                                        }
                                    </div>
                                </VContainer>
                            </>
                        }
                    </HContainer>
                    {height > 0 &&
                        <VContainer style={{ opacity: .6 }}>
                            {width} × {height} px
                        </VContainer>
                    }
                </VContainer>
                {image &&
                    <>
                        <HContainer gap={10}>
                            <VContainer style={{ width: '50%' }}>
                                <label>Image Quantization Algorithm</label>
                                <BasicSelect
                                    options={imageQuantizationAlgorithmOptions}
                                    value={quantizationSettings?.imageQuantizationAlgorithm ?? DEFAULT_IMAGE_QUANTIZATION_ALGORITHM}
                                    onChange={e => updateQuantizationSettings({
                                        imageQuantizationAlgorithm: e.target.value as iq.ImageQuantization,
                                    })}
                                />
                            </VContainer>
                            <VContainer style={{ width: '50%' }}>
                                <label>Palette Quantization Algorithm</label>
                                <BasicSelect
                                    options={paletteQuantizationAlgorithmOptions}
                                    value={quantizationSettings?.paletteQuantizationAlgorithm ?? DEFAULT_PALETTE_QUANTIZATION_ALGORITHM}
                                    onChange={e => updateQuantizationSettings({
                                        paletteQuantizationAlgorithm: e.target.value as iq.PaletteQuantization,
                                    })}
                                />
                            </VContainer>
                        </HContainer>
                        <HContainer gap={10}>
                            <VContainer style={{ width: '50%' }}>
                                <label>Color Distance Formula</label>
                                <BasicSelect
                                    options={colorDistanceFormulaOptions}
                                    value={quantizationSettings?.colorDistanceFormula ?? DEFAULT_COLOR_DISTANCE_FORMULA}
                                    onChange={e => updateQuantizationSettings({
                                        colorDistanceFormula: e.target.value as iq.ColorDistanceFormula,
                                    })}
                                />
                            </VContainer>
                            <VContainer style={{ width: '50%' }}>
                                {allowFrameBlendMode &&
                                    <ColorModeSelect
                                        value={colorMode}
                                        setValue={newColorMode => updateColorMode(newColorMode)}
                                        hoverService={services.hoverService}
                                    />
                                }

                            </VContainer>
                        </HContainer>
                    </>
                }
            </VContainer>
        </div>
    );
}
