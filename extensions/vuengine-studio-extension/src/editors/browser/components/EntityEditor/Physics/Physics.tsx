import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { nls } from '@theia/core';

export default function Physics(): JSX.Element {
    const { entityData, setEntityData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const toggleEnabled = (): void => {
        setEntityData({ physics: {
            ...entityData.physics,
            enabled: !entityData.physics.enabled
        } });
    };

    const setMass = (mass: number): void => {
        setEntityData({ physics: {
            ...entityData.physics, mass
        } });
    };

    const setFriction = (friction: number): void => {
        setEntityData({ physics: {
            ...entityData.physics, friction
        } });
    };

    const setBounciness = (bounciness: number): void => {
        setEntityData({ physics: {
            ...entityData.physics, bounciness
        } });
    };

    const setMaximumSpeed = (maximumSpeed: number): void => {
        setEntityData({ physics: {
            ...entityData.physics, maximumSpeed
        } });
    };

    const setMaximumVelocityX = (x: number): void => {
        setEntityData({ physics: {
            ...entityData.physics,
            maximumVelocity: {
                ...entityData.physics.maximumVelocity, x
            }
        }});
    };

    const setMaximumVelocityY = (y: number): void => {
        setEntityData({ physics: {
            ...entityData.physics,
            maximumVelocity: {
                ...entityData.physics.maximumVelocity, y
            }
        }});
    };

    const setMaximumVelocityZ = (z: number): void => {
        setEntityData({ physics: {
            ...entityData.physics,
            maximumVelocity: {
                ...entityData.physics.maximumVelocity, z
            }
        }});
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/enabled', 'Enabled')}
            </label>
            <input
                type="checkbox"
                checked={entityData.physics.enabled}
                onChange={e => toggleEnabled()}
            />
        </VContainer>
        {entityData.physics.enabled && <>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/mass', 'Mass')}
                </label>
                <input
                    className='theia-input'
                    type='number'
                    value={entityData.physics.mass}
                    onChange={e => setMass(parseFloat(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/friction', 'Friction')}
                </label>
                <input
                    className='theia-input'
                    type='number'
                    value={entityData.physics.friction}
                    onChange={e => setFriction(parseFloat(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/bounciness', 'Bounciness')}
                </label>
                <input
                    className='theia-input'
                    type='number'
                    value={entityData.physics.bounciness}
                    onChange={e => setBounciness(parseFloat(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/maximumSpeed', 'Maximum Speed')}
                </label>
                <input
                    className='theia-input'
                    type='number'
                    value={entityData.physics.maximumSpeed}
                    onChange={e => setMaximumSpeed(parseFloat(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/maximumVelocity', 'Maximum Velocity (X, Y, Z)')}
                </label>
                <HContainer gap={10}>
                    <input
                        className='theia-input'
                        type='number'
                        value={entityData.pixelSize.x}
                        onChange={e => setMaximumVelocityX(parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        type='number'
                        value={entityData.pixelSize.y}
                        onChange={e => setMaximumVelocityY(parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        type='number'
                        value={entityData.pixelSize.z}
                        onChange={e => setMaximumVelocityZ(parseInt(e.target.value))}
                        min={0}
                    />
                </HContainer>
            </VContainer>
        </>}
    </VContainer>;
}
