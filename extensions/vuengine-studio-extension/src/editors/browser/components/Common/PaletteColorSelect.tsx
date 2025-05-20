import React from 'react';
import HContainer from './Base/HContainer';
import styled from 'styled-components';

export const COLOR_PALETTE = [
    '#e46772', '#e49b67', '#e4c567', '#67e4b0', '#67cfe4', '#677ce4', '#9167e4', '#e4679b',
    '#dd3c49', '#dd7f3c', '#ddb43c', '#3cdd9a', '#3cc2dd', '#3c57dd', '#713cdd', '#dd3c7f',
    '#a91e29', '#a9581e', '#a9861e', '#1ea96f', '#1e92a9', '#1e35a9', '#4c1ea9', '#a91e58',
];

export const DEFAULT_COLOR_INDEX = 4;

const ColorSquare = styled.div`
    cursor: pointer;
    height: 32px;
    width: calc(12.5% - 1px);

    &.active {
        border-radius: 1px;
        outline: 2px solid var(--theia-focusBorder);
        outline-offset: 1px;
        position: relative;
        z-index: 1;
    }
`;

interface PaletteColorSelectProps {
    color: number;
    updateColor: (newColor: number) => void;
}

export default function PaletteColorSelect(props: PaletteColorSelectProps): React.JSX.Element {
    const { color, updateColor } = props;

    return <HContainer gap={1} wrap='wrap'>
        {COLOR_PALETTE.map((l, i) =>
            <ColorSquare
                key={i}
                className={i === color ? 'active' : undefined}
                style={{
                    backgroundColor: l,
                    /*
                    order: i < 8
                        ? (i + 1) * 10 + 1
                        : i < 16
                            ? (i - 8 + 1) * 10 + 2
                            : (i - 16 + 1) * 10 + 3,
                    */
                }}
                onClick={() => updateColor(i)}
            />
        )}
    </HContainer>;
}
