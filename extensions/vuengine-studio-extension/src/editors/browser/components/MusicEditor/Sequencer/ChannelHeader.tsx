import React, { useContext } from 'react';
import { ChannelConfig, MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';

interface ChannelHeaderProps {
    channel: ChannelConfig
    number: number
    muted: boolean
    solo: boolean
    instrumentName: string
}

export default function ChannelHeader(props: ChannelHeaderProps): JSX.Element {
    const { getChannelName, setCurrentChannel, toggleChannelMuted, toggleChannelSolo } = useContext(MusicEditorContext) as MusicEditorContextType;
    const { channel, number, muted, solo, instrumentName } = props;

    const classNames = ['channelHeader'];

    return <div className={classNames.join(' ')}>
        <div
            className='channelInfo'
            onClick={() => setCurrentChannel(number)}
        >
            <div className='channelName'>
                {getChannelName(number)}
            </div>
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
