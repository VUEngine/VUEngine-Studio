import React, { useContext } from 'react';
import PositionedEntity from '../../Common/PositionedEntities/PositionedEntity';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType, PositionedEntityData } from '../EntityEditorTypes';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { nls } from '@theia/core';

export default function ChildrenList(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const update = async (partialPositionedEntity: Partial<PositionedEntityData>, index: number): Promise<void> => {
        const children = { ...data.children };
        children.children[index] = {
            ...children.children[index],
            ...partialPositionedEntity,
        };

        setData({ children });
    };

    const remove = async (index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveComponent', 'Are you sure you want to remove this component?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const children = { ...data.children };
            children.children = [
                ...data.children.children.slice(0, index),
                ...data.children.children.slice(index + 1)
            ];

            setData({ children });
        }
    };

    return <>
        {data.children.children.length > 0 &&
            <VContainer>
                {data.children.children.map((child, index) =>
                    <PositionedEntity
                        key={'child-' + index}
                        positionedEntity={child}
                        updatePositionedEntity={partialPositionedEntity => update(partialPositionedEntity, index)}
                        removePositionedEntity={() => remove(index)}
                    />
                )}
            </VContainer>
        }
    </>;
}
