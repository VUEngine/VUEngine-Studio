import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Behavior from './Behavior';

export default function BehaviorsList(): React.JSX.Element {
    const { data, } = useContext(EntityEditorContext) as EntityEditorContextType;

    return <>
        {data.behaviors.behaviors.length > 0 &&
            <VContainer>
                {data.behaviors.behaviors.map((behavior, index) =>
                    <Behavior
                        key={'behavior-' + index}
                        behavior={behavior}
                        index={index}
                    />
                )}
            </VContainer>
        }
    </>;
}
