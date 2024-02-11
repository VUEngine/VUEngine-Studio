import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { WithFileUri } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { EntityData, PositionedEntityData } from '../../EntityEditor/EntityEditorTypes';
import HContainer from '../HContainer';
import VContainer from '../VContainer';

interface PositionedEntityProps {
    positionedEntity: PositionedEntityData
    updatePositionedEntity: (partialPositionedEntity: Partial<PositionedEntityData>) => void
}

export default function PositionedEntity(props: PositionedEntityProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { positionedEntity, updatePositionedEntity } = props;

    const entityItem = services.vesProjectService.getProjectDataItemById(positionedEntity.itemId, 'Entity') as EntityData & WithFileUri;

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

    const setPositionX = (x: number): void => {
        updatePositionedEntity({
            onScreenPosition: {
                ...positionedEntity.onScreenPosition,
                x,
            },
        });
    };

    const setPositionY = (y: number): void => {
        updatePositionedEntity({
            onScreenPosition: {
                ...positionedEntity.onScreenPosition,
                y,
            },
        });
    };

    const setPositionZ = (z: number): void => {
        updatePositionedEntity({
            onScreenPosition: {
                ...positionedEntity.onScreenPosition,
                z,
            },
        });
    };

    const setPositionZDisplacement = (zDisplacement: number): void => {
        updatePositionedEntity({
            onScreenPosition: {
                ...positionedEntity.onScreenPosition,
                zDisplacement,
            },
        });
    };

    const toggleLoadRegardlessOfPosition = (): void => {
        updatePositionedEntity({
            loadRegardlessOfPosition: !positionedEntity.loadRegardlessOfPosition,
        });
    };

    const openEditor = async (): Promise<void> => {
        console.log(entityItem);

        if (entityItem && entityItem._fileUri) {
            const opener = await services.openerService.getOpener(entityItem._fileUri);
            await opener.open(entityItem._fileUri);
        }
    };

    return (
        <HContainer gap={15} wrap='wrap'>
            {entityItem ? <>
                <HContainer alignItems='end'>
                    <VContainer>
                        <label>Entity</label>
                        <input
                            className='theia-input'
                            // @ts-ignore
                            value={entityItem.name}
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
                    <label>Position (x, y, z, z displacement)</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.onScreenPosition.x}
                            onChange={e => setPositionX(parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.onScreenPosition.y}
                            onChange={e => setPositionY(parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.onScreenPosition.z}
                            onChange={e => setPositionZ(parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.onScreenPosition.zDisplacement}
                            onChange={e => setPositionZDisplacement(parseInt(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
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
            </>
                : <VContainer className='error'>
                    {nls.localize('vuengine/editors/entityNotFound', 'Entity could not be found')}
                </VContainer>}
        </HContainer>
    );
}
