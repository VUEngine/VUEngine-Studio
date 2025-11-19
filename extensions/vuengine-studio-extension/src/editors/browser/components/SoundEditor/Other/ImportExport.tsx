import { nls, URI } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import * as midiManager from 'midi-file';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { DEFAULT_TRACK_SETTINGS, SoundData, TrackSettings } from '../SoundEditorTypes';
import { convertUgeSong } from './uge/ugeConverter';
import { loadUGESong } from './uge/ugeHelper';
import InfoLabel from '../../Common/InfoLabel';

interface ImportExportProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    setToolsDialogOpen: Dispatch<SetStateAction<boolean>>
    setTrackSettings: Dispatch<SetStateAction<TrackSettings[]>>
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
}

export default function ImportExport(props: ImportExportProps): React.JSX.Element {
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;
    const { soundData, updateSoundData, setToolsDialogOpen, setTrackSettings, setCurrentSequenceIndex } = props;

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
                [nls.localize('vuengine/editors/sound/supportedFiles', 'Supported Files')]: [
                    // 'midi',
                    // 'mid',
                    'uge'
                ],
            }
        };
        const currentPath = await services.fileService.resolve(fileUri.parent);
        const uri: URI | undefined = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            const fileContent = await services.fileService.readFile(uri);
            let importedSoundData: SoundData | undefined;
            switch (uri.path.ext) {
                case '.mid':
                case '.midi':
                    const parsedMidi = midiManager.parseMidi(fileContent.value.buffer);
                    console.log('parsed', parsedMidi);
                    break;
                /*
                case '.s3m':
                    parsed = window.electronVesCore.kaitaiParse(fileContent.value.buffer, uri.path.ext);
                    break;
                */
                case '.uge':
                    const parsedUgeSong = loadUGESong(fileContent.value.buffer as unknown as ArrayBuffer);
                    console.log('original', parsedUgeSong);
                    if (parsedUgeSong) {
                        importedSoundData = convertUgeSong(parsedUgeSong);
                        console.log('parsed', importedSoundData);
                    }
                    break;
            }

            if (!importedSoundData) {
                services.messageService.error(
                    nls.localize(
                        'vuengine/editors/sound/importError',
                        'The was an error importing the file {0}.',
                        uri.path.base,
                    ));
                return;
            }

            setTrackSettings([...importedSoundData.tracks.map(t => (DEFAULT_TRACK_SETTINGS))]);
            updateSoundData({ ...soundData, ...importedSoundData });
            setToolsDialogOpen(false);
            setCurrentSequenceIndex(0, 0);
        }
    };

    return <VContainer>
        <InfoLabel
            label={nls.localize('vuengine/editors/sound/importExport', 'Import/Export')}
            tooltip={nls.localize(
                'vuengine/editors/sound/importExportDescription',
                'Supported import files: uge. \
                Supported export files: vb.'
            )}
        />
        <HContainer>
            <button
                className='theia-button secondary'
                onClick={selectFileForImport}
            >
                {nls.localize('vuengine/editors/sound/import', 'Import')}
            </button>
            <button
                className='theia-button secondary'
                onClick={exportRom}
            >
                {nls.localize('vuengine/editors/sound/export', 'Export')}
            </button>
        </HContainer>
    </VContainer>;
}
