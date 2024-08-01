import { nls } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileContent } from '@theia/filesystem/lib/common/files';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { Size } from '../FontEditorTypes';

export interface ParsedImageData {
    height: number
    width: number
    colorType: number
    pixelData: number[][]
};

interface ImportExportProps {
    setCharacters: (characters: number[][][]) => void
    size: Size
    offset: number
    characterCount: number
}

export default function ImportExport(props: ImportExportProps): React.JSX.Element {
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;

    const parseIndexedPng = async (fileContent: FileContent): Promise<ParsedImageData | false> => {
        console.log('parseIndexedPng');
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
                console.log('png', png);

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

        console.log('imageData', imageData);
        return imageData;
    };

    const imageDataToCharacters = (imageData: ParsedImageData): number[][][] => {
        const charactersPerLine = imageData.width / (props.size.x * 8);

        const characters: number[][][] = [];
        [...Array(256)].map((i, c) => {
            if (c < props.offset || c >= props.offset + props.characterCount) {
                // @ts-ignore
                // eslint-disable-next-line no-null/no-null
                characters[c] = null;
            } else {
                characters[c] = [];
                [...Array(props.size.y * 8)].map((j, y) => {
                    characters[c][y] = [];
                    [...Array(props.size.x * 8)].map((k, x) => {
                        const offsetCurrentCharacter = c - props.offset;
                        const currentYIndex = (Math.floor(offsetCurrentCharacter / charactersPerLine) * (props.size.y * 8)) + y;
                        const currentXIndex = (offsetCurrentCharacter % charactersPerLine) * (props.size.x * 8) + x;
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
            console.log('uri', uri);
            const fileContent = await services.fileService.readFile(uri);
            console.log('fileContent', fileContent);
            const imgData = await parseIndexedPng(fileContent);
            if (imgData !== false) {
                props.setCharacters(imageDataToCharacters(imgData));
            } else {
                services.messageService.error(
                    nls.localize('vuengine/fontEditor/errorImporting', 'There was as error importing the PNG file.')
                );
            }
        }
    };

    return <div className='tools'>
        <button
            className='theia-button secondary full-width'
            title={nls.localize('vuengine/fontEditor/actions/import', 'Import')}
            onClick={selectImageFile}
        >
            {nls.localize('vuengine/fontEditor/actions/import', 'Import')}
        </button>
        { /* }
        <button
            className='theia-button secondary full-width'
            title={nls.localize('vuengine/fontEditor/actions/export', 'Export')}
        >
            {nls.localize('vuengine/fontEditor/actions/export', 'Export')}
        </button>
        { */ }
    </div>;
}
