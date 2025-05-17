import { nls, URI } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ColorMode } from '../../../../../../core/browser/ves-common-types';
import {
    DEFAULT_COLOR_DISTANCE_CALCULATOR,
    DEFAULT_DITHER_SERPENTINE,
    DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
    DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER
} from '../../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../../ves-editors-types';
import HContainer from '../../../Common/Base/HContainer';
import Input from '../../../Common/Base/Input';
import VContainer from '../../../Common/Base/VContainer';
import { roundToNextMultipleOf8 } from '../../../Common/Utils';
import Images from '../../../ImageEditor/Images';
import Alphabet from '../../Alphabet/Alphabet';
import { CHAR_PIXEL_SIZE, INPUT_BLOCKING_COMMANDS, MAX_CHAR_COUNT, MAX_CHAR_SIZE, MAX_OFFSET, MIN_CHAR_SIZE, MIN_OFFSET } from '../../FontEditorTypes';
import { ParsedImageData } from './ImportExportTools';

interface ImportSettingsProps {
    open: boolean
    importedCharacters: number[][][]
    setImportedCharacters: React.Dispatch<React.SetStateAction<number[][][]>>
    importedCharHeight: number
    setImportedCharHeight: React.Dispatch<React.SetStateAction<number>>
    importedCharWidth: number
    setImportedCharWidth: React.Dispatch<React.SetStateAction<number>>
    importOffset: number
    setImportOffset: React.Dispatch<React.SetStateAction<number>>
    setImportCharacterCount: React.Dispatch<React.SetStateAction<number>>
}

const ReconvertButton = styled.button`
    background-color: transparent;
    height: 100%;
`;

