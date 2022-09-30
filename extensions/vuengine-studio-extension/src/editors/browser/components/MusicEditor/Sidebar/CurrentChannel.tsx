import React from 'react';
import HContainer from '../../../../../core/browser/components/HContainer';
import VContainer from '../../../../../core/browser/components/VContainer';
import { ChannelConfig, VOLUME_STEPS } from '../MusicEditorTypes';

interface CurrentChannelProps {
    channel: ChannelConfig
    setCurrentChannel: (channel: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelCollapsed: (channelId: number) => void
    setChannelVolume: (volume: number) => void
}

export default function CurrentChannel(props: CurrentChannelProps): JSX.Element {
    const {
        channel,
        setCurrentChannel,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
        setChannelVolume,
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
                    onChange={e => setChannelVolume(parseInt(e.target.value))}
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
