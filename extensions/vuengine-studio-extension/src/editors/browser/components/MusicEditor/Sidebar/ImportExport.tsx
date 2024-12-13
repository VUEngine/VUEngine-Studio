import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';

export default function ImportExport(): React.JSX.Element {
    /*
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;

    const selectFiles = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/musicEditor/selectFiles', 'Select file to import'),
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany: false,
            filters: { 'MIDI': ['midi', 'mid'] }
        };
        const currentPath = await services.fileService.resolve(fileUri.parent);
        const uri: URI | undefined = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            const fileContent = await services.fileService.readFile(uri);
            const parsedFile = midiManager.parseMidi(fileContent.value.buffer);
            console.log('parsedFile', parsedFile);
        }
    };
    */

    return <VContainer gap={15}>
        <label>
            {nls.localize('vuengine/musicEditor/ImportExport', 'Import/Export')}
        </label>
        <i>Not yet implemented</i>
        { /* }
        <button
            className='theia-button secondary'
            title={nls.localize('vuengine/musicEditor/importMidi', 'Import MIDI')}
            onClick={selectFiles}
        >
            Import MIDI
        </button>
        { */ }
    </VContainer>;
}