export default function ImportSettings(props: ImportSettingsProps): React.JSX.Element {
    const {
        open,
        importedCharacters,
        setImportedCharacters,
        importedCharHeight,
        setImportedCharHeight,
        importedCharWidth,
        setImportedCharWidth,
        importOffset,
        setImportOffset,
        setImportCharacterCount,
    } = props;
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;
    const [sourceImagePath, setSourceImagePath] = useState<string>();
    const [sourceImageHeight, setSourceImageHeight] = useState<number>(0);
    const [sourceImageWidth, setSourceImageWidth] = useState<number>(0);
    const [invert, setInvert] = useState<boolean>(false);

    const charPixelHeight = importedCharHeight;
    const charPixelWidth = importedCharWidth;

    const parseIndexedPng = async (fileContent: Uint8Array): Promise<ParsedImageData | false> => {
        const PNG = require('@camoto/pngjs/browser').PNG;
        let imageData: ParsedImageData | false = false;

        await new Promise<void>((resolve, reject) => {
            new PNG({
                keepIndexed: true,
            }).parse(fileContent, (error: unknown, data: unknown): void => {
                if (error) {
                    console.error('Error while parsing PNG', error, data);
                    resolve();
                }
            }).on('parsed', function (): void {
                // @ts-ignore: suppress implicit any errors
                const png = this;

                const height = png.height;
                const width = png.width;
                const colorType = png._parser._parser._colorType;

                const pixelData: number[][] = [];
                [...Array(height)].map((h, y) => {
                    const line: number[] = [];
                    [...Array(width)].map((w, x) => {
                        line.push(png.data[y * width + x]);
                    });
                    pixelData.push(line);
                });

                imageData = { height, width, colorType, pixelData };

                resolve();
            });
        });

        return imageData;
    };

    const imageDataToCharacters = (imageData: ParsedImageData): number[][][] => {
        const charactersPerLine = imageData.width / (charPixelWidth);

        const chars: number[][][] = [];
        [...Array(MAX_CHAR_COUNT)].map((i, c) => {
            /*
            if (c < offset || c >= offset + characterCount) {
                // @ts-ignore
                // eslint-disable-next-line no-null/no-null
                chars[c] = null;
            } else {
            */
            chars[c] = [];
            [...Array(charPixelHeight)].map((j, y) => {
                chars[c][y] = [];
                [...Array(charPixelWidth)].map((k, x) => {
                    const offsetCurrentCharacter = c - importOffset;
                    const currentYIndex = (Math.floor(offsetCurrentCharacter / charactersPerLine) * (charPixelHeight)) + y;
                    const currentXIndex = (offsetCurrentCharacter % charactersPerLine) * (charPixelWidth) + x;
                    const paletteIndex = imageData.pixelData[currentYIndex] && imageData.pixelData[currentYIndex][currentXIndex]
                        ? imageData.pixelData[currentYIndex][currentXIndex]
                        : 0;
                    // @ts-ignore
                    // eslint-disable-next-line no-null/no-null
                    chars[c][y][x] = paletteIndex === 0 ? null : paletteIndex;
                });
            });
            // }
        });

        return chars;
    };

    const selectImageFileToImport = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/editors/font/selectImageToImport', 'Select image file to import'),
            canSelectFolders: false,
            canSelectFiles: true,
            filters: { 'PNG': ['png'] }
        };
        const currentPath = await services.fileService.resolve(fileUri);
        const uri = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            setSourceImagePath(uri.path.fsPath());
        }
    };

    const sourceImageToCharacters = async (): Promise<void> => {
        if (!sourceImagePath) {
            setImportedCharacters([]);
            return;
        }

        const quantizedImage = await services.vesImagesService.quantizeImage(
            new URI(sourceImagePath),
            {
                distanceCalculator: DEFAULT_COLOR_DISTANCE_CALCULATOR,
                imageQuantizationAlgorithm: DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
                minimumColorDistanceToDither: DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
                serpentine: DEFAULT_DITHER_SERPENTINE,
                invert,
            },
            ColorMode.Default,
        );
        const imgData = await parseIndexedPng(quantizedImage);
        if (imgData !== false) {
            setSourceImageHeight(imgData.height);
            setSourceImageWidth(imgData.width);
            setImportCharacterCount(imgData.width / importedCharWidth * imgData.height / importedCharHeight);
            setImportedCharacters(imageDataToCharacters(imgData));
        } else {
            services.messageService.error(
                nls.localize('vuengine/editors/font/errorImporting', 'There was an error importing the PNG file.')
            );
        }
    };

    useEffect(() => {
        if (open) {
            selectImageFileToImport();
        }
    }, [
        open
    ]);

    useEffect(() => {
        sourceImageToCharacters();
    }, [
        importedCharHeight,
        importedCharWidth,
        importOffset,
        sourceImagePath,
        invert,
    ]);

    return (
        <VContainer gap={10} grow={1} overflow='hidden' style={{ padding: '1px' }}>
            <VContainer grow={1} overflow='hidden'>
                <HContainer grow={1} overflow='hidden'>
                    <VContainer style={{ width: '50%' }} overflow='hidden'>
                        <HContainer justifyContent='space-between'>
                            <label>
                                {nls.localize('vuengine/editors/general/source', 'Source')}
                            </label>
                            <VContainer style={{ opacity: .6 }}>
                                {sourceImageHeight
                                    ? <>{sourceImageWidth} × {sourceImageHeight} px</>
                                    : <>&nbsp;</>
                                }
                            </VContainer>
                        </HContainer>
                        <Images
                            data={sourceImagePath ? [sourceImagePath] : []}
                            updateData={(imagePaths: string[]) => setSourceImagePath(imagePaths[0])}
                            allInFolderAsFallback={false}
                            canSelectMany={false}
                            stack={true}
                            showMetaData={false}
                            absolutePaths={true}
                            containerHeight={'100%'}
                            containerWidth={'100%'}
                        />
                    </VContainer>
                    <VContainer justifyContent="center">
                        <label style={{ width: 34 }}>&nbsp;</label>
                        <ReconvertButton
                            className="theia-button"
                            title={nls.localize('vuengine/editors/general/reconvertImage', 'Reconvert Image')}
                            onClick={sourceImageToCharacters}
                        >
                            <i className="codicon codicon-arrow-right"></i>
                        </ReconvertButton>
                    </VContainer>
                    <VContainer style={{ width: '50%' }} overflow='hidden'>
                        <label>
                            {nls.localize('vuengine/editors/general/result', 'Result')}
                        </label>
                        <VContainer
                            alignItems='center'
                            className="filePreview"
                            grow={1}
                            justifyContent='center'
                            overflow='hidden'
                            style={{
                                // @ts-ignore
                                '--ves-file-height': '100%',
                                '--ves-file-width': '100%',
                            }}
                        >
                            <Alphabet
                                charsData={importedCharacters}
                                offset={0}
                                charCount={256}
                                charHeight={importedCharHeight}
                                charWidth={importedCharWidth}
                                currentCharacterIndex={-1}
                                setCurrentCharacterIndex={() => { }}
                                setCurrentCharacterHoverIndex={() => { }}
                                variableSize={{
                                    enabled: false,
                                    x: [],
                                    y: 0,
                                }}
                            />
                        </VContainer>
                    </VContainer>
                </HContainer>
            </VContainer>
            <HContainer gap={20}>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/font/characterSize', 'Character Size')}
                    </label>
                    <HContainer alignItems='center'>
                        <Input
                            type="number"
                            value={importedCharWidth}
                            setValue={v => setImportedCharWidth(roundToNextMultipleOf8(v as number))}
                            step={CHAR_PIXEL_SIZE}
                            min={MIN_CHAR_SIZE * CHAR_PIXEL_SIZE}
                            max={MAX_CHAR_SIZE * CHAR_PIXEL_SIZE}
                            commands={INPUT_BLOCKING_COMMANDS}
                            width={48}
                        />
                        <div style={{ paddingBottom: 3 }}>×</div>
                        <Input
                            type="number"
                            value={importedCharHeight}
                            setValue={v => setImportedCharHeight(roundToNextMultipleOf8(v as number))}
                            step={CHAR_PIXEL_SIZE}
                            min={MIN_CHAR_SIZE * CHAR_PIXEL_SIZE}
                            max={MAX_CHAR_SIZE * CHAR_PIXEL_SIZE}
                            commands={INPUT_BLOCKING_COMMANDS}
                            width={48}
                        />
                    </HContainer>
                </VContainer>
                <Input
                    label={nls.localize('vuengine/editors/font/offset', 'Offset')}
                    type="number"
                    value={importOffset}
                    setValue={v => setImportOffset(v as number)}
                    min={MIN_OFFSET}
                    max={MAX_OFFSET}
                    commands={INPUT_BLOCKING_COMMANDS}
                    width={48}
                />
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/font/invertColors', 'Invert Colors')}
                    </label>
                    <input
                        type="checkbox"
                        checked={invert}
                        onChange={() => setInvert(!invert)}
                    />
                </VContainer>
            </HContainer>
        </VContainer>
    );
}
