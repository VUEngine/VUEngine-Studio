import React from 'react';
import SortableList from 'react-easy-sort';
import { arrayMove } from '../../Common/Utils';
import { ChannelConfig, NOTE_RESOLUTION, SoundData } from '../SoundEditorTypes';
import AddPattern from './AddPattern';
import ChannelHeader from './ChannelHeader';
import Pattern from './Pattern';
import { StyledChannel, StyledPatternFill } from './StyledComponents';

interface ChannelProps {
    songData: SoundData
    channel: ChannelConfig
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    currentPatternId: number
    setCurrentPatternId: (channel: number, patternId: number) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    otherSolo: boolean
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelSeeThrough: (channelId: number) => void
}

export default function Channel(props: ChannelProps): React.JSX.Element {
    const {
        songData,
        channel,
        currentChannelId, setCurrentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        otherSolo,
        setChannel,
        toggleChannelMuted, toggleChannelSolo, toggleChannelSeeThrough,
    } = props;

    const classNames = [];
    if (channel.muted || otherSolo) {
        classNames.push('muted');
    }
    if (channel.solo) {
        classNames.push('solo');
    }
    if (currentChannelId === channel.id) {
        classNames.push('current');
    }

    const onSortEnd = (oldIndex: number, newIndex: number): void =>
        setChannel(channel.id, {
            sequence: arrayMove(
                [...songData.channels[channel.id].sequence],
                oldIndex,
                newIndex
            )
        });

    return (
        <StyledChannel className={classNames.join(' ')}>
            <ChannelHeader
                channel={channel}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
                toggleChannelSeeThrough={toggleChannelSeeThrough}
            />

            <SortableList
                onSortEnd={onSortEnd}
                draggedItemClassName='dragging'
                lockAxis='x'
                style={{
                    display: 'flex',
                }}
            >
                {channel.sequence.map((patternId, index) =>
                    <Pattern
                        songData={songData}
                        key={index}
                        index={index}
                        channelId={channel.id}
                        pattern={channel.patterns[patternId]}
                        patternSize={channel.patterns[patternId].size * NOTE_RESOLUTION}
                        patternId={patternId}
                        currentChannelId={currentChannelId}
                        currentPatternId={currentPatternId}
                        currentSequenceIndex={currentSequenceIndex}
                        setCurrentSequenceIndex={setCurrentSequenceIndex}
                        setChannel={setChannel}
                    />
                )}
            </SortableList>
            <AddPattern
                songData={songData}
                channel={channel}
                setChannel={setChannel}
                setCurrentPatternId={setCurrentPatternId}
            />
            <StyledPatternFill
                onClick={() => setCurrentChannelId(channel.id)}
            ></StyledPatternFill>
        </StyledChannel>
    );
}
