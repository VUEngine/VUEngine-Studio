import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { SoundData, TrackSettings } from '../SoundEditorTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';

interface ImportExportProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    setToolsDialogOpen: Dispatch<SetStateAction<boolean>>
    setTrackSettings: Dispatch<SetStateAction<TrackSettings[]>>
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
}

export default function ImportExport(props: ImportExportProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;

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
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.IMPORT.id)}
            >
                {nls.localize('vuengine/editors/sound/import', 'Import')}
            </button>
            <button
                className='theia-button secondary'
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.EXPORT.id)}
            >
                {nls.localize('vuengine/editors/sound/export', 'Export')}
            </button>
        </HContainer>
    </VContainer>;
}
