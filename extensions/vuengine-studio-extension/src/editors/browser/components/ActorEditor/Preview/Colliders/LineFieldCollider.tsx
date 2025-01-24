import React, { useContext } from 'react';
import styled from 'styled-components';
import { PixelRotation, PixelVector, ROTATION_RATIO } from '../../../Common/VUEngineTypes';
import { AxisNumeric, ColliderData, ActorEditorContext, ActorEditorContextType } from '../../ActorEditorTypes';

interface LineFieldFaceProps {
    axis: AxisNumeric
    length: number
    thickness: number
    displacement: PixelVector
    rotation: PixelRotation
    highlighted: number // number to work around bug styled-component problem with boolean
}

const LineFieldFace = styled.div<LineFieldFaceProps>`
    border-top: .5px dashed yellow;
    border-radius: ${p => p.highlighted ? '.25px' : '0'};
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    justify-content: center;
    outline: ${p => p.highlighted ? '1px solid #0f0' : 'none'};
    outline-offset: 1px;
    position: absolute;
    transform: 
        rotateX(${p => p.rotation.x * ROTATION_RATIO}deg) 
        rotateY(${p => p.axis === AxisNumeric.Z
        ? p.rotation.y * ROTATION_RATIO - 90
        : p.rotation.y * ROTATION_RATIO}deg) 
        rotateZ(${p => p.axis === AxisNumeric.Y
        ? p.rotation.z * ROTATION_RATIO - 90
        : p.rotation.z * ROTATION_RATIO}deg);
    transform-style: preserve-3d;
    translate: ${p => p.displacement.x}px ${p => p.displacement.y}px ${p => p.displacement.parallax * -1}px;
    z-index: ${p => p.highlighted ? 999999 : 120000};
    width: ${p => p.length}px;
`;

interface LineFieldNormalFaceProps {
    thickness: number
    highlighted: number // number to work around bug styled-component problem with boolean
}

const LineFieldNormalFace = styled.div<LineFieldNormalFaceProps>`
    border-left: .5px dashed yellow;
    height: ${p => p.thickness}px;
    width: 0;
`;

export interface LineFieldColiderProps {
    index: number
    highlighted: boolean
    collider: ColliderData
}

export default function LineFieldCollider(props: LineFieldColiderProps): React.JSX.Element {
    const { setCurrentComponent } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { index, highlighted, collider } = props;

    let a = AxisNumeric.X;
    let l = collider.pixelSize.x;
    let t = collider.scale.x;
    if (collider.pixelSize.y > 0) {
        a = AxisNumeric.Y;
        l = collider.pixelSize.y;
        t = collider.scale.y;
    } else if (collider.pixelSize.z > 0) {
        a = AxisNumeric.Z;
        l = collider.pixelSize.z;
        t = collider.scale.z;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentComponent(`colliders-${index}`);
    };

    return <LineFieldFace
        highlighted={highlighted ? 1 : 0}
        onClick={handleClick}
        axis={a}
        length={l}
        thickness={t}
        displacement={collider.displacement}
        rotation={collider.rotation}
    >
        <LineFieldNormalFace
            highlighted={highlighted ? 1 : 0}
            thickness={t}
        />
    </LineFieldFace>;
}
