import { nls } from '@theia/core';
import React from 'react';
import { ChannelConfig, SongData } from '../MusicEditorTypes';
import CurrentChannel from './CurrentChannel';

interface ChannelProps {
    songData: SongData
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    getChannelName: (channelId: number) => string
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        getChannelName,
        setChannel,
        toggleChannelMuted,
        toggleChannelSolo,
    } = props;

    return <>
        {currentChannelId > -1
            ? <CurrentChannel
                songData={songData}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
                getChannelName={getChannelName}
                setChannel={setChannel}
            />
            : <div>
                {nls.localize('vuengine/musicEditor/selectChannelToEditProperties', 'Select a channel to edit its properties')}
            </div>}
    </>;
}
