import { nls } from '@theia/core';
import React, { PropsWithChildren } from 'react';
import HContainer from './HContainer';

interface PopUpDialogProps {
    open: boolean
    onClose: () => void
    onOk: () => void
    okLabel?: string
    title: string
    error?: string
    height?: string
    width?: string
    cancelButton?: boolean
}

export default function PopUpDialog(props: PropsWithChildren<PopUpDialogProps>): React.JSX.Element {
    const { open, onClose, onOk, okLabel, title, error, height, width, cancelButton, children } = props;

    return <div
        className="p-Widget dialogOverlay"
        style={{
            display: open ? 'flex' : 'none',
            height: '100%',
            position: 'absolute',
            width: '100%',
        }}
        onKeyDown={e => {
            if (e.key === 'Escape') {
                onClose();
            };
        }}
    >
        <div className="dialogBlock" style={{
            height,
            maxWidth: '100%',
            minWidth: '100px',
            overflow: 'hidden',
            width,
        }}
        >
            <div className="dialogTitle">
                <div>{title}</div>
                <i
                    className="codicon codicon-close action-label closeButton"
                    onClick={onClose}
                >
                </i>
            </div>
            <div className="dialogContent" style={{ flexGrow: 1, maxHeight: 'unset' }}>
                {children}
            </div>
            <HContainer className="dialogControl">
                <div className="error" style={{ flex: 2 }}>
                    {error}
                </div>
                {cancelButton &&
                    <button
                        className="theia-button secondary"
                        onClick={onClose}
                    >
                        {nls.localizeByDefault('Cancel')}
                    </button>
                }
                <button
                    className="theia-button main"
                    onClick={onOk}
                    style={{
                        minWidth: '65px',
                    }}
                >
                    {okLabel ? okLabel : 'OK'}
                </button>
            </HContainer>
        </div>
    </div>;
}
