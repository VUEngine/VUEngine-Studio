import { nls } from '@theia/core';
import { HoverService, OpenerService } from '@theia/core/lib/browser';
import React from 'react';
import styled from 'styled-components';
import { GameConfigType } from '../../../project/browser/types/GameConfig';
import { TranslationsType } from '../../../project/browser/types/Translations';
import { WorkspaceService } from '@theia/workspace/lib/browser';

const StyledMenuButton = styled.button`
    -webkit-app-region: no-drag;
    align-items: center;
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, .3);
    border-radius: 5px;
    border-radius: 5px;
    box-sizing: border-box;
    color: var(--theia-titleBar-activeForeground);
    cursor: pointer;
    display: flex;
    height: calc(var(--theia-private-menubar-height) - 7px);
    line-height: calc(var(--theia-private-menubar-height) - 7px);
    outline-width: 0 !important;
    width: calc(var(--theia-private-menubar-height) - 7px);

    &:hover,
    &:focus,
    &:active {
        background-color: rgba(255, 255, 255, .3);
    }
`;

const StyledMainMenuButton = styled(StyledMenuButton)`
    border-color: transparent
`;

interface MainMenuProps {
    openMainMenu: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
    hoverService: HoverService
    workspaceService: WorkspaceService
    openerService: OpenerService
}

export default function MainMenu(props: MainMenuProps): React.JSX.Element {
    const { openMainMenu, hoverService, workspaceService, openerService } = props;

    const openConfigFile = async (filename: string): Promise<void> => {
        const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;
        const fileUri = workspaceRootUri.resolve('config').resolve(filename);
        const opener = await openerService.getOpener(fileUri);
        await opener.open(fileUri);
    };

    return (
        <>
            <StyledMenuButton
                onClick={() => openConfigFile('GameConfig')}
                onMouseEnter={event => {
                    hoverService.requestHover({
                        content: GameConfigType.schema.title,
                        target: event.currentTarget,
                        position: 'bottom',
                    });
                }}
                onMouseLeave={hoverService.cancelHover}
            >
                <i className='codicon codicon-settings-gear' />
            </StyledMenuButton>
            <StyledMenuButton
                onClick={() => openConfigFile('Translations')}
                onMouseEnter={event => {
                    hoverService.requestHover({
                        content: TranslationsType.schema.title,
                        target: event.currentTarget,
                        position: 'bottom',
                    });
                }}
                onMouseLeave={hoverService.cancelHover}
            >
                <i className='ph ph-translate' />
            </StyledMenuButton>
            <StyledMainMenuButton
                onClick={openMainMenu}
                onMouseEnter={event => {
                    hoverService.requestHover({
                        content: nls.localizeByDefault('Application Menu'),
                        target: event.currentTarget,
                        position: 'bottom',
                    });
                }}
                onMouseLeave={hoverService.cancelHover}
            >
                <i className='codicon codicon-menu' />
            </StyledMainMenuButton>
        </>
    );
}
