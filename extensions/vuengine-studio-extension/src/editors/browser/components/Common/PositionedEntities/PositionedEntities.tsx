import { QuickPickItem, QuickPickOptions, nls } from '@theia/core';
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
            title: nls.localize('vuengine/editors/selectEntity', 'Select Entity'),
            placeholder: nls.localize('vuengine/editors/selectEntityToAdd', 'Select an Entity to add...'),
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
                    onScreenPosition: {
                        x: 0,
                        y: 0,
                        z: 0,
                        zDisplacement: 0,
                    },
                    name: '',
                    children: [],
                    extraInfo: '',
                    loadRegardlessOfPosition: false,
                },
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
