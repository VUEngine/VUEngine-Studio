import { nls } from '@theia/core';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';

interface ImportExportProps {
    fileDialogService: FileDialogService
    fileService: FileService
}

export default function ImportExport(props: ImportExportProps): JSX.Element {
    const selectDirectory = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/general/selectDirectory', 'Select directory'),
            canSelectFolders: false,
            canSelectFiles: true,
            filters: { 'png': ['.png'] }
        };
        const uri = await props.fileDialogService.showOpenDialog(openFileDialogProps);
        if (uri) {
            const fileContent = await props.fileService.readFile(uri);
            const PNG = require('@camoto/pngjs').PNG;
            new PNG({ filterType: 4 }).parse(fileContent.value.toString(), function (error: unknown, data: unknown): void {
                console.log(error, data);
            });
        }
    };

    return <div className='tools'>
        <button
            className='theia-button secondary full-width'
            title={nls.localize('vuengine/fontEditor/actions/import', 'Import')}
            onClick={selectDirectory}
        >
            {nls.localize('vuengine/fontEditor/actions/import', 'Import')}
        </button>
        <button
            className='theia-button secondary full-width'
            title={nls.localize('vuengine/fontEditor/actions/export', 'Export')}
        >
            {nls.localize('vuengine/fontEditor/actions/export', 'Export')}
        </button>
    </div>;
}
