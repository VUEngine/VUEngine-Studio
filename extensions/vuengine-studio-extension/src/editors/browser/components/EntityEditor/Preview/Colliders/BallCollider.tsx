import React, { useContext } from 'react';
import styled from 'styled-components';
import { PixelRotation, PixelVector, ROTATION_RATIO } from '../../../Common/VUEngineTypes';
import { ColliderData, EntityEditorContext, EntityEditorContextType } from '../../EntityEditorTypes';

interface BallFaceProps {
    diameter: number
    displacement: PixelVector
    rotation: PixelRotation
    highlighted: number // number to work around bug styled-component problem with boolean
}

const BallFace = styled.div<BallFaceProps>`
    align-items: center;
    border: .5px dashed yellow;
    border-radius: 100%;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    height: ${p => p.diameter}px;
    justify-content: center;
    outline: ${p => p.highlighted ? '1px solid #0f0' : 'none'};
    outline-offset: 1px;
    position: absolute;
    transform: rotateX(${p => p.rotation.x * ROTATION_RATIO}deg) 
        rotateY(${p => p.rotation.y * ROTATION_RATIO}deg) 
        rotateZ(${p => p.rotation.z * ROTATION_RATIO}deg);
    transform-style: preserve-3d;
    translate: ${p => p.displacement.x}px ${p => p.displacement.y}px ${p => p.displacement.parallax * -1}px;
    width: ${p => p.diameter}px;
    z-index: ${p => p.highlighted ? 999999 : 120000};
`;

const BallCenterFace = styled.div`
    background-color: yellow;
    border-radius: 1px;
    height: 1px;
    width: 1px;
`;

export interface BallColliderProps {
    index: number
    highlighted: boolean
    collider: ColliderData
}

export default function BallCollider(props: BallColliderProps): React.JSX.Element {
    const { setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, highlighted, collider } = props;

    const diameter = collider.pixelSize.x * collider.scale.x;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setState({ currentComponent: `colliders-${index}` });
    };

    return <BallFace
        highlighted={highlighted ? 1 : 0}
        onClick={handleClick}
        diameter={diameter}
        displacement={collider.displacement}
        rotation={collider.rotation}
    >
        <BallCenterFace />
    </BallFace>;
}