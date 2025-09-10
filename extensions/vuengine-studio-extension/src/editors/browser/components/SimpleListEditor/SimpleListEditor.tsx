import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { nanoid } from '../Common/Utils';

interface SimpleListEditorProps {
    data: Record<string, string>
    updateData: (data: Record<string, string>) => void
    sort?: boolean
}

export default function SimpleListEditor(props: SimpleListEditorProps): React.JSX.Element {
    const { data, updateData, sort } = props;

    const addItem = (): void => {
        updateData({
            ...data,
            [nanoid()]: ''
        });
    };

    const removeItem = async (key: string): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/simpleList/removeItem', 'Remove Item'),
            msg: nls.localize('vuengine/editors/simpleList/areYouSureYouWantToRemoveItem', 'Are you sure you want to remove this item?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedData = {
                ...data
            };
            delete updatedData[key];
            updateData(updatedData);
        }
    };

    const setItem = async (key: string, value: string): Promise<void> => {
        updateData({
            ...data,
            [key]: value
        });
    };

    const dataKeys = Object.keys(data);

    const preparedData = Object.entries(data);
    if (sort !== false) {
        preparedData.sort(([, a], [, b]) => a.localeCompare(b));
    }

    return <VContainer>
        {dataKeys.length > 0 && preparedData
            .map(([key, value]: string[]) => (
                <HContainer key={key}>
                    <input
                        className='theia-input full-width'
                        style={{ flexGrow: 1 }}
                        value={value}
                        autoFocus={value === ''}
                        onChange={e => setItem(key, e.target.value)}
                    />
                    <button
                        className='theia-button secondary'
                        onClick={() => removeItem(key)}
                        title={nls.localizeByDefault('Remove')}
                    >
                        <i className='codicon codicon-x' />
                    </button>
                </HContainer>
            ))}
        <button
            className='theia-button add-button full-width'
            onClick={addItem}
            title={nls.localizeByDefault('Add')}
        >
            <i className='codicon codicon-plus' />
        </button>
    </VContainer>;
}
