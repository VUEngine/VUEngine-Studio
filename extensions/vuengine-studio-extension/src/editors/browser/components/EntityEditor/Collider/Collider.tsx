import { URI, nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import MultiSelect, { MultiSelectOption } from '../../Common/MultiSelect';
import VContainer from '../../Common/VContainer';
import { ColliderData, ColliderType } from '../EntityEditorTypes';

interface ColliderProps {
    collider: ColliderData
    updateCollider: (partialData: Partial<ColliderData>) => void
    removeCollider: () => void
}

export default function Collider(props: ColliderProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { collider, updateCollider, removeCollider } = props;

    let colliderLayersFileUri: URI | undefined;
    const colliderLayers = services.vesProjectService.getProjectDataItemsForType('ColliderLayers');
    if (colliderLayers) {
        colliderLayersFileUri = colliderLayers[ProjectContributor.Project]?._fileUri;
    }

    const getHeaviness = (): number => {
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

    const setType = (type: ColliderType): void => {
        updateCollider({
            type,
        });
    };

    const setPixelSizeX = (x: number): void => {
        updateCollider({
            pixelSize: {
                ...collider.pixelSize,
                x,
            },
        });
    };

    const setPixelSizeY = (y: number): void => {
        updateCollider({
            pixelSize: {
                ...collider.pixelSize,
                y,
            },
        });
    };

    const setPixelSizeZ = (z: number): void => {
        updateCollider({
            pixelSize: {
                ...collider.pixelSize,
                z,
            },
        });
    };

    const setDisplacementX = (x: number): void => {
        updateCollider({
            displacement: {
                ...collider.displacement,
                x,
            },
        });
    };

    const setDisplacementY = (y: number): void => {
        updateCollider({
            displacement: {
                ...collider.displacement,
                y,
            },
        });
    };

    const setDisplacementZ = (z: number): void => {
        updateCollider({
            displacement: {
                ...collider.displacement,
                z,
            },
        });
    };

    const setDisplacementParallax = (parallax: number): void => {
        updateCollider({
            displacement: {
                ...collider.displacement,
                parallax,
            },
        });
    };

    const setRotationX = (x: number): void => {
        updateCollider({
            rotation: {
                ...collider.rotation,
                x,
            },
        });
    };

    const setRotationY = (y: number): void => {
        updateCollider({
            rotation: {
                ...collider.rotation,
                y,
            },
        });
    };

    const setRotationZ = (z: number): void => {
        updateCollider({
            rotation: {
                ...collider.rotation,
                z,
            },
        });
    };

    const setScaleX = (x: number): void => {
        updateCollider({
            scale: {
                ...collider.scale,
                x,
            },
        });
    };

    const setScaleY = (y: number): void => {
        updateCollider({
            scale: {
                ...collider.scale,
                y,
            },
        });
    };

    const setScaleZ = (z: number): void => {
        updateCollider({
            scale: {
                ...collider.scale,
                z,
            },
        });
    };

    const toggleCheckForCollisions = (): void => {
        updateCollider({
            checkForCollisions: !collider.checkForCollisions,
        });
    };

    const getColliderLayerOptions = (): MultiSelectOption[] => {
        const options: MultiSelectOption[] = [];

        // get all colliders from all contributors
        let clayers: string[] = [];
        const cl = services.vesProjectService.getProjectDataItemsForType('ColliderLayers');
        if (cl) {
            Object.values(cl).map(c => {
                clayers = clayers.concat(
                    // @ts-ignore
                    c.layers
                );
            });
        }

        // create options
        clayers.filter((value, i, self) => self.indexOf(value) === i).sort().map(l => {
            const o = { value: l, label: l };
            options.push(o);
        });

        return options;
    };
    const colliderLayerOptions = getColliderLayerOptions();

    const setColliderLayers = (layers: string[]): void => {
        updateCollider({ layers });
    };

    const setColliderLayersToCheck = (layersToCheck: string[]): void => {
        updateCollider({ layersToCheck });
    };

    const openEditor = async (): Promise<void> => {
        if (!colliderLayersFileUri) {
            const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
            colliderLayersFileUri = workspaceRootUri.resolve('config').resolve('ColliderLayers');
            await services.fileService.createFile(colliderLayersFileUri);
        }

        const opener = await services.openerService.getOpener(colliderLayersFileUri);
        await opener.open(colliderLayersFileUri);
    };

    const heaviness = getHeaviness();

    return <div className='item'>
        <button
            className="remove-button"
            onClick={removeCollider}
            title={nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component')}
        >
            <i className='codicon codicon-x' />
        </button>
        <HContainer gap={20}>
            {/*
            <VContainer>
                <div className='filePreviewImage'>
                    {collider.type === ColliderType.Ball &&
                        <div
                            className='colliderPreviewBall'
                            style={{
                                borderRadius: '100%',
                                height: collider.pixelSize.y,
                                width: collider.pixelSize.x,
                                bottom: collider.displacement.y < 0 ? -collider.displacement.y : 0,
                                left: collider.displacement.x > 0 ? collider.displacement.x : 0,
                                right: collider.displacement.x < 0 ? -collider.displacement.x : 0,
                                top: collider.displacement.y > 0 ? collider.displacement.y : 0,
                                transform: `rotateX(${collider.rotation.x}deg)
                                    rotateY(${collider.rotation.y}deg)
                                    rotateZ(${collider.rotation.z}deg)
                                    scale3d(${collider.scale.x}, ${collider.scale.y}, ${collider.scale.z})`
                            }}
                        />
                    }

                    <i className='codicon codicon-circle' style={{
                        position: 'absolute',
                        opacity: .3
                    }} />
                </div>
            </VContainer>
            */}
            <VContainer gap={15}>
                <HContainer alignItems='end' gap={15} wrap='wrap'>
                    <VContainer>
                        <input
                            className={`theia-input heaviness ${heaviness > 4 ? 'heavinessHeavy' : heaviness > 2 ? 'heavinessMedium' : 'heavinessLight'}`}
                            type='text'
                            value={`${heaviness} / 5`}
                            disabled
                            title={nls.localize('vuengine/entityEditor/heaviness', 'Heaviness')}
                        />
                    </VContainer>
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
                    <VContainer grow={1}>
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderLayers', 'Collider Layers')}
                            {collider.layers.length > 0 &&
                                <>
                                    {' '}<span className='count'>{collider.layers.length}</span>
                                </>
                            }
                        </label>
                        <HContainer>
                            <VContainer grow={1}>
                                <MultiSelect
                                    defaultValue={collider.layers}
                                    onChange={options => setColliderLayers(options)}
                                    options={colliderLayerOptions}
                                // onCreateOption={options => console.log(options)}
                                />
                            </VContainer>
                            <button
                                className='theia-button secondary'
                                onClick={openEditor}
                                title={nls.localize('vuengine/entityEditor/manageColliderLayers', 'Manage Collider Layers')}
                            >
                                <i className='codicon codicon-settings-gear' />
                            </button>
                        </HContainer>
                    </VContainer>
                </HContainer>
                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderDisplacement', 'Displacement (x, y, z, parallax)')}
                        </label>
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
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderSize', 'Size (x, y, z)')}
                        </label>
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
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderRotation', 'Rotation (x, y, z)')}
                        </label>
                        <HContainer>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={-360}
                                max={360}
                                step={0.5}
                                value={collider.rotation.x}
                                onChange={e => setRotationX(parseFloat(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={-360}
                                max={360}
                                step={0.5}
                                value={collider.rotation.y}
                                onChange={e => setRotationY(parseFloat(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={-360}
                                max={360}
                                step={0.5}
                                value={collider.rotation.z}
                                onChange={e => setRotationZ(parseFloat(e.target.value))}
                            />
                        </HContainer>
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderScale', 'Scale (x, y, z)')}
                        </label>
                        <HContainer>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={0}
                                max={64}
                                step={0.5}
                                value={collider.scale.x}
                                onChange={e => setScaleX(parseFloat(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={0}
                                max={64}
                                step={0.5}
                                value={collider.scale.y}
                                onChange={e => setScaleY(parseFloat(e.target.value))}
                            />
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                type='number'
                                min={0}
                                max={64}
                                step={0.5}
                                value={collider.scale.z}
                                onChange={e => setScaleZ(parseFloat(e.target.value))}
                            />
                        </HContainer>
                    </VContainer>
                </HContainer>
                <HContainer alignItems='start' gap={15} wrap='wrap'>
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
                    {collider.checkForCollisions && <VContainer grow={1}>
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderLayersToCheckAgainst', 'Collider Layers to check against')}
                            {collider.layersToCheck.length > 0 &&
                                <>
                                    {' '}<span className='count'>{collider.layersToCheck.length}</span>
                                </>
                            }
                        </label>
                        <HContainer>
                            <VContainer grow={1}>
                                <MultiSelect
                                    defaultValue={collider.layersToCheck}
                                    onChange={options => setColliderLayersToCheck(options)}
                                    options={colliderLayerOptions}
                                // onCreateOption={options => console.log(options)}
                                />
                            </VContainer>
                            <button
                                className='theia-button secondary'
                                onClick={openEditor}
                                title={nls.localize('vuengine/entityEditor/manageColliderLayers', 'Manage Collider Layers')}
                            >
                                <i className='codicon codicon-settings-gear' />
                            </button>
                        </HContainer>
                    </VContainer>}
                </HContainer>
            </VContainer>
        </HContainer>
    </div>;
}
