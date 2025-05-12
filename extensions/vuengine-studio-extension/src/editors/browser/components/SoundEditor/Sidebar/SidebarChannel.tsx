import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import { ChannelConfig, SoundData } from '../SoundEditorTypes';
import CurrentChannel from './CurrentChannel';

interface SidebarChannelProps {
    soundData: SoundData
    currentChannelId: number
    setCurrentChannelId: Dispatch<SetStateAction<number>>
    setCurrentPatternId: Dispatch<SetStateAction<string>>
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    editInstrument: (instrument: string) => void
}

export default function SidebarChannel(props: SidebarChannelProps): React.JSX.Element {
    const {
        soundData,
        currentChannelId, setCurrentChannelId,
        setCurrentPatternId,
        setChannel,
        editInstrument,
    } = props;

    return <>
        {currentChannelId > -1
            ? <CurrentChannel
                soundData={soundData}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                setCurrentPatternId={setCurrentPatternId}
                setChannel={setChannel}
                editInstrument={editInstrument}
            />
            : <div className="lightLabel">
                {nls.localize('vuengine/editors/sound/selectChannelToEditProperties', 'Select a channel to edit its properties')}
            </div>}
    </>;
}
