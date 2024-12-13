import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import { Axis } from '../../Common/VUEngineTypes';
import { INPUT_BLOCKING_COMMANDS } from '../EntityEditor';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function Physics(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

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

    const setGravityAxes = (gravityAxes: Axis[]): void => {
        setData({
            physics: {
                ...data.physics,
                gravityAxes,
            }
        });
    };

    const setRotationAxes = (rotationAxes: Axis[]): void => {
        setData({
            physics: {
                ...data.physics,
                rotationAxes,
            }
        });
    };

    return (
        <HContainer gap={15} wrap='wrap'>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/mass', 'Mass')}
                </label>
                <input
                    className='theia-input'
                    style={{ width: 54 }}
                    type='number'
                    step="0.1"
                    value={data.physics.mass}
                    onChange={e => setMass(parseFloat(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/friction', 'Friction')}
                </label>
                <input
                    className='theia-input'
                    style={{ width: 54 }}
                    type='number'
                    step="0.1"
                    value={data.physics.friction}
                    onChange={e => setFriction(parseFloat(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/bounciness', 'Bounciness')}
                </label>
                <input
                    className='theia-input'
                    style={{ width: 54 }}
                    type='number'
                    step="0.1"
                    value={data.physics.bounciness}
                    onChange={e => setBounciness(parseFloat(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/maximumVelocity', 'Maximum Velocity (x, y, z)')}
                </label>
                <HContainer>
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.physics.maximumVelocity.x}
                        min={0}
                        onChange={e => setMaximumVelocityX(parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.physics.maximumVelocity.y}
                        min={0}
                        onChange={e => setMaximumVelocityY(parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.physics.maximumVelocity.z}
                        min={0}
                        onChange={e => setMaximumVelocityZ(parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/maximumSpeed', 'Maximum Speed')}
                </label>
                <input
                    className='theia-input'
                    style={{ width: 54 }}
                    type='number'
                    value={data.physics.maximumSpeed}
                    onChange={e => setMaximumSpeed(parseInt(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/gravityAxes', 'Gravity Axes')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/gravityAxesDescription',
                        'Select the axes on which the entity should be subject to gravity.'
                    )}
                />
                <RadioSelect
                    options={[{
                        value: Axis.XAxis,
                        label: 'X',
                    }, {
                        value: Axis.XAxis,
                        label: 'Y',
                    }, {
                        value: Axis.XAxis,
                        label: 'Z',
                    }]}
                    defaultValue={data.physics.gravityAxes}
                    onChange={options => setGravityAxes(options.map(o => o.value) as Axis[])}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    canSelectMany
                    allowBlank
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/rotationAxes', 'Rotation Axes')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/rotationAxesDescription',
                        'Select the axes around which the entity\'s spatial rotation syncs with its body\'s direction, ' +
                        'which propagates to its sprites, colliders and wireframes. ' +
                        'Note that sprites need to use AFFINE mode to be able to be rotated.',
                    )}
                />
                <RadioSelect
                    options={[{
                        value: Axis.XAxis,
                        label: 'X',
                    }, {
                        value: Axis.YAxis,
                        label: 'Y',
                    }, {
                        value: Axis.ZAxis,
                        label: 'Z',
                    }]}
                    defaultValue={data.physics.rotationAxes}
                    onChange={options => setRotationAxes(options.map(o => o.value) as Axis[])}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    canSelectMany
                    allowBlank
                />
            </VContainer>
        </HContainer>
    );
}
