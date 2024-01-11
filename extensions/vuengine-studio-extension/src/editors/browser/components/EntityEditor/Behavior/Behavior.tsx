import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import {
    EntityEditorContext,
    EntityEditorContextType
} from '../EntityEditorTypes';

interface BehaviorProps {
    behavior: string
    index: number
}

export default function Behavior(props: BehaviorProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { behavior, index } = props;

    const remove = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeBehavior', 'Remove Behavior'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveBehavior', 'Are you sure you want to remove this Behavior?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const behaviors = { ...data.behaviors };
            behaviors.behaviors = [
                ...data.behaviors.behaviors.slice(0, index),
                ...data.behaviors.behaviors.slice(index + 1)
            ];

            setData({ behaviors });
        }
    };

    const setValue = (b: string): void => {
        const behaviors = { ...data.behaviors };
        behaviors.behaviors[index] = b;
        setData({ behaviors });
    };

    return <div>
        <VContainer className='item' gap={15}>
            <button
                className="remove-button"
                onClick={remove}
                title={nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component')}
            >
                <i className='codicon codicon-x' />
            </button>
            <input
                className='theia-input'
                value={behavior}
                onChange={e => setValue(e.target.value)}
            />
        </VContainer>
    </div>;
}
