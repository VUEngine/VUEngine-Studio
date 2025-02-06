import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import { ChannelConfig, SongData } from '../MusicEditorTypes';
import CurrentChannel from './CurrentChannel';

interface ChannelProps {
    songData: SongData
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    setCurrentInstrument: Dispatch<SetStateAction<number>>
    setSidebarTab: Dispatch<SetStateAction<number>>
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        setChannel,
        toggleChannelMuted,
        toggleChannelSolo,
        setCurrentInstrument,
        setSidebarTab,
    } = props;

    return <>
        {currentChannelId > -1
            ? <CurrentChannel
                songData={songData}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
                setChannel={setChannel}
                setCurrentInstrument={setCurrentInstrument}
                setSidebarTab={setSidebarTab}
            />
            : <div className="lightLabel">
                {nls.localize('vuengine/editors/music/selectChannelToEditProperties', 'Select a channel to edit its properties')}
            </div>}
    </>;
}
