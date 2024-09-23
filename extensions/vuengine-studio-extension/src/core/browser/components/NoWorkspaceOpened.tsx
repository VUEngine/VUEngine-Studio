import { CommandService, nls } from '@theia/core';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import React from 'react';

interface NoWorkspaceOpenedProps {
    commandService: CommandService
}

export default function NoWorkspaceOpened(props: NoWorkspaceOpenedProps): React.JSX.Element {
    const { commandService } = props;
    const openWorkspace = () => commandService.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);

    return <div className="theia-TreeContainer lightLabel" style={{ boxSizing: 'border-box' }}>
        <div className="theia-WelcomeView">
            <div>
                <span>
                    {nls.localize('vuengine/general/noWorkspaceOpened', 'You have not yet opened a workspace.')}
                </span>
            </div>
            <div className="theia-WelcomeViewButtonWrapper">
                <button
                    className="theia-button theia-WelcomeViewButton"
                    onClick={openWorkspace}>
                    {nls.localize('vuengine/general/openWorkspace', 'Open Workspace')}
                </button>
            </div>
        </div>
    </div>;
}
