import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { WithContributor, WithFileUri } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { EntityData, MAX_SCALE, MIN_SCALE, PositionedEntityData } from '../../EntityEditor/EntityEditorTypes';
import HContainer from '../HContainer';
import Rotation from '../Rotation';
import { clamp } from '../Utils';
import VContainer from '../VContainer';
import { PixelVector } from '../VUEngineTypes';

interface PositionedEntityProps {
    positionedEntity: PositionedEntityData
    updatePositionedEntity: (partialPositionedEntity: Partial<PositionedEntityData>) => void
}

export default function PositionedEntity(props: PositionedEntityProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { positionedEntity, updatePositionedEntity } = props;

    const entityItem = services.vesProjectService.getProjectDataItemById(positionedEntity.itemId, 'Entity') as EntityData & WithFileUri & WithContributor;

    const setName = (name: string): void => {
        updatePositionedEntity({
            name,
        });
    };

    const setExtraInfo = (extraInfo: string): void => {
        updatePositionedEntity({
            extraInfo,
        });
    };

    const setPosition = (a: 'x' | 'y' | 'z', value: number): void => {
        updatePositionedEntity({
            onScreenPosition: {
                ...positionedEntity.onScreenPosition,
                [a]: clamp(value, -256, 256),
            },
        });
    };

    const setRotation = (rotation: PixelVector): void => {
        updatePositionedEntity({
            onScreenRotation: rotation,
        });
    };

    const setScale = (a: 'x' | 'y' | 'z', value: number): void => {
        updatePositionedEntity({
            onScreenScale: {
                ...positionedEntity.onScreenScale,
                [a]: clamp(value, MIN_SCALE, MAX_SCALE),
            },
        });
    };

    const toggleLoadRegardlessOfPosition = (): void => {
        updatePositionedEntity({
            loadRegardlessOfPosition: !positionedEntity.loadRegardlessOfPosition,
        });
    };

    const openEditor = async (): Promise<void> => {
        if (entityItem && entityItem._fileUri) {
            const opener = await services.openerService.getOpener(entityItem._fileUri);
            await opener.open(entityItem._fileUri);
        }
    };

    return (
        <VContainer gap={15}>
            {entityItem ? <>
                <HContainer alignItems='end' grow={1}>
                    <VContainer grow={1}>
                        <label>Entity</label>
                        <input
                            className='theia-input'
                            value={entityItem._fileUri.path.name}
                            title={entityItem._contributorUri.parent.path.relative(entityItem._fileUri.path)?.fsPath()}
                            disabled
                        />
                    </VContainer>
                    <button
                        className='theia-button secondary'
                        onClick={openEditor}
                        title={nls.localize('vuengine/entityEditor/editEntity', 'Edit Entity')}
                    >
                        <i className='codicon codicon-edit' />
                    </button>
                </HContainer>
                <VContainer>
                    <label>Position (x, y, z)</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.onScreenPosition.x}
                            onChange={e => setPosition('x', parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.onScreenPosition.y}
                            onChange={e => setPosition('y', parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.onScreenPosition.z}
                            onChange={e => setPosition('z', parseInt(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
                <Rotation
                    rotation={positionedEntity.onScreenRotation}
                    updateRotation={setRotation}
                />
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/scale', 'Scale (x, y, z)')}
                    </label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
                            type='number'
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.5}
                            value={positionedEntity.onScreenScale?.x ?? 0}
                            onChange={e => setScale('x', parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
                            type='number'
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.5}
                            value={positionedEntity.onScreenScale?.y ?? 0}
                            onChange={e => setScale('y', parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 54 }}
                            type='number'
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.1}
                            value={positionedEntity.onScreenScale?.z ?? 0}
                            onChange={e => setScale('z', parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>

                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <label>Name</label>
                        <HContainer>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                value={positionedEntity.name}
                                onChange={e => setName(e.target.value)}
                            />
                        </HContainer>
                    </VContainer>
                    <VContainer>
                        <label>Extra Info</label>
                        <HContainer>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                value={positionedEntity.extraInfo}
                                onChange={e => setExtraInfo(e.target.value)}
                            />
                        </HContainer>
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/loadRegardlessOfPosition', 'Always load')}
                        </label>
                        <input
                            type="checkbox"
                            checked={positionedEntity.loadRegardlessOfPosition}
                            onChange={toggleLoadRegardlessOfPosition}
                        />
                    </VContainer>
                </HContainer>
            </>
                : <VContainer className='error'>
                    {nls.localize('vuengine/editors/entityNotFound', 'Entity could not be found')}
                </VContainer>}
        </VContainer>
    );
}
