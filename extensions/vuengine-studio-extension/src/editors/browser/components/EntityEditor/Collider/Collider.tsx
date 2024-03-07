import { URI, nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext, useEffect, useState } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import MultiSelect, { MultiSelectOption } from '../../Common/MultiSelect';
import VContainer from '../../Common/VContainer';
import { COLLIDER_LINEFIELD_LENGTH_MAX, COLLIDER_LINEFIELD_LENGTH_MIN, ColliderData } from '../EntityEditorTypes';
import { ColliderType } from '../../Common/VUEngineTypes';
import RadioSelect from '../../Common/RadioSelect';

interface ColliderProps {
    collider: ColliderData
    updateCollider: (partialData: Partial<ColliderData>) => void
}

export default function Collider(props: ColliderProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { collider, updateCollider } = props;
    const [length, setLength] = useState<number>(0);
    const [axis, setAxis] = useState<number>(0);
    const [thickness, setThickness] = useState<number>(0);

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

    const setDiameter = (diameter: number): void => {
        updateCollider({
            pixelSize: {
                x: diameter,
                y: 0,
                z: 0,
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

    const setScale = (scale: number): void => {
        updateCollider({
            scale: {
                x: scale,
                y: 0,
                z: 0,
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

    const updateLineField = (a: number, l: number, t: number): void => {
        const cappedLength = Math.min(Math.max(l, COLLIDER_LINEFIELD_LENGTH_MIN), COLLIDER_LINEFIELD_LENGTH_MAX);

        updateCollider({
            pixelSize: {
                x: a === 0 ? cappedLength : 0,
                y: a === 1 ? cappedLength : 0,
                z: a === 2 ? cappedLength : 0,
            },
            scale: {
                x: a === 0 ? t : 0,
                y: a === 1 ? t : 0,
                z: a === 2 ? t : 0,
            }
        });

        setAxis(a);
        setLength(cappedLength);
        setThickness(t);
    };

    useEffect(() => {
        if (collider.pixelSize.x > 0) {
            setLength(collider.pixelSize.x);
            setThickness(collider.scale.x);
            setAxis(0);
        } else if (collider.pixelSize.y > 0) {
            setLength(collider.pixelSize.y);
            setThickness(collider.scale.y);
            setAxis(1);
        } else if (collider.pixelSize.z > 0) {
            setLength(collider.pixelSize.z);
            setThickness(collider.scale.z);
            setAxis(2);
        }
    }, []);

    return (
        <VContainer gap={15}>
            <HContainer alignItems='end' gap={15} wrap='wrap'>
                <VContainer grow={1}>
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
                    <input
                        className={`theia-input heaviness ${heaviness > 4 ? 'heavinessHeavy' : heaviness > 2 ? 'heavinessMedium' : 'heavinessLight'}`}
                        type='text'
                        value={`${heaviness} / 5`}
                        disabled
                        title={nls.localize('vuengine/entityEditor/heaviness', 'Heaviness')}
                    />
                </VContainer>
            </HContainer>
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
            {(collider.type === ColliderType.Box || collider.type === ColliderType.InverseBox) &&
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
            }
            {collider.type === ColliderType.Ball &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/diameter', 'Diameter')}
                    </label>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={collider.pixelSize.x}
                        onChange={e => setDiameter(parseFloat(e.target.value))}
                    />
                </VContainer>
            }
            {collider.type === ColliderType.LineField &&
                <HContainer gap={15}>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderLength', 'Length')}
                        </label>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            max={512}
                            min={0}
                            value={length}
                            onChange={e => updateLineField(axis, parseFloat(e.target.value), thickness)}
                        />
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderAxis', 'Axis')}
                        </label>
                        <RadioSelect
                            options={[{
                                label: 'X',
                                value: 0,
                            }, {
                                label: 'Y',
                                value: 1,
                            }, {
                                label: 'Z',
                                value: 2,
                            }]}
                            defaultValue={axis}
                            onChange={options => updateLineField(options[0].value as number, length, thickness)}
                            allowBlank
                        />
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/thickness', 'Thickness')}
                        </label>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={thickness}
                            onChange={e => updateLineField(axis, length, parseFloat(e.target.value))}
                        />
                    </VContainer>
                </HContainer>
            }
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
            {(collider.type === ColliderType.Box || collider.type === ColliderType.InverseBox) &&
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
                            step={0.1}
                            value={collider.scale.z}
                            onChange={e => setScaleZ(parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
            }
            {collider.type === ColliderType.Ball &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/scale', 'Scale')}
                    </label>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={collider.scale.x}
                        onChange={e => setScale(parseFloat(e.target.value))}
                    />
                </VContainer>
            }
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
            {collider.checkForCollisions &&
                <VContainer grow={1}>
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
                </VContainer>
            }
        </VContainer>
    );
}
