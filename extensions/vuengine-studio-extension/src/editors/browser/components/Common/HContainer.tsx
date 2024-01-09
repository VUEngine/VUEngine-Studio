import React, { PropsWithChildren } from 'react';

interface HContainerProps {
    alignItems?: string
    className?: string
    gap?: number
    grow?: number
    overflow?: string
    style?: object
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
}

export default function HContainer(props: PropsWithChildren<HContainerProps>): React.JSX.Element {
    const { alignItems, children, className, overflow, wrap, gap, grow, style } = props;

    return <div
        style={{
            alignItems,
            display: 'flex',
            flexDirection: 'row',
            flexGrow: grow,
            flexWrap: wrap !== undefined ? wrap : 'nowrap',
            gap: gap !== undefined ? `${gap}px` : '5px',
            overflow,
            ...(style || {}),
        }}
        className={className}
    >
        {children}
    </div>;
}

