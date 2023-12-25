import React from 'react';

interface ColorSelectorProps {
    color: number;
    updateColor: (newColor: number) => void;
}

const NUMBER_OF_COLOR = 4;

export default function ColorSelector(props: ColorSelectorProps): React.JSX.Element {
    const { color, updateColor } = props;

    const handleKeyPress = (e: React.KeyboardEvent): void => {
        if (e.key === 'ArrowLeft') {
            if (color === 0) {
                updateColor(NUMBER_OF_COLOR - 1);
            } else {
                updateColor(color - 1);
            }
        } else if (e.key === 'ArrowRight') {
            if (color === NUMBER_OF_COLOR - 1) {
                updateColor(0);
            } else {
                updateColor(color + 1);
            }
        }
    };

    return <div className="colorSelector" onKeyDown={handleKeyPress} tabIndex={0}>
        {[0, 1, 2, 3].map(c => {
            const selected = c === color ? ' selected' : '';
            return <div
                key={`ves-new-project-c-${c}`}
                data-c={c}
                className={selected}
                onClick={() => updateColor(c)}
            ></div>;
        })}
    </div>;
}
