import React from 'react';
import { ChannelConfig, PatternConfig, SongData } from '../types';
import CurrentChannel from './CurrentChannel';
import CurrentPattern from './CurrentPattern';
import Song from './Song';

interface TabSongProps {
    name: string
    volume: number
    speed: number
    bar: number
    channel: ChannelConfig
    pattern: PatternConfig | boolean
    currentChannel: number
    currentPattern: number
    defaultPatternSize: number
    setCurrentChannel: (channel: number) => void
    setCurrentPattern: (channel: number, pattern: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelCollapsed: (channelId: number) => void
    setChannelVolume: (volume: number) => void
    setPatternSize: (size: number) => void
    setSongData: (songData: Partial<SongData>) => void
}

export default function TabSong(props: TabSongProps): JSX.Element {
    const { name,
        volume,
        speed,
        bar,
        channel,
        pattern,
        currentChannel,
        currentPattern,
        defaultPatternSize,
        setCurrentChannel,
        setCurrentPattern,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
        setChannelVolume,
        setPatternSize,
        setSongData,
    } = props;

    return <>
        <Song
            name={name}
            volume={volume}
            speed={speed}
            bar={bar}
            defaultPatternSize={defaultPatternSize}
            setSongData={setSongData}
        />

        {currentChannel > -1 && <CurrentChannel
            channel={channel}
            setCurrentChannel={setCurrentChannel}
            toggleChannelMuted={toggleChannelMuted}
            toggleChannelSolo={toggleChannelSolo}
            toggleChannelCollapsed={toggleChannelCollapsed}
            setChannelVolume={setChannelVolume}
        />}

        {currentPattern > -1 && <CurrentPattern
            pattern={pattern as PatternConfig}
            channel={channel}
            currentPattern={currentPattern}
            setCurrentPattern={setCurrentPattern}
            setPatternSize={setPatternSize}
        />}
    </>;
}
