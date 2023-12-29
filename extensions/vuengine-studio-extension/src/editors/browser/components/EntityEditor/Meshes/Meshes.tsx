import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType, Transparency } from '../EntityEditorTypes';
import { nls } from '@theia/core';
import Mesh from './Mesh';

export default function Meshes(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const addMesh = (): void => {
        const updatedMeshes = { ...data.meshes };
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
                    color: 3,
                    transparency: Transparency.None,
                    interlaced: false,
                },
                segments: [],
            },
        ];

        setData({ meshes: updatedMeshes });
    };

    return <VContainer gap={10}>
        {data.meshes.meshes.length
            ? data.meshes.meshes.map((m, i) =>
                <Mesh
                    key={`mesh-${i}`}
                    index={i}
                    mesh={m}
                />
            )
            : <>{nls.localize('vuengine/entityEditor/noMeshes', 'No Meshes')}</>
        }
        <button
            className='theia-button secondary full-width'
            onClick={addMesh}
            title={nls.localize('vuengine/entityEditor/addMesh', 'Add Mesh')}
        >
            <i className='fa fa-plus' />
        </button>
    </VContainer>;
}
