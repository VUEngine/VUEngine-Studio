import React, { useContext } from 'react';
import styled from 'styled-components';
import { PixelRotation, PixelSize, PixelVector, Scale } from '../../../Common/VUEngineTypes';
import { EntityEditorContext, EntityEditorContextType } from '../../EntityEditorTypes';

interface BallFaceProps {
    diameter: number
    displacement: PixelVector
    rotation: PixelRotation
    highlighted: boolean
}

const BallFace = styled.div<BallFaceProps>`
    border: ${p => p.highlighted ? '1px dashed green' : '.3px dashed yellow'};
    border-radius: 100%;
    box-sizing: border-box;
    cursor: pointer;
    height: ${p => p.diameter}px;
    width: ${p => p.diameter}px;
    position: absolute;
    transform: rotateX(${p => p.rotation.x}deg) rotateY(${p => p.rotation.y}deg) rotateZ(${p => p.rotation.z}deg);
    transform-style: preserve-3d;
    translate: ${p => p.displacement.x}px ${p => p.displacement.y}px ${p => p.displacement.parallax * -1}px;
    z-index: ${p => p.highlighted ? 999999 : 110000};
`;

export interface BallColiderProps {
    index: number
    highlighted: boolean
    size: PixelSize
    displacement: PixelVector
    rotation: PixelRotation
    scale: Scale
}

export default function BallCollider(props: BallColiderProps): React.JSX.Element {
    const { setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, highlighted, size, displacement, rotation, scale } = props;

    const diameter = size.x * scale.x;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setState({ currentComponent: `colliders-${index}` });
    };

    return <BallFace
        highlighted={highlighted}
        onClick={handleClick}
        diameter={diameter}
        displacement={displacement}
        rotation={rotation}
    />;
}
