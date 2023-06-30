import React, { useContext } from 'react';
import HContainer from '../../../../../core/browser/components/HContainer';
import VContainer from '../../../../../core/browser/components/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function General(): JSX.Element {
    const { entityData, setEntityData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const setName = (n: string): void => {
        setEntityData({ name: n.trim() });
    };

    const setExtraInfo = (e: string): void => {
        setEntityData({ extraInfo: e.trim() });
    };

    const setPixelSizeX = (x: number): void => {
        setEntityData({ pixelSize: {
            ...entityData.pixelSize, x
        } });
    };

    const setPixelSizeY = (y: number): void => {
        setEntityData({ pixelSize: {
            ...entityData.pixelSize, y
        } });
    };

    const setPixelSizeZ = (z: number): void => {
        setEntityData({ pixelSize: {
            ...entityData.pixelSize, z
        } });
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>Name</label>
            <input
                className='theia-input large'
                value={entityData.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
        <VContainer>
            <label>Extra Info</label>
            <input
                className='theia-input'
                value={entityData.extraInfo}
                onChange={e => setExtraInfo(e.target.value)}
            />
        </VContainer>
        <VContainer>
            <label>Size (X, Y, Z)</label>
            <div>
                Size of entity in pixels. Used by streaming to test if out of screen bounds. If 0, width and height will be inferred from the first sprite's texture's size.
            </div>
            <HContainer gap={10}>
                <input
                    className='theia-input'
                    type='number'
                    value={entityData.pixelSize.x}
                    onChange={e => setPixelSizeX(parseInt(e.target.value))}
                    min={0}
                />
                <input
                    className='theia-input'
                    type='number'
                    value={entityData.pixelSize.y}
                    onChange={e => setPixelSizeY(parseInt(e.target.value))}
                    min={0}
                />
                <input
                    className='theia-input'
                    type='number'
                    value={entityData.pixelSize.z}
                    onChange={e => setPixelSizeZ(parseInt(e.target.value))}
                    min={0}
                />
            </HContainer>
        </VContainer>
    </VContainer>;
}
