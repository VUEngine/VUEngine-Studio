import React from 'react';
import { ChannelConfig, MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
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
}

export default function TabSong(props: TabSongProps): JSX.Element {
    const { name, volume, speed, bar, channel, pattern, currentChannel, currentPattern, defaultPatternSize, stateApi } = props;

    return <>
        <Song
            name={name}
            volume={volume}
            speed={speed}
            bar={bar}
            defaultPatternSize={defaultPatternSize}
            stateApi={stateApi}
        />

        {currentChannel > -1 && <CurrentChannel
            channel={channel}
            stateApi={stateApi}
        />}

        {currentPattern > -1 && <CurrentPattern
            pattern={pattern as PatternConfig}
            channel={channel}
            currentPattern={currentPattern}
            stateApi={stateApi}
        />}
    </>;
}
