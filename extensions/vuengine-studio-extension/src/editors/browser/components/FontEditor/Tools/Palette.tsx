import React from 'react';
import { FontEditorState } from '../FontEditorTypes';

interface PaletteProps {
    paletteIndexL: number
    paletteIndexR: number
    setState: (state: Partial<FontEditorState>) => void
}

export default function Palette(props: PaletteProps): JSX.Element {
    const { paletteIndexL, paletteIndexR, setState } = props;

    return <div className="palette">
        {[...Array(4)].map((x, i) =>
            <div
                key={`palette-${i}`}
                className={`color-${i} ${(i === paletteIndexL || i === paletteIndexR) && 'active'}`}
                onClick={() => setState({ paletteIndexL: i })}
                onContextMenu={() => setState({ paletteIndexR: i })}
            >
                {i === paletteIndexL && 'L'}
                {i === paletteIndexL && i === paletteIndexR && '/'}
                {i === paletteIndexR && 'R'}
            </div>
        )}
    </div>;
}
