import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import { Axis } from '../../Common/VUEngineTypes';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor';
import { ActorEditorContext, ActorEditorContextType } from '../ActorEditorTypes';

export default function Body(): React.JSX.Element {
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const setMass = (mass: number): void => {
        setData({
            body: {
                ...data.body, mass
            }
        });
    };

    const setFriction = (friction: number): void => {
        setData({
            body: {
                ...data.body, friction
            }
        });
    };

    const setBounciness = (bounciness: number): void => {
        setData({
            body: {
                ...data.body, bounciness
            }
        });
    };

    const setMaximumSpeed = (maximumSpeed: number): void => {
        setData({
            body: {
                ...data.body, maximumSpeed
            }
        });
    };

    const setMaximumVelocityX = (x: number): void => {
        setData({
            body: {
                ...data.body,
                maximumVelocity: {
                    ...data.body.maximumVelocity, x
                }
            }
        });
    };

    const setMaximumVelocityY = (y: number): void => {
        setData({
            body: {
                ...data.body,
                maximumVelocity: {
                    ...data.body.maximumVelocity, y
                }
            }
        });
    };

    const setMaximumVelocityZ = (z: number): void => {
        setData({
            body: {
                ...data.body,
                maximumVelocity: {
                    ...data.body.maximumVelocity, z
                }
            }
        });
    };

    const setGravityAxes = (gravityAxes: Axis[]): void => {
        setData({
            body: {
                ...data.body,
                gravityAxes,
            }
        });
    };

    const setRotationAxes = (rotationAxes: Axis[]): void => {
        setData({
            body: {
                ...data.body,
                rotationAxes,
            }
        });
    };

    return (
        <HContainer gap={15} wrap='wrap'>
            <VContainer>
                <label>
                    {nls.localize('vuengine/actorEditor/mass', 'Mass')}
                </label>
                <input
                    className='theia-input'
                    style={{ width: 54 }}
                    type='number'
                    step="0.1"
                    value={data.body.mass}
                    onChange={e => setMass(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/actorEditor/friction', 'Friction')}
                </label>
                <input
                    className='theia-input'
                    style={{ width: 54 }}
                    type='number'
                    step="0.1"
                    value={data.body.friction}
                    onChange={e => setFriction(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/actorEditor/bounciness', 'Bounciness')}
                </label>
                <input
                    className='theia-input'
                    style={{ width: 54 }}
                    type='number'
                    step="0.1"
                    value={data.body.bounciness}
                    onChange={e => setBounciness(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/actorEditor/maximumVelocity', 'Maximum Velocity (x, y, z)')}
                </label>
                <HContainer>
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.body.maximumVelocity.x}
                        min={0}
                        onChange={e => setMaximumVelocityX(e.target.value === '' ? 0 : parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.body.maximumVelocity.y}
                        min={0}
                        onChange={e => setMaximumVelocityY(e.target.value === '' ? 0 : parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.body.maximumVelocity.z}
                        min={0}
                        onChange={e => setMaximumVelocityZ(e.target.value === '' ? 0 : parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/actorEditor/maximumSpeed', 'Maximum Speed')}
                </label>
                <input
                    className='theia-input'
                    style={{ width: 54 }}
                    type='number'
                    value={data.body.maximumSpeed}
                    onChange={e => setMaximumSpeed(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/actorEditor/gravityAxes', 'Gravity Axes')}
                    tooltip={nls.localize(
                        'vuengine/actorEditor/gravityAxesDescription',
                        'Select the axes on which the actor should be subject to gravity.'
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
                    defaultValue={data.body.gravityAxes}
                    onChange={options => setGravityAxes(options.map(o => o.value) as Axis[])}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    canSelectMany
                    allowBlank
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/actorEditor/rotationAxes', 'Rotation Axes')}
                    tooltip={nls.localize(
                        'vuengine/actorEditor/rotationAxesDescription',
                        'Select the axes around which the actor\'s spatial rotation syncs with its body\'s direction, ' +
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
                    defaultValue={data.body.rotationAxes}
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
