import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Wireframe from './Wireframe';

export default function WireframesList(): React.JSX.Element {
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;

    return <>
        {data.wireframes.wireframes.length > 0 &&
            <VContainer>
                {data.wireframes.wireframes.map((wireframe, index) =>
                    <Wireframe
                        key={`wireframe-${index}`}
                        index={index}
                        wireframe={wireframe}
                    />
                )}
            </VContainer>
        }
    </>;
}
