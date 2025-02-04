import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor';
import { ActorEditorContext, ActorEditorContextType, MAX_ACTOR_PIXEL_SIZE, MIN_ACTOR_PIXEL_SIZE } from '../ActorEditorTypes';

export default function ExtraProperties(): React.JSX.Element {
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

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
                    [a]: clamp(value, MIN_ACTOR_PIXEL_SIZE, MAX_ACTOR_PIXEL_SIZE),
                },
            },
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer grow={1}>
                <label>
                    {nls.localize('vuengine/actorEditor/extraInfo', 'Extra Info')}
                </label>
                <input
                    className='theia-input'
                    value={data.extraProperties.extraInfo}
                    onChange={e => setExtraInfo(e.target.value)}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/actorEditor/actorSize', 'Size (x, y, z)')}
                    tooltip={
                        nls.localize(
                            'vuengine/actorEditor/actorSizeDescription',
                            'Size of the actor in pixels. Used by streaming to test if out of screen bounds. ' +
                            'If 0, width and height will be inferred from the first sprite\'s texture\'s size.'
                        )}
                />
                <HContainer>
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.extraProperties.pixelSize.x}
                        min={0}
                        onChange={e => setPixelSize('x', e.target.value === '' ? 0 : parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.extraProperties.pixelSize.y}
                        min={0}
                        onChange={e => setPixelSize('y', e.target.value === '' ? 0 : parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 54 }}
                        type='number'
                        value={data.extraProperties.pixelSize.z}
                        min={0}
                        onChange={e => setPixelSize('z', e.target.value === '' ? 0 : parseInt(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
