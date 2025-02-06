import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import {
    ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_DEFAULT_VALUE,
    ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MAX_VALUE,
    ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MIN_VALUE,
    COLLIDERS_MAX_SIZE_DEFAULT_VALUE,
    COLLIDERS_MAX_SIZE_MAX_VALUE,
    COLLIDERS_MAX_SIZE_MIN_VALUE,
    EngineConfigData,
    FRICTION_FORCE_FACTOR_POWER_DEFAULT_VALUE,
    FRICTION_FORCE_FACTOR_POWER_MAX_VALUE,
    FRICTION_FORCE_FACTOR_POWER_MIN_VALUE,
    GRAVITY_DEFAULT_VALUE,
    GRAVITY_MAX_VALUE,
    GRAVITY_MIN_VALUE,
    MAXIMUM_BOUNCINESS_COEFFICIENT_DEFAULT_VALUE,
    MAXIMUM_BOUNCINESS_COEFFICIENT_MAX_VALUE,
    MAXIMUM_BOUNCINESS_COEFFICIENT_MIN_VALUE,
    MAXIMUM_FRICTION_COEFFICIENT_DEFAULT_VALUE,
    MAXIMUM_FRICTION_COEFFICIENT_MAX_VALUE,
    MAXIMUM_FRICTION_COEFFICIENT_MIN_VALUE,
    PHYSICS_HIGH_PRECISION_DEFAULT_VALUE,
    STOP_BOUNCING_VELOCITY_THRESHOLD_DEFAULT_VALUE,
    STOP_BOUNCING_VELOCITY_THRESHOLD_MAX_VALUE,
    STOP_BOUNCING_VELOCITY_THRESHOLD_MIN_VALUE,
    STOP_VELOCITY_THRESHOLD_DEFAULT_VALUE,
    STOP_VELOCITY_THRESHOLD_MAX_VALUE,
    STOP_VELOCITY_THRESHOLD_MIN_VALUE,
    TIME_ELAPSED_DIVISOR_DEFAULT_VALUE,
    TIME_ELAPSED_DIVISOR_MAX_VALUE,
    TIME_ELAPSED_DIVISOR_MIN_VALUE
} from '../EngineConfigEditorTypes';

interface EngineConfigPhysicsProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigPhysics(props: EngineConfigPhysicsProps): React.JSX.Element {
    const { data, updateData } = props;

