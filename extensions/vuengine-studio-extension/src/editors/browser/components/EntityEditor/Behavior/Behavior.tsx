import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/VContainer';
import {
    BehaviorData
} from '../EntityEditorTypes';

interface BehaviorProps {
    behavior: BehaviorData
    updateBehavior: (partialData: Partial<BehaviorData>) => void
    removeBehavior: () => void
}

export default function Behavior(props: BehaviorProps): React.JSX.Element {
    const { behavior, updateBehavior, removeBehavior } = props;

    const setName = (name: string): void => {
        updateBehavior({ name });
    };

    return <div>
        <VContainer className='item' gap={15}>
            <button
                className="remove-button"
                onClick={removeBehavior}
                title={nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component')}
            >
                <i className='codicon codicon-x' />
            </button>
            <input
                className='theia-input'
                value={behavior.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
    </div>;
}
