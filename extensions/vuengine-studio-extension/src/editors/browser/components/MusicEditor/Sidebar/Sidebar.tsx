import React, { useState } from 'react';
import { ChannelConfig, PatternConfig, SongData } from '../MusicEditorTypes';
import TabInput from './TabInput';
import TabInstruments from './TabInstruments';
import TabNote from './TabNote';
import TabSong from './TabSong';
import TabWaveforms from './TabWaveforms';

interface SidebarProps {
    name: string
    volume: number
    speed: number
    bar: number
    channel: ChannelConfig
    pattern: PatternConfig | boolean
    currentChannel: number
    currentPattern: number
    currentNote: number
    tab: number
    defaultPatternSize: number
    setCurrentChannel: (channel: number) => void
    setCurrentPattern: (channel: number, pattern: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelCollapsed: (channelId: number) => void
    setSidebarTab: (tab: number) => void
    setChannelVolume: (volume: number) => void
    setPatternSize: (size: number) => void
    setNote: (noteIndex: number, note: number | undefined) => void
    setVolumeL: (noteIndex: number, volume: number | undefined) => void
    setVolumeR: (noteIndex: number, volume: number | undefined) => void
    setSongData: (songData: Partial<SongData>) => void
}

export default function Sidebar(props: SidebarProps): JSX.Element {
    const [collapsed, setCollapsed] = useState(false);
    const { name,
        volume,
        speed,
        bar,
        channel,
        pattern,
        currentChannel,
        currentPattern,
        currentNote,
        tab,
        defaultPatternSize,
        setCurrentChannel,
        setCurrentPattern,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
        setSidebarTab,
        setChannelVolume,
        setPatternSize,
        setNote,
        setVolumeL,
        setVolumeR,
        setSongData,
    } = props;

    return <>
        <div
            className={`sidebarToggle ${collapsed ? 'collapsed' : ''}`}
            onClick={() => setCollapsed(!collapsed)}
        />
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className='sidebarTabs'>
                <div
                    className={`sidebarTab ${tab === 0 && 'active'}`}
                    onClick={() => setSidebarTab(0)}
                >
                    <i className='fa fa-cog' />
                </div>
                <div
                    className={`sidebarTab ${tab === 1 && 'active'}`}
                    onClick={() => setSidebarTab(1)}
                >
                    <i className='fa fa-music' />
                </div>
                <div
                    className={`sidebarTab ${tab === 2 && 'active'}`}
                    onClick={() => setSidebarTab(2)}
                >
                    <i className='fa fa-bullhorn' />
                </div>
                <div
                    className={`sidebarTab ${tab === 3 && 'active'}`}
                    onClick={() => setSidebarTab(3)}
                >
                    <i className='fa fa-signal' />
                </div>
                <div
                    className={`sidebarTab ${tab === 4 && 'active'}`}
                    onClick={() => setSidebarTab(4)}
                >
                    <i className='fa fa-keyboard-o' />
                </div>
            </div>
            <div className='sidebarTabContent'>
                {tab === 0 && <TabSong
                    name={name}
                    volume={volume}
                    speed={speed}
                    bar={bar}
                    channel={channel}
                    pattern={pattern}
                    currentChannel={currentChannel}
                    currentPattern={currentPattern}
                    defaultPatternSize={defaultPatternSize}
                    setCurrentChannel={setCurrentChannel}
                    setCurrentPattern={setCurrentPattern}
                    toggleChannelMuted={toggleChannelMuted}
                    toggleChannelSolo={toggleChannelSolo}
                    toggleChannelCollapsed={toggleChannelCollapsed}
                    setChannelVolume={setChannelVolume}
                    setPatternSize={setPatternSize}
                    setSongData={setSongData}
                />}
                {tab === 1 && <TabNote
                    pattern={pattern}
                    currentNote={currentNote}
                    setNote={setNote}
                    setVolumeL={setVolumeL}
                    setVolumeR={setVolumeR}
                />}
                {tab === 2 && <TabInstruments
                    pattern={pattern}
                    currentNote={currentNote}
                />}
                {tab === 3 && <TabWaveforms
                    pattern={pattern}
                    currentNote={currentNote}
                />}
                {tab === 4 && <TabInput
                    pattern={pattern}
                    currentNote={currentNote}
                />}
            </div>
        </div>
    </>;
}
