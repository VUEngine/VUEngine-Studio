import React, { PropsWithChildren } from 'react';

interface HContainerProps {
    gap?: number;
}

export default function HContainer(props: PropsWithChildren<HContainerProps>): JSX.Element {
    const { children, gap } = props;

    // TODO: move to css class
    return (<div style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        gap: gap ? `${gap}px` : '5px',
    }}>
        {children}
    </div>);
}

