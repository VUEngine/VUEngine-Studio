import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../HContainer';
import VContainer from '../VContainer';
import { PositionedEntityData } from '../../EntityEditor/EntityEditorTypes';

interface PositionedEntityProps {
    positionedEntity: PositionedEntityData
    updatePositionedEntity: (partialPositionedEntity: Partial<PositionedEntityData>) => void
    removePositionedEntity: () => void
}

export default function PositionedEntity(props: PositionedEntityProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { positionedEntity, updatePositionedEntity, removePositionedEntity } = props;

    const entityItem = services.vesProjectService.getProjectDataItemById(positionedEntity.itemId, 'Entity');

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
            position: {
                ...positionedEntity.position,
                x,
            },
        });
    };

    const setPositionY = (y: number): void => {
        updatePositionedEntity({
            position: {
                ...positionedEntity.position,
                y,
            },
        });
    };

    const setPositionZ = (z: number): void => {
        updatePositionedEntity({
            position: {
                ...positionedEntity.position,
                z,
            },
        });
    };

    const setPositionParallax = (parallax: number): void => {
        updatePositionedEntity({
            position: {
                ...positionedEntity.position,
                parallax,
            },
        });
    };

    const toggleLoadRegardlessOfPosition = (): void => {
        updatePositionedEntity({
            loadRegardlessOfPosition: !positionedEntity.loadRegardlessOfPosition,
        });
    };

    return <div className='item'>
        <button
            className="remove-button"
            onClick={removePositionedEntity}
            title={nls.localize('vuengine/editors/remove', 'Remove')}
        >
            <i className='codicon codicon-x' />
        </button>
        <HContainer gap={15} wrap='wrap'>
            {entityItem ? <>
                <VContainer>
                    <label>Entity</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            // @ts-ignore
                            value={entityItem.name}
                            disabled
                        />
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>Position (x, y, z, parallax)</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.position.x}
                            onChange={e => setPositionX(parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.position.y}
                            onChange={e => setPositionY(parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.position.z}
                            onChange={e => setPositionZ(parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedEntity.position.parallax}
                            onChange={e => setPositionParallax(parseInt(e.target.value))}
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
    </div>;
}
