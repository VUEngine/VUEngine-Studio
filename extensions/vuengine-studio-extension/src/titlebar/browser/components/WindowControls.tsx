import { isOSX } from '@theia/core';
import React from 'react';
import styled from 'styled-components';

const WindowControlButtons = styled.div`
    display: flex;
    flex-direction: row;
    padding-left: ${isOSX ? 5 : 0}px;
`;

export const WindowControlButton = styled.div`
    -webkit-app-region: no-drag;
    display: inline-block;
    fill: var(--theia-titleBar-activeForeground);
    font-size: 18px;
    height: var(--theia-private-menubar-height);
    line-height: var(--theia-private-menubar-height);
    text-align: center;
    width: 40px;

    &:hover,
    &:active {
        background: rgba(255, 255, 255, .3);
    }
`;

interface WindowControlsProps {
    hidden: boolean
    isMaximized: boolean
    minimizeWindow: () => void
    maximizeWindow: () => void
    unmaximizeWindow: () => void
    closeWindow: () => void
}

export default function WindowControls(props: WindowControlsProps): React.JSX.Element {
    const { hidden, isMaximized, minimizeWindow, maximizeWindow, unmaximizeWindow, closeWindow } = props;

    return (
        <WindowControlButtons>
            {!hidden && <>
                <WindowControlButton
                    className='minimize'
                    onClick={minimizeWindow}
                >
                    {/* ‒ */}
                    <svg width='11' height='11' viewBox='0 0 11 1'>
                        <path d='m11 0v1h-11v-1z' strokeWidth='.26208' />
                    </svg>
                </WindowControlButton>
                {!isMaximized && (
                    <WindowControlButton
                        className='maximize'
                        onClick={maximizeWindow}
                    >
                        {/* ◻ */}
                        <svg width='10' height='10' viewBox='0 0 10 10'>
                            <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' strokeWidth='.25' />
                        </svg>
                    </WindowControlButton>
                )}
                {isMaximized && (
                    <WindowControlButton
                        className='restore'
                        onClick={unmaximizeWindow}
                    >
                        {/* ❐ */}
                        <svg width='11' height='11' viewBox='0 0 11 11'>
                            <path
                                d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z'
                                strokeWidth='.275'
                            />
                        </svg>
                    </WindowControlButton>
                )}
                <WindowControlButton
                    className='close'
                    onClick={closeWindow}
                >
                    {/* ⨉ */}
                    <svg width='12' height='12' viewBox='0 0 12 12'>
                        <path
                            /* eslint-disable-next-line */
                            d='m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z'
                            strokeWidth='.3'
                        />
                    </svg>
                </WindowControlButton>
            </>}
        </WindowControlButtons>
    );
}
