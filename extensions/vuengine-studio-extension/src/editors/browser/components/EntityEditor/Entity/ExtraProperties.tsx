import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function ExtraProperties(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const disableExtraProperties = (): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                enabled: false,
            }
        });
    };

    const setExtraInfo = (e: string): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                extraInfo: e
            }
        });
    };

    const setPixelSizeX = (x: number): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                pixelSize: {
                    ...data.extraProperties.pixelSize, x
                }
            }
        });
    };

    const setPixelSizeY = (y: number): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                pixelSize: {
                    ...data.extraProperties.pixelSize, y
                }
            }
        });
    };

    const setPixelSizeZ = (z: number): void => {
        setData({

            extraProperties: {
                ...data.extraProperties,
                pixelSize: {
                    ...data.extraProperties.pixelSize, z
                }
            }
        });
    };

    return <>
        {data.extraProperties.enabled && <HContainer gap={15} className='item'>
            <button
                className="remove-button"
                onClick={disableExtraProperties}
                title={nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component')}
            >
                <i className='codicon codicon-x' />
            </button>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/extraInfo', 'Extra Info')}
                </label>
                <input
                    className='theia-input'
                    value={data.extraProperties.extraInfo}
                    onChange={e => setExtraInfo(e.target.value)}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/entitySize', 'Size (x, y, z)')}
                    tooltip={
                        nls.localize(
                            'vuengine/entityEditor/entitySizeDescription',
                            'Size of the entity in pixels. Used by streaming to test if out of screen bounds. ' +
                            'If 0, width and height will be inferred from the first sprite\'s texture\'s size.'
                        )}
                />
                <HContainer>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={data.extraProperties.pixelSize.x}
                        onChange={e => setPixelSizeX(parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={data.extraProperties.pixelSize.y}
                        onChange={e => setPixelSizeY(parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={data.extraProperties.pixelSize.z}
                        onChange={e => setPixelSizeZ(parseInt(e.target.value))}
                        min={0}
                    />
                </HContainer>
            </VContainer>
        </HContainer>}
    </>;
}
