import { nls } from '@theia/core';
import { isNaN } from 'lodash';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import HContainer from './Base/HContainer';
import Input from './Base/Input';
import VContainer from './Base/VContainer';
import { MAX_ROTATION, MIN_ROTATION, PixelRotation, ROTATION_RATIO } from './VUEngineTypes';

interface RotationProps {
    rotation: PixelRotation
    updateRotation: (rotation: PixelRotation) => void
}

export default function Rotation(props: PropsWithChildren<RotationProps>): React.JSX.Element {
    const { rotation, updateRotation } = props;
    const [rotationDegrees, setRotationDegrees] = useState<PixelRotation>({ x: 0, y: 0, z: 0 });

    const toDegrees = (r: number): number =>
        isNaN(r) ? 0 : Math.round(r * ROTATION_RATIO * 100) / 100;

    const setRotation = (a: 'x' | 'y' | 'z', value: number): void => {
        setRotationDegrees({
            ...rotationDegrees,
            [a]: toDegrees(value),
        });

        updateRotation({
            ...rotation,
            [a]: value,
        });
    };

    useEffect(() => {
        setRotationDegrees({
            x: toDegrees(rotation?.x ?? 0),
            y: toDegrees(rotation?.y ?? 0),
            z: toDegrees(rotation?.z ?? 0),
        });
    }, []);

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/general/rotation', 'Rotation (x, y, z)')}
            </label>
            <HContainer wrap='wrap'>
                <VContainer>
                    <Input
                        value={rotation.x}
                        setValue={v => setRotation('x', v as number)}
                        type='number'
                        min={MIN_ROTATION}
                        max={MAX_ROTATION}
                        width={64}
                    />
                    <div className="secondaryText">
                        {rotationDegrees.x}°
                    </div>
                </VContainer>
                <VContainer>
                    <Input
                        value={rotation.y}
                        setValue={v => setRotation('y', v as number)}
                        type='number'
                        min={MIN_ROTATION}
                        max={MAX_ROTATION}
                        width={64}
                    />
                    <div className="secondaryText">
                        {rotationDegrees.y}°
                    </div>
                </VContainer>
                <VContainer>
                    <Input
                        value={rotation.z}
                        setValue={v => setRotation('z', v as number)}
                        type='number'
                        min={MIN_ROTATION}
                        max={MAX_ROTATION}
                        width={64}
                    />
                    <div className="secondaryText">
                        {rotationDegrees.z}°
                    </div>
                </VContainer>
            </HContainer>
        </VContainer>
    );
}
