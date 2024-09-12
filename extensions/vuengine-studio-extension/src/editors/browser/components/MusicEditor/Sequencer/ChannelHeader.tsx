import React from 'react';
import { ChannelConfig } from '../MusicEditorTypes';

interface ChannelHeaderProps {
    channel: ChannelConfig
    number: number
    muted: boolean
    solo: boolean
    instrumentName: string
    setCurrentChannelId: (currentChannelId: number) => void
    getChannelName: (channelId: number) => string
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
}

export default function ChannelHeader(props: ChannelHeaderProps): React.JSX.Element {
    const { channel, number, muted, solo, setCurrentChannelId, getChannelName, toggleChannelMuted, toggleChannelSolo } = props;

    return <div className='channelHeader'>
        <div
            className='channelInfo'
            onClick={() => setCurrentChannelId(number)}
        >
            <div className='channelName'>
                {getChannelName(number)}
            </div>
            { /* }
            <div className='channelInstrument'>
                {instrumentName}
            </div>
            { */ }
            {channel.volume < 100 && <div className='channelVolume'>
                <div style={{ width: `${channel.volume}%` }}></div>
            </div>}
        </div>
        <div className='channelButtons'>
            <div
                className={`channelButton ${muted ? 'active' : ''}`}
                onClick={() => toggleChannelMuted(number)}
            >
                <i className={`fa fa-volume-${muted ? 'off' : 'up'}`} />
            </div>
            <div
                className={`channelButton ${solo ? 'active' : ''}`}
                onClick={() => toggleChannelSolo(number)}
            >
                <i className={`fa fa-star${solo ? '' : '-o'}`} />
            </div>
        </div>
    </div>;
}
