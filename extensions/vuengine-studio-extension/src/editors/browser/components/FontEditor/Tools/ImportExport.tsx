import { MessageService, URI, nls } from '@theia/core';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import { ImageData } from '../../../../../core/browser/ves-common-types';
import { Size } from '../FontEditorTypes';

interface ImportExportProps {
    fileDialogService: FileDialogService
    fileService: FileService
    messageService: MessageService
    baseUri: URI
    setCharacters: (characters: number[][][]) => void
    size: Size
    offset: number
    characterCount: number
}

export default function ImportExport(props: ImportExportProps): React.JSX.Element {
    const imageDataToCharacters = (imageData: ImageData): number[][][] => {
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
            filters: { 'png': ['.png'] }
        };
        const currentPath = await props.fileService.resolve(props.baseUri);
        const uri = await props.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            const fileContent = await props.fileService.readFile(uri);
            const imgData = await window.electronVesCore.parsePng(fileContent);
            if (imgData !== false) {
                props.setCharacters(imageDataToCharacters(imgData));
            } else {
                props.messageService.error(
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
