import React, { PropsWithChildren } from 'react';

interface HContainerProps {
    className?: string
    gap?: number
}

export default function HContainer(props: PropsWithChildren<HContainerProps>): JSX.Element {
    const { children, className, gap } = props;

    // TODO: move to css class
    return <div
        style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row',
            gap: gap !== undefined ? `${gap}px` : '5px',
        }}
        className={className}
    >
        {children}
    </div>;
}

