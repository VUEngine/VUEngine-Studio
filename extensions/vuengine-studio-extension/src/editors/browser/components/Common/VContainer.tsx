import React, { PropsWithChildren } from 'react';

interface VContainerProps {
    className?: string
    gap?: number
    grow?: number
    overflow?: string
}

export default function VContainer(props: PropsWithChildren<VContainerProps>): React.JSX.Element {
    const { children, className, gap, grow, overflow } = props;

    return <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: gap !== undefined ? `${gap}px` : '5px',
            flexGrow: grow,
            overflow,
        }}
        className={className}
    >
        {children}
    </div>;
}

