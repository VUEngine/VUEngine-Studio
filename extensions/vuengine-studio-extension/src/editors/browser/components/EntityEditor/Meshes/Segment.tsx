import React, { useContext } from 'react';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

interface SegmentProps {
    meshIndex: number,
    segmentIndex: number,
}

export default function Segment(props: SegmentProps): React.JSX.Element {
    const { entityData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { meshIndex, segmentIndex } = props;
    const segment = entityData.meshes.meshes[meshIndex].segments[segmentIndex];

    console.log(segment);

    return <div className="item">
        Hi!
    </div>;
}
