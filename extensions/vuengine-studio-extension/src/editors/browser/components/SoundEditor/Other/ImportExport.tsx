import { nls, URI } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import * as midiManager from 'midi-file';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { DEFAULT_TRACK_SETTINGS, SoundData, TrackSettings } from '../SoundEditorTypes';
import { convertUgeSong } from './uge/ugeConverter';
import { loadUGESong } from './uge/ugeHelper';
import { convertVbmSong } from './vbm/vbmConverter';
import { parseVbmSong } from './vbm/vbmParser';

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
                    // 'midi', 'mid',
                    // 's3m',
                    'uge',
                    'vbm',
                ],
            }
        };
        const currentPath = await services.fileService.resolve(fileUri.parent);
        const uri: URI | undefined = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            const fileContent = await services.fileService.readFile(uri);
            const fileArrayBuffer = fileContent.value.buffer as unknown as ArrayBuffer;
            let importedSoundData: SoundData | undefined;
            switch (uri.path.ext) {
                case '.mid':
                case '.midi':
                    const parsedMidi = midiManager.parseMidi(fileContent.value.buffer);
                    console.log('parsed', parsedMidi);
                    break;
                case '.s3m':
                    const parsedS3mSong = window.electronVesCore.kaitaiParse(fileArrayBuffer, uri.path.ext);
                    console.log('parsed', parsedS3mSong);
                    break;
                case '.uge':
                    const parsedUgeSong = loadUGESong(fileArrayBuffer);
                    console.log('parsed', parsedUgeSong);
                    if (parsedUgeSong) {
                        importedSoundData = convertUgeSong(parsedUgeSong);
                        console.log('imported', importedSoundData);
                    }
                    break;
                case '.vbm':
                    const parsedVbmSong = parseVbmSong(fileArrayBuffer);
                    console.log('parsed', parsedVbmSong);
                    if (parsedVbmSong) {
                        importedSoundData = convertVbmSong(parsedVbmSong);
                        console.log('imported', importedSoundData);
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
            tooltip={<>
                {nls.localize(
                    'vuengine/editors/sound/supportedImportFormats',
                    'Supported import formats:'
                )}
                <ul>
                    <li>
                        <b>hUGEtracker (.uge)</b>{': '}
                        {nls.localize(
                            'vuengine/editors/sound/ugeDescription',
                            'Game Boy specific sound format supported by e.g. GB Studio.'
                        )}
                    </li>
                    <li>
                        <b>VB Music Tracker (.vbm)</b>{': '}
                        {nls.localize(
                            'vuengine/editors/sound/vbmDescription',
                            "Proprietary sound format used by M.K.'s VB Music Tracker."
                        )}
                    </li>
                </ul>
                {nls.localize(
                    'vuengine/editors/sound/supportedExportFormats',
                    'Supported export formats:'
                )}
                <ul>
                    <li>
                        <b>ROM (.vb)</b>{': '}
                        {nls.localize(
                            'vuengine/editors/sound/vbDescription',
                            'Virtual Boy ROM file that plays your sound on either real hardware or an emulator.'
                        )}
                    </li>
                </ul>
            </>}
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
