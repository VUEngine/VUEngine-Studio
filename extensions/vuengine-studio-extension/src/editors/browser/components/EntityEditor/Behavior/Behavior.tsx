import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import {
    BehaviorData
} from '../EntityEditorTypes';

interface BehaviorProps {
    behavior: BehaviorData
    updateBehavior: (partialData: Partial<BehaviorData>) => void
}

export default function Behavior(props: BehaviorProps): React.JSX.Element {
    const { behavior, updateBehavior } = props;

    const setName = (name: string): void => {
        updateBehavior({ name });
    };

    return (
        <VContainer gap={15}>
            <input
                className='theia-input'
                value={behavior.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
    );
}
