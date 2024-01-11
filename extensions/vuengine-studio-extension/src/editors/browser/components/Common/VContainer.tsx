import React, { PropsWithChildren } from 'react';

interface VContainerProps {
    alignItems?: string
    className?: string
    gap?: number
    grow?: number
    justifyContent?: string
    overflow?: string
    style?: object
}

export default function VContainer(props: PropsWithChildren<VContainerProps>): React.JSX.Element {
    const { alignItems, justifyContent, children, className, gap, grow, overflow, style } = props;

    return <div
        style={{
            alignItems,
            display: 'flex',
            flexDirection: 'column',
            gap: gap !== undefined ? `${gap}px` : '5px',
            flexGrow: grow,
            justifyContent,
            overflow,
            ...(style || {}),
        }}
        className={className}
    >
        {children}
    </div>;
}

