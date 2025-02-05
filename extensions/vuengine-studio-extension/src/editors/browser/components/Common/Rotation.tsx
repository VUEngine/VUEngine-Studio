import { nls } from '@theia/core';
import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor/ActorEditor';
import HContainer from './Base/HContainer';
import VContainer from './Base/VContainer';
import { clamp } from './Utils';
import { MAX_ROTATION, MIN_ROTATION, PixelRotation, ROTATION_RATIO } from './VUEngineTypes';

interface RotationProps {
    rotation: PixelRotation
    updateRotation: (rotation: PixelRotation) => void
}

export default function Rotation(props: PropsWithChildren<RotationProps>): React.JSX.Element {
    const { rotation, updateRotation } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [rotationDegrees, setRotationDegrees] = useState<PixelRotation>({ x: 0, y: 0, z: 0 });

    const toDegrees = (engineRotation: number): number =>
        Math.round(engineRotation * ROTATION_RATIO * 100) / 100;

    const setRotation = (a: 'x' | 'y' | 'z', value: number): void => {
        const clampedValue = clamp(value, MIN_ROTATION, MAX_ROTATION);

        setRotationDegrees({
            ...rotationDegrees,
            [a]: toDegrees(clampedValue),
        });

        updateRotation({
            ...rotation,
            [a]: clampedValue,
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
                {nls.localize('vuengine/editors/rotation', 'Rotation (x, y, z)')}
            </label>
            <HContainer wrap='wrap'>
                <VContainer>
                    <input
                        className='theia-input'
                        style={{ width: 76 }}
                        type='number'
                        min={MIN_ROTATION}
                        max={MAX_ROTATION}
                        value={rotation.x}
                        onChange={e => setRotation('x', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <div className="secondaryText">
                        {rotationDegrees.x}°
                    </div>
                </VContainer>
                <VContainer>
                    <input
                        className='theia-input'
                        style={{ width: 76 }}
                        type='number'
                        min={MIN_ROTATION}
                        max={MAX_ROTATION}
                        value={rotation.y}
                        onChange={e => setRotation('y', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <div className="secondaryText">
                        {rotationDegrees.y}°
                    </div>
                </VContainer>
                <VContainer>
                    <input
                        className='theia-input'
                        style={{ width: 76 }}
                        type='number'
                        min={MIN_ROTATION}
                        max={MAX_ROTATION}
                        value={rotation.z}
                        onChange={e => setRotation('z', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <div className="secondaryText">
                        {rotationDegrees.z}°
                    </div>
                </VContainer>
            </HContainer>
        </VContainer>
    );
}
