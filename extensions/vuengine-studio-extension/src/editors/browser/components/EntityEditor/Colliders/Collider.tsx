import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { ColliderData, ColliderType, EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';

interface ColliderProps {
    index: number
    collider: ColliderData
}

export default function Collider(props: ColliderProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, collider } = props;

    const removeCollider = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeCollider', 'Remove Collider'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveCollider', 'Are you sure you want to remove this Collider?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const colliders = { ...data.colliders };
            colliders.colliders = [
                ...data.colliders.colliders.slice(0, index),
                ...data.colliders.colliders.slice(index + 1)
            ];

            setData({ colliders });
        }
    };

    const getHeavyness = (): number => {
        let total = 0;

        switch (collider.type) {
            case ColliderType.Ball:
                total += 1;
                break;
            case ColliderType.LineField:
                total += 2;
                break;
            case ColliderType.Box:
            case ColliderType.InverseBox:
                total += 3;
                break;
        }

        if (collider.checkForCollisions) {
            total += 2;
        }

        return total;
    };

    const setCollider = (partialColliderData: Partial<ColliderData>): void => {
        const updatedCollidersArray = [...data.colliders.colliders];
        updatedCollidersArray[index] = {
            ...updatedCollidersArray[index],
            ...partialColliderData,
        };

        const colliders = { ...data.colliders };
        colliders.colliders = updatedCollidersArray;

        setData({ colliders });
    };

    const setType = (type: ColliderType): void => {
        setCollider({
            type,
        });
    };

    const setPixelSizeX = (x: number): void => {
        setCollider({
            pixelSize: {
                ...collider.pixelSize,
                x,
            },
        });
    };

    const setPixelSizeY = (y: number): void => {
        setCollider({
            pixelSize: {
                ...collider.pixelSize,
                y,
            },
        });
    };

    const setPixelSizeZ = (z: number): void => {
        setCollider({
            pixelSize: {
                ...collider.pixelSize,
                z,
            },
        });
    };

    const setDisplacementX = (x: number): void => {
        setCollider({
            displacement: {
                ...collider.displacement,
                x,
            },
        });
    };

    const setDisplacementY = (y: number): void => {
        setCollider({
            displacement: {
                ...collider.displacement,
                y,
            },
        });
    };

    const setDisplacementZ = (z: number): void => {
        setCollider({
            displacement: {
                ...collider.displacement,
                z,
            },
        });
    };

    const setDisplacementParallax = (parallax: number): void => {
        setCollider({
            displacement: {
                ...collider.displacement,
                parallax,
            },
        });
    };

    const setRotationX = (x: number): void => {
        setCollider({
            rotation: {
                ...collider.rotation,
                x,
            },
        });
    };

    const setRotationY = (y: number): void => {
        setCollider({
            rotation: {
                ...collider.rotation,
                y,
            },
        });
    };

    const setRotationZ = (z: number): void => {
        setCollider({
            rotation: {
                ...collider.rotation,
                z,
            },
        });
    };

    const setScaleX = (x: number): void => {
        setCollider({
            scale: {
                ...collider.scale,
                x,
            },
        });
    };

    const setScaleY = (y: number): void => {
        setCollider({
            scale: {
                ...collider.scale,
                y,
            },
        });
    };

    const setScaleZ = (z: number): void => {
        setCollider({
            scale: {
                ...collider.scale,
                z,
            },
        });
    };

    const toggleCheckForCollisions = (): void => {
        setCollider({
            checkForCollisions: !collider.checkForCollisions,
        });
    };

    const heavyness = getHeavyness();

    return <div className='item'>
        <button
            className="remove-button"
            onClick={removeCollider}
            title={nls.localize('vuengine/entityEditor/remove', 'Remove')}
        >
            <i className='codicon codicon-x' />
        </button>
        <VContainer gap={15}>
            <HContainer gap={15} grow={1} wrap='wrap'>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/type', 'Type')}
                    </label>
                    <SelectComponent
                        options={[{
                            value: ColliderType.Ball,
                            label: nls.localize('vuengine/entityEditor/colliderTypeBall', 'Ball'),
                        }, {
                            value: ColliderType.Box,
                            label: nls.localize('vuengine/entityEditor/colliderTypeBox', 'Box'),
                        }, {
                            value: ColliderType.InverseBox,
                            label: nls.localize('vuengine/entityEditor/colliderTypeInverseBox', 'InverseBox'),
                        }, {
                            value: ColliderType.LineField,
                            label: nls.localize('vuengine/entityEditor/colliderTypeLineField', 'LineField'),
                        }]}
                        defaultValue={collider.type}
                        onChange={option => setType(option.value as ColliderType)}
                    />
                </VContainer>
                <VContainer>
                    <label>Collision Layers</label>
                    <HContainer>
                        [To Be Implemented]
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>Heaviness</label>
                    <HContainer>
                        <input
                            className={`theia-input heavyness ${heavyness > 4 ? 'heavynessHeavy' : heavyness > 2 ? 'heavynessMedium' : 'heavynessLight'}`}
                            type='text'
                            value={`${heavyness} / 5`}
                            disabled
                        />
                    </HContainer>
                </VContainer>
            </HContainer>
            <HContainer gap={15} wrap='wrap'>
                <VContainer>
                    <label>Displacement (X, Y, Z, Parallax)</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.displacement.x}
                            onChange={e => setDisplacementX(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.displacement.y}
                            onChange={e => setDisplacementY(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.displacement.z}
                            onChange={e => setDisplacementZ(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.displacement.parallax}
                            onChange={e => setDisplacementParallax(parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>Size (X, Y, Z, Parallax)</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.pixelSize.x}
                            onChange={e => setPixelSizeX(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.pixelSize.y}
                            onChange={e => setPixelSizeY(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.pixelSize.z}
                            onChange={e => setPixelSizeZ(parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>Rotation (X, Y, Z, Parallax)</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.rotation.x}
                            onChange={e => setRotationX(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.rotation.y}
                            onChange={e => setRotationY(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.rotation.z}
                            onChange={e => setRotationZ(parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>Scale (X, Y, Z, Parallax)</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.scale.x}
                            onChange={e => setScaleX(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.scale.y}
                            onChange={e => setScaleY(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={collider.scale.z}
                            onChange={e => setScaleZ(parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
            </HContainer>
            <HContainer gap={15} wrap='wrap'>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/checkForCollisions', 'Check For Collisions')}
                    </label>
                    <input
                        type="checkbox"
                        checked={collider.checkForCollisions}
                        onChange={toggleCheckForCollisions}
                    />
                </VContainer>
                {collider.checkForCollisions && <VContainer>
                    <label>Collision Layers to check against</label>
                    <HContainer>
                        [To Be Implemented]
                    </HContainer>
                </VContainer>}
            </HContainer>
        </VContainer>
    </div>;
}
