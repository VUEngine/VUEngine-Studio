import { nls } from '@theia/core';
import React, { CSSProperties, MouseEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { clamp } from '../../Common/Utils';

// distance in pixels within which a size snaps to its default
const SNAP_DISTANCE = 8;
const HANDLE_THICKNESS = 5;

const StyledResizeHandle = styled.div`
    flex-shrink: 0;
    position: relative;
    z-index: 300;

    &.horizontal {
        cursor: col-resize;
        margin: 0 -2px;
        width: ${HANDLE_THICKNESS}px;
    }

    &.vertical {
        cursor: row-resize;
        height: ${HANDLE_THICKNESS}px;
    }

    &::after {
        background-color: var(--theia-focusBorder);
        bottom: 0;
        content: '';
        left: 0;
        opacity: 0;
        position: absolute;
        right: 0;
        top: 0;
        transition: opacity .1s;
    }

    &:hover::after,
    &.dragging::after {
        opacity: 1;
    }

    &.snapped::after {
        background-color: var(--theia-editor-foreground);
    }
`;

interface ResizeHandleProps {
    // the axis along which the handle gets dragged
    direction: 'horizontal' | 'vertical'
    size: number
    setSize: (size: number) => void
    min: number
    max: number
    defaultSize: number
    // grow when dragging towards the left or the top instead of the right or the bottom
    inverted?: boolean
    style?: CSSProperties
}

export default function ResizeHandle(props: ResizeHandleProps): React.JSX.Element {
    const { direction, size, setSize, min, max, defaultSize, inverted, style } = props;
    const [dragging, setDragging] = useState<boolean>(false);
    const dragStartRef = useRef<{ position: number, size: number }>({ position: 0, size: 0 });

    const getPosition = (e: { clientX: number, clientY: number }): number =>
        direction === 'horizontal' ? e.clientX : e.clientY;

    const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        dragStartRef.current = { position: getPosition(e), size };
        setDragging(true);
    };

    useEffect(() => {
        if (!dragging) {
            return;
        }

        const onMouseMove = (e: globalThis.MouseEvent) => {
            const delta = getPosition(e) - dragStartRef.current.position;
            const newSize = clamp(dragStartRef.current.size + (inverted ? -delta : delta), min, max);
            setSize(Math.abs(newSize - defaultSize) <= SNAP_DISTANCE ? defaultSize : newSize);
        };
        const onMouseUp = () => setDragging(false);

        // keep the resize cursor while the mouse leaves the handle
        const previousCursor = document.body.style.cursor;
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.body.style.cursor = previousCursor;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [
        dragging,
    ]);

    const snapped = dragging && size === defaultSize;

    return (
        <StyledResizeHandle
            className={[direction, dragging ? 'dragging' : '', snapped ? 'snapped' : ''].join(' ')}
            onMouseDown={onMouseDown}
            onDoubleClick={() => setSize(defaultSize)}
            title={nls.localize('vuengine/editors/general/resizeHandleDescription', 'Drag to resize, double-click to reset')}
            style={style}
        />
    );
}
