import React, { useContext } from 'react';
import styled from 'styled-components';
import { PixelRotation, PixelSize, PixelVector, Scale } from '../../../Common/VUEngineTypes';
import { AxisNumeric, EntityEditorContext, EntityEditorContextType } from '../../EntityEditorTypes';

interface LineFieldFaceProps {
    axis: AxisNumeric
    length: number
    thickness: number
    displacement: PixelVector
    rotation: PixelRotation
    highlighted: boolean
}

const LineFieldFace = styled.div<LineFieldFaceProps>`
    border-top: ${p => p.highlighted ? '1px dashed green' : '.3px dashed yellow'};
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    justify-content: center;
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
    border-left: ${p => p.highlighted ? '1px dashed green' : '.3px dashed yellow'};
    height: ${p => p.thickness}px;
    width: 0;
`;

export interface LineFieldColiderProps {
    index: number
    highlighted: boolean
    size: PixelSize
    displacement: PixelVector
    rotation: PixelRotation
    scale: Scale
}

export default function LineFieldCollider(props: LineFieldColiderProps): React.JSX.Element {
    const { setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, highlighted, size, displacement, rotation, scale } = props;

    let a = AxisNumeric.X;
    let l = size.x;
    let t = scale.x;
    if (size.y > 0) {
        a = AxisNumeric.Y;
        l = size.y;
        t = scale.y;
    } else if (size.z > 0) {
        a = AxisNumeric.Z;
        l = size.z;
        t = scale.z;
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
        displacement={displacement}
        rotation={rotation}
    >
        <LineFieldNormalFace
            highlighted={highlighted}
            thickness={t}
        />
    </LineFieldFace>;
}
