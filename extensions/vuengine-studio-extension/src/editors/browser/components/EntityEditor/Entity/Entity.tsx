import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Behaviors from './Behaviors';
import Children from './Children';
import Physics from './Physics';

export default function Entity(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const setName = (n: string): void => {
        setData({ name: n });
    };

    const setExtraInfo = (e: string): void => {
        setData({ extraInfo: e });
    };

    const setPixelSizeX = (x: number): void => {
        setData({
            pixelSize: {
                ...data.pixelSize, x
            }
        });
    };

    const setPixelSizeY = (y: number): void => {
        setData({
            pixelSize: {
                ...data.pixelSize, y
            }
        });
    };

    const setPixelSizeZ = (z: number): void => {
        setData({
            pixelSize: {
                ...data.pixelSize, z
            }
        });
    };

    return <VContainer gap={15}>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/name', 'Name')}
            </label>
            <input
                className='theia-input large'
                value={data.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
        <HContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/extraInfo', 'Extra Info')}
                </label>
                <input
                    className='theia-input'
                    value={data.extraInfo}
                    onChange={e => setExtraInfo(e.target.value)}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/entitySize', 'Size (x, y, z)')}
                    // eslint-disable-next-line max-len
                    tooltip={nls.localize('vuengine/entityEditor/entitySizeDescription', 'Size of the entity in pixels. Used by streaming to test if out of screen bounds. If 0, width and height will be inferred from the first sprite\'s texture\'s size.')}
                />
                <HContainer>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={data.pixelSize.x}
                        onChange={e => setPixelSizeX(parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={data.pixelSize.y}
                        onChange={e => setPixelSizeY(parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={data.pixelSize.z}
                        onChange={e => setPixelSizeZ(parseInt(e.target.value))}
                        min={0}
                    />
                </HContainer>
            </VContainer>
        </HContainer>
        <Physics />
        <Behaviors />
        <Children />
    </VContainer>;
}
