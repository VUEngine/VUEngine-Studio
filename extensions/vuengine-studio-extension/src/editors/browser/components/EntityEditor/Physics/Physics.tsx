import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { nls } from '@theia/core';

export default function Physics(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const toggleEnabled = (): void => {
        setData({
            physics: {
                ...data.physics,
                enabled: !data.physics.enabled
            }
        });
    };

    const setMass = (mass: number): void => {
        setData({
            physics: {
                ...data.physics, mass
            }
        });
    };

    const setFriction = (friction: number): void => {
        setData({
            physics: {
                ...data.physics, friction
            }
        });
    };

    const setBounciness = (bounciness: number): void => {
        setData({
            physics: {
                ...data.physics, bounciness
            }
        });
    };

    const setMaximumSpeed = (maximumSpeed: number): void => {
        setData({
            physics: {
                ...data.physics, maximumSpeed
            }
        });
    };

    const setMaximumVelocityX = (x: number): void => {
        setData({
            physics: {
                ...data.physics,
                maximumVelocity: {
                    ...data.physics.maximumVelocity, x
                }
            }
        });
    };

    const setMaximumVelocityY = (y: number): void => {
        setData({
            physics: {
                ...data.physics,
                maximumVelocity: {
                    ...data.physics.maximumVelocity, y
                }
            }
        });
    };

    const setMaximumVelocityZ = (z: number): void => {
        setData({
            physics: {
                ...data.physics,
                maximumVelocity: {
                    ...data.physics.maximumVelocity, z
                }
            }
        });
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/enabled', 'Enabled')}
            </label>
            <input
                type="checkbox"
                checked={data.physics.enabled}
                onChange={e => toggleEnabled()}
            />
        </VContainer>
        {data.physics.enabled && <>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/mass', 'Mass')}
                </label>
                <input
                    className='theia-input'
                    type='number'
                    step="0.1"
                    value={data.physics.mass}
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
                    step="0.1"
                    value={data.physics.friction}
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
                    step="0.1"
                    value={data.physics.bounciness}
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
                    value={data.physics.maximumSpeed}
                    onChange={e => setMaximumSpeed(parseInt(e.target.value))}
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
                        value={data.physics.maximumVelocity.x}
                        onChange={e => setMaximumVelocityX(parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        type='number'
                        value={data.physics.maximumVelocity.y}
                        onChange={e => setMaximumVelocityY(parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        type='number'
                        value={data.physics.maximumVelocity.z}
                        onChange={e => setMaximumVelocityZ(parseInt(e.target.value))}
                        min={0}
                    />
                </HContainer>
            </VContainer>
        </>}
    </VContainer>;
}
