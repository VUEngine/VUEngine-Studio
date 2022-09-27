import React from 'react';
import { ChannelConfig, MusicEditorStateApi } from '../../ves-music-editor-types';

interface ChannelHeaderProps {
    channel: ChannelConfig
    number: number
    muted: boolean
    solo: boolean
    collapsed: boolean
    stateApi: MusicEditorStateApi
}

export default function ChannelHeader(props: ChannelHeaderProps): JSX.Element {
    const {
        channel,
        number,
        muted,
        solo,
        // collapsed,
        stateApi,
    } = props;

    const classNames = ['channelHeader'];

    return <div className={classNames.join(' ')}>
        <div
            className='channelInfo'
            onClick={() => stateApi.setCurrentChannel(number)}
        >
            <div className='channelName'>Channel {number + 1}</div>
            <div className='channelInstrument'>Synth</div>
            {channel.volume < 100 && <div className='channelVolume'>
                <div style={{ width: `${channel.volume}%` }}></div>
            </div>}
        </div>
        <div className='channelButtons'>
            <div
                className={`channelButton ${muted ? 'active' : ''}`}
                onClick={() => stateApi.toggleChannelMuted(number)}
            >
                <i className={`fa fa-volume-${muted ? 'off' : 'up'}`} />
            </div>
            <div
                className={`channelButton ${solo ? 'active' : ''}`}
                onClick={() => stateApi.toggleChannelSolo(number)}
            >
                <i className={`fa fa-star${solo ? '' : '-o'}`} />
            </div>
            {/* <div
                className={`channelButton ${collapsed ? 'active' : ''}`}
                onClick={() => stateApi.toggleChannelCollapsed(number)}
            >
                <i className={`fa fa-eye${collapsed ? '-slash' : ''}`} />
            </div> */}
        </div>
    </div>;
}
