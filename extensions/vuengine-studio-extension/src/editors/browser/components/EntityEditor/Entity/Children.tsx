import { nls } from '@theia/core';
import React, { useContext } from 'react';
import PositionedEntities from '../../Common/PositionedEntities/PositionedEntities';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType, PositionedEntityData } from '../EntityEditorTypes';

export default function Children(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const updateChildren = async (positionedEntities: PositionedEntityData[]): Promise<void> => {
        const children = { ...data.children };
        children.children = positionedEntities;

        setData({ children });
    };

    return <VContainer>
        <label>
            {nls.localize('vuengine/entityEditor/children', 'Children')} {
                data.children.children.length > 0 && ` (${data.children.children.length})`
            }
        </label>
        <PositionedEntities
            positionedEntities={data.children.children}
            updatePositionedEntities={updateChildren}
            itemIdsToIgnore={[data._id]}
        />
    </VContainer >;
}
