import React from 'react';
import styled from 'styled-components';
import { PixelRotation, PixelSize, PixelVector, Scale } from '../../EntityEditorTypes';

const Cuboid = styled.div`
    --half-d: calc(var(--depth) / 2);
    --half-h: calc(var(--height) / 2);
    --half-w: calc(var(--width) / 2);
    transform-style: preserve-3d;
`;

const CuboidFace = styled.div`
    border: 1px dashed green;
    box-sizing: border-box;
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

export interface CubiodColiderProps {
    size: PixelSize
    displacement: PixelVector
    rotation: PixelRotation
    scale: Scale
}

export default function BoxCollider(props: CubiodColiderProps): React.JSX.Element {
    const { size, displacement, rotation, scale } = props;

    return <Cuboid style={{
        // @ts-ignore
        '--depth': `${size.z * scale.z}px`,
        '--height': `${size.y * scale.y}px`,
        '--width': `${size.x * scale.x}px`,
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
        translate: `${displacement.x}px ${displacement.y}px ${-1 * displacement.parallax}px`,
    }}>
        <CuboidFaceFront />
        <CuboidFaceBack />
        <CuboidFaceTop />
        <CuboidFaceBottom />
        {/* <CuboidFaceLeft /> */}
        {/* <CuboidFaceRight /> */}
    </Cuboid>;
}
