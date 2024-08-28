import { nls } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileContent } from '@theia/filesystem/lib/common/files';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SpriteEditorTool } from '../../SpriteEditor/SpriteEditorTool';
import { FileArrowDown } from '@phosphor-icons/react';

export interface ParsedImageData {
    height: number
    width: number
    colorType: number
    pixelData: number[][]
};

interface ImportExportProps {
    charPixelHeight: number,
    charPixelWidth: number,
    offset: number
    characterCount: number
    setCharacters: (characters: number[][][]) => void
}

export default function ImportExport(props: ImportExportProps): React.JSX.Element {
    const { charPixelHeight, charPixelWidth, offset, characterCount, setCharacters } = props;
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;

    const parseIndexedPng = async (fileContent: FileContent): Promise<ParsedImageData | false> => {
        const PNG = require('@camoto/pngjs/browser').PNG;
        let imageData: ParsedImageData | false = false;

        await new Promise<void>((resolve, reject) => {
            new PNG({
                keepIndexed: true,
            }).parse(fileContent.value.buffer, (error: unknown, data: unknown): void => {
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

        const characters: number[][][] = [];
        [...Array(256)].map((i, c) => {
            if (c < offset || c >= offset + characterCount) {
                // @ts-ignore
                // eslint-disable-next-line no-null/no-null
                characters[c] = null;
            } else {
                characters[c] = [];
                [...Array(charPixelHeight)].map((j, y) => {
                    characters[c][y] = [];
                    [...Array(charPixelWidth)].map((k, x) => {
                        const offsetCurrentCharacter = c - offset;
                        const currentYIndex = (Math.floor(offsetCurrentCharacter / charactersPerLine) * (charPixelHeight)) + y;
                        const currentXIndex = (offsetCurrentCharacter % charactersPerLine) * (charPixelWidth) + x;
                        const paletteIndex = imageData.pixelData[currentYIndex] && imageData.pixelData[currentYIndex][currentXIndex]
                            ? imageData.pixelData[currentYIndex][currentXIndex]
                            : 0;
                        // @ts-ignore
                        // eslint-disable-next-line no-null/no-null
                        characters[c][y][x] = paletteIndex === 0 ? null : paletteIndex;
                    });
                });
            }
        });

        return characters;
    };

    const selectImageFile = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/fontEditor/selectImageToImport', 'Select image file to import'),
            canSelectFolders: false,
            canSelectFiles: true,
            filters: { 'PNG': ['png'] }
        };
        const currentPath = await services.fileService.resolve(fileUri);
        const uri = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            const fileContent = await services.fileService.readFile(uri);
            const imgData = await parseIndexedPng(fileContent);
            if (imgData !== false) {
                setCharacters(imageDataToCharacters(imgData));
            } else {
                services.messageService.error(
                    nls.localize('vuengine/fontEditor/errorImporting', 'There was as error importing the PNG file.')
                );
            }
        }
    };

    return <>
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/import', 'Import')}
            onClick={selectImageFile}
        >
            <FileArrowDown size={20} />
        </SpriteEditorTool>
        { /* }
        <SpriteEditorTool
            style={{ width: 70 }}
            title={nls.localize('vuengine/fontEditor/actions/export', 'Export')}
        >
            <FileArrowUp size={20} />
        </SpriteEditorTool>
        { */ }
    </>;
}
