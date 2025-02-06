import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../../ves-editors-types';
import HContainer from '../../../Common/Base/HContainer';
import { MAX_CHAR_COUNT } from '../../FontEditorTypes';
import VContainer from '../../../Common/Base/VContainer';
import { nls } from '@theia/core';
import { clamp } from '../../../Common/Utils';

interface ExportSettingsProps {
    characters: number[][][]
    charPixelHeight: number,
    charPixelWidth: number,
    offset: number
    characterCount: number
    exportPngData?: Buffer
    setExportPngData: (exportPngData: Buffer) => void
    exportFileName: string
    setExportFileName: (exportFileName: string) => void
}

const MIN_CHARS_PER_LINE = 1;
const MAX_CHARS_PER_LINE = 256;

export default function ExportSettings(props: ExportSettingsProps): React.JSX.Element {
    const {
        charPixelHeight,
        charPixelWidth,
        offset,
        characterCount,
        characters,
        exportPngData,
        setExportPngData,
        exportFileName,
        setExportFileName,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [charactersPerLine, setCharactersPerLine] = useState<number>(16);
    const [imageHeight, setImageHeight] = useState<number>(0);
    const [imageWidth, setImageWidth] = useState<number>(0);

    const setPngData = (): void => {
        const startLine = Math.floor(offset / charactersPerLine);
        const startCharacter = startLine * charactersPerLine;
        const endLine = Math.floor((offset + characterCount - 1 + charactersPerLine) / charactersPerLine);
        const endCharacter = endLine * charactersPerLine;
        const pixelsPerCharacterLine = charactersPerLine * charPixelWidth;
        const pixelsPerAlphabetLine = pixelsPerCharacterLine * charPixelHeight;
        const alphabetPixels: number[] = [];
        [...Array(MAX_CHAR_COUNT)].forEach((x, characterIndex) => {
            if (characterIndex < startCharacter || characterIndex > endCharacter) {
                return;
            }
            const offsetCharacterIndex = characterIndex - startCharacter;
            const alphabetLineOffset = Math.floor(offsetCharacterIndex / charactersPerLine) * pixelsPerAlphabetLine;
            const characterOffset = offsetCharacterIndex % charactersPerLine * charPixelWidth;
            [...Array(charPixelHeight)].forEach((y, characterLineIndex) => {
                const characterLineOffset = characterLineIndex * pixelsPerCharacterLine;
                [...Array(charPixelWidth)].forEach((z, characterPixelIndex) => {
                    const pixelOffset = alphabetLineOffset + characterOffset + characterLineOffset + characterPixelIndex;
                    const pixelColorIndex = characterIndex >= offset && characterIndex < (offset + characterCount)
                        && characters[characterIndex] && characters[characterIndex][characterLineIndex]
                        && characters[characterIndex][characterLineIndex][characterPixelIndex]
                        ? characters[characterIndex][characterLineIndex][characterPixelIndex]
                        : 0;
                    alphabetPixels[pixelOffset] = pixelColorIndex;
                });
            });
        });

        const totalChars = endCharacter - startCharacter;
        const height = charPixelHeight * totalChars / charactersPerLine;
        const width = charPixelWidth * charactersPerLine;

        setImageHeight(height);
        setImageWidth(width);
        setExportPngData(services.vesImagesService.getIndexedPng(new Uint8Array(alphabetPixels), height, width));
    };

    useEffect(() => {
        setPngData();
    }, [
        charactersPerLine
    ]);

    return <HContainer gap={25} grow={1} overflow='hidden'>
        <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/font/fileName', 'File Name')}
                </label>
                <HContainer alignItems='center'>
                    <input
                        className="theia-input"
                        style={{ width: 160 }}
                        value={exportFileName}
                        onChange={e => setExportFileName(e.target.value)}
                    />
                    .png
                </HContainer>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/font/charactersPerLine', 'Characters Per Line')}
                </label>
                <input
                    type="number"
                    className="theia-input"
                    style={{ width: 48 }}
                    step="1"
                    min={MIN_CHARS_PER_LINE}
                    max={MAX_CHARS_PER_LINE}
                    value={charactersPerLine}
                    onChange={e => setCharactersPerLine(
                        clamp(parseInt(e.target.value), MIN_CHARS_PER_LINE, MAX_CHARS_PER_LINE)
                    )}
                />
            </VContainer>
        </VContainer>
        <VContainer grow={1} overflow='hidden'>
            <label>
                {nls.localize('vuengine/editors/font/result', 'Result')}
            </label>
            {exportPngData &&
                <VContainer
                    overflow='auto'
                    style={{
                        minHeight: 256,
                        minWidth: 256,
                    }}
                >
                    <img
                        height={imageHeight}
                        src={`data:image/png;base64,${Buffer.from(exportPngData).toString('base64')}`}
                        width={imageWidth}
                    />
                </VContainer>
            }
        </VContainer>
    </HContainer >;
}
