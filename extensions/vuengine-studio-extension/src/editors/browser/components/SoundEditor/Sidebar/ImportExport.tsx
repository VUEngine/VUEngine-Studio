import { nls, URI } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import * as midiManager from 'midi-file';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';

export default function ImportExport(): React.JSX.Element {
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;

    const selectFileForImport = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/editors/sound/selectFiles', 'Select file to import'),
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany: false,
            filters: {
                'MIDI': ['midi', 'mid'],
            }
        };
        const currentPath = await services.fileService.resolve(fileUri.parent);
        const uri: URI | undefined = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            const fileContent = await services.fileService.readFile(uri);
            let parsed;
            switch (uri.path.ext) {
                case '.mid':
                case '.midi':
                    parsed = midiManager.parseMidi(fileContent.value.buffer);
                    break;
                /*
                case '.s3m':
                    parsed = window.electronVesCore.kaitaiParse(fileContent.value.buffer, uri.path.ext);
                    break;
                */
            }

            if (!parsed) {
                services.messageService.error(
                    nls.localize(
                        'vuengine/editors/sound/importError',
                        'The was an error importing the file {0}.',
                        uri.path.base,
                    ));
                return;
            }

            // ...
            console.log('parsed', parsed);
        }
    };

    return <VContainer gap={15}>
        <label>
            {nls.localize('vuengine/editors/sound/importExport', 'Import/Export')}
        </label>
        <button
            className='theia-button secondary'
            onClick={selectFileForImport}
        >
            {nls.localize('vuengine/editors/sound/importMidi', 'Import MIDI')}
        </button>
    </VContainer>;
}
