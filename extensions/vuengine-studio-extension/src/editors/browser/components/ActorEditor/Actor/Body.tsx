import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
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

    const setMaximumVelocity = (axis: 'x' | 'y' | 'z', value: number): void => {
        setData({
            body: {
                ...data.body,
                maximumVelocity: {
                    ...data.body.maximumVelocity,
                    [axis]: value
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
            <Input
                label={nls.localize('vuengine/editors/actor/mass', 'Mass')}
                value={data.body.mass}
                setValue={v => setMass(v as number)}
                type='number'
                min={0}
                max={511}
                step={0.1}
                width={54}
                commands={INPUT_BLOCKING_COMMANDS}
            />
            <Input
                label={nls.localize('vuengine/editors/actor/friction', 'Friction')}
                value={data.body.friction}
                setValue={v => setFriction(v as number)}
                type='number'
                min={0}
                max={511}
                step={0.1}
                width={54}
                commands={INPUT_BLOCKING_COMMANDS}
            />
            <Input
                label={nls.localize('vuengine/editors/actor/bounciness', 'Bounciness')}
                value={data.body.bounciness}
                setValue={v => setBounciness(v as number)}
                type='number'
                min={0}
                max={511}
                step={0.1}
                width={54}
                commands={INPUT_BLOCKING_COMMANDS}
            />
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/actor/maximumVelocity', 'Maximum Velocity (x, y, z)')}
                </label>
                <HContainer>
                    <Input
                        value={data.body.maximumVelocity.x}
                        setValue={v => setMaximumVelocity('x', v as number)}
                        type='number'
                        min={0}
                        max={511}
                        width={54}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <Input
                        value={data.body.maximumVelocity.y}
                        setValue={v => setMaximumVelocity('y', v as number)}
                        type='number'
                        min={0}
                        max={511}
                        width={54}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <Input
                        value={data.body.maximumVelocity.z}
                        setValue={v => setMaximumVelocity('z', v as number)}
                        type='number'
                        min={0}
                        max={511}
                        width={54}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                </HContainer>
            </VContainer>
            <Input
                label={nls.localize('vuengine/editors/actor/maximumSpeed', 'Maximum Speed')}
                value={data.body.maximumSpeed}
                setValue={v => setMaximumSpeed(v as number)}
                type='number'
                min={0}
                max={511}
                width={54}
                commands={INPUT_BLOCKING_COMMANDS}
            />
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/actor/gravityAxes', 'Gravity Axes')}
                    tooltip={nls.localize(
                        'vuengine/editors/actor/gravityAxesDescription',
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
                    label={nls.localize('vuengine/editors/actor/rotationAxes', 'Rotation Axes')}
                    tooltip={nls.localize(
                        'vuengine/editors/actor/rotationAxesDescription',
                        'Select the axes around which the actor\'s spatial rotation syncs with its body\'s direction, \
which propagates to its sprites, colliders and wireframes. \
Note that sprites need to use AFFINE mode to be able to be rotated.',
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
