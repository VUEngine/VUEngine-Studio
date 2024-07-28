import * as iq from 'image-q';
import { PNG } from 'pngjs/browser';
import React, { useContext, useEffect, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import {
    colorDistanceFormulaOptions,
    DEFAULT_COLOR_DISTANCE_FORMULA,
    DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
    DEFAULT_PALETTE_QUANTIZATION_ALGORITHM,
    imageQuantizationAlgorithmOptions,
    ImageQuantizationSettingsType,
    paletteQuantizationAlgorithmOptions
} from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import BasicSelect from '../../Common/BasicSelect';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import Images from '../../ImageEditor/Images';
import ColorModeSelect from './ColorModeSelect';

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

    const quantizeImage = async () => {
        setProgress(0);
        setResultImageBase64('');

        if (imageData && targetPalette) {
            let pointContainer = iq.utils.PointContainer.fromUint8Array(imageData.data, imageData.width, imageData.height);

            if (quantizationSettings?.paletteQuantizationAlgorithm !== undefined && quantizationSettings?.paletteQuantizationAlgorithm !== 'none') {
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
        let data;
        if (image) {
            const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
            const resolvedImageUri = workspaceRootUri.resolve(image);
            const imageFileContent = await services.fileService.readFile(resolvedImageUri);
            data = PNG.sync.read(Buffer.from(imageFileContent.value.buffer));
        }
        setImageData(data);
    };

    const buildTargetPalette = async () => {
        const palette = await iq.buildPalette([]);
        const point0 = iq.utils.Point.createByRGBA(0, 0, 0, 255);
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
                            value={quantizationSettings?.imageQuantizationAlgorithm ?? DEFAULT_IMAGE_QUANTIZATION_ALGORITHM}
                            onChange={e => updateQuantizationSettings({
                                imageQuantizationAlgorithm: e.target.value as iq.ImageQuantization,
                            })}
                            disabled={!image}
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
                            disabled={!image}
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
