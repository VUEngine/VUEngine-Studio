import { URI, nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext, useEffect, useState } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import MultiSelect, { MultiSelectOption } from '../../Common/Base/MultiSelect';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import Rotation from '../../Common/Rotation';
import { ColliderType, PixelVector } from '../../Common/VUEngineTypes';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditorTypes';
import {
    ColliderData,
    MAX_COLLIDER_DIAMETER,
    MAX_COLLIDER_DISPLACEMENT,
    MAX_COLLIDER_DISPLACEMENT_PARALLAX,
    MAX_COLLIDER_LINEFIELD_LENGTH,
    MAX_COLLIDER_LINEFIELD_THICKNESS,
    MAX_COLLIDER_PIXEL_SIZE,
    MAX_SCALE,
    MIN_COLLIDER_DIAMETER,
    MIN_COLLIDER_DISPLACEMENT,
    MIN_COLLIDER_DISPLACEMENT_PARALLAX,
    MIN_COLLIDER_LINEFIELD_LENGTH,
    MIN_COLLIDER_LINEFIELD_THICKNESS,
    MIN_COLLIDER_PIXEL_SIZE,
    MIN_SCALE
} from '../ActorEditorTypes';
import CollidersSettings from './CollidersSettings';

interface ColliderProps {
    collider: ColliderData
    updateCollider: (partialData: Partial<ColliderData>) => void
}