    const setAngleToPreventColliderDisplacement = (angleToPreventColliderDisplacement: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                angleToPreventColliderDisplacement: clamp(
                    angleToPreventColliderDisplacement,
                    ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MIN_VALUE,
                    ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MAX_VALUE,
                    ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_DEFAULT_VALUE
                ),
            }
        });
    };

    const setFrictionForceFactorPower = (frictionForceFactorPower: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                frictionForceFactorPower: clamp(
                    frictionForceFactorPower,
                    FRICTION_FORCE_FACTOR_POWER_MIN_VALUE,
                    FRICTION_FORCE_FACTOR_POWER_MAX_VALUE,
                    FRICTION_FORCE_FACTOR_POWER_DEFAULT_VALUE
                ),
            }
        });
    };

    const setGravity = (gravity: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                gravity: clamp(
                    gravity,
                    GRAVITY_MIN_VALUE,
                    GRAVITY_MAX_VALUE,
                    GRAVITY_DEFAULT_VALUE
                ),
            }
        });
    };

    const toggleHighPrecision = (): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                highPrecision: !(data.physics?.highPrecision ?? PHYSICS_HIGH_PRECISION_DEFAULT_VALUE),
            }
        });
    };

    const setMaximumBouncinessCoefficient = (maximumBouncinessCoefficient: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                maximumBouncinessCoefficient: clamp(
                    maximumBouncinessCoefficient,
                    MAXIMUM_BOUNCINESS_COEFFICIENT_MIN_VALUE,
                    MAXIMUM_BOUNCINESS_COEFFICIENT_MAX_VALUE,
                    MAXIMUM_BOUNCINESS_COEFFICIENT_DEFAULT_VALUE
                ),
            }
        });
    };

    const setMaximumFrictionCoefficient = (maximumFrictionCoefficient: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                maximumFrictionCoefficient: clamp(
                    maximumFrictionCoefficient,
                    MAXIMUM_FRICTION_COEFFICIENT_MIN_VALUE,
                    MAXIMUM_FRICTION_COEFFICIENT_MAX_VALUE,
                    MAXIMUM_FRICTION_COEFFICIENT_DEFAULT_VALUE
                ),
            }
        });
    };

    const setStopBouncingVelocityThreshold = (stopBouncingVelocityThreshold: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                stopBouncingVelocityThreshold: clamp(
                    stopBouncingVelocityThreshold,
                    STOP_BOUNCING_VELOCITY_THRESHOLD_MIN_VALUE,
                    STOP_BOUNCING_VELOCITY_THRESHOLD_MAX_VALUE,
                    STOP_BOUNCING_VELOCITY_THRESHOLD_DEFAULT_VALUE
                ),
            }
        });
    };

    const setStopVelocityThreshold = (stopVelocityThreshold: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                stopVelocityThreshold: clamp(
                    stopVelocityThreshold,
                    STOP_VELOCITY_THRESHOLD_MIN_VALUE,
                    STOP_VELOCITY_THRESHOLD_MAX_VALUE,
                    STOP_VELOCITY_THRESHOLD_DEFAULT_VALUE
                ),
            }
        });
    };

    const setTimeElapsedDivisor = (timeElapsedDivisor: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                timeElapsedDivisor: clamp(
                    timeElapsedDivisor,
                    TIME_ELAPSED_DIVISOR_MIN_VALUE,
                    TIME_ELAPSED_DIVISOR_MAX_VALUE,
                    TIME_ELAPSED_DIVISOR_DEFAULT_VALUE
                ),
            }
        });
    };

    const setCollidersMaximumSize = (collidersMaximumSize: number): void => {
        updateData({
            ...data,
            physics: {
                ...(data.physics ?? {}),
                collidersMaximumSize: clamp(
                    collidersMaximumSize,
                    COLLIDERS_MAX_SIZE_MIN_VALUE,
                    COLLIDERS_MAX_SIZE_MAX_VALUE,
                    COLLIDERS_MAX_SIZE_DEFAULT_VALUE
                ),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/physics/angleToPreventColliderDisplacement',
                        'Angle To Prevent Collider Displacement'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/physics/angleToPreventColliderDisplacementDescription',
                        'Minimum angle to allow movement when colliding against another object. \
Smaller values allow movement to start when colliding against a collider and trying to move towards it.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.angleToPreventColliderDisplacement ?? ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_DEFAULT_VALUE}
                    min={ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MIN_VALUE}
                    max={ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MAX_VALUE}
                    onChange={e => setAngleToPreventColliderDisplacement(e.target.value === '' ? ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/physics/frictionForceFactorPower',
                        'Friction Force Factor Power'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.frictionForceFactorPower ?? FRICTION_FORCE_FACTOR_POWER_DEFAULT_VALUE}
                    min={FRICTION_FORCE_FACTOR_POWER_MIN_VALUE}
                    max={FRICTION_FORCE_FACTOR_POWER_MAX_VALUE}
                    onChange={e => setFrictionForceFactorPower(e.target.value === '' ? FRICTION_FORCE_FACTOR_POWER_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/physics/gravity', 'Gravity')}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.gravity ?? GRAVITY_DEFAULT_VALUE}
                    min={GRAVITY_MIN_VALUE}
                    max={GRAVITY_MAX_VALUE}
                    onChange={e => setGravity(e.target.value === '' ? GRAVITY_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/physics/highPrecision', 'High Precision')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/physics/highPrecisionDescription',
                        'Use higher precision data type (fix7.9) to perform physics simulations.',
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.physics?.highPrecision ?? PHYSICS_HIGH_PRECISION_DEFAULT_VALUE}
                    onChange={() => toggleHighPrecision()}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/physics/maximumBouncinessCoefficient', 'Maximum Bounciness Coefficient')}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.maximumBouncinessCoefficient ?? MAXIMUM_BOUNCINESS_COEFFICIENT_DEFAULT_VALUE}
                    min={MAXIMUM_BOUNCINESS_COEFFICIENT_MIN_VALUE}
                    max={MAXIMUM_BOUNCINESS_COEFFICIENT_MAX_VALUE}
                    onChange={e => setMaximumBouncinessCoefficient(e.target.value === '' ? MAXIMUM_BOUNCINESS_COEFFICIENT_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/physics/maximumFrictionCoefficient', 'Maximum Friction Coefficient')}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.maximumFrictionCoefficient ?? MAXIMUM_FRICTION_COEFFICIENT_DEFAULT_VALUE}
                    min={MAXIMUM_FRICTION_COEFFICIENT_MIN_VALUE}
                    max={MAXIMUM_FRICTION_COEFFICIENT_MAX_VALUE}
                    onChange={e => setMaximumFrictionCoefficient(e.target.value === '' ? MAXIMUM_FRICTION_COEFFICIENT_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/physics/stopBouncingVelocityThreshold', 'Stop Bouncing Velocity Threshold')}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.stopBouncingVelocityThreshold ?? STOP_BOUNCING_VELOCITY_THRESHOLD_DEFAULT_VALUE}
                    min={STOP_BOUNCING_VELOCITY_THRESHOLD_MIN_VALUE}
                    max={STOP_BOUNCING_VELOCITY_THRESHOLD_MAX_VALUE}
                    onChange={e => setStopBouncingVelocityThreshold(e.target.value === '' ? STOP_BOUNCING_VELOCITY_THRESHOLD_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/physics/stopVelocityThreshold', 'Stop Velocity Threshold')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/physics/stopVelocityThresholdDescription',
                        'Threshold to stop bodies.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.stopVelocityThreshold ?? STOP_VELOCITY_THRESHOLD_DEFAULT_VALUE}
                    min={STOP_VELOCITY_THRESHOLD_MIN_VALUE}
                    max={STOP_VELOCITY_THRESHOLD_MAX_VALUE}
                    onChange={e => setStopVelocityThreshold(e.target.value === '' ? STOP_VELOCITY_THRESHOLD_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/physics/timeElapsedDivisor', 'Time Elapsed Divisor')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/physics/timeElapsedDivisorDescription',
                        'Divisor to speed up physics simulations. Bigger number equals faster computations.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.timeElapsedDivisor ?? TIME_ELAPSED_DIVISOR_DEFAULT_VALUE}
                    min={TIME_ELAPSED_DIVISOR_MIN_VALUE}
                    max={TIME_ELAPSED_DIVISOR_MAX_VALUE}
                    onChange={e => setTimeElapsedDivisor(e.target.value === '' ? TIME_ELAPSED_DIVISOR_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/physics/collidersMaximumSize', 'Colliders Maximum Size')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/physics/collidersMaximumSizeDescription',
                        'Maximum size of colliders allowed to avoid checks against far away colliders.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.physics?.collidersMaximumSize ?? COLLIDERS_MAX_SIZE_DEFAULT_VALUE}
                    min={COLLIDERS_MAX_SIZE_MIN_VALUE}
                    max={COLLIDERS_MAX_SIZE_MAX_VALUE}
                    onChange={e => setCollidersMaximumSize(e.target.value === '' ? COLLIDERS_MAX_SIZE_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
        </VContainer>
    );
}
