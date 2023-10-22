import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Segment from './Segment';

interface MeshProps {
    index: number,
}

export default function Mesh(props: MeshProps): React.JSX.Element {
    const { entityData, setEntityData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index } = props;
    const mesh = entityData.meshes.meshes[index];

    const setAllocator = (allocator: string): void => {
        const updatedMeshes = { ...entityData.meshes };
        updatedMeshes.meshes[index] = {
            ...updatedMeshes.meshes[index],
            wireframe: {
                ...updatedMeshes.meshes[index].wireframe,
                allocator
            },
        };

        setEntityData({ meshes: updatedMeshes });
    };

    const setDisplacementX = (x: number): void => {
        const updatedMeshes = { ...entityData.meshes };
        updatedMeshes.meshes[index] = {
            ...updatedMeshes.meshes[index],
            wireframe: {
                ...updatedMeshes.meshes[index].wireframe,
                displacement: {
                    ...updatedMeshes.meshes[index].wireframe.displacement,
                    x,
                },
            },
        };

        setEntityData({ meshes: updatedMeshes });
    };

    const setDisplacementY = (y: number): void => {
        const updatedMeshes = { ...entityData.meshes };
        updatedMeshes.meshes[index] = {
            ...updatedMeshes.meshes[index],
            wireframe: {
                ...updatedMeshes.meshes[index].wireframe,
                displacement: {
                    ...updatedMeshes.meshes[index].wireframe.displacement,
                    y,
                },
            },
        };

        setEntityData({ meshes: updatedMeshes });
    };

    const setDisplacementZ = (z: number): void => {
        const updatedMeshes = { ...entityData.meshes };
        updatedMeshes.meshes[index] = {
            ...updatedMeshes.meshes[index],
            wireframe: {
                ...updatedMeshes.meshes[index].wireframe,
                displacement: {
                    ...updatedMeshes.meshes[index].wireframe.displacement,
                    z,
                },
            },
        };

        setEntityData({ meshes: updatedMeshes });
    };

    const toggleInterlaced = (): void => {
        const updatedMeshes = { ...entityData.meshes };
        updatedMeshes.meshes[index] = {
            ...updatedMeshes.meshes[index],
            wireframe: {
                ...updatedMeshes.meshes[index].wireframe,
                interlaced: !updatedMeshes.meshes[index].wireframe.interlaced
            },
        };

        setEntityData({ meshes: updatedMeshes });
    };

    const addSegment = (): void => {
        const updatedMeshes = { ...entityData.meshes };
        updatedMeshes.meshes[index].segments = [
            ...updatedMeshes.meshes[index].segments,
            {
                fromVertex: {
                    x: 0,
                    y: 0,
                    z: 0,
                    parallax: 0,
                },
                toVertex: {
                    x: 0,
                    y: 0,
                    z: 0,
                    parallax: 0,
                },
            }
        ];

        setEntityData({ meshes: updatedMeshes });
    };

    const removeMesh = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/remove', 'Remove'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveMesh', 'Are you sure you want to remove this mesh?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedMeshes = { ...entityData.meshes };
            updatedMeshes.meshes = [
                ...entityData.meshes.meshes.slice(0, index),
                ...entityData.meshes.meshes.slice(index + 1)
            ];

            setEntityData({ meshes: updatedMeshes });
        }
    };

    return <div className='item'>
        <VContainer gap={10}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/allocator', 'Class allocator')}
                </label>
                <input
                    className='theia-input'
                    type='string'
                    value={mesh.wireframe.allocator}
                    onChange={e => setAllocator(e.target.value)}
                />
            </VContainer>
            <VContainer>
                <label>Displacement (X, Y, Z)</label>
                <HContainer gap={10}>
                    <input
                        className='theia-input'
                        type='number'
                        value={mesh.wireframe.displacement.x}
                        onChange={e => setDisplacementX(parseInt(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        type='number'
                        value={mesh.wireframe.displacement.y}
                        onChange={e => setDisplacementY(parseInt(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        type='number'
                        value={mesh.wireframe.displacement.z}
                        onChange={e => setDisplacementZ(parseInt(e.target.value))}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/interlaced', 'Interlaced')}
                </label>
                <input
                    type="checkbox"
                    checked={mesh.wireframe.interlaced}
                    onChange={toggleInterlaced}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/segments', 'Segments')}
                </label>
                {mesh.segments.map((segment, segmentIndex) =>
                    <Segment
                        key={`segment-${segmentIndex}`}
                        meshIndex={index}
                        segmentIndex={segmentIndex}
                    />
                )}
                <div
                    className='add-button'
                    onClick={addSegment}
                    title={nls.localize('vuengine/entityEditor/addSegment', 'Add Segment')}
                >
                    <i className='fa fa-plus' />
                </div>
            </VContainer>
            <button
                className="theia-button secondary remove-button"
                onClick={removeMesh}
            >
                {nls.localize('vuengine/entityEditor/remove', 'Remove')}
            </button>
        </VContainer>
    </div>;
}
