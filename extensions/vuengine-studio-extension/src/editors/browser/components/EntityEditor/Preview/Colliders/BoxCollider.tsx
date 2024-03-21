import React, { useContext } from 'react';
import styled from 'styled-components';
import { COLLIDER_ROTATION_RATIO, ColliderData, EntityEditorContext, EntityEditorContextType } from '../../EntityEditorTypes';

const Cuboid = styled.div`
    --half-d: calc(var(--depth) / 2);
    --half-h: calc(var(--height) / 2);
    --half-w: calc(var(--width) / 2);
    transform-style: preserve-3d;
`;

const CuboidFace = styled.div`
    border: .5px dashed yellow;
    box-sizing: border-box;
    outline-offset: 1px;
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

export interface BoxColliderProps {
    index: number
    highlighted: boolean
    collider: ColliderData
}

export default function BoxCollider(props: BoxColliderProps): React.JSX.Element {
    const { setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, highlighted, collider } = props;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setState({ currentComponent: `colliders-${index}` });
    };

    const width = collider.pixelSize.x * collider.scale.x;
    const height = collider.pixelSize.y * collider.scale.y;
    const depth = collider.pixelSize.z * collider.scale.z;
    const isRotated = collider.rotation.x > 0 || collider.rotation.y > 0 || collider.rotation.z > 0;

    return <div
        onClick={handleClick}
        style={{
            alignItems: 'center',
            borderRadius: highlighted ? .25 : undefined,
            cursor: 'pointer',
            display: 'flex',
            height: isRotated ? height * 1.66 : height,
            justifyContent: 'center',
            outline: highlighted ? '1px solid #0f0' : undefined,
            translate: `${collider.displacement.x}px ${collider.displacement.y}px ${-1 * collider.displacement.parallax}px`,
            width: isRotated ? width * 1.66 : width,
            zIndex: highlighted ? 999999 : 120000,
        }}
    >
        <Cuboid
            onClick={handleClick}
            style={{
                // @ts-ignore
                '--depth': `${depth}px`,
                '--height': `${height}px`,
                '--width': `${width}px`,
                transform: `rotateX(${collider.rotation.x * COLLIDER_ROTATION_RATIO}deg) 
                    rotateY(${collider.rotation.y * COLLIDER_ROTATION_RATIO}deg) 
                    rotateZ(${collider.rotation.z * COLLIDER_ROTATION_RATIO}deg)`,
            }}
        >
            <CuboidFaceFront />
            <CuboidFaceBack />
            <CuboidFaceTop />
            <CuboidFaceBottom />
            {/* <CuboidFaceLeft /> */}
            {/* <CuboidFaceRight /> */}
        </Cuboid>
    </div>;
}
