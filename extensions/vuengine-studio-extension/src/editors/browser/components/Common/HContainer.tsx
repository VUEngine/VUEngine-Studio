import React, { KeyboardEventHandler, MouseEventHandler, PropsWithChildren } from 'react';

interface HContainerProps {
    alignItems?: string
    className?: string
    gap?: number
    grow?: number
    onClick?: MouseEventHandler | undefined;
    onKeyDown?: KeyboardEventHandler | undefined;
    overflow?: string
    style?: object
    tabIndex?: number
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
}

export default function HContainer(props: PropsWithChildren<HContainerProps>): React.JSX.Element {
    const { alignItems, children, className, onClick, onKeyDown, overflow, tabIndex, wrap, gap, grow, style } = props;

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
        tabIndex={tabIndex}
        onClick={e => { if (onClick) { onClick(e); } }}
        onKeyDown={e => { if (onKeyDown) { onKeyDown(e); } }}
    >
        {children}
    </div>;
}

