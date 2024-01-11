import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Collider from './Collider';

export default function CollidersList(): React.JSX.Element {
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;

    return <>
        {data.colliders.colliders.length > 0 &&
            <VContainer>
                {data.colliders.colliders.map((collider, index) =>
                    <Collider
                        key={`collider-${index}`}
                        index={index}
                        collider={collider}
                    />
                )}
            </VContainer>
        }
    </>;
}
