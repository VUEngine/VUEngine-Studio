import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function Children(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const addChild = (): void => {
        const children = { ...data.children };
        children.children = [
            ...children.children,
            {
                itemId: '',
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
        ];

        setData({ children });
    };

    return <VContainer>
        <label>
            {nls.localize('vuengine/entityEditor/children', 'Children')} {
                data.children.children.length > 0 && ` (${data.children.children.length})`
            }
        </label>
        <VContainer>
            {data.children.children.length > 0 && data.children.children.map((child, index) =>
                <>
                    {/*
                    <PositionedEntity
                        key={`child-${index}`}
                        index={index}
                        positionedEntity={child}
                    />
                    */}
                </>
            )}
            <button
                className='theia-button add-button full-width'
                onClick={addChild}
                title={nls.localize('vuengine/entityEditor/addChildEntity', 'Add Child Entity')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>
    </VContainer>;
}
