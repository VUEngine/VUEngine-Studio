import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { MusicEditorContext, MusicEditorContextType, VOLUME_STEPS } from '../MusicEditorTypes';

export default function CurrentChannel(): React.JSX.Element {
    const {
        state,
        songData,
        setCurrentChannel,
        setChannelInstrument,
        setChannelVolume,
        toggleChannelCollapsed,
        toggleChannelMuted,
        toggleChannelSolo,
        getChannelName,
    } = useContext(MusicEditorContext) as MusicEditorContextType;

    const channel = songData.channels[state.currentChannel];

    return <VContainer gap={10}>
        <VContainer>
            <label>Channel</label>
            <select
                className='theia-select'
                value={channel.id}
                onChange={e => setCurrentChannel(parseInt(e.target.value))}
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
                    type="checkbox"
                    checked={channel.collapsed}
                    onChange={() => toggleChannelCollapsed(channel.id)}
                />
                Collapsed
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={channel.muted}
                    onChange={() => toggleChannelMuted(channel.id)}
                />
                Muted
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={channel.solo}
                    onChange={() => toggleChannelSolo(channel.id)}
                />
                Solo
            </label>
        </VContainer>
    </VContainer>;
}
