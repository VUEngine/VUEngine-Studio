import React from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, ChannelConfig, HIGHEST_NOTE, LOWEST_NOTE, NOTES, SongData } from '../MusicEditorTypes';
import AddPattern from './AddPattern';
import Pattern from './Pattern';

interface ChannelProps {
    channelConfig: ChannelConfig
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    currentPatternId: number
    setCurrentPatternId: (channel: number, patternId: number) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    number: number
    otherSolo: boolean
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    songData: SongData,
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const {
        channelConfig,
        currentChannelId, setCurrentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        number,
        otherSolo,
        setChannel,
        songData,
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
            {channelConfig.sequence.map((patternId, index) =>
                <Pattern
                    key={`channel-${number}-pattern-${index}`}
                    songData={songData}
                    index={index}
                    channel={number}
                    pattern={channelConfig.patterns[patternId]}
                    patternSize={BAR_PATTERN_LENGTH_MULT_MAP[channelConfig.patterns[patternId].bar] * songData.noteResolution}
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
