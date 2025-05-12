import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

export const StyledSidebar = styled.div`
    background-color: rgba(17, 17, 17, .9);
    border-radius: 2px;
    border: 1px solid var(--theia-activityBar-background);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
    transition: all .1s;
    width: 320px;
    z-index: 100;

    body.light-vuengine & {
        background-color: rgba(236, 236, 236, .9);
    }

     hr {
        background-color: var(--theia-editor-foreground);
        border: none;
        height: 0;
        margin: 0;
        opacity: .1;
        padding-top: 1px;
    }
`;

interface SidebarProps {
    open: boolean,
    side: 'left' | 'right',
    width: number,
    style?: object,
}

export default function Sidebar(props: PropsWithChildren<SidebarProps>): React.JSX.Element {
    const { open, side, width, style, children } = props;

    return (
        <StyledSidebar
            style={{
                ...(style ?? {}),
                marginLeft: open && side === 'left' ? 0 : `calc(-${width}px - 1px - var(--padding))`,
                marginRight: open && side === 'right' ? 0 : `calc(-${width}px - 1px - var(--padding))`,
                width,
            }}
        >
            {children}
        </StyledSidebar>
    );
}
