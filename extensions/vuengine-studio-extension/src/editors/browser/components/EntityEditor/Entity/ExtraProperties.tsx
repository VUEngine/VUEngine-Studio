import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType, MAX_ENTITY_PIXEL_SIZE, MIN_ENTITY_PIXEL_SIZE } from '../EntityEditorTypes';

export default function ExtraProperties(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const setAllocator = (customAllocator: string): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                customAllocator,
            }
        });
    };

    const setExtraInfo = (extraInfo: string): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                extraInfo,
            }
        });
    };

    const setPixelSize = (a: 'x' | 'y' | 'z', value: number): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                pixelSize: {
                    ...data.extraProperties.pixelSize,
                    [a]: clamp(value, MIN_ENTITY_PIXEL_SIZE, MAX_ENTITY_PIXEL_SIZE),
                },
            },
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer grow={1}>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/customAllocator', 'Custom Allocator')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/customAllocatorDescription',
                        'Define which class to use to attach custom logic to this entity. ' +
                        'If left blank, either Entity, AnimatedEntity or Actor are used, ' +
                        'depending on the entity\'s components.',
                    )}
                />
                <input
                    className='theia-input'
                    value={data.extraProperties.customAllocator}
                    onChange={e => setAllocator(e.target.value)}
                />
            </VContainer>
            <VContainer grow={1}>
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
                        style={{ width: 54 }}
                        type='number'
                        value={data.extraProperties.pixelSize.x}
                        onChange={e => setPixelSize('x', parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.extraProperties.pixelSize.y}
                        onChange={e => setPixelSize('y', parseInt(e.target.value))}
                        min={0}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.extraProperties.pixelSize.z}
                        onChange={e => setPixelSize('z', parseInt(e.target.value))}
                        min={0}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
