import React from 'react';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';

interface SimpleListEditorProps {
    data: string[]
    updateData: (data: string[]) => void
}

export default function SimpleListEditor(props: SimpleListEditorProps): React.JSX.Element {
    const { data, updateData } = props;

    const addItem = (): void => {
        updateData([
            ...data,
            ''
        ]);
    };

    const removeItem = async (index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/simpleListEditor/removeItem', 'Remove Item'),
            msg: nls.localize('vuengine/simpleListEditor/areYouSureYouWantToRemoveItem', 'Are you sure you want to remove this item?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            updateData([
                ...data.slice(0, index),
                ...data.slice(index + 1)
            ]);
        }
    };

    const setItem = async (index: number, value: string): Promise<void> => {
        updateData([
            ...data.slice(0, index),
            value,
            ...data.slice(index + 1)
        ]);
    };

    return <VContainer>
        {data.length > 0 && data.map((item, index) =>
            <HContainer
                key={`list-editor-${index}`}
            >
                <input
                    className='theia-input full-width'
                    style={{ flexGrow: 1 }}
                    value={item}
                    onChange={e => setItem(index, e.target.value)}
                />
                <button
                    className='theia-button secondary'
                    onClick={() => removeItem(index)}
                    title={nls.localize('vuengine/simpleListEditor/removeItem', 'Remove Item')}
                >
                    <i className='codicon codicon-x' />
                </button>
            </HContainer>
        ) /* : <>
            {nls.localize('vuengine/simpleListEditor/noItems', 'No Items')}
        </> */}
        <button
            className='theia-button add-button full-width'
            onClick={addItem}
            title={nls.localize('vuengine/simpleListEditor/addItem', 'Add Item')}
        >
            <i className='codicon codicon-plus' />
        </button>
    </VContainer>;
}
