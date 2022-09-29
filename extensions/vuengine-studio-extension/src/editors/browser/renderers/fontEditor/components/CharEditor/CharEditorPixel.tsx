import React from 'react';

interface CharEditorPixelProps {
    x: number,
    y: number,
    paletteIndexL: number,
    paletteIndexR: number,
    pixelColor: number,
    setPixelColor: (x: number, y: number, color: number) => void,
    active: boolean
}

export default function CharEditorPixel(props: CharEditorPixelProps): JSX.Element {
    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        setPixelColor(x, y, paletteIndexL);
        e.preventDefault();
    };
    const onRightClick = (e: React.MouseEvent<HTMLElement>) => {
        setPixelColor(x, y, paletteIndexR);
        e.preventDefault();
    };

    const onMouseOver = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 1) {
            setPixelColor(x, y, paletteIndexL);
        } else if (e.buttons === 2) {
            setPixelColor(x, y, paletteIndexR);
        }
        e.preventDefault();
    };

    const {
        x, y,
        pixelColor, setPixelColor,
        paletteIndexL, paletteIndexR,
        active
    } = props;

    const classNames = [`pixel color-${pixelColor}`];
    if (!active) {
        classNames.push('inactive');
    }

    return <div
        className={classNames.join(' ')}
        onClick={onClick}
        onContextMenu={onRightClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseOver}
    ></div>;
}
