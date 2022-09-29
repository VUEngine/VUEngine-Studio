import React from 'react';

interface PaletteProps {
    paletteIndexL: number
    setPaletteIndexL: (index: number) => void
    paletteIndexR: number
    setPaletteIndexR: (index: number) => void
}

export default function Palette(props: PaletteProps): JSX.Element {
    const {
        paletteIndexL, setPaletteIndexL,
        paletteIndexR, setPaletteIndexR,
    } = props;

    return <div className="palette">
        {[...Array(4)].map((x, i) =>
            <div
                key={`palette-${i}`}
                className={`color-${i} ${(i === paletteIndexL || i === paletteIndexR) && 'active'}`}
                onClick={() => setPaletteIndexL(i)}
                onContextMenu={() => setPaletteIndexR(i)}
            >
                {i === paletteIndexL && 'L'}
                {i === paletteIndexL && i === paletteIndexR && '/'}
                {i === paletteIndexR && 'R'}
            </div>
        )}
    </div>;
}
