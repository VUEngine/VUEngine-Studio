import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import { MutatorData } from '../ActorEditorTypes';
import { nls } from '@theia/core';
import Input from '../../Common/Base/Input';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor';

interface MutatorProps {
    mutator: MutatorData
    updateMutator: (partialData: Partial<MutatorData>) => void
}

export default function Mutator(props: MutatorProps): React.JSX.Element {
    const { mutator, updateMutator } = props;

    const setClass = (mutationClass: string): void => {
        updateMutator({
            mutationClass,
            name: mutationClass
        });
    };

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize('vuengine/editors/actor/mutationClass', 'Mutation Class')}
                value={mutator.mutationClass}
                setValue={setClass}
                commands={INPUT_BLOCKING_COMMANDS}
            />
        </VContainer>
    );
}
