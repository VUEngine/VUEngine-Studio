import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { ChannelConfig, SongData, VOLUME_STEPS } from '../MusicEditorTypes';

interface CurrentChannelProps {
    songData: SongData
    currentChannelId: number
    setCurrentChannelId: (channelId: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    getChannelName: (channelId: number) => string
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
}

export default function CurrentChannel(props: CurrentChannelProps): React.JSX.Element {
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        toggleChannelMuted,
        toggleChannelSolo,
        getChannelName,
        setChannel,
    } = props;

    const channel = songData.channels[currentChannelId];

    const setChannelVolume = (volume: number): void => {
        setChannel(currentChannelId, {
            volume,
        });
    };

    const setChannelInstrument = (instrument: number): void => {
        setChannel(currentChannelId, {
            instrument,
        });
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>Channel</label>
            <select
                className='theia-select'
                value={channel.id}
                onChange={e => setCurrentChannelId(parseInt(e.target.value))}
            >
                {[...Array(6)].map((n, i) => (
                    <option key={`select-channel-${i}`} value={i}>{getChannelName(i)}</option>
                ))}
            </select>
        </VContainer>

        <VContainer>
            Instrument
            <select
                className='theia-select'
                onChange={e => setChannelInstrument(parseInt(e.target.value))}
                value={channel.instrument}
            >
                {songData.instruments.map((n, i) =>
                    <option key={`instrument-select-${i}`} value={i}>{n.name}</option>
                )}
            </select>
        </VContainer>

        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/envelopeVolume', 'Envelope Volume')}
            </label>
            <HContainer>
                <input
                    type='range'
                    value={channel.volume}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => setChannelVolume(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    {channel.volume}
                </div>
            </HContainer>
        </VContainer>

        <HContainer gap={15}>
            <VContainer>
                <label>
                    <input
                        type="checkbox"
                        checked={channel.muted}
                        onChange={() => toggleChannelMuted(channel.id)}
                    />
                    {nls.localize('vuengine/musicEditor/muted', 'Muted')}
                </label>
            </VContainer>
            <VContainer>
                <label>
                    <input
                        type="checkbox"
                        checked={channel.solo}
                        onChange={() => toggleChannelSolo(channel.id)}
                    />
                    {nls.localize('vuengine/musicEditor/solo', 'Solo')}
                </label>
            </VContainer>
        </HContainer>
    </VContainer>;
}
