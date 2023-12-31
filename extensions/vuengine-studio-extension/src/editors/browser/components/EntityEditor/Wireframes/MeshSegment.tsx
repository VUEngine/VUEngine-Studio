import React, { useContext } from 'react';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

interface MeshSegmentProps {
    index: number,
    segmentIndex: number,
}

export default function MeshSegment(props: MeshSegmentProps): React.JSX.Element {
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, segmentIndex } = props;
    const segment = data.wireframes.wireframes[index].segments[segmentIndex];

    console.log(segment);

    return <div className="item">
        [To be implemented]
    </div>;
}
