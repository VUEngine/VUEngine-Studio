import React, { PropsWithChildren } from 'react';

interface HContainerProps {
    alignItems?: string
    className?: string
    gap?: number
    grow?: number
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
}

export default function HContainer(props: PropsWithChildren<HContainerProps>): React.JSX.Element {
    const { alignItems, children, className, wrap, gap, grow } = props;

    return <div
        style={{
            alignItems: alignItems !== undefined ? alignItems : 'center',
            display: 'flex',
            flexDirection: 'row',
            flexGrow: grow,
            flexWrap: wrap !== undefined ? wrap : 'nowrap',
            gap: gap !== undefined ? `${gap}px` : '5px',
        }}
        className={className}
    >
        {children}
    </div>;
}

