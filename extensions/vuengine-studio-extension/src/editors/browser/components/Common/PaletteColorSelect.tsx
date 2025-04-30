import React from 'react';
import VContainer from './Base/VContainer';
import HContainer from './Base/HContainer';
import styled from 'styled-components';

export const COLOR_PALETTE = [[
    '#ffa9ae', '#ff97cf', '#ff9eff', '#d4afff', '#b0c3ff', '#87f4ff', '#5effff', '#5affff', '#63f6e8', '#aeffbc', '#e7ffb9', '#ffffab', '#ffff80', '#fff27f', '#ffc29e', '#e2c3ba'
], [
    '#ff868a', '#ff70b7', '#f27bfc', '#bd91ff', '#91a8ff', '#56e5ff', '#00f7ff', '#00ffff', '#00e6d6', '#8dfaa1', '#d2ff9a', '#ffff8a', '#ffff50', '#ffe152', '#ffa67a', '#cfa89e'
], [
    '#ff736f', '#ff43a0', '#e458f0', '#a673f7', '#718ef5', '#00d6ff', '#00eaff', '#00fdff', '#00d6c4', '#6bef86', '#bdff7c', '#ffff66', '#fffd10', '#ffd117', '#ff8a57', '#bb8f83'
], [
    '#ff676e', '#ff3f9d', '#d556ea', '#9c6ff1', '#6c86eb', '#00c8ff', '#00dcff', '#00edff', '#00c9b7', '#64df7d', '#aef175', '#feff5e', '#ffee00', '#ffc41d', '#ff8353', '#af867c'
], [
    '#ff5a68', '#ff3a98', '#c053e2', '#8e67e8', '#637cdf', '#0cb5ff', '#00c8ff', '#00d7e5', '#00b9a7', '#5bcd72', '#99dd6b', '#edf057', '#ffda11', '#ffb323', '#ff7b4e', '#9e7a72'
]];

const ColorSquare = styled.div`
    cursor: pointer;
    flex-grow: 1;
    height: 8px;

    &.active {
        border-radius: 1px;
        outline: 3px solid var(--theia-focusBorder);
        outline-offset: 1px;
        position: relative;
        z-index: 1;
    }
`;

interface PaletteColorSelectProps {
    color: string;
    updateColor: (newColor: string) => void;
}

export default function PaletteColorSelect(props: PaletteColorSelectProps): React.JSX.Element {
    const { color, updateColor } = props;

    return <VContainer gap={1}>
        {COLOR_PALETTE.map((l, i) =>
            <HContainer key={i} gap={1}>
                {l.map((c, j) =>
                    <ColorSquare
                        key={j}
                        style={{ backgroundColor: c }}
                        className={c === color ? 'active' : undefined}
                        onClick={() => updateColor(c)}
                    />
                )}
            </HContainer>)}
    </VContainer>;
}
