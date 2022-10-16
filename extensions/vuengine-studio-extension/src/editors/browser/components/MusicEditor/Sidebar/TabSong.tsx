import React from 'react';
import { ChannelConfig, InstrumentConfig, PatternConfig, SongData } from '../MusicEditorTypes';
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
    editInstrument: (instrument: number) => void
}

export default function TabSong(props: TabSongProps): JSX.Element {
    const { name,
        volume,
        speed,
        bar,
        channel,
        pattern,
        instruments,
        currentChannel,
        currentPattern,
        defaultPatternSize,
        setCurrentChannel,
        setCurrentPattern,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
        setChannelVolume,
        setChannelInstrument,
        setPatternSize,
        setSongData,
        editInstrument,
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
            instruments={instruments}
            setCurrentChannel={setCurrentChannel}
            toggleChannelMuted={toggleChannelMuted}
            toggleChannelSolo={toggleChannelSolo}
            toggleChannelCollapsed={toggleChannelCollapsed}
            setChannelVolume={setChannelVolume}
            setChannelInstrument={setChannelInstrument}
            editInstrument={editInstrument}
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
