import { URI, nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext, useEffect, useState } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import MultiSelect, { MultiSelectOption } from '../../Common/MultiSelect';
import RadioSelect from '../../Common/RadioSelect';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import { ColliderType, PixelRotation } from '../../Common/VUEngineTypes';
import {
    MAX_COLLIDER_LINEFIELD_LENGTH,
    MIN_COLLIDER_LINEFIELD_LENGTH,
    MAX_COLLIDER_LINEFIELD_THICKNESS,
    MIN_COLLIDER_LINEFIELD_THICKNESS,
    ColliderData,
    MAX_COLLIDER_DISPLACEMENT,
    MAX_COLLIDER_DISPLACEMENT_PARALLAX,
    MAX_COLLIDER_PIXEL_SIZE,
    MAX_COLLIDER_ROTATION,
    MAX_COLLIDER_SCALE,
    MIN_COLLIDER_DISPLACEMENT,
    MIN_COLLIDER_DISPLACEMENT_PARALLAX,
    MIN_COLLIDER_PIXEL_SIZE,
    MIN_COLLIDER_ROTATION,
    MIN_COLLIDER_SCALE,
    COLLIDER_ROTATION_RATIO,
} from '../EntityEditorTypes';

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
    const [rotationDegrees, setRotationDegrees] = useState<PixelRotation>({ x: 0, y: 0, z: 0 });

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

    const toDegrees = (engineRotation: number): number =>
        engineRotation * COLLIDER_ROTATION_RATIO;

    const toEngineRotation = (degrees: number): number =>
        Math.round(degrees / COLLIDER_ROTATION_RATIO);

    const setType = (type: ColliderType): void => {
        updateCollider({
            type,
        });
    };

    const setPixelSize = (a: 'x' | 'y' | 'z', value: number): void => {
        updateCollider({
            pixelSize: {
                ...collider.pixelSize,
                [a]: clamp(value, MIN_COLLIDER_PIXEL_SIZE, MAX_COLLIDER_PIXEL_SIZE),
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

    const setDisplacement = (a: 'x' | 'y' | 'z', value: number): void => {
        updateCollider({
            displacement: {
                ...collider.displacement,
                [a]: clamp(value, MIN_COLLIDER_DISPLACEMENT, MAX_COLLIDER_DISPLACEMENT),
            },
        });
    };

    const setDisplacementParallax = (value: number): void => {
        updateCollider({
            displacement: {
                ...collider.displacement,
                parallax: clamp(value, MIN_COLLIDER_DISPLACEMENT_PARALLAX, MAX_COLLIDER_DISPLACEMENT_PARALLAX),
            },
        });
    };

    const setRotation = (a: 'x' | 'y' | 'z', value: number): void => {
        const engineRotation = clamp(toEngineRotation(value), MIN_COLLIDER_ROTATION, MAX_COLLIDER_ROTATION);

        setRotationDegrees({
            ...rotationDegrees,
            [a]: toDegrees(engineRotation),
        });

        updateCollider({
            rotation: {
                ...collider.rotation,
                [a]: engineRotation,
            },
        });
    };

    const setScale = (a: 'x' | 'y' | 'z', value: number): void => {
        updateCollider({
            scale: {
                ...collider.scale,
                [a]: clamp(value, MIN_COLLIDER_SCALE, MAX_COLLIDER_SCALE),
            },
        });
    };

    const setBallScale = (value: number): void => {
        updateCollider({
            scale: {
                x: clamp(value, MIN_COLLIDER_SCALE, MAX_COLLIDER_SCALE),
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
        const cappedLength = clamp(l, MIN_COLLIDER_LINEFIELD_LENGTH, MAX_COLLIDER_LINEFIELD_LENGTH);
        const cappedThickness = clamp(t, MIN_COLLIDER_LINEFIELD_THICKNESS, MAX_COLLIDER_LINEFIELD_THICKNESS);

        updateCollider({
            pixelSize: {
                x: a === 0 ? cappedLength : 0,
                y: a === 1 ? cappedLength : 0,
                z: a === 2 ? cappedLength : 0,
            },
            scale: {
                x: a === 0 ? cappedThickness : 0,
                y: a === 1 ? cappedThickness : 0,
                z: a === 2 ? cappedThickness : 0,
            }
        });

        setAxis(a);
        setLength(cappedLength);
        setThickness(cappedThickness);
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

        setRotationDegrees({
            x: toDegrees(collider.rotation.x),
            y: toDegrees(collider.rotation.y),
            z: toDegrees(collider.rotation.z),
        });
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
                            style={{ width: 54 }}
                            type='number'
                            value={collider.pixelSize.x}
                            onChange={e => setPixelSize('x', parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
                            type='number'
                            value={collider.pixelSize.y}
                            onChange={e => setPixelSize('y', parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
                            type='number'
                            value={collider.pixelSize.z}
                            onChange={e => setPixelSize('z', parseFloat(e.target.value))}
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
                        style={{ width: 54 }}
                        type='number'
                        value={collider.pixelSize.x}
                        onChange={e => setDiameter(parseFloat(e.target.value))}
                    />
                </VContainer>
            }
            {collider.type === ColliderType.LineField &&
                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/colliderLength', 'Length')}
                        </label>
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
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
                            style={{ width: 54 }}
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
                        style={{ width: 54 }}
                        type='number'
                        min={MIN_COLLIDER_DISPLACEMENT}
                        max={MAX_COLLIDER_DISPLACEMENT}
                        value={collider.displacement.x}
                        onChange={e => setDisplacement('x', parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        min={MIN_COLLIDER_DISPLACEMENT}
                        max={MAX_COLLIDER_DISPLACEMENT}
                        value={collider.displacement.y}
                        onChange={e => setDisplacement('y', parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        min={MIN_COLLIDER_DISPLACEMENT}
                        max={MAX_COLLIDER_DISPLACEMENT}
                        value={collider.displacement.z}
                        onChange={e => setDisplacement('z', parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        min={MIN_COLLIDER_DISPLACEMENT_PARALLAX}
                        max={MAX_COLLIDER_DISPLACEMENT_PARALLAX}
                        value={collider.displacement.parallax}
                        onChange={e => setDisplacementParallax(parseFloat(e.target.value))}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/colliderRotation', 'Rotation (x, y, z)')}
                </label>
                <HContainer wrap='wrap'>
                    <HContainer gap={2}>
                        <input
                            className='theia-input'
                            style={{ width: 78 }}
                            type='number'
                            min={MIN_COLLIDER_ROTATION}
                            max={MAX_COLLIDER_ROTATION}
                            step={COLLIDER_ROTATION_RATIO}
                            value={rotationDegrees.x}
                            onChange={e => setRotation('x', parseFloat(e.target.value))}
                        />
                        °
                    </HContainer>
                    <HContainer gap={2}>
                        <input
                            className='theia-input'
                            style={{ width: 78 }}
                            type='number'
                            min={MIN_COLLIDER_ROTATION}
                            max={MAX_COLLIDER_ROTATION}
                            step={COLLIDER_ROTATION_RATIO}
                            value={rotationDegrees.y}
                            onChange={e => setRotation('y', parseFloat(e.target.value))}
                        />
                        °
                    </HContainer>
                    <HContainer gap={2}>
                        <input
                            className='theia-input'
                            style={{ width: 78 }}
                            type='number'
                            min={MIN_COLLIDER_ROTATION}
                            max={MAX_COLLIDER_ROTATION}
                            step={COLLIDER_ROTATION_RATIO}
                            value={rotationDegrees.z}
                            onChange={e => setRotation('z', parseFloat(e.target.value))}
                        />
                        °
                    </HContainer>
                </HContainer>
            </VContainer>
            {
                (collider.type === ColliderType.Box || collider.type === ColliderType.InverseBox) &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/colliderScale', 'Scale (x, y, z)')}
                    </label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
                            type='number'
                            min={MIN_COLLIDER_SCALE}
                            max={MAX_COLLIDER_SCALE}
                            step={0.5}
                            value={collider.scale.x}
                            onChange={e => setScale('x', parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
                            type='number'
                            min={MIN_COLLIDER_SCALE}
                            max={MAX_COLLIDER_SCALE}
                            step={0.5}
                            value={collider.scale.y}
                            onChange={e => setScale('y', parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
                            type='number'
                            min={MIN_COLLIDER_SCALE}
                            max={MAX_COLLIDER_SCALE}
                            step={0.1}
                            value={collider.scale.z}
                            onChange={e => setScale('z', parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
            }
            {
                collider.type === ColliderType.Ball &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/scale', 'Scale')}
                    </label>
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        min={MIN_COLLIDER_SCALE}
                        max={MAX_COLLIDER_SCALE}
                        value={collider.scale.x}
                        onChange={e => setBallScale(parseFloat(e.target.value))}
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
            {
                collider.checkForCollisions &&
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
        </VContainer >
    );
}
