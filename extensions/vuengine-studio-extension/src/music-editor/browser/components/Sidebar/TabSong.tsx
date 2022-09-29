import React from 'react';
import { ChannelConfig, MusicEditorStateApi, PatternConfig } from '../types';
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
    stateApi: MusicEditorStateApi
    setName: (name: string) => void
    setBar: (bar: number) => void
    setSpeed: (speed: number) => void
    setVolume: (volume: number) => void
    setDefaultPatternSize: (size: number) => void
    setCurrentChannel: (channel: number) => void
    setCurrentPattern: (channel: number, pattern: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelCollapsed: (channelId: number) => void
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
        stateApi,
        setName,
        setBar,
        setSpeed,
        setVolume,
        setDefaultPatternSize,
        setCurrentChannel,
        setCurrentPattern,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
    } = props;

    return <>
        <Song
            name={name}
            volume={volume}
            speed={speed}
            bar={bar}
            defaultPatternSize={defaultPatternSize}
            setName={setName}
            setBar={setBar}
            setSpeed={setSpeed}
            setVolume={setVolume}
            setDefaultPatternSize={setDefaultPatternSize}
        />

        {currentChannel > -1 && <CurrentChannel
            channel={channel}
            setCurrentChannel={setCurrentChannel}
            stateApi={stateApi}
            toggleChannelMuted={toggleChannelMuted}
            toggleChannelSolo={toggleChannelSolo}
            toggleChannelCollapsed={toggleChannelCollapsed}
        />}

        {currentPattern > -1 && <CurrentPattern
            pattern={pattern as PatternConfig}
            channel={channel}
            currentPattern={currentPattern}
            setCurrentPattern={setCurrentPattern}
            stateApi={stateApi}
        />}
    </>;
}
