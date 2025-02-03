import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import { MutatorData } from '../ActorEditorTypes';

interface MutatorProps {
    mutator: MutatorData
    updateMutator: (partialData: Partial<MutatorData>) => void
}

export default function Mutator(props: MutatorProps): React.JSX.Element {
    const { mutator, updateMutator } = props;

    const setName = (name: string): void => {
        updateMutator({ name });
    };

    return (
        <VContainer gap={15}>
            <input
                className='theia-input'
                value={mutator.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
    );
}
