import React from 'react';
import { MusicEditorStateApi } from '../../ves-music-editor-types';

interface ChannelHeaderProps {
    number: number
    name: string
    muted: boolean
    solo: boolean
    collapsed: boolean
    stateApi: MusicEditorStateApi
}

export default function ChannelHeader(props: ChannelHeaderProps): JSX.Element {
    const {
        collapsed,
        name,
        muted,
        number,
        solo,
        stateApi,
    } = props;

    const classNames = ['channelHeader'];

    return <div className={classNames.join(' ')}>
        {number} {name}
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
            <div
                className={`channelButton ${collapsed ? 'active' : ''}`}
                onClick={() => stateApi.toggleChannelCollapsed(number)}
            >
                <i className={`fa fa-eye${collapsed ? '-slash' : ''}`} />
            </div>
        </div>
    </div>;
}
