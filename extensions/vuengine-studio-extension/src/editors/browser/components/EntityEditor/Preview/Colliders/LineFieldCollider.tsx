import React, { useContext } from 'react';
import styled from 'styled-components';
import { PixelRotation, PixelVector } from '../../../Common/VUEngineTypes';
import { AxisNumeric, ColliderData, EntityEditorContext, EntityEditorContextType } from '../../EntityEditorTypes';

interface LineFieldFaceProps {
    axis: AxisNumeric
    length: number
    thickness: number
    displacement: PixelVector
    rotation: PixelRotation
    highlighted: boolean
}

const LineFieldFace = styled.div<LineFieldFaceProps>`
    border-top: .3px dashed yellow;
    border-radius: ${p => p.highlighted ? '.5px' : '0'};
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    justify-content: center;
    outline: ${p => p.highlighted ? '.5px solid rgba(0, 255, 0, .5)' : 'none'};
    position: absolute;
    transform: 
        rotateX(${p => p.rotation.x}deg) 
        rotateY(${p => p.axis === AxisNumeric.Z ? p.rotation.y - 90 : p.rotation.y}deg) 
        rotateZ(${p => p.axis === AxisNumeric.Y ? p.rotation.z - 90 : p.rotation.z}deg);
    transform-style: preserve-3d;
    translate: ${p => p.displacement.x}px ${p => p.displacement.y}px ${p => p.displacement.parallax * -1}px;
    z-index: ${p => p.highlighted ? 999999 : 110000};
    width: ${p => p.length}px;
`;

interface LineFieldNormalFaceProps {
    thickness: number
    highlighted: boolean
}

const LineFieldNormalFace = styled.div<LineFieldNormalFaceProps>`
    border-left: .3px dashed yellow;
    height: ${p => p.thickness}px;
    width: 0;
`;

export interface LineFieldColiderProps {
    index: number
    highlighted: boolean
    collider: ColliderData
}

export default function LineFieldCollider(props: LineFieldColiderProps): React.JSX.Element {
    const { setState } = useContext(EntityEditorContext) as EntityEditorContextType;
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
        setState({ currentComponent: `colliders-${index}` });
    };

    return <LineFieldFace
        highlighted={highlighted}
        onClick={handleClick}
        axis={a}
        length={l}
        thickness={t}
        displacement={collider.displacement}
        rotation={collider.rotation}
    >
        <LineFieldNormalFace
            highlighted={highlighted}
            thickness={t}
        />
    </LineFieldFace>;
}
