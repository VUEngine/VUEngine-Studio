import React, { useEffect, useMemo } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { ChannelConfig, SongData } from '../MusicEditorTypes';
import Channel from './Channel';
import StepIndicator from './StepIndicator';
import { StyledSequencer } from './StyledComponents';
import { MusicEditorCommands } from '../MusicEditorCommands';

interface SequencerProps {
    songData: SongData
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    currentPatternId: number
    setCurrentPatternId: (channel: number, patternId: number) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentStep: number
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
}

export default function Sequencer(props: SequencerProps): React.JSX.Element {
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentStep,
        toggleChannelMuted,
        toggleChannelSolo,
        setChannel,
    } = props;

    const soloChannel = useMemo(() => songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1, [
        songData.channels,
    ]);

    const channels = useMemo(() => (
        songData.channels.map(channel =>
            <Channel
                key={channel.id}
                songData={songData}
                channelConfig={channel}
                number={channel.id}
                otherSolo={soloChannel > -1 && soloChannel !== channel.id}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                currentPatternId={currentPatternId}
                setCurrentPatternId={setCurrentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                setCurrentSequenceIndex={setCurrentSequenceIndex}
                setChannel={setChannel}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
            />
        )
    ), [
        soloChannel,
        songData.channels,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex,
    ]);

    const mapVerticalToHorizontalScroll = (e: React.WheelEvent): void => {
        if (e.deltaY === 0) {
            return;
        }
        e.currentTarget.scrollTo({
            left: e.currentTarget.scrollLeft + e.deltaY
        });
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case MusicEditorCommands.SELECT_CHANNEL_1.id:
                setCurrentChannelId(0);
                break;
            case MusicEditorCommands.SELECT_CHANNEL_2.id:
                setCurrentChannelId(1);
                break;
            case MusicEditorCommands.SELECT_CHANNEL_3.id:
                setCurrentChannelId(2);
                break;
            case MusicEditorCommands.SELECT_CHANNEL_4.id:
                setCurrentChannelId(3);
                break;
            case MusicEditorCommands.SELECT_CHANNEL_5.id:
                setCurrentChannelId(4);
                break;
            case MusicEditorCommands.SELECT_CHANNEL_6.id:
                setCurrentChannelId(5);
                break;
            case MusicEditorCommands.SELECT_NEXT_CHANNEL.id:
                if (currentChannelId < 5) {
                    setCurrentChannelId(currentChannelId + 1);
                }
                break;
            case MusicEditorCommands.SELECT_PREVIOUS_CHANNEL.id:
                if (currentChannelId > 0) {
                    setCurrentChannelId(currentChannelId - 1);
                }
                break;
            case MusicEditorCommands.SELECT_NEXT_SEQUENCE_INDEX.id:
                if (currentSequenceIndex < songData.channels[currentChannelId].sequence.length - 1) {
                    setCurrentSequenceIndex(currentChannelId, currentSequenceIndex + 1);
                }
                break;
            case MusicEditorCommands.SELECT_PREVIOUS_SEQUENCE_INDEX.id:
                if (currentSequenceIndex > 0) {
                    setCurrentSequenceIndex(currentChannelId, currentSequenceIndex - 1);
                }
                break;
        }
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        currentChannelId,
        currentSequenceIndex,
        songData,
    ]);

    return <StyledSequencer onWheel={mapVerticalToHorizontalScroll}>
        {<StepIndicator
            currentStep={currentStep}
            noteResolution={songData.noteResolution}
            isPianoRoll={false}
            hidden={currentStep === -1}
        />}
        <VContainer gap={0} grow={1}>
            {channels}
        </VContainer>
    </StyledSequencer>;
}
