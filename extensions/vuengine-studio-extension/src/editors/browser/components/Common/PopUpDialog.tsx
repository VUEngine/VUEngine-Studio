import React, { PropsWithChildren } from 'react';

interface PopUpDialogProps {
    open: boolean
    onClose: () => void
    onOk: () => void
    okLabel?: string
    title: string
    error?: string
    height?: string
    width?: string
}

export default function PopUpDialog(props: PropsWithChildren<PopUpDialogProps>): React.JSX.Element {
    const { open, onClose, onOk, okLabel, title, error, height, width, children } = props;

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
            <div className="dialogControl">
                <div className="error" style={{ flex: 2 }}>
                    {error}
                </div>
                <button
                    className="theia-button main"
                    onClick={onOk}
                    style={{
                        minWidth: '65px',
                    }}
                >
                    {okLabel ? okLabel : 'OK'}
                </button>
            </div>
        </div>
    </div>;
}
