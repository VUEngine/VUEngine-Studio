import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { PositionedActorData } from '../../ActorEditor/ActorEditorTypes';
import { showActorSelection } from '../Utils';
import VContainer from '../Base/VContainer';
import PositionedActor from './PositionedActor';

export interface PositionedActorsProps {
    positionedActors: PositionedActorData[]
    updatePositionedActors: (positionedActors: PositionedActorData[]) => void
    itemIdsToIgnore?: string[]
}

export default function PositionedActors(props: PositionedActorsProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { positionedActors, updatePositionedActors, itemIdsToIgnore } = props;

    const addPositionedActor = async (): Promise<void> => {
        const actorToAdd = await showActorSelection(services.quickPickService, services.vesProjectService, itemIdsToIgnore);
        if (actorToAdd !== undefined) {
            updatePositionedActors([
                ...positionedActors,
                {
                    itemId: actorToAdd.id!,
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

    const updatePositionedActor = (index: number, partialPositionedActorData: Partial<PositionedActorData>): void => {
        const updatedPositionedActorArray = [...positionedActors];
        updatedPositionedActorArray[index] = {
            ...updatedPositionedActorArray[index],
            ...partialPositionedActorData,
        };

        updatePositionedActors(updatedPositionedActorArray);
    };

    return <VContainer>
        {positionedActors.length > 0 && positionedActors.map((child, index) =>
            <PositionedActor
                key={index}
                positionedActor={child}
                updatePositionedActor={(partialPositionedActor: Partial<PositionedActorData>) => updatePositionedActor(index, partialPositionedActor)}
            />
        )}
        <button
            className='theia-button add-button full-width'
            onClick={addPositionedActor}
            title={nls.localize('vuengine/editors/general/addActor', 'Add Actor')}
        >
            <i className='codicon codicon-plus' />
        </button>
    </VContainer>;
}