export default function Collider(props: ColliderProps): React.JSX.Element {
    const { services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
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

    const setPixelSize = (a: 'x' | 'y' | 'z', value: number): void => {
        updateCollider({
            pixelSize: {
                ...collider.pixelSize,
                [a]: value,
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
                [a]: value,
            },
        });
    };

    const setDisplacementParallax = (value: number): void => {
        updateCollider({
            displacement: {
                ...collider.displacement,
                parallax: value,
            },
        });
    };

    const setRotation = (rotation: PixelVector): void => {
        updateCollider({ rotation });
    };

    const setScale = (a: 'x' | 'y' | 'z', value: number): void => {
        updateCollider({
            scale: {
                ...collider.scale,
                [a]: value,
            },
        });
    };

    const setBallScale = (value: number): void => {
        updateCollider({
            scale: {
                x: value,
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
        let clayers: Record<string, string> = {};
        const cl = services.vesProjectService.getProjectDataItemsForType('ColliderLayers');
        if (cl) {
            Object.values(cl).map(c => {
                clayers = {
                    ...clayers,
                    // @ts-ignore
                    ...(c.layers ?? {})
                };
            });
        }

        // create options
        Object.entries(clayers)
            .sort(([, a], [, b]) => a.localeCompare(b))
            .map(([key, value]: string[]) => {
                options.push({
                    value: key,
                    label: value,
                });
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
        updateCollider({
            pixelSize: {
                x: a === 0 ? l : 0,
                y: a === 1 ? l : 0,
                z: a === 2 ? l : 0,
            },
            scale: {
                x: a === 0 ? t : 0,
                y: a === 1 ? t : 0,
                z: a === 2 ? t : 0,
            }
        });

        setAxis(a);
        setLength(l);
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
        <>
            <VContainer gap={15}>
                <HContainer alignItems='end' gap={15} wrap='wrap'>
                    <VContainer grow={1}>
                        <label>
                            {nls.localizeByDefault('Type')}
                        </label>
                        <SelectComponent
                            options={[{
                                value: ColliderType.Ball,
                                label: nls.localize('vuengine/editors/actor/colliderTypeBall', 'Ball'),
                            }, {
                                value: ColliderType.Box,
                                label: nls.localize('vuengine/editors/actor/colliderTypeBox', 'Box'),
                            }, {
                                value: ColliderType.InverseBox,
                                label: nls.localize('vuengine/editors/actor/colliderTypeInverseBox', 'InverseBox'),
                            }, {
                                value: ColliderType.LineField,
                                label: nls.localize('vuengine/editors/actor/colliderTypeLineField', 'LineField'),
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
                            title={nls.localize('vuengine/editors/actor/heaviness', 'Heaviness')}
                        />
                    </VContainer>
                </HContainer>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/editors/actor/colliderLayers', 'Collider Layers')}
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
                            title={nls.localize('vuengine/editors/actor/manageColliderLayers', 'Manage Collider Layers')}
                        >
                            <i className='codicon codicon-settings-gear' />
                        </button>
                    </HContainer>
                </VContainer>
                {(collider.type === ColliderType.Box || collider.type === ColliderType.InverseBox) &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/actor/colliderSize', 'Size (x, y, z)')}
                        </label>
                        <HContainer>
                            <Input
                                value={collider.pixelSize.x}
                                setValue={v => setPixelSize('x', v as number)}
                                type='number'
                                min={MIN_COLLIDER_PIXEL_SIZE}
                                max={MAX_COLLIDER_PIXEL_SIZE}
                                width={50}
                                commands={INPUT_BLOCKING_COMMANDS}
                            />
                            <Input
                                value={collider.pixelSize.y}
                                setValue={v => setPixelSize('y', v as number)}
                                type='number'
                                min={MIN_COLLIDER_PIXEL_SIZE}
                                max={MAX_COLLIDER_PIXEL_SIZE}
                                width={50}
                                commands={INPUT_BLOCKING_COMMANDS}
                            />
                            <Input
                                value={collider.pixelSize.z}
                                setValue={v => setPixelSize('z', v as number)}
                                type='number'
                                min={MIN_COLLIDER_PIXEL_SIZE}
                                max={MAX_COLLIDER_PIXEL_SIZE}
                                width={50}
                                commands={INPUT_BLOCKING_COMMANDS}
                            />
                        </HContainer>
                    </VContainer>
                }
                {collider.type === ColliderType.Ball &&
                    <Input
                        label={nls.localize('vuengine/editors/actor/diameter', 'Diameter')}
                        value={collider.pixelSize.x}
                        setValue={v => setDiameter(v as number)}
                        type='number'
                        min={MIN_COLLIDER_DIAMETER}
                        max={MAX_COLLIDER_DIAMETER}
                        width={50}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                }
                {collider.type === ColliderType.LineField &&
                    <HContainer gap={15} wrap='wrap'>
                        <Input
                            label={nls.localize('vuengine/editors/actor/length', 'Length')}
                            value={length}
                            setValue={v => updateLineField(axis, v as number, thickness)}
                            type='number'
                            min={MIN_COLLIDER_LINEFIELD_LENGTH}
                            max={MAX_COLLIDER_LINEFIELD_LENGTH}
                            width={50}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/editors/actor/colliderAxis', 'Axis')}
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
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                                allowBlank
                            />
                        </VContainer>
                        <Input
                            label={nls.localize('vuengine/editors/actor/thickness', 'Thickness')}
                            value={thickness}
                            setValue={v => updateLineField(axis, length, v as number)}
                            type='number'
                            min={MIN_COLLIDER_LINEFIELD_THICKNESS}
                            max={MAX_COLLIDER_LINEFIELD_THICKNESS}
                            width={50}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                    </HContainer>
                }
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/actor/colliderDisplacement', 'Displacement (x, y, z, parallax)')}
                    </label>
                    <HContainer>
                        <Input
                            value={collider.displacement.x}
                            setValue={v => setDisplacement('x', v as number)}
                            type='number'
                            min={MIN_COLLIDER_DISPLACEMENT}
                            max={MAX_COLLIDER_DISPLACEMENT}
                            width={50}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                        <Input
                            value={collider.displacement.y}
                            setValue={v => setDisplacement('y', v as number)}
                            type='number'
                            min={MIN_COLLIDER_DISPLACEMENT}
                            max={MAX_COLLIDER_DISPLACEMENT}
                            width={50}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                        <Input
                            value={collider.displacement.z}
                            setValue={v => setDisplacement('z', v as number)}
                            type='number'
                            min={MIN_COLLIDER_DISPLACEMENT}
                            max={MAX_COLLIDER_DISPLACEMENT}
                            width={50}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                        <Input
                            value={collider.displacement.parallax}
                            setValue={v => setDisplacementParallax(v as number)}
                            type='number'
                            min={MIN_COLLIDER_DISPLACEMENT_PARALLAX}
                            max={MAX_COLLIDER_DISPLACEMENT_PARALLAX}
                            width={50}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                    </HContainer>
                </VContainer>
                <Rotation
                    rotation={collider.rotation}
                    updateRotation={setRotation}
                />
                {
                    (collider.type === ColliderType.Box || collider.type === ColliderType.InverseBox) &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/actor/scale', 'Scale (x, y, z)')}
                        </label>
                        <HContainer>
                            <Input
                                value={collider.scale.x}
                                setValue={v => setScale('x', v as number)}
                                type='number'
                                min={MIN_SCALE}
                                max={MAX_SCALE}
                                step={0.5}
                                width={50}
                                commands={INPUT_BLOCKING_COMMANDS}
                            />
                            <Input
                                value={collider.scale.y}
                                setValue={v => setScale('y', v as number)}
                                type='number'
                                min={MIN_SCALE}
                                max={MAX_SCALE}
                                step={0.5}
                                width={50}
                                commands={INPUT_BLOCKING_COMMANDS}
                            />
                            <Input
                                value={collider.scale.z}
                                setValue={v => setScale('z', v as number)}
                                type='number'
                                min={MIN_SCALE}
                                max={MAX_SCALE}
                                step={0.5}
                                width={50}
                                commands={INPUT_BLOCKING_COMMANDS}
                            />
                        </HContainer>
                    </VContainer>
                }
                {
                    collider.type === ColliderType.Ball &&
                    <Input
                        label={nls.localize('vuengine/editors/actor/scale', 'Scale')}
                        value={collider.scale.x}
                        setValue={v => setBallScale(v as number)}
                        type='number'
                        min={MIN_SCALE}
                        max={MAX_SCALE}
                        step={0.5}
                        width={50}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                }
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/actor/checkForCollisions', 'Check For Collisions')}
                    </label>
                    <input
                        type="checkbox"
                        checked={collider.checkForCollisions}
                        onChange={toggleCheckForCollisions}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
                {
                    collider.checkForCollisions &&
                    <VContainer grow={1}>
                        <label>
                            {nls.localize('vuengine/editors/actor/colliderLayersToCheckAgainst', 'Collider Layers to check against')}
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
                                    menuPlacement='top'
                                // onCreateOption={options => console.log(options)}
                                />
                            </VContainer>
                            <button
                                className='theia-button secondary'
                                onClick={openEditor}
                                title={nls.localize('vuengine/editors/actor/manageColliderLayers', 'Manage Collider Layers')}
                            >
                                <i className='codicon codicon-settings-gear' />
                            </button>
                        </HContainer>
                    </VContainer>
                }
            </VContainer >
            <hr />
            <CollidersSettings />
        </>
    );
}
