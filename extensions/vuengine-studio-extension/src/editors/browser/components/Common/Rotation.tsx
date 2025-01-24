import { nls } from '@theia/core';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import HContainer from './Base/HContainer';
import { clamp } from './Utils';
import VContainer from './Base/VContainer';
import { MAX_ROTATION, MIN_ROTATION, PixelRotation, ROTATION_RATIO } from './VUEngineTypes';

interface RotationProps {
    rotation: PixelRotation
    updateRotation: (rotation: PixelRotation) => void
}

export default function Rotation(props: PropsWithChildren<RotationProps>): React.JSX.Element {
    const { rotation, updateRotation } = props;
    const [rotationDegrees, setRotationDegrees] = useState<PixelRotation>({ x: 0, y: 0, z: 0 });

    const toDegrees = (engineRotation: number): number =>
        engineRotation * ROTATION_RATIO;

    const toEngineRotation = (degrees: number): number =>
        Math.round(degrees / ROTATION_RATIO);

    const setRotation = (a: 'x' | 'y' | 'z', value: number): void => {
        const engineRotation = clamp(toEngineRotation(value), MIN_ROTATION, MAX_ROTATION);

        setRotationDegrees({
            ...rotationDegrees,
            [a]: toDegrees(engineRotation),
        });

        updateRotation({
            ...rotation,
            [a]: engineRotation,
        });
    };

    useEffect(() => {
        setRotationDegrees({
            x: toDegrees(rotation?.x ?? 0),
            y: toDegrees(rotation?.y ?? 0),
            z: toDegrees(rotation?.z ?? 0),
        });
    }, []);

    return <VContainer>
        <label>
            {nls.localize('vuengine/editors/rotation', 'Rotation (x, y, z)')}
        </label>
        <HContainer wrap='wrap'>
            <HContainer gap={2}>
                <input
                    className='theia-input'
                    style={{ width: 76 }}
                    type='number'
                    min={MIN_ROTATION}
                    max={MAX_ROTATION}
                    step={ROTATION_RATIO}
                    value={rotationDegrees.x}
                    onChange={e => setRotation('x', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                />
                °
            </HContainer>
            <HContainer gap={2}>
                <input
                    className='theia-input'
                    style={{ width: 76 }}
                    type='number'
                    min={MIN_ROTATION}
                    max={MAX_ROTATION}
                    step={ROTATION_RATIO}
                    value={rotationDegrees.y}
                    onChange={e => setRotation('y', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                />
                °
            </HContainer>
            <HContainer gap={2}>
                <input
                    className='theia-input'
                    style={{ width: 76 }}
                    type='number'
                    min={MIN_ROTATION}
                    max={MAX_ROTATION}
                    step={ROTATION_RATIO}
                    value={rotationDegrees.z}
                    onChange={e => setRotation('z', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                />
                °
            </HContainer>
        </HContainer>
    </VContainer>;
}
