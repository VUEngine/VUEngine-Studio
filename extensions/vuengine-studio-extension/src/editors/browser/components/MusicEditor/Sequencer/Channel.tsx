import React from 'react';
import { ChannelConfig, HIGHEST_NOTE, LOWEST_NOTE, Notes } from '../MusicEditorTypes';
import AddPattern from './AddPattern';
import ChannelHeader from './ChannelHeader';
import Pattern from './Pattern';

interface ChannelProps {
    channelConfig: ChannelConfig
    currentChannel: number
    currentPattern: number
    number: number
    otherSolo: boolean
    setCurrentChannel: (id: number) => void
    setCurrentPattern: (channelId: number, patternId: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelCollapsed: (channelId: number) => void
    removeFromSequence: (channelId: number, index: number) => void
    moveSequencePattern: (channelId: number, from: number, to: number) => void
    addToSequence: (channelId: number, patternId: number) => void
}

export default function Channel(props: ChannelProps): JSX.Element {
    const {
        channelConfig,
        currentChannel,
        currentPattern,
        number,
        otherSolo,
        setCurrentChannel,
        setCurrentPattern,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
        removeFromSequence,
        moveSequencePattern,
        addToSequence,
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
            onClick={() => toggleChannelCollapsed(number)}
        />
        : <div className={classNames.join(' ')}>
            <ChannelHeader
                channel={channelConfig}
                number={number}
                muted={channelConfig.muted}
                solo={channelConfig.solo}
                setCurrentChannel={setCurrentChannel}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
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
                    setCurrentPattern={setCurrentPattern}
                    removeFromSequence={removeFromSequence}
                    moveSequencePattern={moveSequencePattern}
                />)}
            <AddPattern
                channel={channelConfig}
                height={patternHeight}
                addToSequence={addToSequence}
            />
            <div
                className='patternFill'
                onClick={() => setCurrentChannel(number)}
            ></div>
        </div>;
}
