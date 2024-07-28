import React, { PropsWithChildren } from 'react';

interface PopUpDialogProps {
    open: boolean;
    setOpen: (setOpen: boolean) => void;
    title: string;
    error?: string;
    height?: string
    width?: string
}

export default function PopUpDialog(props: PropsWithChildren<PopUpDialogProps>): React.JSX.Element {
    const { open, setOpen, title, error, height, width, children } = props;

    const close = () => setOpen(false);

    return <div
        className="p-Widget dialogOverlay"
        style={{
            display: open ? 'flex' : 'none',
            height: '100%',
            width: '100%',
        }}
        onKeyDown={e => {
            if (e.key === 'Escape') {
                close();
            };
        }}
    >
        <div className="dialogBlock" style={{ height, width }}
        >
            <div className="dialogTitle">
                <div>{title}</div>
                <i
                    className="codicon codicon-close action-label closeButton"
                    onClick={close}
                >
                </i>
            </div>
            <div className="dialogContent" style={{ flexGrow: 1 }}>
                {children}
            </div>
            <div className="dialogControl">
                <div className="error" style={{ flex: 2 }}>
                    {error}
                </div>
                <button
                    className="theia-button main"
                    onClick={close}
                    style={{
                        minWidth: '65px',
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    </div>;
}
