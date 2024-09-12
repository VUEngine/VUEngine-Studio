import React from 'react';
import { ChannelConfig, HIGHEST_NOTE, LOWEST_NOTE, NOTES, SongData } from '../MusicEditorTypes';
import AddPattern from './AddPattern';
import ChannelHeader from './ChannelHeader';
import Pattern from './Pattern';

interface ChannelProps {
    channelConfig: ChannelConfig
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    currentPatternId: number
    setCurrentPatternId: (channel: number, patternId: number) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    getChannelName: (channelId: number) => string
    instrumentName: string
    number: number
    otherSolo: boolean
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    songData: SongData,
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const {
        channelConfig,
        currentChannelId, setCurrentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        getChannelName,
        instrumentName,
        number,
        otherSolo,
        setChannel,
        songData,
        toggleChannelMuted,
        toggleChannelSolo,
    } = props;

    const classNames = ['channel'];
    if (channelConfig.muted || otherSolo) {
        classNames.push('muted');
    }
    if (channelConfig.solo) {
        classNames.push('solo');
    }
    if (currentChannelId === number) {
        classNames.push('current');
    }

    const patternHeight = Object.keys(NOTES)
        .filter((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE)
        .length;

    return (
        <div className={classNames.join(' ')}>
            <ChannelHeader
                channel={channelConfig}
                number={number}
                muted={channelConfig.muted}
                solo={channelConfig.solo}
                instrumentName={instrumentName}
                setCurrentChannelId={setCurrentChannelId}
                getChannelName={getChannelName}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
            />
            {channelConfig.sequence.map((patternId, index) =>
                <Pattern
                    key={`channel-${number}-pattern-${index}`}
                    songData={songData}
                    index={index}
                    channel={number}
                    pattern={channelConfig.patterns[patternId]}
                    patternId={patternId}
                    height={patternHeight}
                    currentChannelId={currentChannelId}
                    currentPatternId={currentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setChannel={setChannel}
                />)}
            <AddPattern
                channel={channelConfig}
                setChannel={setChannel}
                songData={songData}
                setCurrentPatternId={setCurrentPatternId}
            />
            <div
                className='patternFill'
                onClick={() => setCurrentChannelId(number)}
            ></div>
        </div>
    );
}
