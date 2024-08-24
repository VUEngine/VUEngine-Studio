import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { PositionedEntityData } from '../../EntityEditor/EntityEditorTypes';
import { showEntitySelection } from '../Utils';
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

    const addPositionedEntity = async (): Promise<void> => {
        const entityToAdd = await showEntitySelection(services.quickPickService, services.vesProjectService, itemIdsToIgnore);
        if (entityToAdd !== undefined) {
            updatePositionedEntities([
                ...positionedEntities,
                {
                    itemId: entityToAdd.id!,
                    onScreenPosition: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    onScreenRotation: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    onScreenScale: {
                        x: 0,
                        y: 0,
                        z: 0,
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
