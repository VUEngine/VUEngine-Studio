import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { FileArrowDown, FileArrowUp } from '@phosphor-icons/react';

export const SUPPORTED_IMPORT_FORMATS_ELEMENT = <VContainer>
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
</VContainer>;

export const SUPPORTED_EXPORT_FORMATS_ELEMENT = <VContainer>
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
</VContainer>;

interface ImportExportProps {
}

export default function ImportExport(props: ImportExportProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;

    return <VContainer>
        <InfoLabel
            label={nls.localize('vuengine/editors/sound/importExport', 'Import/Export')}
            tooltip={<>
                {SUPPORTED_IMPORT_FORMATS_ELEMENT}
                {SUPPORTED_EXPORT_FORMATS_ELEMENT}
            </>}
        />
        <HContainer>
            <button
                className='theia-button secondary'
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.IMPORT.id)}
                title={SoundEditorCommands.IMPORT.label +
                    services.vesCommonService.getKeybindingLabel(SoundEditorCommands.IMPORT.id, true)}
            >
                <FileArrowDown size={17} /> {nls.localize('vuengine/editors/sound/import', 'Import')}
            </button>
            <button
                className='theia-button secondary'
                onClick={() => services.commandService.executeCommand(SoundEditorCommands.EXPORT.id)}
                title={SoundEditorCommands.EXPORT.label +
                    services.vesCommonService.getKeybindingLabel(SoundEditorCommands.EXPORT.id, true)}
            >
                <FileArrowUp size={17} /> {nls.localize('vuengine/editors/sound/export', 'Export')}
            </button>
        </HContainer>
    </VContainer>;
}
