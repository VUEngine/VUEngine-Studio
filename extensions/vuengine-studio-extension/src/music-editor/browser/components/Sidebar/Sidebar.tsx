import React, { useState } from 'react';
import { ChannelConfig, MusicEditorStateApi, PatternConfig } from '../types';
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
        <div
            className={`sidebarToggle ${collapsed ? 'collapsed' : ''}`}
            onClick={() => setCollapsed(!collapsed)}
        />
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className='sidebarTabs'>
                <div
                    className={`sidebarTab ${tab === 0 && 'active'}`}
                    onClick={() => stateApi.setSidebarTab(0)}
                >
                    <i className='fa fa-cog' />
                </div>
                <div
                    className={`sidebarTab ${tab === 1 && 'active'}`}
                    onClick={() => stateApi.setSidebarTab(1)}
                >
                    <i className='fa fa-music' />
                </div>
                <div
                    className={`sidebarTab ${tab === 2 && 'active'}`}
                    onClick={() => stateApi.setSidebarTab(2)}
                >
                    <i className='fa fa-bullhorn' />
                </div>
                <div
                    className={`sidebarTab ${tab === 3 && 'active'}`}
                    onClick={() => stateApi.setSidebarTab(3)}
                >
                    <i className='fa fa-signal' />
                </div>
                <div
                    className={`sidebarTab ${tab === 4 && 'active'}`}
                    onClick={() => stateApi.setSidebarTab(4)}
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
                    setName={setName}
                    setBar={setBar}
                    setSpeed={setSpeed}
                    setVolume={setVolume}
                    setDefaultPatternSize={setDefaultPatternSize}
                    setCurrentChannel={setCurrentChannel}
                    setCurrentPattern={setCurrentPattern}
                    toggleChannelMuted={toggleChannelMuted}
                    toggleChannelSolo={toggleChannelSolo}
                    toggleChannelCollapsed={toggleChannelCollapsed}
                    stateApi={stateApi}
                />}
                {tab === 1 && <TabNote
                    pattern={pattern}
                    currentNote={currentNote}
                    stateApi={stateApi}
                />}
                {tab === 2 && <TabInstruments
                    pattern={pattern}
                    currentNote={currentNote}
                    stateApi={stateApi}
                />}
                {tab === 3 && <TabWaveforms
                    pattern={pattern}
                    currentNote={currentNote}
                    stateApi={stateApi}
                />}
                {tab === 4 && <TabInput
                    pattern={pattern}
                    currentNote={currentNote}
                    stateApi={stateApi}
                />}
            </div>
        </div>
    </>;
}
