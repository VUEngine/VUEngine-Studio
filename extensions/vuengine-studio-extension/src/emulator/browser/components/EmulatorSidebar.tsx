import { CommandService, nls, PreferenceService } from '@theia/core';
import React from 'react';
import { EmulatorCommands } from '../ves-emulator-commands';
import EmulatorAutoQueuePreference from './EmulatorAutoQueuePreference';

interface EmulatorSidebarProps {
    isQueued: boolean
    commandService: CommandService
    preferenceService: PreferenceService
}

export default function EmulatorSidebar(props: EmulatorSidebarProps): React.JSX.Element {
    const { isQueued, commandService, preferenceService } = props;
    const run = () => commandService.executeCommand(EmulatorCommands.RUN.id);

    return <div className='emulatorSidebarWidget'>
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
    </div>;
}