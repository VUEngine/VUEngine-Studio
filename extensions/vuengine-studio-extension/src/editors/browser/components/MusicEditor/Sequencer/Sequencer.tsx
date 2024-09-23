import React from 'react';
import styled from 'styled-components';
import { ChannelConfig, SongData } from '../MusicEditorTypes';
import Channel from './Channel';
import StepIndicator from './StepIndicator';
import VContainer from '../../Common/VContainer';
import ChannelHeader from './ChannelHeader';

export const StyledSequencer = styled.div`
    display: flex;
    flex-direction: row;
    margin: 0 calc(var(--theia-ui-padding) * 2);
    position: relative;
`;

interface SequencerProps {
    songData: SongData
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    currentPatternId: number
    setCurrentPatternId: (channel: number, patternId: number) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentStep: number
    getChannelName: (channelId: number) => string
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
        getChannelName,
        toggleChannelMuted,
        toggleChannelSolo,
        setChannel,
    } = props;

    const soloChannel = songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

    return <StyledSequencer>
        {<StepIndicator
            currentStep={currentStep}
            noteResolution={songData.noteResolution}
            isPianoRoll={false}
            hidden={currentStep === -1}
        />}
        <VContainer gap={1}>
            {songData.channels.map(channel =>
                <ChannelHeader
                    channel={channel}
                    number={channel.id}
                    currentChannelId={currentChannelId}
                    setCurrentChannelId={setCurrentChannelId}
                    getChannelName={getChannelName}
                    toggleChannelMuted={toggleChannelMuted}
                    toggleChannelSolo={toggleChannelSolo}
                />
            )}
        </VContainer>
        <VContainer gap={1} overflow="auto" style={{ paddingBottom: 3 }}>
            {songData.channels.map(channel =>
                <Channel
                    key={channel.id}
                    channelConfig={channel}
                    number={channel.id}
                    songData={songData}
                    otherSolo={soloChannel > -1 && soloChannel !== channel.id}
                    currentChannelId={currentChannelId}
                    setCurrentChannelId={setCurrentChannelId}
                    currentPatternId={currentPatternId}
                    setCurrentPatternId={setCurrentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setChannel={setChannel}
                />
            )}
        </VContainer>
    </StyledSequencer>;
}
