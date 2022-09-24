import React from 'react';
import { ChannelConfig, CurrentPattern, MusicEditorStateApi, Notes, PatternConfig } from '../../ves-music-editor-types';
import AddPattern from './AddPattern';
import ChannelHeader from './ChannelHeader';
import Pattern from './Pattern';

interface ChannelProps {
    channelConfig: ChannelConfig
    patterns: PatternConfig[]
    currentPattern: CurrentPattern
    lowestNote: number
    highestNote: number
    number: number
    otherSolo: boolean
    stateApi: MusicEditorStateApi
}

export default function Channel(props: ChannelProps): JSX.Element {
    const {
        channelConfig,
        currentPattern,
        lowestNote,
        highestNote,
        number,
        otherSolo,
        patterns,
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
    if (currentPattern.channel === number) {
        classNames.push('current');
    }

    const resolvedPatterns: PatternConfig[] = [];
    channelConfig.patterns.forEach(patternId => {
        patterns.forEach(pattern => {
            if (pattern.channel === number && pattern.id === patternId) {
                resolvedPatterns.push(pattern);
                return;
            }
        });
    });

    const patternHeight = Notes
        .filter((note, index) =>
            index <= lowestNote &&
            index >= highestNote)
        .length;

    const isCurrent = (id: number): boolean => currentPattern.channel === number && currentPattern.id === id;

    return channelConfig.collapsed
        ? <div
            className='collapsedChannel'
            onClick={() => stateApi.toggleChannelCollapsed(number - 1)}
        />
        : <div className={classNames.join(' ')}>
            <ChannelHeader
                name={channelConfig.name}
                number={number}
                muted={channelConfig.muted}
                solo={channelConfig.solo}
                collapsed={channelConfig.collapsed}
                stateApi={stateApi}
            />
            {resolvedPatterns.map((pattern, index) =>
                <Pattern
                    key={`channel-${number}-pattern-${index}`}
                    channel={number}
                    patternId={pattern.id}
                    current={isCurrent(pattern.id)}
                    notes={pattern.notes}
                    height={patternHeight}
                    size={pattern.size}
                    setCurrentPattern={stateApi.setCurrentPattern}
                />)}
            <AddPattern
                channel={number}
                height={patternHeight}
                channelPatterns={channelConfig.patterns}
                patterns={patterns}
                stateApi={stateApi}
            />
        </div>;
}
