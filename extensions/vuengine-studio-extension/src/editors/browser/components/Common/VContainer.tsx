import React, { PropsWithChildren } from 'react';

interface VContainerProps {
    className?: string
    gap?: number
}

export default function VContainer(props: PropsWithChildren<VContainerProps>): React.JSX.Element {
    const { children, className, gap } = props;

    // TODO: move to css class
    return <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: gap !== undefined ? `${gap}px` : '5px',
        }}
        className={className}
    >
        {children}
    </div>;
}

