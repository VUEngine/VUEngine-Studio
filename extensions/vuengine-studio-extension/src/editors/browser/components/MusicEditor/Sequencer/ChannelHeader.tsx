import React from 'react';
import { ChannelConfig } from '../MusicEditorTypes';

interface ChannelHeaderProps {
    channel: ChannelConfig
    number: number
    muted: boolean
    solo: boolean
    instrumentName: string
    setCurrentChannel: (id: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
}

export default function ChannelHeader(props: ChannelHeaderProps): JSX.Element {
    const {
        channel,
        number,
        muted,
        solo,
        instrumentName,
        setCurrentChannel,
        toggleChannelMuted,
        toggleChannelSolo,
    } = props;

    const classNames = ['channelHeader'];

    return <div className={classNames.join(' ')}>
        <div
            className='channelInfo'
            onClick={() => setCurrentChannel(number)}
        >
            <div className='channelName'>Channel {number + 1}</div>
            <div className='channelInstrument'>
                {instrumentName}
            </div>
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
