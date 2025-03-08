import { FileArrowDown, FileArrowUp } from '@phosphor-icons/react';
import { environment, nls, URI } from '@theia/core';
import { CommonCommands, ConfirmDialog } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { SaveFileDialogProps } from '@theia/filesystem/lib/browser';
import React, { useContext, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../../ves-editors-types';
import HContainer from '../../../Common/Base/HContainer';
import PopUpDialog from '../../../Common/Base/PopUpDialog';
import { PixelEditorTool } from '../../../PixelEditor/Sidebar/PixelEditorTool';
import { CHAR_PIXEL_SIZE, FontData } from '../../FontEditorTypes';
import ExportSettings from './ExportSettings';
import ImportSettings from './ImportSettings';

export interface ParsedImageData {
    height: number
    width: number
    colorType: number
    pixelData: number[][]
};

interface ImportExportToolsProps {
    characters: number[][][]
    charPixelHeight: number,
    charPixelWidth: number,
    offset: number
    characterCount: number
    updateFontData: (partialFontData: Partial<FontData>) => void
}

export default function ImportExportTools(props: ImportExportToolsProps): React.JSX.Element {
    const { charPixelHeight, charPixelWidth, offset, characterCount, characters, updateFontData } = props;
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;
    const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
    const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
    const [exportFileName, setExportFileName] = useState<string>(fileUri.path.name);
    const [exportPngData, setExportPngData] = useState<Buffer>();
    const [importedCharHeight, setImportedCharHeight] = useState<number>(CHAR_PIXEL_SIZE);
    const [importedCharWidth, setImportedCharWidth] = useState<number>(CHAR_PIXEL_SIZE);
    const [importedCharacters, setImportedCharacters] = useState<number[][][]>([]);
    const [importOffset, setImportOffset] = useState<number>(32);
    const [importCharacterCount, setImportCharacterCount] = useState<number>(224);

    const selectImageFileToExport = async (): Promise<void> => {
        let exists: boolean = false;
        let overwrite: boolean = false;
        let selected: URI | undefined;
        const saveFilterDialogProps: SaveFileDialogProps = {
            title: nls.localize('vuengine/editors/font/exportFontPng', 'Export Font PNG'),
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
            title: nls.localize('vuengine/editors/font/overwrite', 'Overwrite'),
            msg: nls.localize('vuengine/editors/font/doYouReallyWantToOverwrite', 'Do you really want to overwrite "{0}"?', uri.path.fsPath()),
        }).open();
        return !!confirmed;
    };

    return <HContainer gap={2} wrap='wrap'>
        <PixelEditorTool
            title={nls.localize('vuengine/editors/font/actions/import', 'Import')}
            onClick={() => setImportDialogOpen(true)}
        >
            <FileArrowUp size={20} />
        </PixelEditorTool>
        <PixelEditorTool
            title={nls.localize('vuengine/editors/font/actions/export', 'Export')}
            onClick={() => setExportDialogOpen(true)}
        >
            <FileArrowDown size={20} />
        </PixelEditorTool>
        <PopUpDialog
            height='100%'
            width='100%'
            open={importDialogOpen}
            onClose={() => setImportDialogOpen(false)}
            onOk={async () => {
                if (importedCharacters) {
                    updateFontData({
                        size: {
                            x: importedCharWidth / CHAR_PIXEL_SIZE,
                            y: importedCharHeight / CHAR_PIXEL_SIZE,
                        },
                        offset: importOffset,
                        characterCount: importCharacterCount,
                        pageSize: importCharacterCount,
                        characters: importedCharacters
                    });
                }
                setImportDialogOpen(false);
            }}
            okLabel={nls.localize('vuengine/editors/font/import', 'Import')}
            title={nls.localize('vuengine/editors/font/importSettings', 'Import Settings')}
        >
            <ImportSettings
                open={importDialogOpen}
                importedCharacters={importedCharacters}
                setImportedCharacters={setImportedCharacters}
                importedCharHeight={importedCharHeight}
                setImportedCharHeight={setImportedCharHeight}
                importedCharWidth={importedCharWidth}
                setImportedCharWidth={setImportedCharWidth}
                importOffset={importOffset}
                setImportOffset={setImportOffset}
                setImportCharacterCount={setImportCharacterCount}
            />
        </PopUpDialog>
        <PopUpDialog
            open={exportDialogOpen}
            onClose={() => setExportDialogOpen(false)}
            onOk={async () => {
                await selectImageFileToExport();
                setExportDialogOpen(false);
            }}
            okLabel={nls.localize('vuengine/editors/font/export', 'Export')}
            title={nls.localize('vuengine/editors/font/exportSettings', 'Export Settings')}
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
    </HContainer>;
}
