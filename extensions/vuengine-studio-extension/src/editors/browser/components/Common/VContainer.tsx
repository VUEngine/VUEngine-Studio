import React, { PropsWithChildren } from 'react';

interface VContainerProps {
    className?: string
    gap?: number
    grow?: number
    justifyContent?: string
    overflow?: string
    style?: object
}

export default function VContainer(props: PropsWithChildren<VContainerProps>): React.JSX.Element {
    const { justifyContent, children, className, gap, grow, overflow, style } = props;

    return <div
        style={{
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

