import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';

interface VesMeshesProps {
    id?: string;
    value: string;
    updateValue: (newValue: string) => void;
}

export const VesMeshes: React.FC<VesMeshesProps> = ({ id, value, updateValue }) => {
    // @ts-ignore
    const [hoverAt, setHoverAt] = useState<string | undefined>(undefined);

    return (
        <div className='meshes'>
            <label>Meshes</label>
            <div>
                <Canvas>
                    <ambientLight intensity={1} color="red" />
                </Canvas>
            </div>
        </div>
    );
};
