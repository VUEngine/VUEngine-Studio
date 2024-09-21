import { CommandService, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import { VesEmulatorCommands } from '../ves-emulator-commands';
import EmulatorAutoQueuePreference from './EmulatorAutoQueuePreference';
import EmulatorConfigs from './EmulatorConfigs';

interface EmulatorSidebarProps {
    isQueued: boolean
    commandService: CommandService
    fileDialogService: FileDialogService
    fileService: FileService
    preferenceService: PreferenceService
}

export default function EmulatorSidebar(props: EmulatorSidebarProps): React.JSX.Element {
    const { isQueued, commandService, fileDialogService, fileService, preferenceService } = props;
    const run = () => commandService.executeCommand(VesEmulatorCommands.RUN.id);

    return <>
        <div className='runActions'>
            {isQueued ? (
                <>
                    <div className='queuedInfo'>
                        <i className='fa fa-fw fa-hourglass-half'></i>{' '}
                        <em>
                            {nls.localize('vuengine/emulator/emulationIsQueued', 'Emulation is queued and will start once the build is ready')}
                        </em>
                    </div>
                    <button
                        className='theia-button large secondary'
                        onClick={run}
                    >
                        {nls.localize('vuengine/emulator/cancel', 'Cancel')}
                    </button>
                </>
            ) : (
                <button
                    className='theia-button large full-width'
                    onClick={run}
                >
                    {nls.localize('vuengine/emulator/run', 'Run')}
                </button>
            )}

            <EmulatorAutoQueuePreference
                preferenceService={preferenceService}
            />
        </div>
        <EmulatorConfigs
            commandService={commandService}
            fileDialogService={fileDialogService}
            fileService={fileService}
            preferenceService={preferenceService}
        />
    </>;
}
