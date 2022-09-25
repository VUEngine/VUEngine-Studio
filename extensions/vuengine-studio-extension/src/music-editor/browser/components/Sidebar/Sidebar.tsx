import React, { useState } from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import CurrentChannel from './CurrentChannel';
import CurrentNote from './CurrentNote';
import CurrentPattern from './CurrentPattern';
import Song from './Song';

interface SidebarProps {
    name: string
    volume: number
    speed: number
    bar: number
    pattern: PatternConfig | boolean
    currentChannel: number
    currentPattern: number
    currentNote: number
    stateApi: MusicEditorStateApi
}

export default function Sidebar(props: SidebarProps): JSX.Element {
    const [collapsed, setCollapsed] = useState(false);
    const { name, volume, speed, bar, pattern, currentChannel, currentPattern, currentNote, stateApi } = props;

    return <>
        <div
            className={`sidebarToggle ${collapsed ? 'collapsed' : ''}`}
            onClick={() => setCollapsed(!collapsed)}
        />
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className='sidebarTabs'>
                <div className='sidebarTab active'>
                    <i className='fa fa-cog' />
                </div>
                <div className='sidebarTab'>
                    <i className='fa fa-music' />
                </div>
                <div className='sidebarTab'>
                    <i className='fa fa-bullhorn' />
                </div>
                <div className='sidebarTab'>
                    <i className='fa fa-signal' />
                </div>
            </div>
            <Song
                name={name}
                volume={volume}
                speed={speed}
                bar={bar}
                stateApi={stateApi}
            />

            {currentChannel > -1 && <CurrentChannel
                currentChannel={currentChannel}
                stateApi={stateApi}
            />}

            {currentPattern > -1 && <CurrentPattern
                pattern={pattern as PatternConfig}
                currentPattern={currentPattern}
                stateApi={stateApi}
            />}

            {currentNote > -1 && <CurrentNote
                pattern={pattern as PatternConfig}
                currentChannel={currentChannel}
                currentPattern={currentPattern}
                currentNote={currentNote}
                stateApi={stateApi}
            />}
        </div>
    </>;
}
