import { nls } from '@theia/core';
import React from 'react';
import styled from 'styled-components';

const StyledMainMenuIcon = styled.button`
    -webkit-app-region: no-drag;
    align-items: center;
    background-color: transparent;
    border: 1px solid transparent;
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
        border-color: rgba(255, 255, 255, .3);
    }
`;

interface MainMenuProps {
    hidden: boolean
    openMainMenu: () => void
}

export default function MainMenu(props: MainMenuProps): React.JSX.Element {
    const { hidden, openMainMenu } = props;

    return hidden ? <></> : (
        <StyledMainMenuIcon
            onClick={openMainMenu}
            title={nls.localizeByDefault('Application Menu')}
        >
            <i className='codicon codicon-menu' />
        </StyledMainMenuIcon>
    );
}
