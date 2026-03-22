import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import React from 'react';
import styled from 'styled-components';
import { VesCommonService } from '../../../core/browser/ves-common-service';

const StyledApplicationTitle = styled.button`
    -webkit-app-region: no-drag;
    align-items: center;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 5px;
    box-sizing: border-box;
    color: var(--theia-titleBar-activeForeground);
    cursor: pointer;
    display: flex;
    gap: 5px;
    height: calc(var(--theia-private-menubar-height) - 7px);
    justify-content: center;
    line-height: calc(var(--theia-private-menubar-height) - 7px);
    max-width: 560px;
    outline-width: 0 !important;
    overflow: hidden;
    padding: 0 10px;
    position: relative;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;

    &:hover,
    &:focus,
    &:active {
        background-color: rgba(255, 255, 255, .3);
        border-color: rgba(255, 255, 255, .3);
    }
`;

const StyledApplicationTitleCloseButton = styled.div`
    align-items: center;
    border-radius: 5px;
    display: none;
    height: 20px;
    justify-content: center;
    opacity: .5;
    position: absolute;
    right: 6px;
    width: 20px;

    &:hover {
        background: var(--theia-titleBar-activeForeground);
        color: var(--theia-focusBorder);
        opacity: 1;
    }

    ${StyledApplicationTitle}:hover & {
        display: flex;
    }
`;

interface ApplicationTitleProps {
    applicationTitle: string
    isWorkspaceOpened: boolean
    isCollaboration: boolean
    openRecentWorkspace: () => void
    closeWorkspace: () => void
    vesCommonService: VesCommonService
}

export default function ApplicationTitle(props: ApplicationTitleProps): React.JSX.Element {
    const { applicationTitle, isWorkspaceOpened, isCollaboration, openRecentWorkspace, closeWorkspace, vesCommonService } = props;

    return (
        <StyledApplicationTitle
            onClick={openRecentWorkspace}
            title={WorkspaceCommands.OPEN_RECENT_WORKSPACE.label +
                vesCommonService.getKeybindingLabel(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id, true)
            }
        >
            {isCollaboration && <>
                <i className="codicon codicon-broadcast"></i>
            </>}
            {applicationTitle !== '' ? applicationTitle : 'VUEngine Studio'}
            {isWorkspaceOpened &&
                <StyledApplicationTitleCloseButton
                    onClick={closeWorkspace}
                    title={WorkspaceCommands.CLOSE.label +
                        vesCommonService.getKeybindingLabel(WorkspaceCommands.CLOSE.id, true)
                    }
                >
                    <i className="codicon codicon-close" />
                </StyledApplicationTitleCloseButton>
            }
        </StyledApplicationTitle>
    );
}
