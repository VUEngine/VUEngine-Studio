import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { nls } from '@theia/core';
import Mesh from './Mesh';

export default function Meshes(): React.JSX.Element {
    const { entityData, setEntityData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const addMesh = (): void => {
        const updatedMeshes = { ...entityData.meshes };
        updatedMeshes.meshes = [
            ...updatedMeshes.meshes,
            {
                wireframe: {
                    allocator: 'Mesh',
                    displacement: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    color: 0,
                    transparent: 0,
                    interlaced: false,
                },
                segments: [],
            },
        ];

        setEntityData({ meshes: updatedMeshes });
    };

    return <VContainer gap={10}>
        {entityData.meshes.meshes.length
            ? entityData.meshes.meshes.map((mesh, index) =>
                <Mesh
                    key={`mesh-${index}`}
                    index={index}
                />
            )
            : <>{nls.localize('vuengine/entityEditor/noMeshes', 'No Meshes')}</>
        }
        <div
            className='add-button'
            onClick={addMesh}
            title={nls.localize('vuengine/entityEditor/addMesh', 'Add Mesh')}
        >
            <i className='fa fa-plus' />
        </div>
    </VContainer>;
}
