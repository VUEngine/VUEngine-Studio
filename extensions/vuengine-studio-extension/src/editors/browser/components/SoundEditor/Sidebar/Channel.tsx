import { nls } from '@theia/core';
import React from 'react';
import { ChannelConfig, SoundData } from '../SoundEditorTypes';
import CurrentChannel from './CurrentChannel';

interface ChannelProps {
    songData: SoundData
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    editInstrument: (instrument: string) => void
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        setChannel,
        editInstrument,
    } = props;

    return <>
        {currentChannelId > -1
            ? <CurrentChannel
                songData={songData}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                setChannel={setChannel}
                editInstrument={editInstrument}
            />
            : <div className="lightLabel">
                {nls.localize('vuengine/editors/sound/selectChannelToEditProperties', 'Select a channel to edit its properties')}
            </div>}
    </>;
}
