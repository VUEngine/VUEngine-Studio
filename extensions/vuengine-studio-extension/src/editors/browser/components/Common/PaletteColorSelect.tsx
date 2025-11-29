import React from 'react';
import HContainer from './Base/HContainer';
import styled from 'styled-components';

export const COLOR_PALETTE = [
    '#ffafaf', '#ff9ece', '#f6a4ff', '#d1b1ff', '#b5c2ff', '#a0f1ff', '#8bffff', '#89f2e8', '#bdffc0', '#eaffbd', '#ffffb1', '#ffff8b', '#fff389', '#ffc6a1', '#ddc493',
    '#ff8f8c', '#ff7cb6', '#e783f8', '#ba93fe', '#98a7fc', '#7ee1ff', '#65f2ff', '#62e2d6', '#a2f7a6', '#d8ffa1', '#ffff93', '#ffff64', '#ffe362', '#ffac7f', '#c9aa77',
    '#ff7571', '#ff579c', '#ca60e6', '#9a71ed', '#7585e7', '#5ac4ff', '#3fd7ff', '#3cc5b7', '#7fdc83', '#b8ef7e', '#fcff6f', '#ffef3c', '#ffc83c', '#ff8d5a', '#a98855',
    '#ff6464', '#e95093', '#a657d6', '#8163dc', '#6471cf', '#51a1fc', '#3eb3f9', '#3ca598', '#6ab96e', '#91c76b', '#dad960', '#ffec15', '#ffa83c', '#fd7341', '#8a7042',
];

export const DEFAULT_COLOR_INDEX = 4;

const ColorSquare = styled.div`
    cursor: pointer;
    height: 16px;
    width: calc(6.667% - 1px);

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
                }}
                onClick={() => updateColor(i)}
            />
        )}
    </HContainer>;
}
