import React from 'react';
import { ChannelConfig, HIGHEST_NOTE, LOWEST_NOTE, MusicEditorStateApi, Notes } from '../../ves-music-editor-types';
import AddPattern from './AddPattern';
import ChannelHeader from './ChannelHeader';
import Pattern from './Pattern';

interface ChannelProps {
    channelConfig: ChannelConfig
    currentChannel: number
    currentPattern: number
    number: number
    otherSolo: boolean
    stateApi: MusicEditorStateApi
}

export default function Channel(props: ChannelProps): JSX.Element {
    const {
        channelConfig,
        currentChannel,
        currentPattern,
        number,
        otherSolo,
        stateApi
    } = props;

    const classNames = ['channel'];
    if (channelConfig.muted || otherSolo) {
        classNames.push('muted');
    }
    if (channelConfig.solo) {
        classNames.push('solo');
    }
    if (channelConfig.collapsed) {
        classNames.push('collapsed');
    }
    if (currentChannel === number) {
        classNames.push('current');
    }

    const patternHeight = Notes
        .filter((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE)
        .length;

    return channelConfig.collapsed
        ? <div
            className='collapsedChannel'
            onClick={() => stateApi.toggleChannelCollapsed(number)}
        />
        : <div className={classNames.join(' ')}>
            <ChannelHeader
                channel={channelConfig}
                number={number}
                muted={channelConfig.muted}
                solo={channelConfig.solo}
                collapsed={channelConfig.collapsed}
                stateApi={stateApi}
            />
            {channelConfig.sequence.map((patternId, index) =>
                <Pattern
                    key={`channel-${number}-pattern-${index}`}
                    index={index}
                    channel={number}
                    pattern={channelConfig.patterns[patternId]}
                    patternId={patternId}
                    currentChannel={currentChannel}
                    currentPattern={currentPattern}
                    height={patternHeight}
                    stateApi={stateApi}
                />)}
            <AddPattern
                channel={channelConfig}
                height={patternHeight}
                stateApi={stateApi}
            />
            <div
                className='patternFill'
                onClick={() => stateApi.setCurrentChannel(number)}
            ></div>
        </div>;
}
