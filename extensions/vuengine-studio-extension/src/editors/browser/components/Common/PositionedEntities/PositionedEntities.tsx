import { QuickPickItem, QuickPickOptions, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { PositionedEntityData } from '../../EntityEditor/EntityEditorTypes';
import VContainer from '../VContainer';
import PositionedEntity from './PositionedEntity';

export interface PositionedEntitiesProps {
    positionedEntities: PositionedEntityData[]
    updatePositionedEntities: (positionedEntities: PositionedEntityData[]) => void
    itemIdsToIgnore?: string[]
}

export default function PositionedEntities(props: PositionedEntitiesProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { positionedEntities, updatePositionedEntities, itemIdsToIgnore } = props;

    const showEntitySelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/selectEntity', 'Select Entity')
        };
        const items: QuickPickItem[] = [];
        const entities = services.vesProjectService.getProjectDataItemsForType('Entity');
        if (entities) {
            Object.keys(entities).map(k => {
                if (!itemIdsToIgnore || !itemIdsToIgnore.includes(k)) {
                    const entity = entities[k];
                    // @ts-ignore
                    if (entity._id) {
                        // @ts-ignore
                        items.push({ id: entity._id, label: entity.name || entity._id });
                    }
                }
            });
        }

        return services.quickPickService.show(items, quickPickOptions);
    };

    const addPositionedEntity = async (): Promise<void> => {
        const entityToAdd = await showEntitySelection();
        if (entityToAdd !== undefined) {
            updatePositionedEntities([
                ...positionedEntities,
                {
                    itemId: entityToAdd.id!,
                    position: {
                        x: 0,
                        y: 0,
                        z: 0,
                        parallax: 0,
                    },
                    name: '',
                    extraInfo: '',
                    loadRegardlessOfPosition: false,
                },
            ]);
        }
    };

    const removePositionedEntity = async (index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/removePositionedEntity', 'Remove Entity'),
            msg: nls.localize('vuengine/editors/areYouSureYouWantToRemoveEntity', 'Are you sure you want to remove this entity?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            updatePositionedEntities([
                ...positionedEntities.slice(0, index),
                ...positionedEntities.slice(index + 1)
            ]);
        }
    };

    const updatePositionedEntity = (index: number, partialPositionedEntityData: Partial<PositionedEntityData>): void => {
        const updatedPositionedEntityArray = [...positionedEntities];
        updatedPositionedEntityArray[index] = {
            ...updatedPositionedEntityArray[index],
            ...partialPositionedEntityData,
        };

        updatePositionedEntities(updatedPositionedEntityArray);
    };

    return <VContainer>
        {positionedEntities.length > 0 && positionedEntities.map((child, index) =>
            <PositionedEntity
                key={`positioned-entity-${index}`}
                positionedEntity={child}
                updatePositionedEntity={(partialPositionedEntity: Partial<PositionedEntityData>) => updatePositionedEntity(index, partialPositionedEntity)}
                removePositionedEntity={() => removePositionedEntity(index)}
            />
        )}
        <button
            className='theia-button add-button full-width'
            onClick={addPositionedEntity}
            title={nls.localize('vuengine/editors/addEntity', 'Add Entity')}
        >
            <i className='codicon codicon-plus' />
        </button>
    </VContainer>;
}
