import React from 'react';
import HContainer from '../../../../core/browser/components/HContainer';
import VContainer from '../../../../core/browser/components/VContainer';
import { ChannelConfig, MusicEditorStateApi, VOLUME_STEPS } from '../types';

interface CurrentChannelProps {
    channel: ChannelConfig
    stateApi: MusicEditorStateApi
    setCurrentChannel: (channel: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelCollapsed: (channelId: number) => void
}

export default function CurrentChannel(props: CurrentChannelProps): JSX.Element {
    const {
        channel,
        setCurrentChannel,
        stateApi,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
    } = props;

    return <div className='section currentChannel'>
        <VContainer>
            <label>Channel</label>
            <select
                className='theia-select'
                value={channel.id}
                onChange={e => setCurrentChannel(parseInt(e.target.value))}
            >
                {[...Array(6)].map((n, i) => (
                    <option key={`select-channel-${i}`} value={i}>{i + 1}</option>
                ))}
            </select>
        </VContainer>

        <VContainer>
            Instrument
            <select
                className='theia-select'
                value={0}
            >
                <option value={0}>Piano</option>
                <option value={1}>Guitar</option>
                <option value={2}>Bass</option>
            </select>
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
            <label>
                <input
                    type='checkbox'
                    checked={channel.collapsed}
                    onChange={() => toggleChannelCollapsed(channel.id)}
                />
                Collapsed
            </label>
            <label>
                <input
                    type='checkbox'
                    checked={channel.muted}
                    onChange={() => toggleChannelMuted(channel.id)}
                />
                Muted
            </label>
            <label>
                <input
                    type='checkbox'
                    checked={channel.solo}
                    onChange={() => toggleChannelSolo(channel.id)}
                />
                Solo
            </label>
        </VContainer>
    </div>;
}
