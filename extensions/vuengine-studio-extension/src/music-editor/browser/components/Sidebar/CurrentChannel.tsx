import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import HContainer from '../../../../core/browser/components/HContainer';
import VContainer from '../../../../core/browser/components/VContainer';
import { ChannelConfig, MusicEditorStateApi, VOLUME_STEPS } from '../../ves-music-editor-types';

interface CurrentChannelProps {
    channel: ChannelConfig
    stateApi: MusicEditorStateApi
}

export default function CurrentChannel(props: CurrentChannelProps): JSX.Element {
    const { channel, stateApi } = props;

    return <div className='section currentChannel'>
        <VContainer>
            <label>Channel</label>
            <SelectComponent
                options={[...Array(6)].map((n, i) => ({
                    value: i.toString(),
                    label: (i + 1).toString()
                }))}
                defaultValue={CurrentChannel.toString()}
                onChange={option => stateApi.setCurrentChannel(parseInt(option.value!))}
            />
        </VContainer>

        <VContainer>
            Instrument
            <SelectComponent
                options={[
                    { value: '0', label: 'Piano' },
                    { value: '1', label: 'Guitar' },
                    { value: '2', label: 'Bass' },
                    { value: '3', label: 'Oboe' },
                ]}
                defaultValue={'0'}
            />
        </VContainer>

        <VContainer>
            <label>Envelope Volume</label>
            <HContainer>
                <input
                    type='range'
                    value={channel.volume}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => stateApi.setChannelVolume(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {channel.volume}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            <div>
                <input
                    type='checkbox'
                    checked={channel.collapsed}
                    onClick={() => stateApi.toggleChannelCollapsed(channel.id)}
                />
                <label>Collapsed</label>
            </div>
            <div>
                <input
                    type='checkbox'
                    checked={channel.muted}
                    onClick={() => stateApi.toggleChannelMuted(channel.id)}
                />
                <label>Muted</label>
            </div>
            <div>
                <input
                    type='checkbox'
                    checked={channel.solo}
                    onClick={() => stateApi.toggleChannelSolo(channel.id)}
                />
                <label>Solo</label>
            </div>
        </VContainer>
    </div>;
}
