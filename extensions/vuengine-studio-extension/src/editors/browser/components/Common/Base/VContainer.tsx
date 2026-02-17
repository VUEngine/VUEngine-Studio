import React, { MouseEventHandler, PropsWithChildren } from 'react';

interface VContainerProps {
    alignItems?: string
    className?: string
    gap?: number | string
    grow?: number
    justifyContent?: string
    onClick?: MouseEventHandler;
    overflow?: string
    style?: object
}

export default function VContainer(props: PropsWithChildren<VContainerProps>): React.JSX.Element {
    const { alignItems, justifyContent, children, className, gap, grow, onClick, overflow, style } = props;

    return <div
        style={{
            alignItems,
            display: 'flex',
            flexDirection: 'column',
            gap: gap !== undefined ? gap : 5,
            flexGrow: grow,
            justifyContent,
            overflow,
            ...(style || {}),
        }}
        className={className}
        onClick={e => { if (onClick) { onClick(e); } }}
    >
        {children}
    </div>;
}

