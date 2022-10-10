import React, { PropsWithChildren } from 'react';

interface VContainerProps {
    gap?: number;
}

export default function VContainer(props: PropsWithChildren<VContainerProps>): JSX.Element {
    const { children, gap } = props;

    // TODO: move to css class
    return (<div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gap ? `${gap}px` : '5px',
    }}>
        {children}
    </div >);
}

