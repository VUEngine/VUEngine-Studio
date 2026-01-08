import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { Axis } from '../../Common/VUEngineTypes';
import { BodyData } from '../ActorEditorTypes';

interface BodyProps {
    body: BodyData
    updateBody: (partialData: Partial<BodyData>) => void
}

export default function Body(props: BodyProps): React.JSX.Element {
    const { body, updateBody } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const setMass = (mass: number): void => {
        updateBody({ mass });
    };

    const setFriction = (friction: number): void => {
        updateBody({ friction });
    };

    const setBounciness = (bounciness: number): void => {
        updateBody({ bounciness });
    };

    const setMaximumSpeed = (maximumSpeed: number): void => {
        updateBody({ maximumSpeed });
    };

    const setMaximumVelocity = (axis: 'x' | 'y' | 'z', value: number): void => {
        updateBody({
            maximumVelocity: {
                ...body.maximumVelocity,
                [axis]: value
            }
        });
    };

    const setGravityAxes = (gravityAxes: Axis[]): void => {
        updateBody({ gravityAxes });
    };

    const setRotationAxes = (rotationAxes: Axis[]): void => {
        updateBody({
            rotationAxes
        });
    };

    return (
        <VContainer gap={15}>
            <HContainer gap={15}>
                <Input
                    label={nls.localize('vuengine/editors/actor/mass', 'Mass')}
                    value={body.mass}
                    setValue={setMass}
                    type='number'
                    min={0}
                    max={511}
                    step={0.1}
                    width={64}
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
                        defaultValue={body.gravityAxes}
                        onChange={options => setGravityAxes(options.map(o => o.value) as Axis[])}
                        onFocus={() => disableCommands()}
                        onBlur={() => enableCommands()}
                        canSelectMany
                        allowBlank
                    />
                </VContainer>
            </HContainer>
            <HContainer gap={15}>
                <Input
                    label={nls.localize('vuengine/editors/actor/friction', 'Friction')}
                    value={body.friction}
                    setValue={setFriction}
                    type='number'
                    min={0}
                    max={511}
                    step={0.1}
                    width={64}
                />
                <Input
                    label={nls.localize('vuengine/editors/actor/bounciness', 'Bounciness')}
                    value={body.bounciness}
                    setValue={setBounciness}
                    type='number'
                    min={0}
                    max={511}
                    step={0.1}
                    width={64}
                />
                <Input
                    label={nls.localize('vuengine/editors/actor/maximumSpeed', 'Maximum Speed')}
                    value={body.maximumSpeed}
                    setValue={setMaximumSpeed}
                    type='number'
                    min={0}
                    max={511}
                    width={64}
                />
            </HContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/actor/maximumVelocity', 'Maximum Velocity (x, y, z)')}
                </label>
                <HContainer>
                    <Input
                        value={body.maximumVelocity.x}
                        setValue={v => setMaximumVelocity('x', v as number)}
                        type='number'
                        min={0}
                        max={511}
                        width={64}
                    />
                    <Input
                        value={body.maximumVelocity.y}
                        setValue={v => setMaximumVelocity('y', v as number)}
                        type='number'
                        min={0}
                        max={511}
                        width={64}
                    />
                    <Input
                        value={body.maximumVelocity.z}
                        setValue={v => setMaximumVelocity('z', v as number)}
                        type='number'
                        min={0}
                        max={511}
                        width={64}
                    />
                </HContainer>
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
                    defaultValue={body.rotationAxes}
                    onChange={options => setRotationAxes(options.map(o => o.value) as Axis[])}
                    onFocus={() => disableCommands()}
                    onBlur={() => enableCommands()}
                    canSelectMany
                    allowBlank
                />
            </VContainer>
        </VContainer >
    );
}
