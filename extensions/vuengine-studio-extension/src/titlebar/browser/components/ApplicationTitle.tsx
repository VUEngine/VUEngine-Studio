import { HoverService } from '@theia/core/lib/browser';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import React from 'react';
import styled from 'styled-components';
import { VesKeybindingService } from '../../../core/browser/ves-keybinding-service';

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
    vesKeybindingService: VesKeybindingService
    hoverService: HoverService
}

export default function ApplicationTitle(props: ApplicationTitleProps): React.JSX.Element {
    const { applicationTitle, isWorkspaceOpened, isCollaboration, openRecentWorkspace, closeWorkspace, vesKeybindingService, hoverService } = props;

    return (
        <StyledApplicationTitle
            onClick={openRecentWorkspace}
            onMouseEnter={event => {
                hoverService.requestHover({
                    content: WorkspaceCommands.OPEN_RECENT_WORKSPACE.label +
                        vesKeybindingService.getKeybindingLabel(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id, true),
                    target: event.currentTarget,
                    position: 'bottom',
                });
            }}
            onMouseLeave={() => {
                hoverService.cancelHover();
            }}
        >
            {isCollaboration && <>
                <i className="codicon codicon-broadcast"></i>
            </>}
            {applicationTitle !== '' ? applicationTitle : 'VUEngine Studio'}
            {isWorkspaceOpened &&
                <StyledApplicationTitleCloseButton
                    onClick={closeWorkspace}
                    onMouseEnter={event => {
                        hoverService.requestHover({
                            content: WorkspaceCommands.CLOSE.label +
                                vesKeybindingService.getKeybindingLabel(WorkspaceCommands.CLOSE.id, true),
                            target: event.currentTarget,
                            position: 'bottom',
                        });
                    }}
                    onMouseLeave={() => {
                        hoverService.cancelHover();
                    }}
                >
                    <i className="codicon codicon-close" />
                </StyledApplicationTitleCloseButton>
            }
        </StyledApplicationTitle>
    );
}
