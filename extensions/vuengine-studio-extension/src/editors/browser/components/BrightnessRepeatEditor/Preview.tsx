import React from 'react';

interface PreviewProps {
    mirror: boolean
    values: number[]
}

export default function Preview(props: PreviewProps): React.JSX.Element {
    const { mirror, values } = props;

    return <div className='preview'>
        {
            [...Array(96)].map((h, y) => {
                const index = mirror && y >= 48 ? 95 - y : y;
                const brightness = values[index] ?? 15;
                return <div
                    key={`preview-row-${y}`}
                    style={{
                        opacity: 1 - (1 / 15 * brightness)
                    }}
                />;
            })
        }
    </div>;
}
