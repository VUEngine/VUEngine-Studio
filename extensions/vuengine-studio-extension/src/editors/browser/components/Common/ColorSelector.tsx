import React from 'react';

interface ColorSelectorProps {
    color: number;
    updateColor: (newColor: number) => void;
    includeTransparent?: boolean
}

export default function ColorSelector(props: ColorSelectorProps): React.JSX.Element {
    const { color, updateColor, includeTransparent } = props;

    const colors = includeTransparent
        ? [-1, 0, 1, 2, 3]
        : [0, 1, 2, 3];

    const handleKeyPress = (e: React.KeyboardEvent): void => {
        if (e.key === 'ArrowLeft') {
            if (color === colors[0]) {
                updateColor(colors[colors.length - 1]);
            } else {
                updateColor(color - 1);
            }
        } else if (e.key === 'ArrowRight') {
            if (color === colors.length - 1) {
                updateColor(colors[0]);
            } else {
                updateColor(color + 1);
            }
        }
    };

    return <div className="colorSelector" onKeyDown={handleKeyPress} tabIndex={0}>
        {colors.map(c => {
            const selected = c === color ? ' selected' : '';
            return <div
                key={`ves-new-project-c-${c}`}
                data-c={c}
                className={`color-${c + 1}${selected}`}
                onClick={e => {
                    e.stopPropagation();
                    updateColor(c);
                }}
            ></div>;
        })}
    </div>;
}
