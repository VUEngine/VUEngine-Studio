import React, { useContext } from 'react';
import styled from 'styled-components';
import { ColliderData, EntityEditorContext, EntityEditorContextType } from '../../EntityEditorTypes';

interface CuboidProps {
    highlighted: boolean
}

const Cuboid = styled.div<CuboidProps>`
    --half-d: calc(var(--depth) / 2);
    --half-h: calc(var(--height) / 2);
    --half-w: calc(var(--width) / 2);
    transform-style: preserve-3d;
    z-index: ${p => p.highlighted ? 999999 : 110000};
`;

interface CuboidFaceProps {
    highlighted: boolean
}

const CuboidFace = styled.div<CuboidFaceProps>`
    border: .3px dashed yellow;
    border-radius: ${p => p.highlighted ? '.5px' : '0'};
    box-sizing: border-box;
    outline: ${p => p.highlighted ? '.5px solid rgba(0, 255, 0, .5)' : 'none'};
    position: absolute;
`;

const CuboidFaceFront = styled(CuboidFace)`
    height: var(--height);
    translate: calc(-1 * var(--half-w)) calc(-1 * var(--half-h)) var(--half-d);
    width: var(--width);
`;

const CuboidFaceBack = styled(CuboidFace)`
    height: var(--height);
    transform: rotateY(180deg);
    translate: calc(-1 * var(--half-w)) calc(-1 * var(--half-h)) calc(var(--depth) / -2);
    width: var(--width);
`;

const CuboidFaceTop = styled(CuboidFace)`
    border-bottom-width: 0;
    border-top-width: 0;
    height: var(--depth);
    transform: rotateX(90deg);
    translate: calc(-1 * var(--half-w)) calc(var(--half-h) - var(--half-d)) 0;
    width: var(--width);
`;

const CuboidFaceBottom = styled(CuboidFace)`
    border-bottom-width: 0;
    border-top-width: 0;
    height: var(--depth);
    transform: rotateX(-90deg);
    translate: calc(-1 * var(--half-w)) calc(-1 * var(--half-h) - var(--half-d)) 0;
    width: var(--width);
`;

/*
const CuboidFaceLeft = styled(CuboidFace)`
    height: var(--height);
    transform: rotateY(90deg);
    translate: calc(var(--half-w) - var(--half-d)) calc(-1 * var(--half-h)) 0;
    width: var(--depth);
`;

const CuboidFaceRight = styled(CuboidFace)`
    height: var(--height);
    transform: rotateY(-90deg);
    translate: calc(-1 * var(--half-w) - var(--half-d)) calc(-1 * var(--half-h)) 0;
    width: var(--depth);
`;
*/

export interface BoxColiderProps {
    index: number
    highlighted: boolean
    collider: ColliderData
}

export default function BoxCollider(props: BoxColiderProps): React.JSX.Element {
    const { setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, highlighted, collider } = props;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setState({ currentComponent: `colliders-${index}` });
    };

    return <Cuboid
        highlighted={highlighted}
        onClick={handleClick}
        style={{
            // @ts-ignore
            '--depth': `${collider.pixelSize.z * collider.scale.z}px`,
            '--height': `${collider.pixelSize.y * collider.scale.y}px`,
            '--width': `${collider.pixelSize.x * collider.scale.x}px`,
            transform: `rotateX(${collider.rotation.x}deg) rotateY(${collider.rotation.y}deg) rotateZ(${collider.rotation.z}deg)`,
            translate: `${collider.displacement.x}px ${collider.displacement.y}px ${-1 * collider.displacement.parallax}px`,
            cursor: 'pointer',
        }}
    >
        <CuboidFaceFront highlighted={highlighted} />
        <CuboidFaceBack highlighted={highlighted} />
        <CuboidFaceTop highlighted={highlighted} />
        <CuboidFaceBottom highlighted={highlighted} />
        {/* <CuboidFaceLeft highlighted={highlighted} /> */}
        {/* <CuboidFaceRight highlighted={highlighted} /> */}
    </Cuboid>;
}
