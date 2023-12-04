import React, { useCallback } from 'react';

interface CharEditorPixelProps {
    x: number,
    y: number,
    paletteIndexL: number,
    paletteIndexR: number,
    pixelColor: number,
    clickPixel: (x: number, y: number, color: number) => void,
    active: boolean
}

export default function CharEditorPixel(props: CharEditorPixelProps): React.JSX.Element {
    const {
        x, y,
        pixelColor, clickPixel,
        paletteIndexL, paletteIndexR,
        active
    } = props;

    const onClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
        clickPixel(x, y, paletteIndexL);
        e.preventDefault();
    }, [
        paletteIndexL,
        x,
        y,
    ]);

    const onRightClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
        clickPixel(x, y, paletteIndexR);
        e.preventDefault();
    }, [
        paletteIndexL,
        x,
        y,
    ]);

    const onMouse = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 1) {
            clickPixel(x, y, paletteIndexL);
        } else if (e.buttons === 2) {
            clickPixel(x, y, paletteIndexR);
        }
        e.preventDefault();
    }, [
        paletteIndexL,
        paletteIndexR,
        x,
        y,
    ]);

    const classNames = [`pixel color-${pixelColor}`];
    if (!active) {
        classNames.push('inactive');
    }

    return <div
        className={classNames.join(' ')}
        onClick={onClick}
        onContextMenu={onRightClick}
        onMouseDown={e => onMouse(e)}
        onMouseOver={e => onMouse(e)}
    ></div>;
}
