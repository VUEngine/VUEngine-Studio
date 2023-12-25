import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType, Mesh, Wireframe } from '../EntityEditorTypes';
import Segment from './Segment';

interface MeshProps {
    index: number,
    mesh: Mesh
}

export default function Mesh(props: MeshProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, mesh } = props;

    const setMesh = (partialMeshData: Partial<Mesh>): void => {
        const updatedMeshesArray = [...data.meshes.meshes];
        updatedMeshesArray[index] = {
            ...updatedMeshesArray[index],
            ...partialMeshData,
        };

        const updatedMeshes = { ...data.meshes };
        updatedMeshes.meshes = updatedMeshesArray;

        setData({ meshes: updatedMeshes });
    };

    const setWireframe = (partialWireframe: Partial<Wireframe>): void => {
        const updatedWireframe = { ...data.meshes.meshes[index].wireframe };

        setMesh({
            wireframe: {
                ...updatedWireframe,
                ...partialWireframe,
            }
        });
    };

    const setAllocator = (allocator: string): void => {
        setWireframe({
            allocator,
        });
    };

    const setDisplacementX = (x: number): void => {
        setWireframe({
            displacement: {
                ...data.meshes.meshes[index].wireframe.displacement,
                x,
            },
        });
    };

    const setDisplacementY = (y: number): void => {
        setWireframe({
            displacement: {
                ...data.meshes.meshes[index].wireframe.displacement,
                y,
            },
        });
    };

    const setDisplacementZ = (z: number): void => {
        setWireframe({
            displacement: {
                ...data.meshes.meshes[index].wireframe.displacement,
                z,
            },
        });
    };

    const setColor = (color: number): void => {
        setWireframe({
            color
        });
    };

    const setTransparent = (transparent: number): void => {
        setWireframe({
            transparent
        });
    };

    const toggleInterlaced = (): void => {
        setWireframe({
            interlaced: !data.meshes.meshes[index].wireframe.interlaced,
        });
    };

    const addSegment = (): void => {
        const updatedMeshes = { ...data.meshes };
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

        setData({ meshes: updatedMeshes });
    };

    const removeMesh = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/remove', 'Remove'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveMesh', 'Are you sure you want to remove this mesh?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedMeshes = { ...data.meshes };
            updatedMeshes.meshes = [
                ...data.meshes.meshes.slice(0, index),
                ...data.meshes.meshes.slice(index + 1)
            ];

            setData({ meshes: updatedMeshes });
        }
    };

    return <div className='item'>
        <VContainer gap={10}>
            <HContainer alignItems='end' gap={20}>
                <VContainer grow={1}>
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
                <button
                    className="theia-button secondary remove-button"
                    onClick={removeMesh}
                    title={nls.localize('vuengine/entityEditor/remove', 'Remove')}
                >
                    <i className='fa fa-trash' />
                </button>
            </HContainer>
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
                {nls.localize('vuengine/entityEditor/color', 'Color')}
                <ColorSelector
                    color={mesh.wireframe.color}
                    updateColor={setColor}
                />
            </VContainer>
            <HContainer alignItems='start' gap={20}>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/transparency', 'Transparency')}
                    </label>
                    <SelectComponent
                        options={[
                            { value: '0', label: nls.localize('vuengine/entityEditor/transparencyNone', 'None') },
                            { value: '1', label: nls.localize('vuengine/entityEditor/transparencyOdd', 'Odd') },
                            { value: '2', label: nls.localize('vuengine/entityEditor/transparencyEven', 'Even') },
                        ]}
                        defaultValue={mesh.wireframe.transparent}
                        onChange={option => setTransparent(parseInt(option.value || '0'))}
                    />
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
            </HContainer>
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
                <button
                    className='theia-button secondary full-width'
                    onClick={addSegment}
                    title={nls.localize('vuengine/entityEditor/addSegment', 'Add Segment')}
                >
                    <i className='fa fa-plus' />
                </button>
            </VContainer>
        </VContainer>
    </div>;
}
