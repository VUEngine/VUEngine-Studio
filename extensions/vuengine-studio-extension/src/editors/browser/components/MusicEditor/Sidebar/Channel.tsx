import React from 'react';
import { ChannelConfig, InstrumentConfig, PatternConfig, SongData } from '../MusicEditorTypes';
import CurrentChannel from './CurrentChannel';
import CurrentPattern from './CurrentPattern';

interface ChannelProps {
    name: string
    volume: number
    speed: number
    bar: number
    channel: ChannelConfig
    pattern: PatternConfig | boolean
    instruments: InstrumentConfig[]
    currentChannel: number
    currentPattern: number
    defaultPatternSize: number
    setCurrentChannel: (channel: number) => void
    setCurrentPattern: (channel: number, pattern: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelCollapsed: (channelId: number) => void
    setChannelVolume: (volume: number) => void
    setChannelInstrument: (instrument: number) => void
    setPatternSize: (size: number) => void
    setSongData: (songData: Partial<SongData>) => void
}

export default function Channel(props: ChannelProps): JSX.Element {
    const {
        channel,
        pattern,
        instruments,
        currentChannel,
        currentPattern,
        setCurrentChannel,
        setCurrentPattern,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
        setChannelVolume,
        setChannelInstrument,
        setPatternSize,
    } = props;

    return <>
        {currentChannel > -1
            ? <CurrentChannel
                channel={channel}
                instruments={instruments}
                setCurrentChannel={setCurrentChannel}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
                toggleChannelCollapsed={toggleChannelCollapsed}
                setChannelVolume={setChannelVolume}
                setChannelInstrument={setChannelInstrument}
            />
            : <div>
                Select a channel to edit its properties
            </div>}

        {currentPattern > -1 && <>
            <div className="divider"></div>
            <CurrentPattern
                pattern={pattern as PatternConfig}
                channel={channel}
                currentPattern={currentPattern}
                setCurrentPattern={setCurrentPattern}
                setPatternSize={setPatternSize}
            />
        </>}
    </>;
}
