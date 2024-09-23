import React from 'react';
import { ChannelConfig } from '../MusicEditorTypes';

interface ChannelHeaderProps {
    channel: ChannelConfig
    number: number
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    getChannelName: (channelId: number) => string
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
}

export default function ChannelHeader(props: ChannelHeaderProps): React.JSX.Element {
    const { channel, number, currentChannelId, setCurrentChannelId, getChannelName, toggleChannelMuted, toggleChannelSolo } = props;

    const classNames = ['channelHeader'];
    if (currentChannelId === number) {
        classNames.push('current');
    }

    return <div className={classNames.join(' ')}>
        <div
            className='channelInfo'
            onClick={() => setCurrentChannelId(number)}
        >
            <div className='channelName'>
                {getChannelName(number)}
            </div>
        </div>
        <div className='channelButtons'>
            <div
                className={`channelButton ${channel.muted ? 'active' : ''}`}
                onClick={() => toggleChannelMuted(number)}
            >
                <i className={`fa fa-volume-${channel.muted ? 'off' : 'up'}`} />
            </div>
            <div
                className={`channelButton ${channel.solo ? 'active' : ''}`}
                onClick={() => toggleChannelSolo(number)}
            >
                <i className={`fa fa-star${channel.solo ? '' : '-o'}`} />
            </div>
        </div>
    </div>;
}
