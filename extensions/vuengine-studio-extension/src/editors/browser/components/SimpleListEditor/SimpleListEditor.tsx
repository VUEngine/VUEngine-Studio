import React, { useContext } from 'react';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';

interface SimpleListEditorProps {
    data: Record<string, string>
    updateData: (data: Record<string, string>) => void
}

export default function SimpleListEditor(props: SimpleListEditorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;

    const addItem = (): void => {
        updateData({
            ...data,
            [services.vesCommonService.nanoid()]: ''
        });
    };

    const removeItem = async (key: string): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/simpleListEditor/removeItem', 'Remove Item'),
            msg: nls.localize('vuengine/simpleListEditor/areYouSureYouWantToRemoveItem', 'Are you sure you want to remove this item?'),
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

    return <VContainer>
        {dataKeys.length > 0 && Object.entries(data)
            .sort(([, a], [, b]) => a.localeCompare(b))
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
                        title={nls.localize('vuengine/simpleListEditor/removeItem', 'Remove Item')}
                    >
                        <i className='codicon codicon-x' />
                    </button>
                </HContainer>
            ))}
        <button
            className='theia-button add-button full-width'
            onClick={addItem}
            title={nls.localize('vuengine/simpleListEditor/addItem', 'Add Item')}
        >
            <i className='codicon codicon-plus' />
        </button>
    </VContainer>;
}
