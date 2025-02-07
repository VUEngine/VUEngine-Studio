import React from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, ChannelConfig, SongData } from '../MusicEditorTypes';
import AddPattern from './AddPattern';
import ChannelHeader from './ChannelHeader';
import Pattern from './Pattern';
import { StyledChannel, StyledPatternFill } from './StyledComponents';

interface ChannelProps {
    songData: SongData
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
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const {
        songData,
        channelConfig,
        currentChannelId, setCurrentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        number,
        otherSolo,
        setChannel,
        toggleChannelMuted, toggleChannelSolo,
    } = props;

    const classNames = [];
    if (channelConfig.muted || otherSolo) {
        classNames.push('muted');
    }
    if (channelConfig.solo) {
        classNames.push('solo');
    }
    if (currentChannelId === number) {
        classNames.push('current');
    }

    return (
        <StyledChannel className={classNames.join(' ')}>
            <ChannelHeader
                channel={channelConfig}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
            />
            {channelConfig.sequence.map((patternId, index) =>
                <Pattern
                    songData={songData}
                    key={index}
                    index={index}
                    channel={number}
                    pattern={channelConfig.patterns[patternId]}
                    patternSize={BAR_PATTERN_LENGTH_MULT_MAP[channelConfig.patterns[patternId].bar] * songData.noteResolution}
                    patternId={patternId}
                    currentChannelId={currentChannelId}
                    currentPatternId={currentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setChannel={setChannel}
                />)}
            <AddPattern
                songData={songData}
                channel={channelConfig}
                setChannel={setChannel}
                setCurrentPatternId={setCurrentPatternId}
            />
            <StyledPatternFill
                onClick={() => setCurrentChannelId(number)}
            ></StyledPatternFill>
        </StyledChannel>
    );
}
