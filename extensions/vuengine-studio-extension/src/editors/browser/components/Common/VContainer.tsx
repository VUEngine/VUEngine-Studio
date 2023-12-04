import React, { PropsWithChildren } from 'react';

interface VContainerProps {
    className?: string
    gap?: number
    grow?: number
}

export default function VContainer(props: PropsWithChildren<VContainerProps>): React.JSX.Element {
    const { children, className, gap, grow } = props;

    return <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: gap !== undefined ? `${gap}px` : '5px',
            flexGrow: grow,
        }}
        className={className}
    >
        {children}
    </div>;
}

