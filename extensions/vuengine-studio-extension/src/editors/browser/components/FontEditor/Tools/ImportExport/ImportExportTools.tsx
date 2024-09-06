import { FileArrowDown, FileArrowUp } from '@phosphor-icons/react';
import { environment, nls, URI } from '@theia/core';
import { CommonCommands, ConfirmDialog } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { OpenFileDialogProps, SaveFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileContent } from '@theia/filesystem/lib/common/files';
import React, { useContext, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../../ves-editors-types';
import HContainer from '../../../Common/HContainer';
import PopUpDialog from '../../../Common/PopUpDialog';
import { SpriteEditorTool } from '../../../SpriteEditor/SpriteEditorTool';
import { MAX_CHAR_COUNT } from '../../FontEditorTypes';
import ExportSettings from './ExportSettings';

export interface ParsedImageData {
    height: number
    width: number
    colorType: number
    pixelData: number[][]
};

interface ImportExportToolsProps {
    characters: number[][][]
    setCharacters: (characters: number[][][]) => void
    charPixelHeight: number,
    charPixelWidth: number,
    offset: number
    characterCount: number
}

export default function ImportExportTools(props: ImportExportToolsProps): React.JSX.Element {
    const { charPixelHeight, charPixelWidth, offset, characterCount, characters, setCharacters } = props;
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;
    // const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
    const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
    const [exportFileName, setExportFileName] = useState<string>(fileUri.path.name);
    const [exportPngData, setExportPngData] = useState<Buffer>();

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

        const chars: number[][][] = [];
        [...Array(MAX_CHAR_COUNT)].map((i, c) => {
            if (c < offset || c >= offset + characterCount) {
                // @ts-ignore
                // eslint-disable-next-line no-null/no-null
                chars[c] = null;
            } else {
                chars[c] = [];
                [...Array(charPixelHeight)].map((j, y) => {
                    chars[c][y] = [];
                    [...Array(charPixelWidth)].map((k, x) => {
                        const offsetCurrentCharacter = c - offset;
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
            }
        });

        return chars;
    };

    const selectImageFileToImport = async (): Promise<void> => {
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

    const selectImageFileToExport = async (): Promise<void> => {
        let exists: boolean = false;
        let overwrite: boolean = false;
        let selected: URI | undefined;
        const saveFilterDialogProps: SaveFileDialogProps = {
            title: nls.localize('vuengine/fontEditor/exportFontPng', 'Export Font PNG'),
            inputValue: `${exportFileName}.png`,
        };
        const exportDir = await services.fileService.resolve(fileUri.parent);
        do {
            selected = await services.fileDialogService.showSaveDialog(
                saveFilterDialogProps,
                exportDir
            );
            if (selected) {
                exists = await services.fileService.exists(selected);
                if (exists) {
                    overwrite = await confirmOverwrite(selected);
                }
            }
        } while (selected && exists && !overwrite);
        if (selected) {
            try {
                await services.commandService.executeCommand(CommonCommands.SAVE.id);
                // @ts-ignore
                const fileStat = await services.fileService.writeFile(selected, BinaryBuffer.fromString(exportPngData));
            } catch (e) {
                console.warn(e);
            }
        }
    };

    const confirmOverwrite = async (uri: URI): Promise<boolean> => {
        // We only need this in browsers. Electron brings up the OS-level confirmation dialog instead.
        if (environment.electron.is()) {
            return true;
        }
        const confirmed = await new ConfirmDialog({
            title: nls.localize('vuengine/fontEditor/overwrite', 'Overwrite'),
            msg: nls.localize('vuengine/fontEditor/doYouReallyWantToOverwrite', 'Do you really want to overwrite "{0}"?', uri.path.fsPath()),
        }).open();
        return !!confirmed;
    };

    return <HContainer gap={2} wrap='wrap'>
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/import', 'Import')}
            onClick={selectImageFileToImport}
        >
            <FileArrowUp size={20} />
        </SpriteEditorTool>
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/export', 'Export')}
            onClick={() => setExportDialogOpen(true)}
        >
            <FileArrowDown size={20} />
        </SpriteEditorTool>
        <PopUpDialog
            open={exportDialogOpen}
            onClose={() => setExportDialogOpen(false)}
            onOk={async () => {
                await selectImageFileToExport();
                setExportDialogOpen(false);
            }}
            okLabel={nls.localize('vuengine/fontEditor/export', 'Export')}
            title={nls.localize('vuengine/fontEditor/exportSettings', 'Export Settings')}
        >
            <ExportSettings
                characters={characters}
                charPixelHeight={charPixelHeight}
                charPixelWidth={charPixelWidth}
                offset={offset}
                characterCount={characterCount}
                exportPngData={exportPngData}
                setExportPngData={setExportPngData}
                exportFileName={exportFileName}
                setExportFileName={setExportFileName}
            />
        </PopUpDialog>
    </HContainer >;
}
