import { nls, URI } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import * as midiManager from 'midi-file';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';

export default function ImportExport(): React.JSX.Element {
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;

    const exportRom = () => {
        // TODO
        alert('not yet implemented');
    };

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

            // TODO
            console.log('parsed', parsed);
            alert('not yet implemented');
        }
    };

    return <VContainer>
        <label>
            {nls.localize('vuengine/editors/sound/importExport', 'Import/Export')}
        </label>
        <HContainer>
            <button
                className='theia-button secondary'
                onClick={selectFileForImport}
            >
                {nls.localize('vuengine/editors/sound/importMidi', 'Import MIDI')}
            </button>
            <button
                className='theia-button secondary'
                onClick={exportRom}
            >
                {nls.localize('vuengine/editors/sound/exportRom', 'Export ROM')}
            </button>
        </HContainer>
    </VContainer>;
}
