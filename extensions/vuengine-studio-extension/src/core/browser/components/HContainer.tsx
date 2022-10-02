import React, { PropsWithChildren } from 'react';

interface VContainerProps {
}

export default function VContainer(props: PropsWithChildren<VContainerProps>): JSX.Element {
    const { children } = props;

    // TODO: move to css class
    return (<div style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        gap: '5px',
    }}>
        {children}
    </div >);
}

